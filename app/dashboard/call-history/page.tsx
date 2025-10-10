"use client";

import { useState, useMemo, Fragment } from "react";
import { NavBar } from "@/components/dashboard/nav-bar";
import { demoClient, demoCallHistory } from "@/lib/mock-data";
import { CallRecord } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CheckCircle,
  FileText,
  Phone,
  Mail,
  XCircle,
  Play,
  FileDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

export default function CallHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("30");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter calls based on search and filters
  const filteredCalls = useMemo(() => {
    return demoCallHistory.filter((call) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        call.callerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.callerPhone.includes(searchQuery);

      // Outcome filter
      const matchesOutcome = outcomeFilter === "all" || call.outcome === outcomeFilter;

      // Date range filter
      const callDate = new Date(call.timestamp);
      const now = new Date();
      const daysAgo = parseInt(dateRangeFilter);
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      const matchesDateRange = callDate >= cutoffDate;

      return matchesSearch && matchesOutcome && matchesDateRange;
    });
  }, [searchQuery, outcomeFilter, dateRangeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
  const paginatedCalls = filteredCalls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle row expansion
  const toggleRow = (callId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(callId)) {
      newExpanded.delete(callId);
    } else {
      newExpanded.add(callId);
    }
    setExpandedRows(newExpanded);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Date/Time", "Caller Name", "Phone", "Outcome", "Duration", "Notes"];
    const rows = filteredCalls.map((call) => [
      format(new Date(call.timestamp), "yyyy-MM-dd HH:mm:ss"),
      call.callerName,
      call.callerPhone,
      call.outcome,
      `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, "0")}`,
      call.notes.replace(/,/g, ";"),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  // Get outcome badge
  const getOutcomeBadge = (outcome: CallRecord["outcome"]) => {
    const config = {
      booked: { label: "✅ Booked", variant: "default" as const, color: "bg-green-500" },
      info: { label: "📝 Info", variant: "secondary" as const, color: "bg-blue-500" },
      voicemail: { label: "📧 Voicemail", variant: "outline" as const, color: "bg-gray-500" },
      transferred: { label: "📞 Transferred", variant: "secondary" as const, color: "bg-yellow-500" },
      spam: { label: "❌ Spam", variant: "destructive" as const, color: "bg-red-500" },
    };

    const outcomeConfig = config[outcome] || config.info;
    return <Badge variant={outcomeConfig.variant}>{outcomeConfig.label}</Badge>;
  };

  // Get outcome icon
  const getOutcomeIcon = (outcome: CallRecord["outcome"]) => {
    switch (outcome) {
      case "booked":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "info":
        return <FileText className="h-5 w-5 text-blue-600" />;
      case "voicemail":
        return <Mail className="h-5 w-5 text-gray-600" />;
      case "transferred":
        return <Phone className="h-5 w-5 text-yellow-600" />;
      case "spam":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userName={demoClient.businessName} userEmail={demoClient.email} isAdmin={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
          <p className="text-gray-600 mt-1">Complete log of all calls and their outcomes</p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search caller name or number
              </label>
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Outcome Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Outcome</label>
              <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="info">Info Request</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {paginatedCalls.length} of {filteredCalls.length} calls
            </p>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Call History Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Caller</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No calls found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCalls.map((call) => (
                    <Fragment key={call.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleRow(call.id)}
                      >
                        <TableCell>
                          {expandedRows.has(call.id) ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {format(new Date(call.timestamp), "MMM d, yyyy")}
                          <br />
                          <span className="text-sm text-gray-500">
                            {format(new Date(call.timestamp), "h:mm a")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getOutcomeIcon(call.outcome)}
                            <span>{call.callerName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{call.callerPhone}</TableCell>
                        <TableCell>{getOutcomeBadge(call.outcome)}</TableCell>
                        <TableCell className="text-sm">
                          {Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, "0")} min
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert("Call recording playback coming soon!");
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row Details */}
                      {expandedRows.has(call.id) && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gray-50">
                            <div className="p-4 space-y-3">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">📝 Notes:</h4>
                                <p className="text-sm text-gray-700">{call.notes}</p>
                              </div>

                              {call.appointmentDetails && (
                                <div className="border-t pt-3">
                                  <h4 className="font-semibold text-sm mb-2">Appointment Details:</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <span className="text-gray-600">Service:</span>
                                      <p className="font-medium">{call.appointmentDetails.service}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Date:</span>
                                      <p className="font-medium">
                                        {format(new Date(call.appointmentDetails.date), "MMM d, yyyy")}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Time:</span>
                                      <p className="font-medium">{call.appointmentDetails.time}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Stylist:</span>
                                      <p className="font-medium">{call.appointmentDetails.stylist}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm">
                                  <Play className="h-4 w-4 mr-2" />
                                  Listen to Call
                                </Button>
                                <Button variant="outline" size="sm">
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Transcript
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
