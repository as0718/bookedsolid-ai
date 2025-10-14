"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ClientAccount, BillingInfo } from "@/lib/types";
import { Loader2, Check } from "lucide-react";

interface PlanEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientAccount;
  onSuccess?: () => void;
}

const PLAN_DETAILS = {
  missed: {
    name: "Missed Calls",
    price: 149,
    minutes: 500,
    overageRate: 0.3,
    features: [
      "Handles missed calls only",
      "500 minutes/month",
      "$0.30/min overage",
      "Basic booking features",
    ],
  },
  complete: {
    name: "Complete Coverage",
    price: 349,
    minutes: 1000,
    overageRate: 0.25,
    features: [
      "24/7 call coverage",
      "1,000 minutes/month",
      "$0.25/min overage",
      "Advanced booking & FAQs",
      "CRM integration",
    ],
  },
  unlimited: {
    name: "Unlimited",
    price: 599,
    minutes: 999999,
    overageRate: 0,
    features: [
      "Unlimited minutes",
      "No overage charges",
      "Priority support",
      "Custom integrations",
      "Advanced analytics",
    ],
  },
};

export function PlanEditDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
}: PlanEditDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(client.plan);

  const currentPlan = PLAN_DETAILS[selectedPlan as keyof typeof PLAN_DETAILS];
  const billing = client.billing as BillingInfo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPlan === client.plan) {
      onOpenChange(false);
      return;
    }

    if (
      !confirm(
        `Change ${client.businessName}'s plan from ${client.plan} to ${selectedPlan}?`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Update billing information based on new plan
      const newBilling = {
        ...billing,
        minutesIncluded: currentPlan.minutes,
        overageRate: currentPlan.overageRate,
        monthlyRate: currentPlan.price,
      };

      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
          billing: newBilling,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update plan");
      }

      // Success
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Change Subscription Plan</DialogTitle>
          <DialogDescription>
            Update {client.businessName}'s subscription plan and billing
            settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Current Plan Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Current Plan</p>
            <p className="font-semibold text-lg capitalize">{client.plan}</p>
            <p className="text-sm text-gray-600 mt-1">
              ${billing.monthlyRate}/month • {billing.minutesUsed.toLocaleString()}{" "}
              of {billing.minutesIncluded.toLocaleString()} minutes used
            </p>
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>Select New Plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="missed">
                  Missed Calls - $149/mo
                </SelectItem>
                <SelectItem value="complete">
                  Complete Coverage - $349/mo
                </SelectItem>
                <SelectItem value="unlimited">
                  Unlimited - $599/mo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plan Details */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
                <p className="text-2xl font-bold text-primary mt-1">
                  ${currentPlan.price}
                  <span className="text-sm font-normal text-gray-600">
                    /month
                  </span>
                </p>
              </div>
              {selectedPlan === client.plan && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Current
                </span>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-gray-700">
                Plan Features:
              </p>
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Monthly Minutes</p>
              <p className="font-semibold">
                {currentPlan.minutes === 999999
                  ? "Unlimited"
                  : currentPlan.minutes.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Overage Rate</p>
              <p className="font-semibold">
                {currentPlan.overageRate === 0
                  ? "None"
                  : `$${currentPlan.overageRate}/min`}
              </p>
            </div>
          </div>

          {selectedPlan !== client.plan && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> The plan change will take effect
                immediately. The client will be billed the new rate starting
                from their next billing cycle.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedPlan === client.plan}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedPlan === client.plan ? "No Change" : "Update Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
