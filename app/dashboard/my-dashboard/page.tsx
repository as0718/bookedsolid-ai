"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppointmentModal } from "@/components/crm/appointment-modal";
import {
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  User
} from "lucide-react";
import { format, startOfWeek, endOfWeek, isToday, isSameDay } from "date-fns";

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
  } | null;
}

const statusColors = {
  CONFIRMED: "bg-green-100 text-green-800 border-green-300",
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
  NO_SHOW: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function TeamMemberDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

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

  const handleAppointmentSuccess = useCallback(() => {
    fetchAppointments();
    setAppointmentModalOpen(false);
  }, [fetchAppointments]);

  // Calculate stats
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today);
  const endOfCurrentWeek = endOfWeek(today);

  const weeklyAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    return aptDate >= startOfCurrentWeek && aptDate <= endOfCurrentWeek;
  });

  const todayAppointments = appointments
    .filter((apt) => isSameDay(new Date(apt.date), today))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedThisWeek = weeklyAppointments.filter(
    (a) => a.status === "COMPLETED"
  ).length;

  const confirmedToday = todayAppointments.filter(
    (a) => a.status === "CONFIRMED"
  ).length;

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
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {session?.user?.name || "Team Member"}
            </h1>
            <p className="text-gray-600 mt-1">
              Here's your schedule for today
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setAppointmentModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Appointment
            </Button>
            <Button
              onClick={() => router.push("/dashboard/crm/appointments")}
              variant="outline"
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Weekly Appointments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">This Week</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {weeklyAppointments.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">appointments</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Today's Appointments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {todayAppointments.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {confirmedToday} confirmed
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Completed This Week */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {completedThisWeek}
                </p>
                <p className="text-xs text-gray-500 mt-1">this week</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {weeklyAppointments.length > 0
                    ? Math.round((completedThisWeek / weeklyAppointments.length) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">this week</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
              <p className="text-sm text-gray-600 mt-1">
                {format(today, "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            {todayAppointments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/crm/appointments")}
              >
                View Full Calendar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
          <div className="p-6">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No appointments today</p>
                <p className="text-gray-400 text-sm mt-2">
                  You have a free day! Enjoy some time off or check your upcoming schedule.
                </p>
                <Button
                  onClick={() => setAppointmentModalOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule an Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                      statusColors[apt.status]
                    }`}
                    onClick={() => router.push(`/dashboard/crm/clients/${apt.client.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold text-lg">
                            {formatTime(apt.date)}
                          </span>
                          <span className="text-sm text-gray-600">
                            ({formatDuration(apt.duration)})
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${statusColors[apt.status]}`}>
                            {apt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 mb-1">
                          <User className="h-4 w-4" />
                          <span className="font-medium">
                            {apt.client.clientName || "Unknown Client"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          Service: {apt.serviceType}
                        </div>
                        {apt.client.phoneNumber && (
                          <div className="text-sm text-gray-500">
                            {apt.client.phoneNumber}
                          </div>
                        )}
                        {apt.notes && (
                          <div className="text-sm text-gray-500 mt-2 italic">
                            Note: {apt.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments This Week */}
        {weeklyAppointments.length > todayAppointments.length && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming This Week</h2>
              <p className="text-sm text-gray-600 mt-1">
                {format(startOfCurrentWeek, "MMM d")} - {format(endOfCurrentWeek, "MMM d, yyyy")}
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {weeklyAppointments
                  .filter((apt) => !isSameDay(new Date(apt.date), today) && new Date(apt.date) > today)
                  .slice(0, 5)
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/crm/clients/${apt.client.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 font-medium">
                            {format(new Date(apt.date), "EEE")}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {format(new Date(apt.date), "d")}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {apt.client.clientName || "Unknown Client"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(apt.date)} - {apt.serviceType} ({formatDuration(apt.duration)})
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${statusColors[apt.status]}`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
              </div>
              {weeklyAppointments.filter((apt) => !isSameDay(new Date(apt.date), today) && new Date(apt.date) > today).length > 5 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push("/dashboard/crm/appointments")}
                >
                  View All Appointments
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Appointment Modal */}
        <AppointmentModal
          open={appointmentModalOpen}
          onOpenChange={setAppointmentModalOpen}
          onSuccess={handleAppointmentSuccess}
        />
      </div>
    </div>
  );
}
