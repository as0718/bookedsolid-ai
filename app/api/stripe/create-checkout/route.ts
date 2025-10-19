import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, getPriceId, PlanType, BillingInterval, requireStripeConfig } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    requireStripeConfig();

    const session = await getServerSession(authOptions);
    const user = session?.user as { clientId?: string; email?: string } | undefined;

    if (!session || !user?.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan, interval } = body as {
      plan: PlanType;
      interval: BillingInterval;
    };

    if (!plan || !interval) {
      return NextResponse.json(
        { error: "Plan and interval are required" },
        { status: 400 }
      );
    }

    // Get client from database
    const client = await prisma.client.findUnique({
      where: { id: user.clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const priceId = getPriceId(plan, interval);

    if (!priceId || priceId.includes('REPLACE_WITH_YOUR_ACTUAL_PRICE_ID')) {
      return NextResponse.json(
        { error: "Stripe Price IDs not configured. Please create products in Stripe Dashboard and add Price IDs to environment variables." },
        { status: 500 }
      );
    }

    // Create or retrieve Stripe customer
    let customerId = client.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: client.email,
        name: client.businessName,
        metadata: {
          clientId: client.id,
        },
      });
      customerId = customer.id;

      // Update client with Stripe customer ID
      await prisma.client.update({
        where: { id: client.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
      metadata: {
        clientId: client.id,
        plan,
        interval,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
