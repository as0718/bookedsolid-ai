"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Check, X, Settings, User } from "lucide-react";
import { format } from "date-fns";
import {
  getTimeOffRequests,
  updateTimeOffRequest,
  type TimeOffRequest as StorageTimeOffRequest,
} from "@/lib/time-off-storage";

interface TimeOffRequest extends StorageTimeOffRequest {
  // Extended for UI display
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  teamRole: string | null;
  isTeamMember: boolean;
}

interface TeamSchedule {
  id: string;
  teamMemberId: string;
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  recurring: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
  teamMember: {
    id: string;
    name: string | null;
    email: string | null;
    teamRole: string | null;
  };
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
};

const dayOptions = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export default function TeamSchedulesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"time-off" | "schedules">("time-off");
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [schedules, setSchedules] = useState<TeamSchedule[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [scheduleForm, setScheduleForm] = useState({
    workingDays: [] as string[],
    startTime: "09:00",
    endTime: "17:00",
    recurring: true,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get time-off requests from database via API
      const timeOffData = await getTimeOffRequests();
      setRequests(timeOffData);

      // Fetch schedules and members from API (these still use API)
      const [schedulesRes, membersRes] = await Promise.all([
        fetch("/api/team-schedules"),
        fetch("/api/team/members"),
      ]);

      if (schedulesRes.ok) {
        const data = await schedulesRes.json();
        setSchedules(data);
      }

      if (membersRes.ok) {
        const data = await membersRes.json();
        // Combine all team members including current user and business owner
        const allMembers = [
          ...(data.currentUser ? [{ ...data.currentUser, isTeamMember: data.currentUser.isTeamMember }] : []),
          ...(data.businessOwner ? [{ ...data.businessOwner, isTeamMember: true }] : []),
          ...(data.teamMembers || []).map((m: any) => ({ ...m, isTeamMember: true }))
        ];
        // Remove duplicates by id
        const uniqueMembers = allMembers.filter((member, index, self) =>
          index === self.findIndex((m) => m.id === member.id)
        );
        setTeamMembers(uniqueMembers);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeOffAction = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    try {
      // Update in database via API
      const reviewerName = session?.user?.name || session?.user?.email || "Manager";
      const updated = await updateTimeOffRequest(requestId, {
        status,
        reviewedBy: reviewerName,
      });

      if (updated) {
        await fetchData();
      } else {
        alert(`Failed to ${status.toLowerCase()} request`);
      }
    } catch (error) {
      console.error("Error updating time-off request:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      alert("Please select a team member");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/team-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamMemberId: selectedMember,
          workingDays: scheduleForm.workingDays,
          workingHours: {
            start: scheduleForm.startTime,
            end: scheduleForm.endTime,
          },
          recurring: scheduleForm.recurring,
          notes: scheduleForm.notes,
        }),
      });

      if (response.ok) {
        await fetchData();
        setShowScheduleModal(false);
        setSelectedMember("");
        setScheduleForm({
          workingDays: [],
          startTime: "09:00",
          endTime: "17:00",
          recurring: true,
          notes: "",
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save schedule");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWorkingDay = (day: string) => {
    setScheduleForm((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team schedules...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Schedules</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage team member schedules and time-off requests
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("time-off")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "time-off"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                Time-Off Requests
                {pendingRequests.length > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 ml-1">
                    {pendingRequests.length}
                  </Badge>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("schedules")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "schedules"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Settings className="h-4 w-4" />
                Work Schedules
              </div>
            </button>
          </div>
        </div>

        {/* Time-Off Requests Tab */}
        {activeTab === "time-off" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {requests.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No time-off requests yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {requests.map((request) => {
                  // Find the team member details from the teamMembers array
                  const member = teamMembers.find((m) =>
                    m.id === request.teamMemberId || m.email === request.teamMemberId
                  );

                  return (
                    <div key={request.id} className="p-4 hover:bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {member?.name || member?.email || request.teamMemberId}
                            </span>
                            {member?.teamRole && (
                              <span className="text-sm text-gray-500">
                                ({member.teamRole})
                              </span>
                            )}
                            <Badge className={statusColors[request.status]}>
                              {request.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-900 mb-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {format(new Date(request.startDate), "MMM d, yyyy")} -{" "}
                              {format(new Date(request.endDate), "MMM d, yyyy")}
                            </span>
                            <span className="text-gray-500">• {request.reason}</span>
                          </div>
                          {request.reasonDetails && (
                            <p className="text-sm text-gray-600 mt-1 ml-6">
                              {request.reasonDetails}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 ml-6">
                            <Clock className="h-3 w-3" />
                            Requested {format(new Date(request.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                        {request.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleTimeOffAction(request.id, "APPROVED")}
                              className="bg-green-600 hover:bg-green-700 min-h-[44px]"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTimeOffAction(request.id, "REJECTED")}
                              className="border-red-300 text-red-600 hover:bg-red-50 min-h-[44px]"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Work Schedules Tab */}
        {activeTab === "schedules" && (
          <div>
            <div className="mb-4">
              <Button
                onClick={() => setShowScheduleModal(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                Set Team Member Schedule
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => {
                const schedule = schedules.find((s) => s.teamMemberId === member.id);
                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {member.name || member.email}
                        </h3>
                        <p className="text-xs text-gray-500">{member.teamRole}</p>
                      </div>
                    </div>
                    {schedule ? (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-600">Working Days:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {schedule.workingDays.map((day) => (
                              <Badge key={day} className="bg-purple-100 text-purple-800">
                                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Hours:</span>
                          <p className="font-medium">
                            {schedule.workingHours.start} - {schedule.workingHours.end}
                          </p>
                        </div>
                        {schedule.notes && (
                          <div className="text-sm">
                            <span className="text-gray-600">Notes:</span>
                            <p className="text-gray-900">{schedule.notes}</p>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedMember(member.id);
                            setScheduleForm({
                              workingDays: schedule.workingDays,
                              startTime: schedule.workingHours.start,
                              endTime: schedule.workingHours.end,
                              recurring: schedule.recurring,
                              notes: schedule.notes || "",
                            });
                            setShowScheduleModal(true);
                          }}
                          className="w-full mt-2"
                        >
                          Edit Schedule
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-2">No schedule set</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member.id);
                            setShowScheduleModal(true);
                          }}
                        >
                          Set Schedule
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Set Work Schedule</h2>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedMember("");
                    setScheduleForm({
                      workingDays: [],
                      startTime: "09:00",
                      endTime: "17:00",
                      recurring: true,
                      notes: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Member *
                  </label>
                  <select
                    required
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a team member</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email} ({member.teamRole})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {dayOptions.map((day) => (
                      <label
                        key={day.value}
                        className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={scheduleForm.workingDays.includes(day.value)}
                          onChange={() => toggleWorkingDay(day.value)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduleForm.startTime}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduleForm.endTime}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={scheduleForm.notes}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Any additional information..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowScheduleModal(false);
                      setSelectedMember("");
                    }}
                    className="flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={submitting || scheduleForm.workingDays.length === 0}
                  >
                    {submitting ? "Saving..." : "Save Schedule"}
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
