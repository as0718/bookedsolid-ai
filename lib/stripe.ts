import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

// Subscription Plan Configurations
export const SUBSCRIPTION_PLANS = {
  missed: {
    name: "Missed Call Plan",
    monthlyPriceId: process.env.STRIPE_PRICE_MISSED_MONTHLY || "",
    annualPriceId: process.env.STRIPE_PRICE_MISSED_ANNUAL || "",
    minutesIncluded: 500,
    monthlyRate: 297,
    annualRate: 2970, // 10 months price
    features: [
      "500 minutes/month",
      "After-hours call coverage",
      "Basic appointment booking",
      "Email notifications",
      "Standard support",
    ],
  },
  complete: {
    name: "Complete Plan",
    monthlyPriceId: process.env.STRIPE_PRICE_COMPLETE_MONTHLY || "",
    annualPriceId: process.env.STRIPE_PRICE_COMPLETE_ANNUAL || "",
    minutesIncluded: 1000,
    monthlyRate: 497,
    annualRate: 4970, // 10 months price
    features: [
      "1,000 minutes/month",
      "24/7 call coverage",
      "Advanced appointment booking",
      "CRM integration",
      "SMS + Email notifications",
      "Priority support",
    ],
  },
  unlimited: {
    name: "Unlimited Plan",
    monthlyPriceId: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || "",
    annualPriceId: process.env.STRIPE_PRICE_UNLIMITED_ANNUAL || "",
    minutesIncluded: -1, // Unlimited
    monthlyRate: 997,
    annualRate: 9970, // 10 months price
    features: [
      "Unlimited minutes",
      "24/7 premium call coverage",
      "Full appointment management",
      "Advanced CRM integration",
      "Custom AI training",
      "SMS + Email + Slack notifications",
      "Dedicated account manager",
    ],
  },
} as const;

// Overage rate: $0.15 per minute after plan limit
export const OVERAGE_RATE_PER_MINUTE = 0.15;

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
