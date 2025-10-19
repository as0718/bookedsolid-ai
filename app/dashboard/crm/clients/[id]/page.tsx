"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientModal } from "@/components/crm/client-modal";
import { UpcomingAppointments } from "@/components/crm/upcoming-appointments";
import { AppointmentModal } from "@/components/crm/appointment-modal";
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  Edit,
  Trash2,
  PhoneCall,
  MessageSquare,
} from "lucide-react";

interface CallRecord {
  id: string;
  timestamp: string;
  callerName: string;
  callerPhone: string;
  duration: number;
  outcome: string;
  notes: string;
  transcript?: string | null;
}

interface VoiceClient {
  id: string;
  phoneNumber: string;
  clientName: string | null;
  email: string | null;
  serviceType: string | null;
  status: "LEAD" | "BOOKED" | "CUSTOMER" | "INACTIVE";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  callHistory: CallRecord[];
  _count: {
    callHistory: number;
  };
}

const statusColors = {
  LEAD: "bg-yellow-100 text-yellow-800",
  BOOKED: "bg-blue-100 text-blue-800",
  CUSTOMER: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
};

const outcomeColors: Record<string, string> = {
  booked: "bg-green-100 text-green-800",
  info: "bg-blue-100 text-blue-800",
  voicemail: "bg-yellow-100 text-yellow-800",
  transferred: "bg-purple-100 text-purple-800",
  spam: "bg-red-100 text-red-800",
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<VoiceClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [appointmentRefresh, setAppointmentRefresh] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchClient();
    }
  }, [params.id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/voice-clients/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      } else {
        router.push("/dashboard/crm/clients");
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      router.push("/dashboard/crm/clients");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      const response = await fetch(`/api/voice-clients/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/crm/clients");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const handleEdit = () => {
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchClient(); // Refresh client data after update
  };

  const handleAddAppointment = () => {
    setEditingAppointment(null);
    setAppointmentModalOpen(true);
  };

  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment);
    setAppointmentModalOpen(true);
  };

  const handleAppointmentSuccess = () => {
    setAppointmentRefresh(prev => prev + 1); // Trigger refresh in UpcomingAppointments
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading client details...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Client not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/crm/clients")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {client.clientName || "Unknown Client"}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusColors[client.status]}>
                  {client.status}
                </Badge>
                <span className="text-gray-500 text-sm">
                  {client._count.callHistory} calls
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Client Info & Appointments */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </div>
                  <div className="text-gray-900 font-medium">
                    {formatPhoneNumber(client.phoneNumber)}
                  </div>
                </div>

                {client.email && (
                  <div>
                    <div className="flex items-center text-gray-600 text-sm mb-1">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </div>
                    <div className="text-gray-900">{client.email}</div>
                  </div>
                )}

                {client.serviceType && (
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Service Type</div>
                    <div className="text-gray-900">{client.serviceType}</div>
                  </div>
                )}

                <div>
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Added
                  </div>
                  <div className="text-gray-900">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-gray-600 text-sm mb-1">
                    <Clock className="h-4 w-4 mr-2" />
                    Last Updated
                  </div>
                  <div className="text-gray-900">
                    {new Date(client.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {client.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-gray-600 text-sm mb-2">Notes</div>
                  <p className="text-gray-900 text-sm whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Upcoming Appointments */}
            <UpcomingAppointments
              clientId={client.id}
              onAddAppointment={handleAddAppointment}
              onEditAppointment={handleEditAppointment}
              key={appointmentRefresh}
            />
          </div>

          {/* Right Column - Call History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Call History
              </h2>

              {client.callHistory.length === 0 ? (
                <div className="text-center py-8">
                  <PhoneCall className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No calls recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {client.callHistory.map((call) => (
                    <div
                      key={call.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {new Date(call.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <Badge
                          className={
                            outcomeColors[call.outcome] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {call.outcome}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-2 text-sm">
                        <div>
                          <span className="text-gray-600">Duration: </span>
                          <span className="text-gray-900">
                            {formatDuration(call.duration)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Caller: </span>
                          <span className="text-gray-900">{call.callerName}</span>
                        </div>
                      </div>

                      {call.notes && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                            <p className="text-sm text-gray-700">{call.notes}</p>
                          </div>
                        </div>
                      )}

                      {call.transcript && (
                        <details className="mt-2 pt-2 border-t border-gray-100">
                          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                            View Transcript
                          </summary>
                          <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                            {call.transcript}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client Edit Modal */}
        <ClientModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          client={client}
          onSuccess={handleModalSuccess}
        />

        {/* Appointment Modal */}
        <AppointmentModal
          open={appointmentModalOpen}
          onOpenChange={setAppointmentModalOpen}
          appointment={editingAppointment}
          clientId={client.id}
          onSuccess={handleAppointmentSuccess}
        />
      </div>
    </div>
  );
}
