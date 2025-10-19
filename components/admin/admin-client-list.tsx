"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientFormDialog } from "./client-form-dialog";
import { DeleteClientAccountModal } from "./delete-client-account-modal";
import { SubscriptionStatusBadge } from "./subscription-status-badge";
import { ClientAccount, BillingInfo } from "@/lib/types";
import { Search, Filter, Save, X, Edit2, Trash2 } from "lucide-react";

interface AdminClientListProps {
  initialClients: ClientAccount[];
}

export function AdminClientList({ initialClients }: AdminClientListProps) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [filteredClients, setFilteredClients] = useState(initialClients);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingClient, setDeletingClient] = useState<ClientAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [editingPOC, setEditingPOC] = useState<string | null>(null);
  const [pocValue, setPocValue] = useState<string>("");
  const [savingPOC, setSavingPOC] = useState<boolean>(false);

  // Apply filters
  const applyFilters = (
    search: string,
    plan: string,
    status: string,
    subscription: string,
    clientsList = clients
  ) => {
    let filtered = clientsList;

    // Search filter
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.businessName.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          client.phone.includes(query) ||
          client.contactName?.toLowerCase().includes(query) ||
          client.pointOfContact?.toLowerCase().includes(query) ||
          client.location?.toLowerCase().includes(query)
      );
    }

    // Plan filter
    if (plan !== "all") {
      filtered = filtered.filter((client) => client.plan === plan);
    }

    // Status filter
    if (status !== "all") {
      filtered = filtered.filter((client) => client.status === status);
    }

    // Subscription status filter
    if (subscription !== "all") {
      filtered = filtered.filter((client) => {
        switch (subscription) {
          case "active":
            return client.stripeSubscriptionStatus === "active";
          case "trial":
            return client.stripeSubscriptionStatus === "trialing";
          case "not_started":
            return !client.stripeSubscriptionId;
          case "overdue":
            return client.stripeSubscriptionStatus === "past_due" || client.stripeSubscriptionStatus === "unpaid";
          default:
            return true;
        }
      });
    }

    setFilteredClients(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    applyFilters(value, planFilter, statusFilter, subscriptionFilter);
  };

  const handlePlanFilterChange = (value: string) => {
    setPlanFilter(value);
    applyFilters(searchQuery, value, statusFilter, subscriptionFilter);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    applyFilters(searchQuery, planFilter, value, subscriptionFilter);
  };

  const handleSubscriptionFilterChange = (value: string) => {
    setSubscriptionFilter(value);
    applyFilters(searchQuery, planFilter, statusFilter, value);
  };

  const handleClientAdded = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  const handleEditPOC = (clientId: string, currentPOC: string | null | undefined) => {
    setEditingPOC(clientId);
    setPocValue(currentPOC || "");
  };

  const handleCancelEditPOC = () => {
    setEditingPOC(null);
    setPocValue("");
  };

  const handleSavePOC = async (clientId: string) => {
    setSavingPOC(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pointOfContact: pocValue || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update point of contact");
      }

      // Update the client in the local state
      const updatedClients = clients.map((client) =>
        client.id === clientId ? { ...client, pointOfContact: pocValue } : client
      );
      setClients(updatedClients);
      applyFilters(searchQuery, planFilter, statusFilter, subscriptionFilter, updatedClients);
      setEditingPOC(null);
      setPocValue("");
    } catch (error) {
      console.error("Error saving POC:", error);
      alert("Failed to save point of contact. Please try again.");
    } finally {
      setSavingPOC(false);
    }
  };

  const handleDeleteClick = (client: ClientAccount) => {
    setDeletingClient(client);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setDeletingClient(null);
    // Refresh the page to get updated data
    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Client List</h2>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              + Add Client
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={planFilter} onValueChange={handlePlanFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={subscriptionFilter}
                onValueChange={handleSubscriptionFilterChange}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Subscription" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subscriptions</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredClients.length} of {clients.length} clients
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium">
                    Business / Contact
                  </th>
                  <th className="p-3 text-left text-sm font-medium">Plan</th>
                  <th className="p-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    CRM Status
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    Point of Contact
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    Location
                  </th>
                  <th className="p-3 text-left text-sm font-medium">
                    Minutes
                  </th>
                  <th className="p-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No clients found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const billing = client.billing as BillingInfo;
                    const usagePercent =
                      (billing.minutesUsed / billing.minutesIncluded) * 100;
                    const isNearingLimit =
                      usagePercent >= 90 && client.plan !== "unlimited";
                    const isEditingThisPOC = editingPOC === client.id;

                    // Get user info for CRM status
                    const clientUser = (client as any).users?.[0];
                    const fullName = clientUser?.fullName || clientUser?.name || client.contactName;
                    const hasExternalCRM = clientUser?.hasExternalCRM === true;
                    const preferredCRM = clientUser?.preferredCRM;

                    return (
                      <tr
                        key={client.id}
                        className="group border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        {/* Business / Contact Name */}
                        <td className="p-3 text-sm">
                          <div className="font-medium text-gray-900">
                            {client.businessName}
                          </div>
                          {fullName && (
                            <div className="text-xs text-gray-500 mt-1">
                              {fullName}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {client.email}
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize">
                            {client.plan}
                          </Badge>
                        </td>

                        {/* Subscription Status */}
                        <td className="p-3">
                          <SubscriptionStatusBadge
                            status={client.stripeSubscriptionStatus}
                            stripeSubscriptionId={client.stripeSubscriptionId}
                            accountStatus={client.status}
                          />
                        </td>

                        {/* CRM Status */}
                        <td className="p-3">
                          {hasExternalCRM ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                External
                              </Badge>
                              {preferredCRM && (
                                <span className="text-xs text-gray-500">
                                  ({preferredCRM})
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              Built-in
                            </Badge>
                          )}
                        </td>

                        {/* Point of Contact - Editable */}
                        <td className="p-3">
                          {isEditingThisPOC ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={pocValue}
                                onChange={(e) => setPocValue(e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Enter POC name"
                                disabled={savingPOC}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleSavePOC(client.id)}
                                disabled={savingPOC}
                              >
                                <Save className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={handleCancelEditPOC}
                                disabled={savingPOC}
                              >
                                <X className="h-4 w-4 text-gray-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">
                                {client.pointOfContact || (
                                  <span className="text-gray-400 italic">
                                    Not set
                                  </span>
                                )}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={() =>
                                  handleEditPOC(client.id, client.pointOfContact)
                                }
                              >
                                <Edit2 className="h-3 w-3 text-gray-400" />
                              </Button>
                            </div>
                          )}
                        </td>

                        {/* Location */}
                        <td className="p-3 text-sm text-gray-600">
                          {client.location || (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>

                        {/* Minutes Used */}
                        <td className="p-3 text-sm">
                          {billing.minutesUsed.toLocaleString()}
                          {client.plan !== "unlimited" && (
                            <span className="text-gray-400">
                              {" "}
                              / {billing.minutesIncluded.toLocaleString()}
                            </span>
                          )}
                          {isNearingLimit && (
                            <span className="ml-2 text-amber-600 font-medium">
                              ⚠️
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Link href={`/admin/clients/${client.id}`}>
                              <Button size="sm" variant="ghost">
                                View
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteClick(client)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ClientFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleClientAdded}
      />

      {/* Delete Client Account Modal */}
      {deletingClient && (
        <DeleteClientAccountModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          client={{
            id: deletingClient.id,
            businessName: deletingClient.businessName,
            email: deletingClient.email,
          }}
          users={(deletingClient as any).users || []}
          metrics={{
            totalCalls: 0, // We don't have this data in the list, modal will show it
            voiceClientsCount: 0, // Modal will fetch or estimate
            appointmentsCount: 0, // Modal will fetch or estimate
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  );
}
