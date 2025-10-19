"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, Play, RefreshCw, Settings as SettingsIcon, Check, Loader2 } from "lucide-react";
import { ClientSettings } from "@/lib/types";
import type { Client } from "@prisma/client";

interface SettingsClientContentProps {
  client: Client;
}

export function SettingsClientContent({ client }: SettingsClientContentProps) {
  const clientSettings = client.settings as unknown as ClientSettings;

  const [businessName, setBusinessName] = useState(client.businessName);
  const [contactEmail, setContactEmail] = useState(client.email);
  const [phoneNumber, setPhoneNumber] = useState(client.phone);
  const [, setTimezone] = useState(client.timezone || "America/New_York");
  const [voiceType, setVoiceType] = useState(clientSettings.voiceType);
  const [speakingSpeed, setSpeakingSpeed] = useState(clientSettings.speakingSpeed?.toString() || "normal");
  const [customGreeting, setCustomGreeting] = useState(clientSettings.customGreeting);
  const [bookingSystem, setBookingSystem] = useState(clientSettings.bookingSystem || "square");
  const [calendarSync, setCalendarSync] = useState(clientSettings.calendarSync ? "google" : "none");
  const [saved, setSaved] = useState(false);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveAccount = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          email: contactEmail,
          phone: phoneNumber,
          timezone,
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
      setSaving(false);
    }
  };

  const handleSaveVoice = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceType,
          speakingSpeed,
          customGreeting,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save voice settings");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewVoice = () => {
    window.alert("Voice preview coming soon! This will play a sample of your AI voice greeting.");
  };

  const handleTestConnection = async (system: string) => {
    setTesting(true);
    try {
      const response = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationType: "booking",
          config: { system },
        }),
      });

      const data = await response.json();
      if (data.success) {
        window.alert(`${data.message}`);
      } else {
        window.alert(data.message || "Connection test failed");
      }
    } catch (err) {
      window.alert("Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationType: "calendar",
          config: { provider: calendarSync },
        }),
      });

      const data = await response.json();
      if (data.success) {
        window.alert(`${data.message}`);
      } else {
        window.alert(data.message || "Sync failed");
      }
    } catch (err) {
      window.alert("Failed to sync calendar");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveIntegrations = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingSystem,
          calendarSync,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save integration settings");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage your account, AI voice, and integrations</p>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <Check className="h-5 w-5" />
            <span className="font-medium">Settings saved successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
            <span className="font-medium">Error: {error}</span>
          </div>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Business Name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Time Zone</Label>
                  <Select value={client.timezone || "America/New_York"} onValueChange={setTimezone}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">EST (UTC-5)</SelectItem>
                      <SelectItem value="America/Chicago">CST (UTC-6)</SelectItem>
                      <SelectItem value="America/Denver">MST (UTC-7)</SelectItem>
                      <SelectItem value="America/Los_Angeles">PST (UTC-8)</SelectItem>
                      <SelectItem value="America/Phoenix">Arizona (UTC-7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button onClick={handleSaveAccount} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Security</h2>
              <div className="space-y-4">
                <div>
                  <Label>Password</Label>
                  <div className="mt-2">
                    <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                      Change Password
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Two-Factor Authentication</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline">Disabled</Badge>
                    <Button variant="outline" size="sm">
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {passwordError}
              </div>
            )}
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false);
                setPasswordError(null);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </main>
  );
}
