import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, isStripeConfigured, requireStripeConfig } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured) {
      console.error("Stripe is not configured");
      return NextResponse.json(
        {
          error: "Billing system is not configured. Please contact support.",
          details: "Stripe API keys are missing or invalid"
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

    if (!client.stripeCustomerId) {
      return NextResponse.json(
        {
          error: "No billing account found. Please subscribe to a plan first.",
          details: "No Stripe customer ID associated with this account"
        },
        { status: 404 }
      );
    }

    // Verify Stripe configuration
    try {
      requireStripeConfig();
    } catch (configError) {
      console.error("Stripe configuration error:", configError);
      return NextResponse.json(
        {
          error: "Billing system configuration error. Please contact support.",
          details: configError instanceof Error ? configError.message : "Unknown error"
        },
        { status: 503 }
      );
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: client.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating billing portal session:", error);

    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isStripeError = errorMessage.includes("Stripe") || errorMessage.includes("API");

    return NextResponse.json(
      {
        error: isStripeError
          ? "Unable to access billing portal. Please contact support."
          : "Failed to create billing portal session",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
