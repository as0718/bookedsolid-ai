import { CallRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

interface CallActivityTableProps {
  calls: CallRecord[];
  limit?: number;
}

export function CallActivityTable({ calls, limit = 5 }: CallActivityTableProps) {
  const displayCalls = limit ? calls.slice(0, limit) : calls;

  const getOutcomeIcon = (outcome: CallRecord["outcome"]) => {
    switch (outcome) {
      case "booked":
        return "✅";
      case "info":
        return "📝";
      case "transferred":
        return "📞";
      case "voicemail":
        return "📧";
      case "spam":
        return "❌";
      default:
        return "";
    }
  };

  const getOutcomeVariant = (outcome: CallRecord["outcome"]) => {
    switch (outcome) {
      case "booked":
        return "default";
      case "info":
        return "secondary";
      case "transferred":
        return "outline";
      case "voicemail":
        return "outline";
      case "spam":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")} min`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left text-sm font-medium">Date & Time</th>
                <th className="p-3 text-left text-sm font-medium">Caller</th>
                <th className="p-3 text-left text-sm font-medium">Outcome</th>
                <th className="p-3 text-left text-sm font-medium">Duration</th>
                <th className="p-3 text-left text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayCalls.map((call) => (
                <tr key={call.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-sm">{formatTimestamp(call.timestamp)}</td>
                  <td className="p-3 text-sm font-medium">{call.callerName}</td>
                  <td className="p-3">
                    <Badge variant={getOutcomeVariant(call.outcome)}>
                      {getOutcomeIcon(call.outcome)} {call.outcome}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm">{formatDuration(call.duration)}</td>
                  <td className="p-3">
                    <Button size="sm" variant="ghost" className="h-8">
                      <Play className="h-3 w-3 mr-1" />
                      Listen
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
