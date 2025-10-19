"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { SUBSCRIPTION_PLANS, calculateOverageCharges } from "@/lib/stripe";

interface BillingContentProps {
  client: {
    id: string;
    businessName: string;
    email: string;
    plan: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeSubscriptionStatus?: string | null;
    billingInterval: string;
    billing: {
      currentPeriodStart: Date | string;
      currentPeriodEnd: Date | string;
      minutesIncluded: number;
      minutesUsed: number;
      overageRate: number;
      monthlyRate: number;
    };
  };
  totalCalls: number;
  avgCallLength: number;
}

export function BillingContent({ client, totalCalls, avgCallLength }: BillingContentProps) {
  const [loading, setLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const billing = client.billing;
  const planConfig = SUBSCRIPTION_PLANS[client.plan as keyof typeof SUBSCRIPTION_PLANS];

  // Calculate the actual price based on billing interval
  const currentRate = client.billingInterval === "year"
    ? planConfig.annualRate
    : planConfig.monthlyRate;
  const billingLabel = client.billingInterval === "year" ? "/year" : "/month";

  // Calculate usage percentage
  const usagePercent = planConfig.minutesIncluded === -1
    ? 0
    : (billing.minutesUsed / billing.minutesIncluded) * 100;

  // Calculate projected overage
  const projectedOverage = calculateOverageCharges(
    client.plan as keyof typeof SUBSCRIPTION_PLANS,
    billing.minutesUsed
  );

  // Calculate days left in billing period
  const today = new Date();
  const periodEnd = billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd) : null;
  const daysLeft = periodEnd && !isNaN(periodEnd.getTime())
    ? Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 30; // Default to 30 days if no valid date

  // Get plan badge
  const getPlanBadge = (plan: string) => {
    const config: Record<string, { label: string; color: string }> = {
      complete: { label: "Complete Plan", color: "bg-purple-500" },
      missed: { label: "Missed Call Plan", color: "bg-blue-500" },
      unlimited: { label: "Unlimited Plan", color: "bg-green-500" },
    };
    const planCfg = config[plan] || config.complete;
    return (
      <Badge className={`${planCfg.color} text-white`}>{planCfg.label}</Badge>
    );
  };

  // Get usage alert
  const getUsageAlert = () => {
    if (planConfig.minutesIncluded === -1) return null;

    if (usagePercent >= 90) {
      return {
        level: "error" as const,
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
        message: `⚠️ You're at ${usagePercent.toFixed(0)}% of your monthly minutes.`,
        suggestion: "Consider upgrading to High-Volume Unlimited ($599/mo) to avoid overages.",
        color: "bg-red-50 border-red-200 text-red-800",
      };
    } else if (usagePercent >= 75) {
      return {
        level: "warning" as const,
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        message: `⚠️ You're at ${usagePercent.toFixed(0)}% of your monthly minutes.`,
        suggestion: "Consider upgrading to High-Volume Unlimited ($599/mo) to avoid overages.",
        color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      };
    }
    return null;
  };

  const alert = getUsageAlert();

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        // Show the detailed error message from the API
        const errorMessage = data.error || "Failed to create billing portal session";
        console.error("Error opening billing portal:", data);
        window.alert(`${errorMessage}${data.details ? `\n\nDetails: ${data.details}` : ""}`);
        setLoading(false);
        return;
      }

      // Redirect to Stripe billing portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No billing portal URL returned");
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
      window.alert(
        "Failed to open billing portal. Please try again or contact support if the problem persists."
      );
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string, interval: "month" | "year") => {
    setUpgradeLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, interval }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      window.alert("Failed to start upgrade process. Please try again.");
      setUpgradeLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Billing & Usage
        </h1>
        <p className="text-gray-600 mt-1">Manage your subscription and view billing details</p>
      </div>

      {/* Current Plan */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Current Plan</h2>
            {getPlanBadge(client.plan)}
            {client.stripeSubscriptionStatus && (
              <Badge variant="outline" className="ml-2">
                {client.stripeSubscriptionStatus}
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              ${currentRate}
              <span className="text-lg text-gray-600 font-normal">{billingLabel}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {planConfig.minutesIncluded === -1 ? (
            <div className="flex items-center gap-2 text-gray-700">
              <span>• Unlimited minutes per month</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-700">
              <span>• Up to {planConfig.minutesIncluded.toLocaleString()} minutes per month</span>
            </div>
          )}
          {planConfig.minutesIncluded !== -1 && (
            <div className="flex items-center gap-2 text-gray-700">
              <span>• Additional minutes: ${billing.overageRate}/min</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-4 w-4" />
            <span>
              Next billing date: {periodEnd && !isNaN(periodEnd.getTime())
                ? format(periodEnd, "MMMM d, yyyy")
                : "Not set"}
            </span>
            <Badge variant="outline">{daysLeft} days left</Badge>
          </div>
        </div>

        <div className="space-y-2 mb-6 text-sm text-gray-600">
          {planConfig.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {client.stripeCustomerId && (
            <Button variant="outline" onClick={handleManageBilling} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Manage Subscription
            </Button>
          )}
          {!client.stripeSubscriptionId && (
            <Button onClick={() => handleUpgrade(client.plan, "month")} disabled={upgradeLoading}>
              {upgradeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Subscribe Now
            </Button>
          )}
        </div>
      </Card>

      {/* Current Usage */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Usage</h2>

        <div className="space-y-4">
          {planConfig.minutesIncluded !== -1 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Minutes Used This Month
                </span>
                <span className="text-sm font-semibold">
                  {billing.minutesUsed} / {planConfig.minutesIncluded}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    usagePercent >= 90
                      ? "bg-red-500"
                      : usagePercent >= 75
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{usagePercent.toFixed(1)}% used</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Calls</p>
              <p className="text-2xl font-bold">{totalCalls}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avg Call Length</p>
              <p className="text-2xl font-bold">
                {Math.floor(avgCallLength / 60)}:{String(avgCallLength % 60).padStart(2, "0")} min
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Projected Overage</p>
              <p className="text-2xl font-bold">${projectedOverage.toFixed(2)}</p>
            </div>
          </div>

          {projectedOverage === 0 && !alert && planConfig.minutesIncluded !== -1 && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">You&apos;re on track! No overages projected.</span>
            </div>
          )}

          {planConfig.minutesIncluded === -1 && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Unlimited plan - no usage limits!</span>
            </div>
          )}

          {alert && (
            <div className={`flex flex-col gap-2 p-4 border rounded-lg ${alert.color}`}>
              <div className="flex items-center gap-2">
                {alert.icon}
                <span className="font-medium">{alert.message}</span>
              </div>
              <p className="text-sm ml-7">{alert.suggestion}</p>
              <div className="ml-7 mt-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleUpgrade("unlimited", client.billingInterval as "month" | "year")}
                  disabled={upgradeLoading}
                >
                  {upgradeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upgrade Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Plan Comparison */}
      {client.plan !== "unlimited" && (
        <Card className="p-6 mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <h3 className="font-semibold mb-3">💡 Need More Minutes?</h3>
          <p className="text-sm text-gray-700 mb-4">
            Upgrade to High-Volume Unlimited for just $599/month and get unlimited calling minutes,
            priority support, and advanced features.
          </p>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => handleUpgrade("unlimited", client.billingInterval as "month" | "year")}
            disabled={upgradeLoading}
          >
            {upgradeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upgrade to Unlimited
          </Button>
        </Card>
      )}
    </main>
  );
}
