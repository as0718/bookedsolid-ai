"use client";

import { NavBar } from "@/components/dashboard/nav-bar";
import { demoClient, calculateMetrics, demoCallHistory } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Download,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";

export default function BillingPage() {
  const metrics = calculateMetrics(demoCallHistory);
  const usagePercent = (demoClient.billing.minutesUsed / demoClient.billing.minutesIncluded) * 100;
  const projectedOverage =
    demoClient.billing.minutesUsed > demoClient.billing.minutesIncluded
      ? (demoClient.billing.minutesUsed - demoClient.billing.minutesIncluded) *
        demoClient.billing.overageRate
      : 0;

  // Calculate days left in billing period
  const today = new Date();
  const periodEnd = new Date(demoClient.billing.currentPeriodEnd);
  const daysLeft = Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Mock billing history
  const billingHistory = [
    { date: "2025-10-09", amount: 349.0, plan: "Complete Receptionist", status: "Paid" },
    { date: "2025-09-09", amount: 374.5, plan: "Complete + $25.50 overage", status: "Paid" },
    { date: "2025-08-09", amount: 349.0, plan: "Complete Receptionist", status: "Paid" },
    { date: "2025-07-09", amount: 149.0, plan: "Missed Call Recovery", status: "Paid" },
  ];

  // Get plan badge
  const getPlanBadge = (plan: string) => {
    const config: Record<string, { label: string; color: string }> = {
      complete: { label: "Complete Receptionist", color: "bg-purple-500" },
      missed: { label: "Missed Call Recovery", color: "bg-blue-500" },
      unlimited: { label: "High-Volume Unlimited", color: "bg-green-500" },
    };
    const planConfig = config[plan] || config.complete;
    return (
      <Badge className={`${planConfig.color} text-white`}>{planConfig.label}</Badge>
    );
  };

  // Get usage alert
  const getUsageAlert = () => {
    if (usagePercent >= 90) {
      return {
        level: "error" as const,
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
        message: "⚠️ You're at 85% of your monthly minutes.",
        suggestion:
          "Consider upgrading to High-Volume Unlimited ($599/mo) to avoid overages.",
        color: "bg-red-50 border-red-200 text-red-800",
      };
    } else if (usagePercent >= 75) {
      return {
        level: "warning" as const,
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        message: "⚠️ You're at 85% of your monthly minutes.",
        suggestion:
          "Consider upgrading to High-Volume Unlimited ($599/mo) to avoid overages.",
        color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      };
    }
    return null;
  };

  const alert = getUsageAlert();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userName={demoClient.businessName} userEmail={demoClient.email} isAdmin={false} />

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
              {getPlanBadge(demoClient.plan)}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                ${demoClient.billing.monthlyRate}
                <span className="text-lg text-gray-600 font-normal">/month</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-gray-700">
              <span>• Up to {demoClient.billing.minutesIncluded.toLocaleString()} minutes per month</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <span>
                • Additional minutes: ${demoClient.billing.overageRate}/min
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4" />
              <span>
                Next billing date:{" "}
                {format(new Date(demoClient.billing.currentPeriodEnd), "MMMM d, yyyy")}
              </span>
              <Badge variant="outline">{daysLeft} days left</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">Change Plan</Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700">
              Cancel Subscription
            </Button>
          </div>
        </Card>

        {/* Current Usage */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Usage</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Minutes Used This Month
                </span>
                <span className="text-sm font-semibold">
                  {demoClient.billing.minutesUsed} / {demoClient.billing.minutesIncluded}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Calls</p>
                <p className="text-2xl font-bold">{metrics.totalCalls}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Avg Call Length</p>
                <p className="text-2xl font-bold">
                  {Math.floor(
                    demoCallHistory.reduce((sum, c) => sum + c.duration, 0) /
                      demoCallHistory.length /
                      60
                  )}
                  :{String(
                    Math.floor(
                      (demoCallHistory.reduce((sum, c) => sum + c.duration, 0) /
                        demoCallHistory.length) %
                        60
                    )
                  ).padStart(2, "0")}{" "}
                  min
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Projected Overage</p>
                <p className="text-2xl font-bold">
                  ${projectedOverage.toFixed(2)}
                </p>
              </div>
            </div>

            {projectedOverage === 0 && !alert && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">You&apos;re on track! No overages projected.</span>
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
                  <Button size="sm" variant="default">
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <CreditCard className="h-6 w-6 text-gray-700" />
            </div>
            <div className="flex-1">
              <p className="font-medium">💳 Visa ending in 4242</p>
              <p className="text-sm text-gray-600">Expires: 12/2026</p>
            </div>
            <Button variant="outline">Update Payment Method</Button>
          </div>
        </Card>

        {/* Billing History */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Billing History</h2>
            <Button variant="outline" size="sm">
              View All Invoices
            </Button>
          </div>

          <div className="space-y-3">
            {billingHistory.map((invoice, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{format(new Date(invoice.date), "MMMM d, yyyy")}</p>
                    <p className="text-sm text-gray-600">{invoice.plan}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">${invoice.amount.toFixed(2)}</p>
                    <Badge variant="outline" className="text-green-600">
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Plan Comparison */}
        <Card className="p-6 mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <h3 className="font-semibold mb-3">💡 Need More Minutes?</h3>
          <p className="text-sm text-gray-700 mb-4">
            Upgrade to High-Volume Unlimited for just $599/month and get unlimited calling minutes,
            priority support, and advanced analytics.
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700">
            Compare Plans
          </Button>
        </Card>
      </main>
    </div>
  );
}
