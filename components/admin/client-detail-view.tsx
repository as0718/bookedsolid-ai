"use client";

import { useState, useEffect } from "react";
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
import { DeleteClientAccountModal } from "./delete-client-account-modal";
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

// Helper function to format plan names
const formatPlanName = (plan: string): string => {
  const planNames: { [key: string]: string } = {
    missed: "Missed Call Recovery",
    complete: "Complete Receptionist",
    unlimited: "High-Volume Unlimited",
  };
  return planNames[plan] || plan;
};

// Helper function to calculate pricing based on plan and billing interval
const calculatePricing = (plan: string, billingInterval: string) => {
  const planPrices: { [key: string]: number } = {
    missed: 149,
    complete: 349,
    unlimited: 599,
  };

  const monthlyRate = planPrices[plan] || 0;

  if (billingInterval === "year") {
    const yearlyTotal = monthlyRate * 12 * 0.86; // 14% discount for yearly
    const effectiveMonthly = yearlyTotal / 12;
    return {
      displayAmount: yearlyTotal,
      effectiveMonthly: effectiveMonthly,
      isYearly: true,
    };
  }

  return {
    displayAmount: monthlyRate,
    effectiveMonthly: monthlyRate,
    isYearly: false,
  };
};

export function ClientDetailView({
  client,
  callRecords,
  metrics,
}: ClientDetailViewProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [crmToggleLoading, setCrmToggleLoading] = useState(false);
  const [voiceClientsCount, setVoiceClientsCount] = useState(0);
  const [appointmentsCount, setAppointmentsCount] = useState(0);

  // Get user CRM information
  const clientUser = (client as any).users?.[0];
  const hasExternalCRM = clientUser?.hasExternalCRM === true;
  const preferredCRM = clientUser?.preferredCRM;
  const crmAccessEnabled = clientUser?.crmAccessEnabled !== false;

  const billing = client.billing as BillingInfo;
  const usagePercent = billing.minutesIncluded
    ? (billing.minutesUsed / billing.minutesIncluded) * 100
    : 0;

  // Calculate correct pricing based on plan and billing interval
  const pricing = calculatePricing(client.plan, client.billingInterval);

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

  // Fetch VoiceClients and Appointments count when component mounts
  const fetchCounts = async () => {
    try {
      // Get voice clients count for all users of this client
      const clientUsers = (client as any).users || [];
      let totalVoiceClients = 0;
      let totalAppointments = 0;

      for (const user of clientUsers) {
        // Fetch voice clients
        const vcResponse = await fetch(`/api/voice-clients?userId=${user.id}`);
        if (vcResponse.ok) {
          const vcData = await vcResponse.json();
          totalVoiceClients += vcData.length || 0;
        }

        // Fetch appointments
        const apptResponse = await fetch(`/api/appointments?userId=${user.id}`);
        if (apptResponse.ok) {
          const apptData = await apptResponse.json();
          totalAppointments += apptData.length || 0;
        }
      }

      setVoiceClientsCount(totalVoiceClients);
      setAppointmentsCount(totalAppointments);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  // Fetch counts on component mount
  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleCRMAccessToggle = async () => {
    if (!clientUser?.id) {
      alert("No user associated with this client");
      return;
    }

    setCrmToggleLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${clientUser.id}/crm-access`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          crmAccessEnabled: !crmAccessEnabled,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update CRM access");
      }

      router.refresh();
    } catch (error) {
      alert("Failed to update CRM access");
    } finally {
      setCrmToggleLoading(false);
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
              <Badge variant="outline">
                {formatPlanName(client.plan)}
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
                      <p className="font-medium">{formatPlanName(client.plan)}</p>
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
                    <p className="text-sm text-gray-600">
                      {pricing.isYearly ? "Annual Rate" : "Monthly Rate"}
                    </p>
                    <p className="font-medium">
                      {pricing.isYearly ? (
                        <>
                          ${pricing.displayAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                          /year (${pricing.effectiveMonthly.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}/month)
                        </>
                      ) : (
                        `$${pricing.displayAmount.toLocaleString()}/month`
                      )}
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
                    {billing.currentPeriodStart ? new Date(billing.currentPeriodStart).toLocaleDateString() : "N/A"}{" "}
                    -{" "}
                    {billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {pricing.isYearly ? "Annual Rate" : "Monthly Rate"}
                  </p>
                  <p className="font-medium text-xl">
                    {pricing.isYearly ? (
                      <>
                        ${pricing.displayAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                        /year
                        <span className="text-sm text-gray-500 ml-2">
                          (${pricing.effectiveMonthly.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}/month)
                        </span>
                      </>
                    ) : (
                      `$${pricing.displayAmount.toLocaleString()}/month`
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Billing Cycle</p>
                  <p className="font-medium capitalize">
                    {client.billingInterval === "year" ? "Yearly" : "Monthly"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Minutes Included</p>
                  <p className="font-medium">
                    {client.plan === "unlimited"
                      ? "Unlimited"
                      : billing.minutesIncluded?.toLocaleString() || "0"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Minutes Used</p>
                  <p className="font-medium">
                    {billing.minutesUsed?.toLocaleString() || "0"}
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
                      : billing.overageRate ? `$${billing.overageRate}/min` : "N/A"}
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

          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle>CRM Management</CardTitle>
              <CardDescription>
                Control client's access to the built-in CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">CRM Status</p>
                {hasExternalCRM ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                      Using External CRM
                    </Badge>
                    {preferredCRM && (
                      <span className="text-sm text-gray-600">({preferredCRM})</span>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    Using Built-in CRM
                  </Badge>
                )}
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">CRM Access</p>
                    <p className="text-xs text-gray-500">
                      Toggle to override user's CRM preference
                    </p>
                  </div>
                  <Button
                    variant={crmAccessEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={handleCRMAccessToggle}
                    disabled={crmToggleLoading}
                  >
                    {crmAccessEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {crmAccessEnabled
                    ? "Client can access the CRM tab in their dashboard"
                    : "CRM tab is hidden from client's dashboard"}
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
                onClick={handleDeleteClick}
                disabled={loading}
              >
                Delete Client Account
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                CRM customer data ({voiceClientsCount} records) will be preserved
              </p>
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

      <DeleteClientAccountModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        client={{
          id: client.id,
          businessName: client.businessName,
          email: client.email,
        }}
        users={(client as any).users || []}
        metrics={{
          totalCalls: metrics.totalCalls,
          voiceClientsCount,
          appointmentsCount,
        }}
        onSuccess={() => {
          setShowDeleteModal(false);
          router.push("/admin/dashboard");
        }}
      />
    </div>
  );
}
