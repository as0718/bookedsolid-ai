import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, SUBSCRIPTION_PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No stripe signature found" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const priceId = subscription.items.data[0]?.price.id;

  // Find the plan based on price ID
  let plan: keyof typeof SUBSCRIPTION_PLANS | null = null;
  let billingInterval: "month" | "year" = "month";

  for (const [planKey, planConfig] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (planConfig.monthlyPriceId === priceId) {
      plan = planKey as keyof typeof SUBSCRIPTION_PLANS;
      billingInterval = "month";
      break;
    }
    if (planConfig.annualPriceId === priceId) {
      plan = planKey as keyof typeof SUBSCRIPTION_PLANS;
      billingInterval = "year";
      break;
    }
  }

  if (!plan) {
    console.error(`Unknown price ID: ${priceId}`);
    return;
  }

  const planConfig = SUBSCRIPTION_PLANS[plan];
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Update or create client
  await prisma.client.upsert({
    where: { stripeCustomerId: customerId },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: status,
      stripePriceId: priceId,
      plan,
      billingInterval,
      subscriptionEndsAt: currentPeriodEnd,
      status: status === "active" ? "active" : "suspended",
      billing: {
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: currentPeriodEnd,
        minutesIncluded: planConfig.minutesIncluded,
        minutesUsed: 0, // Reset on new billing period
        overageRate: 0.15,
        monthlyRate: billingInterval === "month" ? planConfig.monthlyRate : planConfig.annualRate / 12,
      },
    },
    create: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripeSubscriptionStatus: status,
      stripePriceId: priceId,
      plan,
      billingInterval,
      subscriptionEndsAt: currentPeriodEnd,
      businessName: "New Business", // Will be updated by user
      email: subscription.customer as string, // Temporary
      phone: "",
      status: status === "active" ? "active" : "suspended",
      billing: {
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: currentPeriodEnd,
        minutesIncluded: planConfig.minutesIncluded,
        minutesUsed: 0,
        overageRate: 0.15,
        monthlyRate: billingInterval === "month" ? planConfig.monthlyRate : planConfig.annualRate / 12,
      },
      settings: {
        voiceType: "female",
        speakingSpeed: 1.0,
        customGreeting: "",
        bookingSystem: "none",
        calendarSync: false,
      },
    },
  });

  console.log(`Subscription ${subscriptionId} updated for customer ${customerId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await prisma.client.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionStatus: "canceled",
      status: "suspended",
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
    },
  });

  console.log(`Subscription canceled for customer ${customerId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Ensure client status is active
  await prisma.client.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      status: "active",
      stripeSubscriptionStatus: "active",
    },
  });

  console.log(`Payment succeeded for customer ${customerId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Mark client as past_due
  await prisma.client.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionStatus: "past_due",
    },
  });

  console.log(`Payment failed for customer ${customerId}`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Link customer to subscription
  if (customerId && subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdate(subscription);
  }

  console.log(`Checkout completed for customer ${customerId}`);
}
