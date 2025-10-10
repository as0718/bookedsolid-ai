"use client";

import { useState } from "react";
import { NavBar } from "@/components/dashboard/nav-bar";
import { demoClient } from "@/lib/mock-data";
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
import { Save, Play, RefreshCw, Settings as SettingsIcon, Check } from "lucide-react";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState(demoClient.businessName);
  const [contactEmail, setContactEmail] = useState(demoClient.email);
  const [phoneNumber, setPhoneNumber] = useState(demoClient.phone);
  const [, setTimezone] = useState(demoClient.timezone);
  const [voiceType, setVoiceType] = useState(demoClient.settings.voiceType);
  const [speakingSpeed, setSpeakingSpeed] = useState(demoClient.settings.speakingSpeed);
  const [customGreeting, setCustomGreeting] = useState(demoClient.settings.customGreeting);
  const [bookingSystem, setBookingSystem] = useState(demoClient.settings.bookingSystem);
  const [calendarSync, setCalendarSync] = useState(demoClient.settings.calendarSync);
  const [saved, setSaved] = useState(false);

  const handleSaveAccount = () => {
    // In a real app, this would save to a database
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveVoice = () => {
    // In a real app, this would save to a database
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePreviewVoice = () => {
    alert("Voice preview coming soon! This will play a sample of your AI voice greeting.");
  };

  const handleTestConnection = (system: string) => {
    alert(`Testing connection to ${system}... Connection successful!`);
  };

  const handleSyncNow = () => {
    alert("Syncing calendar... Calendar synced successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar userName={demoClient.businessName} userEmail={demoClient.email} isAdmin={false} />

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

        {/* Settings Tabs */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="voice">AI Voice</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
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
                  <Select value={demoClient.timezone} onValueChange={setTimezone}>
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
                  <Button onClick={handleSaveAccount}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
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
                    <Button variant="outline">Change Password</Button>
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

          {/* AI Voice Settings Tab */}
          <TabsContent value="voice" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">AI Voice Settings</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="voiceType">Voice Type</Label>
                  <Select value={voiceType} onValueChange={setVoiceType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female-professional">Female - Professional</SelectItem>
                      <SelectItem value="female-friendly">Female - Friendly</SelectItem>
                      <SelectItem value="male-professional">Male - Professional</SelectItem>
                      <SelectItem value="male-friendly">Male - Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="speakingSpeed">Speaking Speed</Label>
                  <Select value={speakingSpeed} onValueChange={setSpeakingSpeed}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customGreeting">Custom Greeting</Label>
                  <textarea
                    id="customGreeting"
                    value={customGreeting}
                    onChange={(e) => setCustomGreeting(e.target.value)}
                    placeholder="Enter your custom greeting message..."
                    className="mt-1 w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This is the first message callers will hear when they call your business.
                  </p>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button onClick={handleSaveVoice}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handlePreviewVoice}>
                    <Play className="h-4 w-4 mr-2" />
                    Preview Voice
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-purple-50 border-purple-200">
              <h3 className="font-semibold mb-2">💡 Tips for a Great Greeting</h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Keep it brief (under 15 seconds)</li>
                <li>Include your business name</li>
                <li>Sound warm and welcoming</li>
                <li>Set expectations (e.g., &quot;I can help you book an appointment&quot;)</li>
              </ul>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Booking System</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bookingSystem">Select Your Booking System</Label>
                  <Select value={bookingSystem} onValueChange={setBookingSystem}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Square Appointments</SelectItem>
                      <SelectItem value="vagaro">Vagaro</SelectItem>
                      <SelectItem value="mindbody">Mindbody</SelectItem>
                      <SelectItem value="schedulicity">Schedulicity</SelectItem>
                      <SelectItem value="booksy">Booksy</SelectItem>
                      <SelectItem value="other">Other / Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <Badge className="bg-green-500">✅ Connected</Badge>
                  <span className="text-sm text-gray-700">
                    Last synced: 2 minutes ago
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleTestConnection(bookingSystem)}
                  >
                    Test Connection
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Calendar Sync</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="calendarSync">Select Calendar Service</Label>
                  <Select value={calendarSync} onValueChange={setCalendarSync}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Calendar</SelectItem>
                      <SelectItem value="outlook">Outlook Calendar</SelectItem>
                      <SelectItem value="apple">Apple iCloud Calendar</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <Badge className="bg-green-500">✅ Synced</Badge>
                  <span className="text-sm text-gray-700">
                    Last sync: 2 minutes ago
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSyncNow}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                  <Button variant="outline">Manage Integrations</Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-2">🔌 Need Help with Integrations?</h3>
              <p className="text-sm text-gray-700 mb-3">
                Our team can help you set up integrations with your existing booking and calendar
                systems.
              </p>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
