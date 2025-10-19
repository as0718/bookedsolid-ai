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
import { AlertTriangle, Loader2, CheckCircle2, XCircle, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DeleteClientAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: {
    id: string;
    businessName: string;
    email: string;
  };
  users?: Array<{ name?: string | null; email?: string | null }>;
  metrics: {
    totalCalls: number;
    voiceClientsCount?: number;
    appointmentsCount?: number;
  };
  onSuccess: () => void;
}

export function DeleteClientAccountModal({
  open,
  onOpenChange,
  client,
  users = [],
  metrics,
  onSuccess,
}: DeleteClientAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete client account");
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

  const voiceClientsCount = metrics.voiceClientsCount || 0;
  const appointmentsCount = metrics.appointmentsCount || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-xl">
            <AlertTriangle className="h-6 w-6" />
            DELETE CLIENT ACCOUNT - {client.businessName}
          </DialogTitle>
          <DialogDescription className="text-base">
            This action is permanent and cannot be undone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Danger Warning */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-2">
                  ⚠️ DANGER ZONE - This action is permanent
                </h4>
                <p className="text-sm text-red-800">
                  This will permanently delete the business account and all associated data.
                  CRM customer records will be preserved for admin access.
                </p>
              </div>
            </div>
          </div>

          {/* What Will Be Deleted */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              This will permanently delete:
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                <span>
                  <strong>{client.businessName}</strong> business account
                </span>
              </li>
              {users.map((user, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                  <span>
                    User: <strong>{user.name || "Unknown"}</strong> ({user.email})
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                <span>
                  All appointments{" "}
                  <Badge variant="destructive" className="ml-1">
                    {appointmentsCount} records
                  </Badge>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                <span>
                  All call history{" "}
                  <Badge variant="destructive" className="ml-1">
                    {metrics.totalCalls} calls
                  </Badge>
                </span>
              </li>
            </ul>
          </div>

          {/* What Will Be Preserved */}
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              CRM customer data will be PRESERVED:
            </h4>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-center gap-2">
                <Archive className="h-4 w-4 flex-shrink-0" />
                <span>
                  CRM customer database{" "}
                  <Badge variant="outline" className="bg-green-100 text-green-800 ml-1">
                    {voiceClientsCount} records
                  </Badge>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0" />
                <span>Customer contact information and notes</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0" />
                <span>Customer service history and preferences</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0" />
                <span>Accessible by admins for future reference</span>
              </li>
            </ul>
            <p className="text-xs text-green-700 mt-3 font-medium">
              ℹ️ These {voiceClientsCount} CRM records will be transferred to the system admin
              account and can be accessed or exported if needed.
            </p>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label htmlFor="confirmText" className="text-sm font-semibold text-gray-900">
              Type "DELETE" to confirm permanent deletion:
            </label>
            <input
              id="confirmText"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg font-mono"
              placeholder="Type DELETE here"
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || confirmText !== "DELETE"}
            className="min-w-[200px]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Permanently Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
