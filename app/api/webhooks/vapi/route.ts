/**
 * Vapi.ai Webhook Endpoint
 * Receives and processes call events from Vapi.ai
 *
 * Webhook URL: https://yourdomain.com/api/webhooks/vapi
 *
 * Events handled:
 * - assistant-request: Assistant configuration request
 * - call-start: Call initiation
 * - call-end: Call completion with transcript
 * - function-call: Tool/function execution
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface VapiCallData {
  id: string;
  assistantId?: string;
  customer?: {
    number?: string;
    name?: string;
  };
  phoneNumber?: {
    number?: string;
  };
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  duration?: number;
  cost?: number;
  metadata?: Record<string, unknown>;
}

interface VapiWebhookPayload {
  type: string;
  call?: VapiCallData;
  message?: {
    type: string;
    role: string;
    content: string;
  };
}

/**
 * POST handler for Vapi.ai webhooks
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Vapi Webhook] Received webhook request");

  try {
    // 1. Verify webhook signature (if Vapi provides one)
    const signature = request.headers.get("x-vapi-signature");
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;

    // Optional: Add signature verification if Vapi supports it
    if (webhookSecret && signature) {
      // Implement verification logic here
    }

    // 2. Parse payload
    const payload: VapiWebhookPayload = await request.json();

    console.log("[Vapi Webhook] Event type:", payload.type);

    // 3. Process webhook based on event type
    const result = await processVapiWebhook(payload);

    const duration = Date.now() - startTime;
    console.log(`[Vapi Webhook] Processed in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        type: payload.type,
        call_id: payload.call?.id,
        processed_at: new Date().toISOString(),
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Vapi Webhook] Error processing webhook:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Process Vapi webhook based on event type
 */
async function processVapiWebhook(payload: VapiWebhookPayload) {
  const { type, call } = payload;

  switch (type) {
    case "assistant-request":
      return { message: "Assistant configuration provided" };

    case "call-start":
      return call ? await handleCallStart(call) : { warning: "No call data" };

    case "call-end":
      return call ? await handleCallEnd(call) : { warning: "No call data" };

    case "function-call":
      console.log("[Vapi Webhook] Function call event received");
      return { message: "Function call acknowledged" };

    default:
      console.warn(`[Vapi Webhook] Unknown event type: ${type}`);
      return { warning: "Unknown event type" };
  }
}

/**
 * Handle call-start event
 */
async function handleCallStart(call: VapiCallData) {
  console.log("[Vapi Webhook] Handling call-start");

  const clientId = await findClientByAssistantId(call.assistantId, call.metadata);

  if (!clientId) {
    console.error("[Vapi Webhook] Could not determine client for assistant:", call.assistantId);
    throw new Error("Client not found for assistant");
  }

  // Create initial call record
  const callRecord = await prisma.callRecord.create({
    data: {
      clientId,
      retellCallId: `vapi_${call.id}`, // Prefix to distinguish from Retell calls
      agentId: call.assistantId || "",
      timestamp: call.startedAt ? new Date(call.startedAt) : new Date(),
      callerName: call.customer?.name || "Unknown",
      callerPhone: call.customer?.number || call.phoneNumber?.number || "Unknown",
      duration: 0, // Will be updated on call-end
      outcome: "unknown", // Will be determined on call-end
      notes: "Call in progress",
      callType: "phone_call",
      toNumber: call.phoneNumber?.number,
      direction: "inbound",
      callStatus: "ongoing",
      metadata: (call.metadata || {}) as Record<string, string | number | boolean>,
      optOutSensitiveData: false,
    },
  });

  console.log("[Vapi Webhook] Created call record:", callRecord.id);

  return { call_record_id: callRecord.id, action: "created" };
}

/**
 * Handle call-end event
 */
