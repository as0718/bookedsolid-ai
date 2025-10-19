"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VoiceClient {
  id: string;
  phoneNumber: string;
  clientName: string | null;
  email: string | null;
  serviceType: string | null;
  status: "LEAD" | "BOOKED" | "CUSTOMER" | "INACTIVE";
  notes: string | null;
}

interface ClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: VoiceClient | null;
  onSuccess: () => void;
}

export function ClientModal({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    clientName: "",
    phoneNumber: "",
    email: "",
    serviceType: "",
    notes: "",
    status: "LEAD" as "LEAD" | "BOOKED" | "CUSTOMER" | "INACTIVE",
  });

  // Reset form when modal opens or client changes
  useEffect(() => {
    if (open) {
      if (client) {
        // Edit mode - populate with existing data
        setFormData({
          clientName: client.clientName || "",
          phoneNumber: client.phoneNumber || "",
          email: client.email || "",
          serviceType: client.serviceType || "",
          notes: client.notes || "",
          status: client.status || "LEAD",
        });
      } else {
        // Add mode - reset to defaults
        setFormData({
          clientName: "",
          phoneNumber: "",
          email: "",
          serviceType: "",
          notes: "",
          status: "LEAD",
        });
      }
      setError("");
    }
  }, [open, client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!formData.clientName.trim()) {
      setError("Client name is required");
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }

    setLoading(true);

    try {
      const url = client
        ? `/api/voice-clients/${client.id}`
        : "/api/voice-clients";
      const method = client ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName: formData.clientName.trim() || null,
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim() || null,
          serviceType: formData.serviceType || null,
          notes: formData.notes.trim() || null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save client");
      }

      // Success - close modal and refresh list
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {client ? "Edit Client" : "Add New Client"}
          </DialogTitle>
          <DialogDescription>
            {client
              ? "Update the client information below."
              : "Enter the client details to add them to your CRM."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">
              Client Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clientName"
              placeholder="John Doe"
              value={formData.clientName}
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value })
              }
              disabled={loading}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              disabled={loading}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) =>
                setFormData({ ...formData, serviceType: value })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="haircut">Haircut</SelectItem>
                <SelectItem value="coloring">Coloring</SelectItem>
                <SelectItem value="styling">Styling</SelectItem>
                <SelectItem value="mens-cut">Men's Cut</SelectItem>
                <SelectItem value="womens-cut">Women's Cut</SelectItem>
                <SelectItem value="highlights">Highlights</SelectItem>
                <SelectItem value="balayage">Balayage</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as "LEAD" | "BOOKED" | "CUSTOMER" | "INACTIVE",
                })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="BOOKED">Booked</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add receptionist notes about this client..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Footer Buttons */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? "Saving..." : client ? "Update Client" : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
