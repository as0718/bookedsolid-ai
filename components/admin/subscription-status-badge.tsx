import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertTriangle, Ban, FlaskConical } from "lucide-react";

interface SubscriptionStatusBadgeProps {
  status?: string | null;
  stripeSubscriptionId?: string | null;
  accountStatus?: string; // "active" | "suspended" | "demo"
}

export function SubscriptionStatusBadge({
  status,
  stripeSubscriptionId,
  accountStatus = "active"
}: SubscriptionStatusBadgeProps) {
  // Determine the effective status
  const getEffectiveStatus = () => {
    // Account-level statuses take priority
    if (accountStatus === "suspended") {
      return "SUSPENDED";
    }
    if (accountStatus === "demo") {
      return "DEMO";
    }

    // If no subscription ID, client hasn't started payment
    if (!stripeSubscriptionId) {
      return "NOT_STARTED";
    }

    // Map Stripe status to our status types
    switch (status) {
      case "active":
        return "ACTIVE";
      case "trialing":
        return "TRIAL";
      case "past_due":
      case "unpaid":
        return "OVERDUE";
      case "canceled":
      case "incomplete":
      case "incomplete_expired":
        return "NOT_STARTED";
      default:
        return "NOT_STARTED";
    }
  };

  const effectiveStatus = getEffectiveStatus();

  // Status configurations
  const statusConfig = {
    ACTIVE: {
      label: "ACTIVE & PAID",
      variant: "default" as const,
      icon: CheckCircle,
      className: "bg-green-600 text-white hover:bg-green-700",
    },
    TRIAL: {
      label: "ACTIVE TRIAL",
      variant: "secondary" as const,
      icon: Clock,
      className: "bg-yellow-500 text-white hover:bg-yellow-600",
    },
    NOT_STARTED: {
      label: "NOT STARTED",
      variant: "outline" as const,
      icon: XCircle,
      className: "bg-gray-400 text-white hover:bg-gray-500",
    },
    OVERDUE: {
      label: "PAYMENT FAILED",
      variant: "destructive" as const,
      icon: AlertTriangle,
      className: "bg-red-600 text-white hover:bg-red-700",
    },
    SUSPENDED: {
      label: "SUSPENDED",
      variant: "destructive" as const,
      icon: Ban,
      className: "bg-red-700 text-white hover:bg-red-800",
    },
    DEMO: {
      label: "DEMO",
      variant: "secondary" as const,
      icon: FlaskConical,
      className: "bg-purple-500 text-white hover:bg-purple-600",
    },
  };

  const config = statusConfig[effectiveStatus];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
