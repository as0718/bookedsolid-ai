import { ClientAccount, CallRecord, User } from "./types";

// Demo Users
export const demoUsers: User[] = [
  {
    id: "user_001",
    email: "demo@bookedsolid.ai",
    name: "Demo Salon & Spa",
    role: "client",
    clientId: "client_001",
  },
  {
    id: "user_002",
    email: "admin@bookedsolid.ai",
    name: "Admin User",
    role: "admin",
  },
];

// Demo Client Account
export const demoClient: ClientAccount = {
  id: "client_001",
  businessName: "Demo Salon & Spa",
  email: "demo@bookedsolid.ai",
  phone: "(555) 123-4567",
  plan: "complete",
  status: "demo",
  createdDate: "2025-09-09",
  timezone: "America/New_York",
  billing: {
    currentPeriodStart: "2025-10-09",
    currentPeriodEnd: "2025-11-09",
    minutesIncluded: 1000,
    minutesUsed: 847,
    overageRate: 0.25,
    monthlyRate: 349,
  },
  settings: {
    voiceType: "female-professional",
    speakingSpeed: "normal",
    customGreeting: "Thank you for calling Demo Salon & Spa. How may I help you today?",
    bookingSystem: "square",
    calendarSync: "google",
  },
};

// Additional demo clients for admin view
export const allClients: ClientAccount[] = [
  demoClient,
  {
    id: "client_002",
    businessName: "Glam Salon NYC",
    email: "owner@glamsalonnyc.com",
    phone: "(212) 555-0123",
    plan: "complete",
    status: "active",
    createdDate: "2025-08-15",
    timezone: "America/New_York",
    billing: {
      currentPeriodStart: "2025-10-09",
      currentPeriodEnd: "2025-11-09",
      minutesIncluded: 1000,
      minutesUsed: 247,
      overageRate: 0.25,
      monthlyRate: 349,
    },
    settings: {
      voiceType: "female-professional",
      speakingSpeed: "normal",
      customGreeting: "Thank you for calling Glam Salon NYC.",
      bookingSystem: "square",
      calendarSync: "google",
    },
  },
  {
    id: "client_003",
    businessName: "Cut & Style DC",
    email: "info@cutandstyledc.com",
    phone: "(202) 555-0456",
    plan: "missed",
    status: "active",
    createdDate: "2025-09-01",
    timezone: "America/New_York",
    billing: {
      currentPeriodStart: "2025-10-09",
      currentPeriodEnd: "2025-11-09",
      minutesIncluded: 500,
      minutesUsed: 91,
      overageRate: 0.30,
      monthlyRate: 149,
    },
    settings: {
      voiceType: "female-professional",
      speakingSpeed: "normal",
      customGreeting: "Thank you for calling Cut & Style DC.",
      bookingSystem: "vagaro",
      calendarSync: "google",
    },
  },
  {
    id: "client_004",
    businessName: "Hair Studio NJ",
    email: "contact@hairstudionj.com",
    phone: "(973) 555-0789",
    plan: "unlimited",
    status: "active",
    createdDate: "2025-07-10",
    timezone: "America/New_York",
    billing: {
      currentPeriodStart: "2025-10-09",
      currentPeriodEnd: "2025-11-09",
      minutesIncluded: 999999,
      minutesUsed: 3421,
      overageRate: 0,
      monthlyRate: 599,
    },
    settings: {
      voiceType: "female-professional",
      speakingSpeed: "normal",
      customGreeting: "Thank you for calling Hair Studio NJ.",
      bookingSystem: "mindbody",
      calendarSync: "google",
    },
  },
  {
    id: "client_005",
    businessName: "Barber Shop VA",
    email: "info@barbershopva.com",
    phone: "(703) 555-0321",
    plan: "complete",
    status: "active",
    createdDate: "2025-06-20",
    timezone: "America/New_York",
    billing: {
      currentPeriodStart: "2025-10-09",
      currentPeriodEnd: "2025-11-09",
      minutesIncluded: 1000,
      minutesUsed: 973,
      overageRate: 0.25,
      monthlyRate: 349,
    },
    settings: {
      voiceType: "male-professional",
      speakingSpeed: "normal",
      customGreeting: "Thank you for calling Barber Shop VA.",
      bookingSystem: "square",
      calendarSync: "google",
    },
  },
];

// Caller names for realistic data
const callerNames = [
  "Sarah Johnson",
  "Mike Chen",
  "Lisa Martinez",
  "James Wilson",
  "Emma Davis",
  "Robert Taylor",
  "Jessica Anderson",
  "David Lee",
  "Maria Garcia",
  "Chris Brown",
  "Ashley White",
  "Kevin Moore",
  "Amanda Clark",
  "Ryan Thomas",
  "Nicole Robinson",
  "Brandon Walker",
  "Stephanie Hall",
  "Jason Allen",
  "Rachel Young",
  "Daniel King",
  "Jennifer Wright",
  "Matthew Scott",
  "Lauren Green",
  "Andrew Adams",
  "Michelle Baker",
  "Joshua Nelson",
  "Megan Carter",
  "Tyler Mitchell",
  "Samantha Perez",
  "Eric Roberts",
];

