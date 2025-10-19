import Stripe from "stripe";

// Check if Stripe is properly configured
export const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
  !process.env.STRIPE_SECRET_KEY.includes('REPLACE_WITH_YOUR_KEY') &&
  !process.env.STRIPE_SECRET_KEY.includes('REPLACE_WITH_YOUR_ACTUAL_PRICE_ID')
);

// Initialize Stripe with a fallback for development
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

// Helper function to check if Stripe operations are available
export function requireStripeConfig() {
  if (!isStripeConfigured) {
    throw new Error(
      "Stripe is not properly configured. Please set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables. " +
      "Get your keys from https://dashboard.stripe.com/apikeys"
    );
  }
}

// Helper function to validate price IDs are configured
export function validatePriceIds() {
  const plans: PlanType[] = ['missed', 'complete', 'unlimited'];
  const intervals: BillingInterval[] = ['month', 'year'];

  for (const plan of plans) {
    for (const interval of intervals) {
      const priceId = getPriceId(plan, interval);
      if (!priceId || priceId.includes('REPLACE_WITH_YOUR_ACTUAL_PRICE_ID')) {
        throw new Error(
          `Missing or invalid Stripe Price ID for ${plan} plan (${interval}ly). ` +
          `Please create products in Stripe Dashboard and add Price IDs to your environment variables.`
        );
      }
    }
  }
}

// Subscription Plan Configurations
export const SUBSCRIPTION_PLANS = {
  missed: {
    name: "Missed Call Recovery",
    description: "Perfect for: Testing the service while keeping your receptionist",
    monthlyPriceId: process.env.STRIPE_PRICE_MISSED_MONTHLY || "",
    annualPriceId: process.env.STRIPE_PRICE_MISSED_ANNUAL || "",
    minutesIncluded: -1, // Unlimited missed calls
    monthlyRate: 149,
    annualRate: 1700,
    ctaText: "Start with Missed Calls",
    subtitle: "Upgrade to full coverage anytime",
    features: [
      "Unlimited missed calls handled",
      "Books appointments 24/7",
      "After-hours & weekend coverage",
      "CRM/booking system integration",
      "SMS confirmations & reminders",
      "Basic analytics dashboard",
      "Email support",
    ],
  },
  complete: {
    name: "Complete Receptionist",
    description: "Includes: Up to 1,000 minutes per month | Overage: $0.25/minute",
    monthlyPriceId: process.env.STRIPE_PRICE_COMPLETE_MONTHLY || "",
    annualPriceId: process.env.STRIPE_PRICE_COMPLETE_ANNUAL || "",
    minutesIncluded: 1000,
    monthlyRate: 349,
    annualRate: 4000,
    ctaText: "Get Complete Coverage",
    subtitle: "Save $2,850/month vs traditional receptionist",
    badge: "MOST POPULAR",
    features: [
      "All calls handled 24/7/365",
      "Unlimited concurrent calls",
      "CRM/booking system integration",
      "SMS confirmations & reminders",
      "Multi-service booking",
      "Stylist preference management",
      "Call recordings & transcripts",
      "Advanced analytics dashboard",
      "Phone & email support",
    ],
  },
  unlimited: {
    name: "High-Volume Unlimited",
    description: "For businesses with: 50+ calls per day or multi-location needs",
    monthlyPriceId: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || "",
    annualPriceId: process.env.STRIPE_PRICE_UNLIMITED_ANNUAL || "",
    minutesIncluded: -1, // Truly unlimited
    monthlyRate: 599,
    annualRate: 7000,
    ctaText: "Contact Sales",
    subtitle: "For 50+ calls/day",
    features: [
      "Truly unlimited minutes",
      "No overage charges ever",
      "All Complete plan features",
      "Up to 3 locations included",
      "Custom CRM integrations",
      "Advanced call routing",
      "Priority phone support",
      "Dedicated account manager",
      "Custom reporting",
    ],
  },
} as const;

// Overage rate: $0.25 per minute after plan limit (for Complete plan only)
export const OVERAGE_RATE_PER_MINUTE = 0.25;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;
export type BillingInterval = "month" | "year";

/**
 * Get the price ID for a specific plan and billing interval
 */
export function getPriceId(plan: PlanType, interval: BillingInterval): string {
  const planConfig = SUBSCRIPTION_PLANS[plan];
  return interval === "month" ? planConfig.monthlyPriceId : planConfig.annualPriceId;
}

/**
 * Calculate overage charges based on minutes used
 */
export function calculateOverageCharges(
  plan: PlanType,
  minutesUsed: number
): number {
  const planConfig = SUBSCRIPTION_PLANS[plan];

  // Unlimited plan has no overage
  if (planConfig.minutesIncluded === -1) {
    return 0;
  }

  // Calculate overage minutes
  const overageMinutes = Math.max(0, minutesUsed - planConfig.minutesIncluded);

  return overageMinutes * OVERAGE_RATE_PER_MINUTE;
}

/**
 * Get plan details by plan type
 */
export function getPlanDetails(plan: PlanType) {
  return SUBSCRIPTION_PLANS[plan];
}
