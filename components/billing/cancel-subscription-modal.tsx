"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingInterval: "month" | "year";
  subscriptionEndsAt?: Date | string | null;
  onSuccess: () => void;
}

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  billingInterval,
  subscriptionEndsAt,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const isYearly = billingInterval === "year";
  const endDate = subscriptionEndsAt
    ? new Date(subscriptionEndsAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "the end of your billing period";

  const handleCancel = async () => {
    if (confirmText !== "CANCEL") {
      setError('Please type "CANCEL" to confirm');
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          immediate: false, // Always cancel at period end
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      // Success
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            {isYearly
              ? "Yearly subscriptions are non-refundable"
              : "Your subscription will continue until the end of your billing period"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">
              What happens when you cancel:
            </h4>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• Your service will continue until {endDate}</li>
              <li>• You'll retain access to all features until then</li>
              <li>• No refunds will be issued for {isYearly ? "yearly" : "remaining time on"} subscriptions</li>
              <li>• Your account data will be preserved</li>
              <li>• You can reactivate anytime before {endDate}</li>
            </ul>
          </div>

          {isYearly && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900 mb-1">
                Yearly Subscription Policy
              </p>
              <p className="text-sm text-amber-800">
                Yearly subscriptions are non-refundable. Your service will continue until {endDate}.
                After that date, your subscription will not renew.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="confirmText" className="text-sm font-medium">
              Type "CANCEL" to confirm:
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Type CANCEL here"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Keep Subscription
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={loading || confirmText !== "CANCEL"}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Subscription
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
