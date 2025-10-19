"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppointmentModal } from "@/components/crm/appointment-modal";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { hasPermission } from "@/lib/permissions";

interface Appointment {
  id: string;
  date: string;
  duration: number;
  serviceType: string;
  status: "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string;
  client: {
    id: string;
    clientName: string | null;
    phoneNumber: string;
    email: string | null;
  };
  specialist?: {
    id: string;
    name: string | null;
    teamRole: string | null;
  } | null;
}

const statusColors = {
  CONFIRMED: "bg-green-100 text-green-800 border-green-300",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
  NO_SHOW: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function AppointmentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  // Check if user can edit appointments
  const canEditAppointments = useMemo(() => {
    return hasPermission(session?.user || null, "edit_appointments");
  }, [session]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/appointments");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNewAppointment = useCallback(() => {
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setAppointmentModalOpen(true);
  }, []);

  const handleQuickSchedule = useCallback((date: Date, time?: string) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setSelectedDate(dateStr);
    setSelectedTime(time);
    setAppointmentModalOpen(true);
  }, []);

  const handleAppointmentSuccess = useCallback(() => {
    fetchAppointments(); // Refresh appointments list
  }, [fetchAppointments]);

  const getDaysToShow = () => {
    if (viewMode === "day") {
      return [currentDate];
    } else if (viewMode === "week") {
      const start = startOfWeek(currentDate);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => isSameDay(new Date(apt.date), day));
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, direction === "next" ? 7 : -7));
    } else {
      const monthOffset = direction === "next" ? 1 : -1;
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1));
    }
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), "h:mm a");
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  const daysToShow = getDaysToShow();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Manage your appointment schedule</p>
          </div>
          {canEditAppointments && (
            <Button
              onClick={handleNewAppointment}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          )}
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                {viewMode === "month"
                  ? format(currentDate, "MMMM yyyy")
                  : viewMode === "week"
                  ? `Week of ${format(startOfWeek(currentDate), "MMM d, yyyy")}`
                  : format(currentDate, "EEEE, MMMM d, yyyy")}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
              >
                Day
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                Month
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {viewMode === "month" ? (
            // Month View - Grid
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-700"
                >
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {daysToShow.map((day, index) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isCurrentDay = isToday(day);
                const isPastDate = day < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <div
                    key={index}
                    className={`bg-white p-2 min-h-[120px] ${
                      isCurrentDay ? "bg-blue-50" : ""
                    } ${
                      canEditAppointments && !isPastDate
                        ? "cursor-pointer hover:bg-gray-50"
                        : ""
                    }`}
                    onClick={() => {
                      if (canEditAppointments && !isPastDate) {
                        handleQuickSchedule(day);
                      }
                    }}
                  >
                    <div
                      className={`text-sm font-medium mb-2 ${
                        isCurrentDay ? "text-blue-600" : "text-gray-900"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((apt) => (
                        <div
                          key={apt.id}
                          className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 ${
                            statusColors[apt.status]
                          }`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent day click
                            router.push(`/dashboard/crm/clients/${apt.client.id}`);
                          }}
                        >
                          {formatTime(apt.date)} - {apt.client.clientName || "Unknown"}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Day/Week View - List
            <div className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-1"} gap-px bg-gray-200`}>
              {daysToShow.map((day, index) => {
                const dayAppointments = getAppointmentsForDay(day).sort(
                  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                const isCurrentDay = isToday(day);

                return (
                  <div key={index} className="bg-white">
                    {/* Day Header */}
                    <div
                      className={`p-3 border-b ${
                        isCurrentDay ? "bg-blue-50" : "bg-gray-50"
                      }`}
                    >
                      <div
                        className={`text-sm font-semibold ${
                          isCurrentDay ? "text-blue-600" : "text-gray-900"
                        }`}
                      >
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          isCurrentDay ? "text-blue-600" : "text-gray-900"
                        }`}
                      >
                        {format(day, "d")}
                      </div>
                    </div>

                    {/* Appointments for this day */}
                    <div className="p-3 space-y-2 min-h-[300px]">
                      {dayAppointments.length === 0 ? (
                        <div className="text-center text-gray-400 py-8 text-sm">
                          No appointments
                        </div>
                      ) : (
                        dayAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                              statusColors[apt.status]
                            }`}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent day click
                              router.push(`/dashboard/crm/clients/${apt.client.id}`);
                            }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4" />
                              <span className="font-semibold text-sm">
                                {formatTime(apt.date)}
                              </span>
                              <span className="text-xs">
                                ({formatDuration(apt.duration)})
                              </span>
                            </div>
                            <div className="text-sm font-medium">
                              {apt.client.clientName || "Unknown Client"}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {apt.serviceType}
                            </div>
                            {apt.specialist && (
                              <div className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">Specialist:</span> {apt.specialist.name}
                              </div>
                            )}
                            {apt.notes && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {apt.notes}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Appointments</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {appointments.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Confirmed</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {appointments.filter((a) => a.status === "CONFIRMED").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {appointments.filter((a) => a.status === "PENDING").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {appointments.filter((a) => a.status === "COMPLETED").length}
            </div>
          </div>
        </div>

        {/* Appointment Modal */}
        <AppointmentModal
          open={appointmentModalOpen}
          onOpenChange={setAppointmentModalOpen}
          onSuccess={handleAppointmentSuccess}
          prefilledDate={selectedDate}
          prefilledTime={selectedTime}
        />
      </div>
    </div>
  );
}
