"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientFormDialog } from "./client-form-dialog";
import { PlanEditDialog } from "./plan-edit-dialog";
import { ClientAccount, CallRecord, BillingInfo } from "@/lib/types";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
  Users,
  AlertCircle,
} from "lucide-react";

interface ClientDetailViewProps {
  client: ClientAccount;
  callRecords: CallRecord[];
  metrics: {
    totalCalls: number;
    todayCalls: number;
    monthCalls: number;
    monthBooked: number;
    conversionRate: number;
  };
}

export function ClientDetailView({
  client,
  callRecords,
  metrics,
}: ClientDetailViewProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const billing = client.billing as BillingInfo;
  const usagePercent = (billing.minutesUsed / billing.minutesIncluded) * 100;

  const handleStatusToggle = async () => {
    if (
      !confirm(
        `Are you sure you want to ${
          client.status === "active" ? "suspend" : "activate"
        } this client?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: client.status === "active" ? "suspended" : "active",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to update client status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${client.businessName}? This cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      router.push("/admin/dashboard");
    } catch (error) {
      alert("Failed to delete client");
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {client.businessName}
            </h1>
            <div className="flex gap-2 mt-2">
              <Badge
                variant={client.status === "active" ? "default" : "secondary"}
              >
                {client.status}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {client.plan} Plan
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
            <Button
              variant={client.status === "active" ? "destructive" : "default"}
              size="sm"
              onClick={handleStatusToggle}
              disabled={loading}
            >
              {client.status === "active" ? "Suspend" : "Activate"}
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCalls}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.monthCalls}</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.monthBooked} booked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.conversionRate.toFixed(0)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Minutes Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billing.minutesUsed.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {client.plan !== "unlimited" && (
                <>of {billing.minutesIncluded.toLocaleString()}</>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Warning */}
      {usagePercent >= 90 && client.plan !== "unlimited" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">
              Approaching Usage Limit
            </h3>
            <p className="text-sm text-amber-800 mt-1">
              This client has used {usagePercent.toFixed(0)}% of their monthly
              minutes. Consider upgrading their plan or notifying them about
              overage charges.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="calls">Recent Calls</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Timezone</p>
                    <p className="font-medium">{client.timezone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Created Date</p>
                    <p className="font-medium">
                      {new Date(client.createdDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium capitalize">{client.plan}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => setShowPlanDialog(true)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Monthly Rate</p>
                    <p className="font-medium">
                      ${billing.monthlyRate.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Current billing period and usage details
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPlanDialog(true)}
              >
                Change Plan
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current Period</p>
                  <p className="font-medium">
                    {new Date(billing.currentPeriodStart).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Rate</p>
                  <p className="font-medium text-xl">
                    ${billing.monthlyRate.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Minutes Included</p>
                  <p className="font-medium">
                    {client.plan === "unlimited"
                      ? "Unlimited"
                      : billing.minutesIncluded.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Minutes Used</p>
                  <p className="font-medium">
                    {billing.minutesUsed.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Usage Percentage</p>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          usagePercent >= 90
                            ? "bg-red-600"
                            : usagePercent >= 75
                            ? "bg-amber-600"
                            : "bg-green-600"
                        }`}
                        style={{
                          width: `${Math.min(usagePercent, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-sm mt-1">{usagePercent.toFixed(1)}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overage Rate</p>
                  <p className="font-medium">
                    {client.plan === "unlimited"
                      ? "N/A"
                      : `$${billing.overageRate}/min`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Calls Tab */}
        <TabsContent value="calls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
              <CardDescription>
                Last 20 calls for {client.businessName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left text-sm font-medium">
                        Date/Time
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Caller
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Duration
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Outcome
                      </th>
                      <th className="p-3 text-left text-sm font-medium">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {callRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">
                          No call records yet
                        </td>
                      </tr>
                    ) : (
                      callRecords.map((call) => (
                        <tr
                          key={call.id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="p-3 text-sm">
                            {new Date(call.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3 text-sm">{call.callerName}</td>
                          <td className="p-3 text-sm">
                            {Math.floor(call.duration / 60)}m {call.duration % 60}s
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                call.outcome === "booked"
                                  ? "default"
                                  : call.outcome === "spam"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {call.outcome}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-gray-600">
                            {call.notes.substring(0, 50)}
                            {call.notes.length > 50 && "..."}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Voice Type</p>
                <p className="font-medium">{client.settings.voiceType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Speaking Speed</p>
                <p className="font-medium">{client.settings.speakingSpeed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Custom Greeting</p>
                <p className="font-medium">{client.settings.customGreeting}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Booking System</p>
                <p className="font-medium capitalize">
                  {client.settings.bookingSystem}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Calendar Sync</p>
                <p className="font-medium capitalize">
                  {client.settings.calendarSync}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Client Permanently
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ClientFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        client={client}
        onSuccess={() => {
          setShowEditDialog(false);
          router.refresh();
        }}
      />

      <PlanEditDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
        client={client}
        onSuccess={() => {
          setShowPlanDialog(false);
          router.refresh();
        }}
      />
    </div>
  );
}