const services = [
  "Haircut",
  "Color & Cut",
  "Highlights",
  "Balayage",
  "Blowout",
  "Hair Treatment",
  "Beard Trim",
  "Shave",
  "Extensions",
  "Updo",
  "Hair Styling",
  "Perm",
  "Keratin Treatment",
];

// Generate 30 days of call history
// Using a fixed reference date to ensure consistent data between server and client
function generateCallHistory(): CallRecord[] {
  const calls: CallRecord[] = [];
  // Use fixed date: October 10, 2025 for consistent demo data
  const now = new Date("2025-10-10T12:00:00Z");
  const outcomes: CallRecord["outcome"][] = ["booked", "info", "voicemail", "transferred", "spam"];
  const outcomeWeights = [0.63, 0.18, 0.09, 0.07, 0.03]; // Based on PRD: 156/247 = 63% booked

  let callId = 1;

  // Seeded random number generator for consistent results
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Generate calls for last 30 days
  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    // Generate 6-12 calls per day (to reach ~247 total)
    const callsPerDay = Math.floor(seededRandom() * 7) + 6;

    for (let i = 0; i < callsPerDay; i++) {
      // Random time between 9 AM and 8 PM
      const hour = Math.floor(seededRandom() * 11) + 9;
      const minute = Math.floor(seededRandom() * 60);
      date.setHours(hour, minute, 0, 0);

      // Weighted random outcome
      const rand = seededRandom();
      let outcome: CallRecord["outcome"] = "booked";
      let cumWeight = 0;
      for (let j = 0; j < outcomes.length; j++) {
        cumWeight += outcomeWeights[j];
        if (rand <= cumWeight) {
          outcome = outcomes[j];
          break;
        }
      }

      // Random duration between 1-6 minutes
      const duration = Math.floor(seededRandom() * 300) + 60; // 60-360 seconds

      const callerName = callerNames[Math.floor(seededRandom() * callerNames.length)];
      const phoneNumber = `+1555${String(Math.floor(seededRandom() * 10000000)).padStart(7, "0")}`;

      let notes = "";
      let appointmentDetails = undefined;

      if (outcome === "booked") {
        const service = services[Math.floor(seededRandom() * services.length)];
        const daysAhead = Math.floor(seededRandom() * 14) + 1;
        const apptDate = new Date(date);
        apptDate.setDate(apptDate.getDate() + daysAhead);
        const apptHour = Math.floor(seededRandom() * 10) + 9;

        notes = `Booked ${service.toLowerCase()} for ${apptDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} at ${apptHour}:00${apptHour >= 12 ? "pm" : "am"}`;

        appointmentDetails = {
          service,
          date: apptDate.toISOString().split("T")[0],
          time: `${apptHour}:00`,
          stylist: ["Jessica", "Michael", "Amanda", "David"][Math.floor(seededRandom() * 4)],
          estimatedValue: Math.floor(seededRandom() * 100) + 50,
        };
      } else if (outcome === "info") {
        notes = "Asked about pricing and services, will call back";
      } else if (outcome === "voicemail") {
        notes = "Left voicemail requesting callback";
      } else if (outcome === "transferred") {
        notes = "Transferred to stylist for consultation";
      } else if (outcome === "spam") {
        notes = "Spam call, hung up immediately";
      }

      calls.push({
        id: `call_${String(callId).padStart(5, "0")}`,
        clientId: "client_001",
        timestamp: date.toISOString(),
        callerName,
        callerPhone: phoneNumber,
        duration,
        outcome,
        notes,
        recordingUrl: `/recordings/call_${callId}.mp3`,
        transcriptUrl: `/transcripts/call_${callId}.txt`,
        appointmentDetails,
      });

      callId++;
    }
  }

  // Sort by timestamp descending (most recent first)
  return calls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const demoCallHistory = generateCallHistory();

// Helper function to get calls for a specific date range
export function getCallsInRange(
  calls: CallRecord[],
  startDate: Date,
  endDate: Date
): CallRecord[] {
  return calls.filter((call) => {
    const callDate = new Date(call.timestamp);
    return callDate >= startDate && callDate <= endDate;
  });
}

// Helper function to calculate metrics from calls
export function calculateMetrics(calls: CallRecord[]) {
  const totalCalls = calls.length;
  const appointmentsBooked = calls.filter((c) => c.outcome === "booked").length;
  const missedCallsRecovered = calls.filter(
    (c) => c.outcome === "booked" || c.outcome === "info"
  ).length;
  const revenueRecovered = calls
    .filter((c) => c.appointmentDetails)
    .reduce((sum, c) => sum + (c.appointmentDetails?.estimatedValue || 0), 0);
  const conversionRate = totalCalls > 0 ? (appointmentsBooked / totalCalls) * 100 : 0;
  const minutesUsed = Math.floor(calls.reduce((sum, c) => sum + c.duration, 0) / 60);

  return {
    totalCalls,
    appointmentsBooked,
    missedCallsRecovered,
    revenueRecovered,
    conversionRate,
    minutesUsed,
  };
}
