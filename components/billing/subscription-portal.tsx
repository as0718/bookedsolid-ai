"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Crown, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { SUBSCRIPTION_PLANS, PlanType } from "@/lib/stripe";
import { CancelSubscriptionModal } from "./cancel-subscription-modal";

interface SubscriptionPortalProps {
  currentPlan: string;
  currentBillingInterval: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionEndsAt?: Date | string | null;
  stripeSubscriptionStatus?: string | null;
}

const planIcons = {
  missed: Zap,
  complete: Crown,
  unlimited: TrendingUp,
};

export function SubscriptionPortal({
  currentPlan,
  currentBillingInterval,
  stripeCustomerId,
  stripeSubscriptionId,
  subscriptionEndsAt,
  stripeSubscriptionStatus,
}: SubscriptionPortalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const handleUpgrade = async (plan: PlanType) => {
    setLoading(plan);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          interval: currentBillingInterval === "year" ? "year" : "month"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      window.alert("Failed to start upgrade process. Please try again.");
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading("manage");
    try {
      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to create billing portal session";
        console.error("Error opening billing portal:", data);
        window.alert(`${errorMessage}${data.details ? `\n\nDetails: ${data.details}` : ""}`);
        setLoading(null);
        return;
      }

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
      setLoading(null);
    }
  };

  const isCurrentPlan = (plan: PlanType) => plan === currentPlan;
  const canUpgradeTo = (plan: PlanType) => {
    const planOrder = { missed: 1, complete: 2, unlimited: 3 };
    const currentOrder = planOrder[currentPlan as PlanType] || 0;
    const targetOrder = planOrder[plan];
    return targetOrder > currentOrder;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Perfect Plan
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upgrade or downgrade anytime. All plans include our AI-powered voice receptionist
          technology.
        </p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {(Object.keys(SUBSCRIPTION_PLANS) as PlanType[]).map((planKey) => {
          const plan = SUBSCRIPTION_PLANS[planKey];
          const Icon = planIcons[planKey];
          const price = currentBillingInterval === "year" ? plan.annualRate : plan.monthlyRate;
          const billingLabel = currentBillingInterval === "year" ? "/year" : "/month";
          const isCurrent = isCurrentPlan(planKey);
          const canUpgrade = canUpgradeTo(planKey);

          return (
            <Card
              key={planKey}
              className={`relative p-6 flex flex-col ${
                plan.badge
                  ? "border-purple-500 border-2 shadow-xl scale-105"
                  : "border-gray-200"
              } ${isCurrent ? "bg-gradient-to-br from-blue-50 to-indigo-50" : ""}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-4 py-1 text-sm font-semibold">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-blue-600 text-white">Current Plan</Badge>
                </div>
              )}

              {/* Icon & Title */}
              <div className="text-center mb-4 pt-2">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-3">
                  <Icon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 min-h-[40px]">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900">${price}</span>
                  <span className="text-gray-600 ml-2">{billingLabel}</span>
                </div>
                {plan.subtitle && (
                  <p className="text-sm text-gray-500 mt-2">{plan.subtitle}</p>
                )}
              </div>

              {/* Features */}
              <div className="flex-grow space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="mt-auto">
                {isCurrent ? (
                  <>
                    {stripeSubscriptionId ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleUpgrade(planKey)}
                        disabled={loading === planKey}
                      >
                        {loading === planKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Get Started
                      </Button>
                    )}
                  </>
                ) : canUpgrade ? (
                  <Button
                    className={`w-full ${
                      plan.badge
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-gray-900 hover:bg-gray-800"
                    }`}
                    onClick={() => handleUpgrade(planKey)}
                    disabled={loading === planKey}
                  >
                    {loading === planKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {plan.ctaText || "Upgrade"}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Contact Support to Downgrade
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Comparison Table */}
      <Card className="p-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Compare: BookedSolid AI vs Traditional Options
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-4 px-4 font-semibold text-gray-900">Feature</th>
                <th className="text-center py-4 px-4 font-semibold text-purple-600">
                  BookedSolid AI
                  <br />
                  <span className="text-sm font-normal text-gray-600">
                    $149-$599/mo
                  </span>
                </th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">
                  Human Receptionist
                  <br />
                  <span className="text-sm font-normal text-gray-600">
                    ~$3,200/mo
                  </span>
                </th>
                <th className="text-center py-4 px-4 font-semibold text-gray-700">
                  Voicemail
                  <br />
                  <span className="text-sm font-normal text-gray-600">
                    Free
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { feature: "24/7 Availability", ai: true, human: false, voicemail: true },
                { feature: "Instant Response", ai: true, human: true, voicemail: false },
                { feature: "Books Appointments", ai: true, human: true, voicemail: false },
                { feature: "Never Sick or On Vacation", ai: true, human: false, voicemail: true },
                { feature: "Handles Multiple Calls Simultaneously", ai: true, human: false, voicemail: true },
                { feature: "CRM Integration", ai: true, human: false, voicemail: false },
                { feature: "Call Recordings & Transcripts", ai: true, human: false, voicemail: false },
                { feature: "SMS Confirmations & Reminders", ai: true, human: false, voicemail: false },
                { feature: "Analytics Dashboard", ai: true, human: false, voicemail: false },
                { feature: "No Training Required", ai: true, human: false, voicemail: true },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-gray-900">{row.feature}</td>
                  <td className="py-4 px-4 text-center">
                    {row.ai ? (
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {row.human ? (
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {row.voicemail ? (
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Value Proposition */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Save Over $30,000 Per Year
              </h3>
              <p className="text-gray-700 mb-4">
                The average full-time receptionist costs $3,200/month ($38,400/year) in salary alone,
                not including benefits, training, or time off. Our Complete Receptionist plan costs
                just $349/month ($4,188/year) — a savings of $34,212 annually.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Traditional Receptionist</p>
                  <p className="text-2xl font-bold text-red-600">$38,400/yr</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">BookedSolid AI Complete</p>
                  <p className="text-2xl font-bold text-green-600">$4,188/yr</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Your Savings</p>
                  <p className="text-2xl font-bold text-purple-600">$34,212/yr</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription Management Section */}
      {stripeSubscriptionId && stripeSubscriptionStatus !== "canceled" && (
        <Card className="p-6 max-w-7xl mx-auto border-red-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Cancel Subscription
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {currentBillingInterval === "year"
                  ? "Yearly subscriptions are non-refundable. Your service will continue until the end of your billing period."
                  : "Your subscription will continue until the end of your billing period. No refunds for partial months."}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={loading === "manage"}
                >
                  {loading === "manage" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Manage Billing
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setCancelModalOpen(true)}
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Canceled Subscription Notice */}
      {stripeSubscriptionStatus === "canceled" && subscriptionEndsAt && (
        <Card className="p-6 max-w-7xl mx-auto border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-amber-900 mb-1">
                Subscription Canceled
              </h3>
              <p className="text-sm text-amber-800 mb-2">
                Your subscription has been canceled and will end on{" "}
                {new Date(subscriptionEndsAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                . You can still reactivate before this date.
              </p>
              <Button
                onClick={() => handleUpgrade(currentPlan as PlanType)}
                className="bg-amber-600 hover:bg-amber-700"
                disabled={loading === currentPlan}
              >
                {loading === currentPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reactivate Subscription
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        billingInterval={currentBillingInterval as "month" | "year"}
        subscriptionEndsAt={subscriptionEndsAt}
        onSuccess={() => {
          router.refresh();
          setCancelModalOpen(false);
        }}
      />
    </div>
  );
}
