"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Bell,
  Shield,
  Database,
  Key,
  Mail,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface AdminSettingsContentProps {
  totalClients: number;
  totalCallRecords: number;
}

export function AdminSettingsContent({ totalClients, totalCallRecords }: AdminSettingsContentProps) {
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // System Configuration
  const [companyName, setCompanyName] = useState("BookedSolid AI");
  const [supportEmail, setSupportEmail] = useState("support@bookedsolid.ai");
  const [defaultTimezone, setDefaultTimezone] = useState("America/New_York");

  // Notifications
  const [notifyNewClientSignup, setNotifyNewClientSignup] = useState(true);
  const [notifyClientNearLimit, setNotifyClientNearLimit] = useState(true);
  const [notifySystemErrors, setNotifySystemErrors] = useState(true);
  const [notifyWeeklyReports, setNotifyWeeklyReports] = useState(true);

  // Email Configuration
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [fromEmail, setFromEmail] = useState("noreply@bookedsolid.ai");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        // Update state with loaded settings
        setCompanyName(data.companyName || "BookedSolid AI");
        setSupportEmail(data.supportEmail || "support@bookedsolid.ai");
        setDefaultTimezone(data.defaultTimezone || "America/New_York");
        setNotifyNewClientSignup(data.notifyNewClientSignup ?? true);
        setNotifyClientNearLimit(data.notifyClientNearLimit ?? true);
        setNotifySystemErrors(data.notifySystemErrors ?? true);
        setNotifyWeeklyReports(data.notifyWeeklyReports ?? true);
        setSmtpHost(data.smtpHost || "smtp.gmail.com");
        setSmtpPort(data.smtpPort || 587);
        setFromEmail(data.fromEmail || "noreply@bookedsolid.ai");
        setSmtpUsername(data.smtpUsername || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const saveSystemConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          supportEmail,
          defaultTimezone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyNewClientSignup,
          notifyClientNearLimit,
          notifySystemErrors,
          notifyWeeklyReports,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const saveEmailConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost,
          smtpPort,
          fromEmail,
          smtpUsername,
          ...(smtpPassword && { smtpPassword }),
          smtpEnabled: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save SMTP settings");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const testEmail = async () => {
    setTestingEmail(true);
    setError(null);
    try {
      const response = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationType: "email",
          config: { smtpHost, smtpPort, fromEmail },
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Test email sent successfully! Check your inbox.");
      } else {
        alert(data.message || "Failed to send test email");
      }
    } catch (err) {
      alert("Failed to send test email");
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <>
      {/* Success Message */}
      {saved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Settings saved successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
          <span className="font-medium">Error: {error}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">System Configuration</h2>
              <p className="text-sm text-gray-600">Core system settings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Default Timezone</Label>
              <Input
                id="timezone"
                value={defaultTimezone}
                onChange={(e) => setDefaultTimezone(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={saveSystemConfig}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>

        {/* API Integrations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">API Integrations</h2>
              <p className="text-sm text-gray-600">Connected services</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Retell.ai</p>
                  <p className="text-xs text-gray-600">Voice AI Platform</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Google OAuth</p>
                  <p className="text-xs text-gray-600">Authentication</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Stripe</p>
                  <p className="text-xs text-gray-600">Payment Processing</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-sm text-gray-600">Alert preferences</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Client Signup</p>
                <p className="text-xs text-gray-600">Email notifications for new accounts</p>
              </div>
              <input
                type="checkbox"
                checked={notifyNewClientSignup}
                onChange={(e) => setNotifyNewClientSignup(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Client Near Limit</p>
                <p className="text-xs text-gray-600">Alert when clients approach usage limits</p>
              </div>
              <input
                type="checkbox"
                checked={notifyClientNearLimit}
                onChange={(e) => setNotifyClientNearLimit(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">System Errors</p>
                <p className="text-xs text-gray-600">Critical system notifications</p>
              </div>
              <input
                type="checkbox"
                checked={notifySystemErrors}
                onChange={(e) => setNotifySystemErrors(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Reports</p>
                <p className="text-xs text-gray-600">Automated weekly summary emails</p>
              </div>
              <input
                type="checkbox"
                checked={notifyWeeklyReports}
                onChange={(e) => setNotifyWeeklyReports(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={saveNotifications}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Security</h2>
              <p className="text-sm text-gray-600">Access and authentication</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-gray-600">Enhanced security for admin accounts</p>
              </div>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                Coming Soon
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Session Timeout</p>
                <p className="text-xs text-gray-600">Auto-logout after inactivity</p>
              </div>
              <span className="text-sm font-medium">30 minutes</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">API Rate Limiting</p>
                <p className="text-xs text-gray-600">Requests per minute</p>
              </div>
              <span className="text-sm font-medium">1000/min</span>
            </div>
          </div>
        </div>

        {/* Database & Storage */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Database className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Database & Storage</h2>
              <p className="text-sm text-gray-600">Data management</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Clients</span>
              <span className="font-semibold">{totalClients}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Call Records</span>
              <span className="font-semibold">{totalCallRecords}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage Used</span>
              <span className="font-semibold">2.4 GB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Backup</span>
              <span className="font-semibold">2 hours ago</span>
            </div>
            <div className="pt-2 space-y-2">
              <Button className="w-full" variant="outline" disabled>
                Backup Now (Coming Soon)
              </Button>
              <Button className="w-full" variant="outline" disabled>
                Export Data (Coming Soon)
              </Button>
            </div>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Email Configuration</h2>
              <p className="text-sm text-gray-600">SMTP and email settings</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="smtp-username">SMTP Username (Optional)</Label>
              <Input
                id="smtp-username"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="smtp-password">SMTP Password (Optional)</Label>
              <Input
                id="smtp-password"
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="mt-1"
              />
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={testEmail}
              disabled={testingEmail}
            >
              {testingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Email"
              )}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={saveEmailConfig}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save SMTP Settings"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
