import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  alert?: "success" | "warning" | "error";
  alertMessage?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = "MTD",
  subtitle,
  icon: Icon,
  trend,
  alert,
  alertMessage,
}: MetricCardProps) {
  const getTrendColor = () => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  const getAlertColor = () => {
    if (alert === "success") return "text-green-600";
    if (alert === "warning") return "text-amber-600";
    if (alert === "error") return "text-red-600";
    return "";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${getTrendColor()} flex items-center gap-1 mt-1`}>
            <span>
              {change > 0 ? "↑" : change < 0 ? "↓" : "→"} {Math.abs(change)}%
            </span>
            <span className="text-muted-foreground">{changeLabel}</span>
          </p>
        )}
        {alertMessage && (
          <p className={`text-xs ${getAlertColor()} mt-2 font-medium`}>
            {alertMessage}
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
