import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, isStripeConfigured, requireStripeConfig } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured) {
      return NextResponse.json(
        {
          error: "Billing system is not configured. Please contact support.",
          details: "Stripe API keys are missing or invalid",
        },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    const user = session?.user as { clientId?: string } | undefined;

    if (!session || !user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client from database
    const client = await prisma.client.findUnique({
      where: { id: user.clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!client.stripeSubscriptionId) {
      return NextResponse.json(
        {
          error: "No active subscription found",
          details: "No Stripe subscription ID associated with this account",
        },
        { status: 404 }
      );
    }

    // Verify Stripe configuration
    try {
      requireStripeConfig();
    } catch (configError) {
      return NextResponse.json(
        {
          error: "Billing system configuration error. Please contact support.",
          details: configError instanceof Error ? configError.message : "Unknown error",
        },
        { status: 503 }
      );
    }

    // Get the subscription to check billing interval
    const subscription = await stripe.subscriptions.retrieve(
      client.stripeSubscriptionId
    );

    // Parse request body for cancellation type
    const body = await req.json();
    const { immediate } = body as { immediate?: boolean };

    // Cancel subscription
    // For monthly: cancel at period end (default)
    // For yearly: cancel at period end (no refunds)
    // Immediate cancellation only if explicitly requested
    const canceledSubscription = await stripe.subscriptions.update(
      client.stripeSubscriptionId,
      {
        cancel_at_period_end: !immediate,
        ...(immediate && { cancel_at: Math.floor(Date.now() / 1000) }),
      }
    );

    // Update client record
    await prisma.client.update({
      where: { id: client.id },
      data: {
        stripeSubscriptionStatus: immediate ? "canceled" : "active",
        subscriptionEndsAt: canceledSubscription.current_period_end
          ? new Date(canceledSubscription.current_period_end * 1000)
          : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: immediate
        ? "Subscription canceled immediately"
        : "Subscription will cancel at the end of the billing period",
      endsAt: canceledSubscription.current_period_end
        ? new Date(canceledSubscription.current_period_end * 1000).toISOString()
        : null,
      billingInterval: subscription.items.data[0]?.price?.recurring?.interval || "month",
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isStripeError = errorMessage.includes("Stripe") || errorMessage.includes("API");

    return NextResponse.json(
      {
        error: isStripeError
          ? "Unable to cancel subscription. Please contact support."
          : "Failed to cancel subscription",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