async function handleCallEnd(call: VapiCallData) {
  console.log("[Vapi Webhook] Handling call-end");

  const clientId = await findClientByAssistantId(call.assistantId, call.metadata);

  if (!clientId) {
    console.error("[Vapi Webhook] Could not determine client for assistant:", call.assistantId);
    throw new Error("Client not found for assistant");
  }

  // Calculate duration in seconds
  const duration = call.duration || 0;

  // Determine outcome from transcript/summary
  const outcome = determineVapiOutcome(call.transcript, call.summary);

  // Check if call record already exists
  const existingRecord = await prisma.callRecord.findFirst({
    where: {
      retellCallId: `vapi_${call.id}`,
    },
  });

  let recordId: string;
  let action: string;

  if (existingRecord) {
    // Update existing record
    const updatedRecord = await prisma.callRecord.update({
      where: { id: existingRecord.id },
      data: {
        duration,
        outcome,
        notes: call.transcript || call.summary || "No transcript available",
        recordingUrl: call.recordingUrl,
        transcript: call.transcript,
        callStatus: "ended",
        updatedAt: new Date(),
      },
    });

    recordId = updatedRecord.id;
    action = "updated";
    console.log("[Vapi Webhook] Updated call record:", updatedRecord.id);
  } else {
    // Create new record (call-start might have been missed)
    const newRecord = await prisma.callRecord.create({
      data: {
        clientId,
        retellCallId: `vapi_${call.id}`,
        agentId: call.assistantId || "",
        timestamp: call.startedAt ? new Date(call.startedAt) : new Date(),
        callerName: call.customer?.name || "Unknown",
        callerPhone: call.customer?.number || call.phoneNumber?.number || "Unknown",
        duration,
        outcome,
        notes: call.transcript || call.summary || "No transcript available",
        recordingUrl: call.recordingUrl,
        transcript: call.transcript,
        callType: "phone_call",
        toNumber: call.phoneNumber?.number,
        direction: "inbound",
        callStatus: "ended",
        metadata: (call.metadata || {}) as Record<string, string | number | boolean>,
        optOutSensitiveData: false,
      },
    });

    recordId = newRecord.id;
    action = "created";
    console.log("[Vapi Webhook] Created call record:", newRecord.id);
  }

  // Update client billing with call minutes
  await updateClientBillingMinutes(clientId, duration);

  return { call_record_id: recordId, action, minutes_tracked: Math.ceil(duration / 60) };
}

/**
 * Determine call outcome from Vapi transcript/summary
 */
function determineVapiOutcome(transcript?: string, summary?: string): string {
  const text = `${transcript || ""} ${summary || ""}`.toLowerCase();

  if (text.includes("appointment") && (text.includes("booked") || text.includes("scheduled"))) {
    return "booked";
  }

  if (text.includes("transfer") || text.includes("forwarded")) {
    return "transferred";
  }

  if (text.includes("voicemail") || text.includes("message")) {
    return "voicemail";
  }

  if (text.includes("spam") || text.includes("robocall")) {
    return "spam";
  }

  if (text.includes("information") || text.includes("question")) {
    return "info";
  }

  return "unknown";
}

/**
 * Update client billing minutes
 */
async function updateClientBillingMinutes(clientId: string, durationSeconds: number) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      console.error("[Vapi Webhook] Client not found for billing update:", clientId);
      return;
    }

    const billing = client.billing as Record<string, unknown>;
    const minutesUsed = (typeof billing.minutesUsed === "number" ? billing.minutesUsed : 0);
    const callMinutes = Math.ceil(durationSeconds / 60);
    const newMinutesUsed = minutesUsed + callMinutes;

    // Update billing information
    await prisma.client.update({
      where: { id: clientId },
      data: {
        billing: {
          ...billing,
          minutesUsed: newMinutesUsed,
        },
      },
    });

    console.log(
      `[Vapi Webhook] Updated billing for client ${clientId}: +${callMinutes} minutes (total: ${newMinutesUsed})`
    );
  } catch (error) {
    console.error("[Vapi Webhook] Error updating billing minutes:", error);
  }
}

/**
 * Find client by Vapi assistant ID
 */
async function findClientByAssistantId(
  assistantId?: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  // Strategy 1: Check if client_id is in metadata
  if (metadata?.client_id && typeof metadata.client_id === "string") {
    const client = await prisma.client.findUnique({
      where: { id: metadata.client_id },
    });

    if (client) {
      return client.id;
    }
  }

  // Strategy 2: Look up by assistant_id in client settings
  if (assistantId) {
    const clients = await prisma.client.findMany({
      select: { id: true, settings: true },
    });

    for (const client of clients) {
      const settings = client.settings as Record<string, unknown>;

      if (settings.vapiAssistantId === assistantId) {
        return client.id;
      }
    }
  }

  // Strategy 3: Default to first active client (for testing)
  console.warn("[Vapi Webhook] Could not find client by assistant_id, using default client");

  const defaultClient = await prisma.client.findFirst({
    where: { status: "active" },
  });

  return defaultClient?.id || null;
}

/**
 * GET handler - Returns webhook configuration info
 */
export async function GET() {
  return NextResponse.json({
    name: "BookedSolid AI - Vapi.ai Webhook",
    version: "1.0.0",
    events: ["assistant-request", "call-start", "call-end", "function-call"],
    status: "active",
  });
}
