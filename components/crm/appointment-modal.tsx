"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { ClientModal } from "@/components/crm/client-modal";
import { Plus } from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  duration: number;
  serviceType: string;
  status: "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  clientId: string;
  specialistId?: string;
}

interface TeamMember {
  id: string;
  name: string;
  teamRole?: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  teamRole?: string;
  isTeamMember: boolean;
}

interface VoiceClient {
  id: string;
  clientName: string | null;
  phoneNumber: string;
  email: string | null;
}

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  clientId?: string; // Made optional to support client selection
  onSuccess: () => void;
  prefilledDate?: string; // Support pre-filled date from calendar
  prefilledTime?: string; // Support pre-filled time from calendar
}

export function AppointmentModal({
  open,
  onOpenChange,
  appointment,
  clientId,
  onSuccess,
  prefilledDate,
  prefilledTime,
}: AppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [businessOwner, setBusinessOwner] = useState<TeamMember | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [clients, setClients] = useState<VoiceClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [formData, setFormData] = useState({
    clientId: clientId || "",
    date: prefilledDate || "",
    time: prefilledTime || "",
    duration: "60",
    serviceType: "",
    status: "CONFIRMED" as "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
    notes: "",
    specialistId: "", // Will be set to current user ID after fetch
  });

  // Fetch team members and clients when modal opens (optimized to run only once per open)
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoadingTeam(true);
      setLoadingClients(true);

      try {
        // Fetch team members and clients in parallel
        const [teamResponse, clientsResponse] = await Promise.all([
          fetch("/api/team/members"),
          !clientId ? fetch("/api/voice-clients") : Promise.resolve(null),
        ]);

        if (teamResponse.ok) {
          const teamData = await teamResponse.json();
          setCurrentUser(teamData.currentUser || null);
          setBusinessOwner(teamData.businessOwner || null);
          setTeamMembers(teamData.teamMembers || []);

          // Set default specialist to current user when creating new appointment
          if (!appointment && teamData.currentUser) {
            setFormData(prev => ({
              ...prev,
              specialistId: teamData.currentUser.id,
            }));
          }
        }

        if (clientsResponse && clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoadingTeam(false);
        setLoadingClients(false);
      }
    };

    fetchData();
  }, [open, clientId, appointment]);

  // Reset form when modal opens or appointment changes
  useEffect(() => {
    if (open) {
      if (appointment) {
        // Edit mode - populate with existing data
        const appointmentDate = new Date(appointment.date);
        const dateStr = appointmentDate.toISOString().split("T")[0];
        const timeStr = appointmentDate.toTimeString().slice(0, 5);

        setFormData({
          clientId: appointment.clientId,
          date: dateStr,
          time: timeStr,
          duration: appointment.duration.toString(),
          serviceType: appointment.serviceType,
          status: appointment.status,
          notes: appointment.notes || "",
          specialistId: appointment.specialistId || "unassigned",
        });
      } else {
        // Add mode - use prefilled data or defaults
        // Default to current user if available, otherwise unassigned
        setFormData({
          clientId: clientId || "",
          date: prefilledDate || "",
          time: prefilledTime || "",
          duration: "60",
          serviceType: "",
          status: "CONFIRMED",
          notes: "",
          specialistId: currentUser?.id || "",
        });
      }
      setError("");
    }
  }, [open, appointment, clientId, prefilledDate, prefilledTime, currentUser]);

  // Optimized submit handler with useCallback
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!formData.clientId || !formData.date || !formData.time || !formData.serviceType) {
      setError("Please fill in all required fields");
      return;
    }

    // Combine date and time into ISO string
    const dateTime = new Date(`${formData.date}T${formData.time}`);
    if (isNaN(dateTime.getTime())) {
      setError("Invalid date or time");
      return;
    }

    setLoading(true);

    try {
      const url = appointment
        ? `/api/appointments/${appointment.id}`
        : "/api/appointments";
      const method = appointment ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: formData.clientId,
          date: dateTime.toISOString(),
          duration: parseInt(formData.duration),
          serviceType: formData.serviceType,
          status: formData.status,
          notes: formData.notes.trim() || null,
          specialistId: formData.specialistId && formData.specialistId !== "unassigned" ? formData.specialistId : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save appointment");
      }

      // Success - close modal and refresh
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [formData, appointment, onOpenChange, onSuccess]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Optimized form field update handlers
  const updateFormField = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle successful client creation
  const handleClientCreated = useCallback(async () => {
    setShowClientModal(false);
    // Refetch clients to get the newly created client
    setLoadingClients(true);
    try {
      const response = await fetch("/api/voice-clients");
      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData || []);
        // Auto-select the most recently created client (last in array)
        if (clientsData && clientsData.length > 0) {
          const newestClient = clientsData[clientsData.length - 1];
          setFormData(prev => ({ ...prev, clientId: newestClient.id }));
        }
      }
    } catch (err) {
      console.error("Error refetching clients:", err);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {appointment ? "Edit Appointment" : "Schedule New Appointment"}
          </DialogTitle>
          <DialogDescription>
            {appointment
              ? "Update the appointment details below."
              : "Schedule a new appointment for this client."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection - Only show if clientId not provided */}
          {!clientId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="client">
                  Client <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClientModal(true)}
                  className="text-purple-600 hover:text-purple-700 h-auto py-1 px-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add New Client
                </Button>
              </div>
              <Select
                value={formData.clientId}
                onValueChange={(value) => updateFormField("clientId", value)}
                disabled={loading || loadingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.clientName || client.phoneNumber}
                      {client.email && ` (${client.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => updateFormField("date", e.target.value)}
              disabled={loading}
              required
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">
              Time <span className="text-red-500">*</span>
            </Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => updateFormField("time", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => updateFormField("duration", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="150">2.5 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label htmlFor="serviceType">
              Service Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.serviceType}
              onValueChange={(value) => updateFormField("serviceType", value)}
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

          {/* Specialist - Assignment Dropdown with "Me-First" Logic */}
          <div className="space-y-2">
            <Label htmlFor="specialist">Assign To</Label>
            <Select
              value={formData.specialistId}
              onValueChange={(value) => updateFormField("specialistId", value)}
              disabled={loading || loadingTeam}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingTeam ? "Loading..." : "Select who to assign"} />
              </SelectTrigger>
              <SelectContent>
                {/* Current User - "Me" Option (shown first) */}
                {currentUser && (
                  <SelectItem value={currentUser.id}>
                    Me ({currentUser.name})
                    {currentUser.teamRole && ` - ${currentUser.teamRole}`}
                  </SelectItem>
                )}

                {/* Business Owner (if current user is a team member) */}
                {businessOwner && (
                  <SelectItem value={businessOwner.id}>
                    {businessOwner.name} (Owner)
                    {businessOwner.teamRole && ` - ${businessOwner.teamRole}`}
                  </SelectItem>
                )}

                {/* Separator for other team members */}
                {teamMembers.length > 0 && (currentUser || businessOwner) && (
                  <SelectItem value="separator" disabled className="text-xs text-gray-500 font-semibold">
                    ── Other Team Members ──
                  </SelectItem>
                )}

                {/* Other Team Members */}
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                    {member.teamRole && ` - ${member.teamRole}`}
                  </SelectItem>
                ))}

                {/* Unassigned Option (at the end) */}
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Defaults to you. Choose another team member to delegate this appointment.
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => updateFormField("status", value as typeof formData.status)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or notes..."
              value={formData.notes}
              onChange={(e) => updateFormField("notes", e.target.value)}
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
              {loading
                ? "Saving..."
                : appointment
                ? "Update Appointment"
                : "Schedule Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Client Creation Modal */}
      <ClientModal
        open={showClientModal}
        onOpenChange={setShowClientModal}
        onSuccess={handleClientCreated}
      />
    </Dialog>
  );
}
