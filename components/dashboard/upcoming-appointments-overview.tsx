"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import Link from "next/link";

interface Appointment {
  id: string;
  date: string;
  duration: number;
  serviceType: string;
  status: "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  client: {
    id: string;
    clientName: string | null;
    phoneNumber: string;
  };
}

export function UpcomingAppointmentsOverview() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/appointments");
      if (response.ok) {
        const data = await response.json();
        // Filter for today and tomorrow only, and confirmed/pending appointments
        const now = new Date();
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        const tomorrowEnd = new Date(todayEnd);
        tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

        const upcomingSoon = data
          .filter((apt: Appointment) => {
            const aptDate = new Date(apt.date);
            return (
              aptDate >= now &&
              aptDate <= tomorrowEnd &&
              (apt.status === "CONFIRMED" || apt.status === "PENDING")
            );
          })
          .sort((a: Appointment, b: Appointment) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          .slice(0, 6); // Limit to 6 appointments

        setAppointments(upcomingSoon);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), "h:mm a");
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Group appointments by date
  const groupedAppointments = appointments.reduce((acc, apt) => {
    const label = getDateLabel(apt.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
        </div>
        <Link href="/dashboard/crm/appointments">
          <Button variant="outline" size="sm">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="p-6">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No appointments scheduled for today or tomorrow</p>
            <Link href="/dashboard/crm/appointments">
              <Button variant="outline" size="sm" className="mt-4">
                View Calendar
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedAppointments).map(([dateLabel, apts]) => (
              <div key={dateLabel}>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                  {dateLabel}
                </h3>
                <div className="space-y-2">
                  {apts.map((apt) => (
                    <Link
                      key={apt.id}
                      href={`/dashboard/crm/clients/${apt.client.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-purple-300 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatTime(apt.date)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {apt.client.clientName || "Unknown Client"}
                          </p>
                          <p className="text-xs text-gray-600">{apt.serviceType}</p>
                        </div>
                        {apt.status === "PENDING" && (
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
