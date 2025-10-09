// Client Account Types
export interface ClientAccount {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  plan: "missed" | "complete" | "unlimited";
  status: "active" | "suspended" | "demo";
  createdDate: string;
  timezone: string;
  billing: BillingInfo;
  settings: ClientSettings;
}

export interface BillingInfo {
  currentPeriodStart: string;
  currentPeriodEnd: string;
  minutesIncluded: number;
  minutesUsed: number;
  overageRate: number;
  monthlyRate: number;
}

export interface ClientSettings {
  voiceType: string;
  speakingSpeed: string;
  customGreeting: string;
  bookingSystem: string;
  calendarSync: string;
}

// Call Record Types
export interface CallRecord {
  id: string;
  clientId: string;
  timestamp: string;
  callerName: string;
  callerPhone: string;
  duration: number; // in seconds
  outcome: "booked" | "info" | "voicemail" | "transferred" | "spam";
  notes: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  appointmentDetails?: AppointmentDetails;
}

export interface AppointmentDetails {
  service: string;
  date: string;
  time: string;
  stylist?: string;
  estimatedValue: number;
}

// Dashboard Metrics Types
export interface DashboardMetrics {
  totalCalls: number;
  totalCallsChange: number;
  appointmentsBooked: number;
  appointmentsChange: number;
  revenueRecovered: number;
  revenueChange: number;
  missedCallsRecovered: number;
  conversionRate: number;
  minutesUsed: number;
  minutesIncluded: number;
}

// Admin Dashboard Types
export interface AdminMetrics {
  activeClients: number;
  newClients: number;
  totalCallsToday: number;
  totalCallsChange: number;
  totalRevenue: number;
  totalRevenueChange: number;
}

// User Type for NextAuth
export interface User {
  id: string;
  email: string;
  name: string;
  role: "client" | "admin";
  clientId?: string;
}
