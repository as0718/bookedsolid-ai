"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, X, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  getTimeOffRequests,
  createTimeOffRequest,
  deleteTimeOffRequest,
  type TimeOffRequest as StorageTimeOffRequest,
} from "@/lib/time-off-storage";

interface TimeOffRequest extends StorageTimeOffRequest {
  // Extended interface for UI display
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
};

const reasonLabels = {
  SICK: "Sick Leave",
  VACATION: "Vacation",
  PERSONAL: "Personal",
  FAMILY: "Family",
  OTHER: "Other",
};

export default function TimeOffPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "VACATION" as keyof typeof reasonLabels,
    reasonDetails: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [session]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Get all requests from database via API
      const allRequests = await getTimeOffRequests();

      // Filter to show only current user's requests
      const userRequests = session?.user?.email
        ? allRequests.filter(
            (r) => r.teamMemberId === session.user.email || r.teamMemberId === session.user.id
          )
        : allRequests;

      setRequests(userRequests);
    } catch (error) {
      console.error("Error fetching time-off requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      if (!session?.user?.email) {
        setSubmitError("You must be logged in to submit a request");
        setSubmitting(false);
        return;
      }

      // Create time-off request in database via API
      await createTimeOffRequest({
        teamMemberId: session.user.email || session.user.id || "unknown",
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        reasonDetails: formData.reasonDetails,
      });

      // Refresh requests and close modal
      await fetchRequests();
      setShowModal(false);
      setFormData({
        startDate: "",
        endDate: "",
        reason: "VACATION",
        reasonDetails: "",
      });
    } catch (error) {
      console.error("Error creating time-off request:", error);
      // Extract the error message from the Error object
      const errorMessage = error instanceof Error ? error.message : "Failed to create time-off request. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this time-off request?")) {
      return;
    }

    try {
      // Delete from database via API
      const success = await deleteTimeOffRequest(id);

      if (success) {
        await fetchRequests();
      } else {
        alert("Failed to cancel request");
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert("An error occurred. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading time-off requests...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const approvedRequests = requests.filter((r) => r.status === "APPROVED");
  const rejectedRequests = requests.filter((r) => r.status === "REJECTED");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Time Off</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Request time off and view your request history
            </p>
          </div>
          <Button
            onClick={() => {
              setShowModal(true);
              setSubmitError("");
            }}
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Time Off
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Pending Requests</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {pendingRequests.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Approved Requests</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {approvedRequests.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Requests</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {requests.length}
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No time-off requests yet</p>
              <Button
                onClick={() => {
                  setShowModal(true);
                  setSubmitError("");
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Time Off
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request.id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={statusColors[request.status]}>
                          {request.status}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {reasonLabels[request.reason]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-900 mb-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {format(new Date(request.startDate), "MMM d, yyyy")} -{" "}
                          {format(new Date(request.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      {request.reasonDetails && (
                        <p className="text-sm text-gray-600 mt-1">
                          {request.reasonDetails}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                        <Clock className="h-3 w-3" />
                        Requested {format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                      {request.reviewedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {request.status === "APPROVED" ? "Approved" : "Rejected"} by{" "}
                          {request.reviewedBy || "Manager"} on{" "}
                          {format(new Date(request.reviewedAt), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                    {request.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(request.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50 min-h-[44px]"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Request Time Off</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSubmitError("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <select
                    required
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reason: e.target.value as keyof typeof reasonLabels,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.entries(reasonLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={formData.reasonDetails}
                    onChange={(e) =>
                      setFormData({ ...formData, reasonDetails: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Any additional information..."
                  />
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {submitError}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowModal(false);
                      setSubmitError("");
                    }}
                    className="flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
