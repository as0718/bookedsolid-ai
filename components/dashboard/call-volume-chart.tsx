"use client";

import { CallRecord } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

interface CallVolumeChartProps {
  calls: CallRecord[];
  days?: number;
}

export function CallVolumeChart({ calls, days = 30 }: CallVolumeChartProps) {
  // Prepare chart data
  const chartData = [];
  const today = startOfDay(new Date());

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, "yyyy-MM-dd");

    const dayCalls = calls.filter((call) => {
      const callDate = startOfDay(new Date(call.timestamp));
      return format(callDate, "yyyy-MM-dd") === dateStr;
    });

    const booked = dayCalls.filter((c) => c.outcome === "booked").length;
    const info = dayCalls.filter((c) => c.outcome === "info").length;
    const other = dayCalls.filter((c) => c.outcome !== "booked" && c.outcome !== "info").length;

    chartData.push({
      date: format(date, "MMM d"),
      fullDate: dateStr,
      booked,
      info,
      other,
      total: dayCalls.length,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Volume Trend (Last {days} Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBooked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInfo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="text-sm font-medium mb-2">
                          {payload[0].payload.date}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="text-green-600">Booked:</span>{" "}
                            {payload[0].payload.booked}
                          </p>
                          <p className="text-sm">
                            <span className="text-blue-600">Info:</span>{" "}
                            {payload[0].payload.info}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-600">Other:</span>{" "}
                            {payload[0].payload.other}
                          </p>
                          <p className="text-sm font-semibold border-t pt-1">
                            Total: {payload[0].payload.total}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="booked"
                stackId="1"
                stroke="#10b981"
                fill="url(#colorBooked)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="info"
                stackId="1"
                stroke="#3b82f6"
                fill="url(#colorInfo)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="other"
                stackId="1"
                stroke="#6b7280"
                fill="#6b728010"
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
