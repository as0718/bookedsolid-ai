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

  // Calculate weekly appointment stats for current user
  const startOfCurrentWeek = startOfWeek(new Date());
  const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);
  const weeklyAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    return aptDate >= startOfCurrentWeek && aptDate <= endOfCurrentWeek;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your appointment schedule</p>
          </div>
          {canEditAppointments && (
            <Button
              onClick={handleNewAppointment}
              className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto min-h-[44px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          )}
        </div>

        {/* Weekly Stats Card - Show for all users */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Your Appointments This Week</h3>
              <p className="text-purple-100 text-sm">
                {format(startOfCurrentWeek, "MMM d")} - {format(endOfCurrentWeek, "MMM d, yyyy")}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{weeklyAppointments.length}</div>
              <div className="text-sm text-purple-100">
                {weeklyAppointments.filter(a => a.status === "CONFIRMED").length} confirmed
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2 sm:gap-4 justify-center sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("prev")}
                className="min-h-[44px] min-w-[44px] flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 text-center flex-1 sm:min-w-[200px]">
                {viewMode === "month"
                  ? format(currentDate, "MMMM yyyy")
                  : viewMode === "week"
                  ? format(startOfWeek(currentDate), "MMM d, yyyy")
                  : format(currentDate, "MMM d, yyyy")}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate("next")}
                className="min-h-[44px] min-w-[44px] flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="min-h-[44px] flex-shrink-0"
              >
                Today
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
                className="min-h-[44px] flex-1 sm:flex-none"
              >
                Day
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
                className="min-h-[44px] flex-1 sm:flex-none"
              >
                Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
                className="min-h-[44px] flex-1 sm:flex-none"
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
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                <div
                  key={day}
                  className="bg-gray-50 p-1 sm:p-2 text-center text-xs sm:text-sm font-semibold text-gray-700"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
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
                    className={`bg-white p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] ${
                      isCurrentDay ? "bg-blue-50" : ""
                    } ${
                      canEditAppointments && !isPastDate
                        ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                        : ""
                    }`}
                    onClick={() => {
                      if (canEditAppointments && !isPastDate) {
                        handleQuickSchedule(day);
                      }
                    }}
                  >
                    <div
                      className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                        isCurrentDay ? "text-blue-600" : "text-gray-900"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 active:opacity-60 min-h-[32px] sm:min-h-[28px] flex items-center ${
                            statusColors[apt.status]
                          }`}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent day click
                            router.push(`/dashboard/crm/clients/${apt.client.id}`);
                          }}
                        >
                          <span className="truncate text-[10px] sm:text-xs">
                            {formatTime(apt.date)} - {apt.client.clientName || "Unknown"}
                          </span>
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-[10px] sm:text-xs text-gray-500 text-center">
                          +{dayAppointments.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Day/Week View - List
            <div className={viewMode === "week" ? "overflow-x-auto" : ""}>
              <div className={`grid ${viewMode === "week" ? "grid-cols-7 min-w-[1400px] sm:min-w-0" : "grid-cols-1"} gap-px bg-gray-200`}>
                {daysToShow.map((day, index) => {
                  const dayAppointments = getAppointmentsForDay(day).sort(
                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                  );
                  const isCurrentDay = isToday(day);

                  return (
                    <div key={index} className="bg-white">
                      {/* Day Header */}
                      <div
                        className={`p-2 sm:p-3 border-b ${
                          isCurrentDay ? "bg-blue-50" : "bg-gray-50"
                        }`}
                      >
                        <div
                          className={`text-xs sm:text-sm font-semibold ${
                            isCurrentDay ? "text-blue-600" : "text-gray-900"
                          }`}
                        >
                          {format(day, "EEE")}
                        </div>
                        <div
                          className={`text-base sm:text-lg font-bold ${
                            isCurrentDay ? "text-blue-600" : "text-gray-900"
                          }`}
                        >
                          {format(day, "d")}
                        </div>
                      </div>

                      {/* Appointments for this day */}
                      <div className="p-2 sm:p-3 space-y-2 min-h-[200px] sm:min-h-[300px]">
                        {dayAppointments.length === 0 ? (
                          <div className="text-center text-gray-400 py-4 sm:py-8 text-xs sm:text-sm">
                            No appointments
                          </div>
                        ) : (
                          dayAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              className={`p-2 sm:p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md active:shadow-lg transition-shadow min-h-[44px] flex flex-col justify-center ${
                                statusColors[apt.status]
                              }`}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent day click
                                router.push(`/dashboard/crm/clients/${apt.client.id}`);
                              }}
                            >
                              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="font-semibold text-xs sm:text-sm">
                                  {formatTime(apt.date)}
                                </span>
                                <span className="text-[10px] sm:text-xs">
                                  ({formatDuration(apt.duration)})
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm font-medium truncate">
                                {apt.client.clientName || "Unknown Client"}
                              </div>
                              <div className="text-[10px] sm:text-xs text-gray-600 mt-1 truncate">
                                {apt.serviceType}
                              </div>
                              {apt.specialist && (
                                <div className="text-[10px] sm:text-xs text-gray-600 mt-1 truncate">
                                  <span className="font-medium">Specialist:</span> {apt.specialist.name}
                                </div>
                              )}
                              {apt.notes && (
                                <div className="text-[10px] sm:text-xs text-gray-500 mt-1 line-clamp-2">
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
