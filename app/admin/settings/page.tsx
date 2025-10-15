import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/dashboard/nav-bar";
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
  CheckCircle
} from "lucide-react";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; email?: string; name?: string } | undefined;

  if (!session || !user || user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar
        userName={user.name || "Admin"}
        userEmail={user.email || ""}
        isAdmin={true}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-1">Manage system configuration and integrations</p>
        </div>

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
                <Input id="company-name" defaultValue="BookedSolid AI" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="support-email">Support Email</Label>
                <Input id="support-email" type="email" defaultValue="support@bookedsolid.ai" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="timezone">Default Timezone</Label>
                <Input id="timezone" defaultValue="America/New_York" className="mt-1" />
              </div>
              <Button className="w-full" variant="outline">Save Changes</Button>
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
              <Button className="w-full" variant="outline">Manage Integrations</Button>
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
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Client Near Limit</p>
                  <p className="text-xs text-gray-600">Alert when clients approach usage limits</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">System Errors</p>
                  <p className="text-xs text-gray-600">Critical system notifications</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-xs text-gray-600">Automated weekly summary emails</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <Button className="w-full" variant="outline">Save Preferences</Button>
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
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Enabled
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
              <Button className="w-full" variant="outline">Security Settings</Button>
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
                <span className="font-semibold">{allClients.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Call Records</span>
                <span className="font-semibold">247</span>
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
                <Button className="w-full" variant="outline">Backup Now</Button>
                <Button className="w-full" variant="outline">Export Data</Button>
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
                <Input id="smtp-host" defaultValue="smtp.gmail.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" defaultValue="587" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="from-email">From Email</Label>
                <Input id="from-email" type="email" defaultValue="noreply@bookedsolid.ai" className="mt-1" />
              </div>
              <Button className="w-full" variant="outline">Test Email</Button>
              <Button className="w-full" variant="outline">Save SMTP Settings</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Import allClients count for display
import { allClients } from "@/lib/mock-data";
