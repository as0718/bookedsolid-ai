"use client";

import { useState } from "react";
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
import { ClientAccount, BillingInfo } from "@/lib/types";
import { Search, Filter } from "lucide-react";

interface AdminClientListProps {
  initialClients: ClientAccount[];
}

export function AdminClientList({ initialClients }: AdminClientListProps) {
  const [clients, setClients] = useState(initialClients);
  const [filteredClients, setFilteredClients] = useState(initialClients);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Apply filters
  const applyFilters = (
    search: string,
    plan: string,
    status: string,
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
          client.phone.includes(query)
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

    setFilteredClients(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    applyFilters(value, planFilter, statusFilter);
  };

  const handlePlanFilterChange = (value: string) => {
    setPlanFilter(value);
    applyFilters(searchQuery, value, statusFilter);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    applyFilters(searchQuery, planFilter, value);
  };

  const handleClientAdded = () => {
    // Refresh the page to get updated data
    window.location.reload();
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
                    Client Name
                  </th>
                  <th className="p-3 text-left text-sm font-medium">Email</th>
                  <th className="p-3 text-left text-sm font-medium">Plan</th>
                  <th className="p-3 text-left text-sm font-medium">
                    Minutes Used
                  </th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
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

                    return (
                      <tr
                        key={client.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3 text-sm font-medium">
                          {client.businessName}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {client.email}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize">
                            {client.plan}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {billing.minutesUsed.toLocaleString()}
                          {client.plan !== "unlimited" && (
                            <span className="text-gray-400">
                              {" "}
                              / {billing.minutesIncluded.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {isNearingLimit ? (
                            <Badge variant="destructive">
                              <span className="mr-1">⚠️</span> Limit
                            </Badge>
                          ) : client.status === "demo" ? (
                            <Badge variant="secondary">Demo</Badge>
                          ) : client.status === "suspended" ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <Link href={`/admin/clients/${client.id}`}>
                            <Button size="sm" variant="ghost">
                              View
                            </Button>
                          </Link>
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
    </>
  );
}
