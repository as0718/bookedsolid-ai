"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  Download,
  Loader2,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Mail,
  PhoneForwarded,
  Ban,
} from "lucide-react";

interface UsageAnalyticsProps {
  clientId: string;
}

interface AnalyticsData {
  summary: {
    totalCalls: number;
    totalMinutes: number;
    avgCallDuration: number;
    conversionRate: number;
    estimatedRevenue: number;
  };
  outcomes: Record<string, number>;
  peakHour: {
    hour: number;
    count: number;
    formatted: string;
  };
  hourlyDistribution: Record<number, number>;
  dailyVolume: Array<{ date: string; count: number }>;
  costAnalysis: {
    monthlyRate: number;
    minutesIncluded: number;
    minutesUsed: number;
    overageMinutes: number;
    overageRate: number;
    overageCost: number;
    totalCost: number;
    costPerCall: number;
    roi: number;
  };
  timeRange: {
    start: string;
    end: string;
    days: number;
  };
}

const outcomeIcons = {
  booked: CheckCircle2,
  info: PhoneCall,
  voicemail: Mail,
  transferred: PhoneForwarded,
  spam: Ban,
};

const outcomeColors = {
  booked: "text-green-600 bg-green-50",
  info: "text-blue-600 bg-blue-50",
  voicemail: "text-yellow-600 bg-yellow-50",
  transferred: "text-purple-600 bg-purple-50",
  spam: "text-red-600 bg-red-50",
};

const outcomeLabels = {
  booked: "Booked",
  info: "Info Request",
  voicemail: "Voicemail",
  transferred: "Transferred",
  spam: "Spam/Blocked",
};

export function UsageAnalytics({ clientId }: UsageAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("30");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics/usage?range=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError("Failed to load analytics data");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) return;

    const csvContent = [
      ["Metric", "Value"],
      ["Total Calls", analytics.summary.totalCalls],
      ["Total Minutes", analytics.summary.totalMinutes],
      ["Avg Call Duration", `${Math.floor(analytics.summary.avgCallDuration / 60)}m ${analytics.summary.avgCallDuration % 60}s`],
      ["Conversion Rate", `${analytics.summary.conversionRate}%`],
      ["Estimated Revenue", `$${analytics.summary.estimatedRevenue}`],
      ["Total Cost", `$${analytics.costAnalysis.totalCost}`],
      ["ROI", `${analytics.costAnalysis.roi}%`],
      [""],
      ["Outcome", "Count"],
      ...Object.entries(analytics.outcomes).map(([outcome, count]) => [
        outcomeLabels[outcome as keyof typeof outcomeLabels] || outcome,
        count,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-analytics-${timeRange}days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">{error || "No data available"}</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const usagePercent = analytics.costAnalysis.minutesIncluded > 0
    ? (analytics.costAnalysis.minutesUsed / analytics.costAnalysis.minutesIncluded) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Time Range Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Usage Analytics</h2>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {(["7", "30", "90"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {range} Days
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Calls</p>
            <Phone className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics.summary.totalCalls}</p>
          <p className="text-xs text-gray-500 mt-1">
            Last {timeRange} days
          </p>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Duration</p>
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {Math.floor(analytics.summary.avgCallDuration / 60)}:
            {String(analytics.summary.avgCallDuration % 60).padStart(2, "0")}
          </p>
          <p className="text-xs text-gray-500 mt-1">Minutes per call</p>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.summary.conversionRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Calls to appointments</p>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Est. Revenue</p>
            <DollarSign className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${analytics.summary.estimatedRevenue}
          </p>
          <p className="text-xs text-gray-500 mt-1">From booked appointments</p>
        </Card>
      </div>

      {/* Usage Progress Bar */}
      {analytics.costAnalysis.minutesIncluded > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Monthly Minutes Used</h3>
            <span className="text-sm font-semibold">
              {analytics.costAnalysis.minutesUsed} / {analytics.costAnalysis.minutesIncluded}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className={`h-4 rounded-full transition-all ${
                usagePercent >= 90
                  ? "bg-red-500"
                  : usagePercent >= 75
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {usagePercent.toFixed(1)}% used • {analytics.costAnalysis.minutesIncluded - analytics.costAnalysis.minutesUsed} minutes remaining
          </p>
        </Card>
      )}

      {/* Call Outcomes Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Call Outcomes</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(analytics.outcomes).map(([outcome, count]) => {
            const Icon = outcomeIcons[outcome as keyof typeof outcomeIcons];
            const colorClass = outcomeColors[outcome as keyof typeof outcomeColors];
            const label = outcomeLabels[outcome as keyof typeof outcomeLabels];

            return (
              <div
                key={outcome}
                className={`p-4 rounded-lg border ${colorClass} transition-transform hover:scale-105`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {Icon && <Icon className="h-5 w-5" />}
                  <p className="text-sm font-medium">{label}</p>
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs opacity-75 mt-1">
                  {((count / analytics.summary.totalCalls) * 100).toFixed(1)}%
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Peak Hours */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Call Volume by Hour</h3>
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-900">
              Peak Hour: {analytics.peakHour.formatted} with {analytics.peakHour.count} calls
            </p>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-2">
          {Object.entries(analytics.hourlyDistribution)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([hour, count]) => {
              const maxCount = Math.max(...Object.values(analytics.hourlyDistribution));
              const heightPercent = (count / maxCount) * 100;
              const hourNum = parseInt(hour);
              const isPeak = hourNum === analytics.peakHour.hour;

              return (
                <div key={hour} className="flex flex-col items-center gap-1" title={`${hour}:00 - ${count} calls`}>
                  <div className="relative w-full h-32 flex items-end">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isPeak ? "bg-purple-600" : "bg-blue-400 hover:bg-blue-500"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {hourNum % 12 || 12}
                    {hourNum >= 12 ? "p" : "a"}
                  </span>
                </div>
              );
            })}
        </div>
      </Card>

      {/* Cost Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Monthly Plan Cost</p>
            <p className="text-2xl font-bold text-gray-900">
              ${analytics.costAnalysis.monthlyRate}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Overage Charges</p>
            <p className="text-2xl font-bold text-gray-900">
              ${analytics.costAnalysis.overageCost}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.costAnalysis.overageMinutes} extra minutes
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900">
              ${analytics.costAnalysis.totalCost}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ${analytics.costAnalysis.costPerCall}/call
            </p>
          </div>
        </div>

        {/* ROI Indicator */}
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Return on Investment</p>
              <p className="text-xs text-gray-600 mt-1">
                Revenue recovered vs. total cost
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">
                {analytics.costAnalysis.roi > 0 ? "+" : ""}
                {analytics.costAnalysis.roi}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                ${analytics.summary.estimatedRevenue - analytics.costAnalysis.totalCost} profit
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Call Volume</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {analytics.dailyVolume.map(({ date, count }) => {
            const maxCount = Math.max(...analytics.dailyVolume.map((d) => d.count));
            const widthPercent = (count / maxCount) * 100;

            return (
              <div key={date} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-24 flex-shrink-0">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-blue-500 h-6 rounded-full transition-all hover:bg-blue-600"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
