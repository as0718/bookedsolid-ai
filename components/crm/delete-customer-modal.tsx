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
import { AlertTriangle, Loader2, Archive, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DeleteCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: string;
    clientName: string | null;
    phoneNumber: string;
  };
  appointmentsCount?: number;
  callsCount?: number;
  onSuccess: () => void;
}

export function DeleteCustomerModal({
  open,
  onOpenChange,
  customer,
  appointmentsCount = 0,
  callsCount = 0,
  onSuccess,
}: DeleteCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleteType, setDeleteType] = useState<"soft" | "hard" | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async (soft: boolean) => {
    setDeleteType(soft ? "soft" : "hard");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/voice-clients/${customer.id}?soft=${soft}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete customer");
      }

      // Success
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete customer"
      );
    } finally {
      setLoading(false);
      setDeleteType(null);
      setConfirmText("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Customer
          </DialogTitle>
          <DialogDescription>
            Choose how to remove {customer.clientName || customer.phoneNumber}{" "}
            from your CRM
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Customer Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">
                  {customer.clientName || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{customer.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Appointments:</span>
                <Badge variant="outline">{appointmentsCount}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Call History:</span>
                <Badge variant="outline">{callsCount}</Badge>
              </div>
            </div>
          </div>

          {/* Soft Delete Option */}
          <div className="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Archive className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Mark as Inactive (Recommended)
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  The customer will be marked as INACTIVE. All appointments and call
                  history are preserved. You can reactivate them later.
                </p>
                <ul className="text-xs text-gray-500 space-y-1 mb-3">
                  <li>✓ Customer data preserved</li>
                  <li>✓ Appointments retained ({appointmentsCount})</li>
                  <li>✓ Call history retained ({callsCount})</li>
                  <li>✓ Can be reactivated anytime</li>
                </ul>
                <Button
                  variant="outline"
                  onClick={() => handleDelete(true)}
                  disabled={loading}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {loading && deleteType === "soft" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Archive className="mr-2 h-4 w-4" />
                  Mark as Inactive
                </Button>
              </div>
            </div>
          </div>

          {/* Hard Delete Option */}
          <div className="border-2 border-red-200 rounded-lg p-4 hover:border-red-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  Permanently Delete
                  <Badge variant="destructive" className="text-xs">
                    Irreversible
                  </Badge>
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Customer will be permanently removed from your CRM. This action
                  cannot be undone.
                </p>
                <ul className="text-xs text-gray-500 space-y-1 mb-3">
                  <li className="text-red-600">⚠ Customer record deleted</li>
                  <li className="text-red-600">
                    ⚠ All appointments deleted ({appointmentsCount})
                  </li>
                  <li>• Call history unlinked (preserved in system)</li>
                  <li className="text-red-600 font-semibold">
                    ⚠ This cannot be undone
                  </li>
                </ul>
                <div className="space-y-2">
                  <label htmlFor="confirmText" className="text-xs font-medium text-gray-700">
                    Type "DELETE" to confirm permanent deletion:
                  </label>
                  <input
                    id="confirmText"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Type DELETE here"
                    disabled={loading}
                  />
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(false)}
                    disabled={loading || confirmText !== "DELETE"}
                  >
                    {loading && deleteType === "hard" && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Trash2 className="mr-2 h-4 w-4" />
                    Permanently Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
