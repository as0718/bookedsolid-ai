"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneMissed, Phone, Clock, Eye, CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

interface CallRecord {
  id: string;
  timestamp: string;
  callerName: string;
  callerPhone: string;
  duration: number;
  outcome: string;
  notes: string;
  voiceClient: {
    id: string;
    clientName: string | null;
    phoneNumber: string;
    status: string;
  } | null;
}

export default function MissedCallsPage() {
  const router = useRouter();
  const [missedCalls, setMissedCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMissedCalls();
  }, []);

  const fetchMissedCalls = async () => {
    setLoading(true);
    try {
      // Fetch calls with outcome "voicemail" from the last 7 days
      const response = await fetch("/api/calls");
      if (response.ok) {
        const data = await response.json();
        // Filter for voicemail calls from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const filtered = data.filter((call: CallRecord) => {
          const callDate = new Date(call.timestamp);
          return (
            call.outcome === "voicemail" &&
            callDate >= sevenDaysAgo
          );
        });

        setMissedCalls(filtered);
      }
    } catch (error) {
      console.error("Error fetching missed calls:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const callTime = new Date(timestamp);
    const diffMs = now.getTime() - callTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Missed Calls</h1>
          <p className="text-gray-600 mt-1">
            Calls requiring follow-up from the last 7 days
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Missed</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {missedCalls.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Today</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {
                missedCalls.filter((call) => {
                  const today = new Date();
                  const callDate = new Date(call.timestamp);
                  return callDate.toDateString() === today.toDateString();
                }).length
              }
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Urgent (24h)</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {
                missedCalls.filter((call) => {
                  const oneDayAgo = new Date();
                  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
                  const callDate = new Date(call.timestamp);
                  return callDate >= oneDayAgo;
                }).length
              }
            </div>
          </div>
        </div>

        {/* Missed Calls List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500">Loading missed calls...</div>
          </div>
        ) : missedCalls.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              All caught up!
            </h3>
            <p className="text-gray-500">
              No missed calls requiring follow-up
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {missedCalls.map((call) => (
              <div
                key={call.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <PhoneMissed className="h-6 w-6 text-red-600" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {call.callerName}
                        </h3>
                        <Badge className="bg-red-100 text-red-800">
                          Voicemail
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {formatPhoneNumber(call.callerPhone)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(call.timestamp).toLocaleString()} (
                          {getTimeAgo(call.timestamp)})
                        </div>
                      </div>

                      {call.notes && (
                        <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          {call.notes}
                        </p>
                      )}

                      {call.voiceClient && (
                        <div className="mt-3 flex items-center text-sm text-purple-600">
                          <span className="mr-2">Linked to:</span>
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/crm/clients/${call.voiceClient?.id}`
                              )
                            }
                            className="font-medium hover:underline"
                          >
                            {call.voiceClient.clientName ||
                              call.voiceClient.phoneNumber}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {call.voiceClient ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/crm/clients/${call.voiceClient?.id}`)
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Client
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push("/dashboard/crm/clients/new")
                        }
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Add Client
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
