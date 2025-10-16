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
    // 1. Parse payload first (needed for verification)
    const rawBody = await request.text();
    const payload: VapiWebhookPayload = JSON.parse(rawBody);

    // 2. Verify webhook signature (REQUIRED for production)
    const signature = request.headers.get("x-vapi-signature");
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Vapi Webhook] VAPI_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error("[Vapi Webhook] Missing X-Vapi-Signature header");
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 401 }
      );
    }

    // Verify the signature matches the webhook secret
    if (signature !== webhookSecret) {
      console.error("[Vapi Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // 3. Validate payload structure
    if (!payload.type) {
      console.error("[Vapi Webhook] Missing event type in payload");
      return NextResponse.json(
        { error: "Invalid payload: missing type" },
        { status: 400 }
      );
    }

    console.log("[Vapi Webhook] Event type:", payload.type);

    // 4. Process webhook based on event type
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
 * Maps call content to standardized outcomes for analytics
 */
function determineVapiOutcome(transcript?: string, summary?: string): "booked" | "info" | "voicemail" | "transferred" | "spam" | "unknown" {
  const text = `${transcript || ""} ${summary || ""}`.toLowerCase();

  // Priority 1: Booked appointments (highest value)
  if (text.match(/\b(appointment|booking|reservation)\b.*\b(booked|scheduled|confirmed|set up)\b/i) ||
      text.match(/\b(booked|scheduled|confirmed|set up)\b.*\b(appointment|booking|reservation)\b/i)) {
    return "booked";
  }

  // Priority 2: Transferred calls
  if (text.match(/\b(transfer|forwarded|connected to|routing to)\b/i)) {
    return "transferred";
  }

  // Priority 3: Voicemail
  if (text.match(/\b(voicemail|left a message|leave a message|after the beep)\b/i)) {
    return "voicemail";
  }

  // Priority 4: Spam detection
  if (text.match(/\b(spam|robocall|telemarketer|automated call|press 1)\b/i)) {
    return "spam";
  }

  // Priority 5: Information requests
  if (text.match(/\b(hours|price|pricing|location|services|question|inquiry|information)\b/i)) {
    return "info";
  }

  // Default: Unknown outcome
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

  // Strategy 3: No fallback in production - require proper configuration
  console.error(
    "[Vapi Webhook] No client found for assistant_id:",
    assistantId,
    "- Please configure vapiAssistantId in client settings or include client_id in metadata"
  );

  return null;
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
