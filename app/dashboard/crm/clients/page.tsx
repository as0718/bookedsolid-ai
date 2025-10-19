"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ClientModal } from "@/components/crm/client-modal";
import { DeleteCustomerModal } from "@/components/crm/delete-customer-modal";

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
  callHistory: any[];
  appointments?: Array<{
    id: string;
    date: string;
    duration: number;
    serviceType: string;
    status: string;
  }>;
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

interface TodayAppointment {
  id: string;
  date: string;
  duration: number;
  serviceType: string;
  status: string;
  client: {
    id: string;
    clientName: string | null;
    phoneNumber: string;
  };
}

export default function CRMClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<VoiceClient[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<VoiceClient | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<VoiceClient | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchClients();
    fetchTodayAppointments();
  }, [search, statusFilter]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/voice-clients?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAppointments = async () => {
    try {
      const response = await fetch("/api/appointments/today");
      if (response.ok) {
        const data = await response.json();
        setTodayAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
    }
  };

  const handleDelete = (client: VoiceClient) => {
    setDeletingClient(client);
    setDeleteModalOpen(true);
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const handleEditClient = (client: VoiceClient) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    showSuccess(
      editingClient ? "Client updated successfully" : "Client added successfully"
    );
    fetchClients();
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple phone formatting
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getLastCallDate = (client: VoiceClient) => {
    if (client.callHistory && client.callHistory.length > 0) {
      return new Date(client.callHistory[0].timestamp).toLocaleDateString();
    }
    return "No calls";
  };

  const formatAppointmentTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeOnly = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAppointmentDisplay = (client: VoiceClient) => {
    if (client.appointments && client.appointments.length > 0) {
      const nextAppt = client.appointments[0];
      return (
        <div className="text-sm">
          <div className="font-medium text-blue-600">
            {formatAppointmentTime(nextAppt.date)}
          </div>
          <div className="text-gray-600 text-xs">
            {nextAppt.serviceType}
          </div>
        </div>
      );
    }
    return <span className="text-gray-500">{client.serviceType || "-"}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voice Clients</h1>
            <p className="text-gray-600 mt-1">
              Manage clients from your phone calls
            </p>
          </div>
          <Button
            onClick={handleAddClient}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Today's Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Today's Appointments
            </h2>
          </div>
          <div className="p-6">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No appointments today
              </div>
            ) : (
              <div className="space-y-2">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => router.push(`/dashboard/crm/clients/${apt.client.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-semibold text-blue-600 min-w-[100px]">
                        {formatTimeOnly(apt.date)}
                      </div>
                      <div className="w-px h-8 bg-gray-200"></div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {apt.client.clientName || "Unknown Client"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {apt.serviceType}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="LEAD">Leads</SelectItem>
                <SelectItem value="BOOKED">Booked</SelectItem>
                <SelectItem value="CUSTOMER">Customers</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Clients</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {clients.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Leads</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {clients.filter((c) => c.status === "LEAD").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Booked</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {clients.filter((c) => c.status === "BOOKED").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Customers</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {clients.filter((c) => c.status === "CUSTOMER").length}
            </div>
          </div>
        </div>

        {/* Client List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500">Loading clients...</div>
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No clients yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start by adding your first voice client
            </p>
            <Button
              onClick={handleAddClient}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calls
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Call
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/crm/clients/${client.id}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-medium">
                              {client.clientName
                                ? client.clientName.charAt(0).toUpperCase()
                                : "?"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.clientName || "Unknown"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {formatPhoneNumber(client.phoneNumber)}
                          </div>
                          {client.email && (
                            <div className="flex items-center text-gray-500">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAppointmentDisplay(client)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={statusColors[client.status]}>
                          {client.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client._count.callHistory}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {getLastCallDate(client)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/crm/clients/${client.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClient(client);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(client);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Client Modal */}
        <ClientModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          client={editingClient}
          onSuccess={handleModalSuccess}
        />

        {/* Delete Customer Modal */}
        {deletingClient && (
          <DeleteCustomerModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            customer={{
              id: deletingClient.id,
              clientName: deletingClient.clientName,
              phoneNumber: deletingClient.phoneNumber,
            }}
            appointmentsCount={deletingClient.appointments?.length || 0}
            callsCount={deletingClient._count.callHistory}
            onSuccess={() => {
              showSuccess("Customer deleted successfully");
              fetchClients();
              setDeleteModalOpen(false);
              setDeletingClient(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
