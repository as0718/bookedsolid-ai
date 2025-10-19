"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

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

interface UpcomingAppointmentsProps {
  clientId: string;
  onAddAppointment?: () => void;
  onEditAppointment?: (appointment: Appointment) => void;
}

const statusColors = {
  CONFIRMED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
};

export function UpcomingAppointments({
  clientId,
  onAddAppointment,
  onEditAppointment,
}: UpcomingAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [clientId]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/appointments?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter for future appointments
        const now = new Date();
        const upcoming = data.filter((apt: Appointment) => new Date(apt.date) >= now);
        setAppointments(upcoming);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAppointments(appointments.filter((apt) => apt.id !== appointmentId));
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Appointments
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Upcoming Appointments
        </h2>
        {onAddAppointment && (
          <Button
            onClick={onAddAppointment}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Appointment
          </Button>
        )}
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No upcoming appointments</p>
          {onAddAppointment && (
            <Button
              onClick={onAddAppointment}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Appointment
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {format(new Date(appointment.date), "EEEE, MMMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(appointment.date), "h:mm a")} •{" "}
                      {formatDuration(appointment.duration)}
                    </div>
                  </div>
                </div>
                <Badge className={statusColors[appointment.status]}>
                  {appointment.status}
                </Badge>
              </div>

              <div className="mt-3 pl-8">
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Service:</span>{" "}
                  {appointment.serviceType}
                </div>
                {appointment.specialist && (
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Specialist:</span>{" "}
                    {appointment.specialist.name}
                    {appointment.specialist.teamRole && (
                      <span className="text-gray-600"> ({appointment.specialist.teamRole})</span>
                    )}
                  </div>
                )}
                {appointment.notes && (
                  <div className="text-sm text-gray-600 mb-3">
                    {appointment.notes}
                  </div>
                )}

                <div className="flex gap-2">
                  {onEditAppointment && (
                    <Button
                      onClick={() => onEditAppointment(appointment)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(appointment.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
