/**
 * Retell.ai Webhook Endpoint
 * Receives and processes call events from Retell.ai
 *
 * Webhook URL: https://yourdomain.com/api/webhooks/retell
 *
 * Events handled:
 * - call_started: Call initiation
 * - call_ended: Call completion with transcript
 * - call_analyzed: AI analysis results
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRetellSignature,
  validateWebhookPayload,
  sanitizePayloadForLogging,
} from "@/lib/webhook-verification";
import {
  RetellWebhookPayload,
  determineCallOutcome,
  extractCallerInfo,
  calculateDuration,
  extractAppointmentDetails,
} from "@/lib/types/retell";

/**
 * POST handler for Retell.ai webhooks
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Retell Webhook] Received webhook request");

  try {
    // 1. Read raw body for signature verification
    const rawBody = await request.text();

    // 2. Verify webhook signature
    const signature = request.headers.get("x-retell-signature");
    const webhookSecret = process.env.RETELL_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Retell Webhook] RETELL_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error("[Retell Webhook] Missing signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    const isValidSignature = verifyRetellSignature(rawBody, signature, webhookSecret);

    if (!isValidSignature) {
      console.error("[Retell Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // 3. Parse and validate payload
    const payload: unknown = JSON.parse(rawBody);

    if (!validateWebhookPayload(payload)) {
      console.error("[Retell Webhook] Invalid payload structure");
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const webhookPayload = payload as unknown as RetellWebhookPayload;

    console.log("[Retell Webhook] Event:", webhookPayload.event);
    console.log("[Retell Webhook] Call ID:", webhookPayload.call.call_id);
    console.log(
      "[Retell Webhook] Sanitized payload:",
      JSON.stringify(sanitizePayloadForLogging(webhookPayload as unknown as Record<string, unknown>), null, 2)
    );

    // 4. Process webhook based on event type
    const result = await processWebhookEvent(webhookPayload);

    const duration = Date.now() - startTime;
    console.log(`[Retell Webhook] Processed in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        event: webhookPayload.event,
        call_id: webhookPayload.call.call_id,
        processed_at: new Date().toISOString(),
        ...result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Retell Webhook] Error processing webhook:", error);

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
 * Process webhook event based on type
 */
async function processWebhookEvent(payload: RetellWebhookPayload) {
  const { event, call } = payload;

  switch (event) {
    case "call_started":
      return await handleCallStarted(call);

    case "call_ended":
      return await handleCallEnded(call);

    case "call_analyzed":
      return await handleCallAnalyzed(call);

    default:
      console.warn(`[Retell Webhook] Unknown event type: ${event}`);
      return { warning: "Unknown event type" };
  }
}

/**
 * Handle call_started event
 * Creates initial call record
 */
async function handleCallStarted(call: RetellWebhookPayload["call"]) {
  console.log("[Retell Webhook] Handling call_started");

  const { name, phone } = extractCallerInfo(call);

  // Find client by agent_id (you'll need to map agent IDs to clients)
  // For now, we'll use a default client or lookup by metadata
  const clientId = await findClientByAgentId(call.agent_id, call.metadata);

  if (!clientId) {
    console.error("[Retell Webhook] Could not determine client for agent:", call.agent_id);
    throw new Error("Client not found for agent");
  }

  // Create initial call record
  const callRecord = await prisma.callRecord.create({
    data: {
      clientId,
      retellCallId: call.call_id,
      agentId: call.agent_id,
      timestamp: new Date(call.start_timestamp),
      callerName: name,
      callerPhone: phone,
      duration: 0, // Will be updated on call_ended
      outcome: "unknown", // Will be determined on call_ended
      notes: "Call in progress",
      callType: call.call_type,
      toNumber: call.to_number,
      direction: call.direction,
      callStatus: call.call_status,
      startTimestamp: BigInt(call.start_timestamp),
      metadata: (call.metadata || {}) as Record<string, string | number | boolean>,
      llmDynamicVariables: (call.retell_llm_dynamic_variables || {}) as Record<string, string | number | boolean>,
      optOutSensitiveData: call.opt_out_sensitive_data_storage || false,
    },
  });

  console.log("[Retell Webhook] Created call record:", callRecord.id);

  return { call_record_id: callRecord.id, action: "created" };
}

/**
 * Handle call_ended event
 * Updates call record with final data
 */
async function handleCallEnded(call: RetellWebhookPayload["call"]) {
  console.log("[Retell Webhook] Handling call_ended");

  const { name, phone } = extractCallerInfo(call);
  const duration = calculateDuration(call);
  const outcome = determineCallOutcome(call);
  const appointmentDetails = extractAppointmentDetails(call);

  // Find client by agent_id
  const clientId = await findClientByAgentId(call.agent_id, call.metadata);

  if (!clientId) {
    console.error("[Retell Webhook] Could not determine client for agent:", call.agent_id);
    throw new Error("Client not found for agent");
  }

  // Check if call record already exists
  const existingRecord = await prisma.callRecord.findUnique({
    where: { retellCallId: call.call_id },
  });

  let recordId: string;
  let action: string;

  if (existingRecord) {
    // Update existing record
    const updatedRecord = await prisma.callRecord.update({
      where: { retellCallId: call.call_id },
      data: {
        callerName: name,
        callerPhone: phone,
        duration,
        outcome,
        notes: call.transcript || "No transcript available",
        recordingUrl: call.recording_url,
        transcriptUrl: call.public_log_url,
        callStatus: call.call_status,
        endTimestamp: call.end_timestamp ? BigInt(call.end_timestamp) : null,
        disconnectionReason: call.disconnection_reason,
        transcript: call.transcript,
        transcriptObject: (call.transcript_object || []) as unknown as Record<string, string | number | boolean>[],
        transcriptWithToolCalls: (call.transcript_with_tool_calls || []) as unknown as Record<string, string | number | boolean>[],
        appointmentDetails: appointmentDetails ? (appointmentDetails as unknown as Record<string, string | number | boolean>) : undefined,
        updatedAt: new Date(),
      },
    });

    recordId = updatedRecord.id;
    action = "updated";
    console.log("[Retell Webhook] Updated call record:", updatedRecord.id);
  } else {
    // Create new record (call_started might have been missed)
    const newRecord = await prisma.callRecord.create({
      data: {
        clientId,
        retellCallId: call.call_id,
        agentId: call.agent_id,
        timestamp: new Date(call.start_timestamp),
        callerName: name,
        callerPhone: phone,
        duration,
        outcome,
        notes: call.transcript || "No transcript available",
        recordingUrl: call.recording_url,
        transcriptUrl: call.public_log_url,
        callType: call.call_type,
        toNumber: call.to_number,
        direction: call.direction,
        callStatus: call.call_status,
        startTimestamp: BigInt(call.start_timestamp),
        endTimestamp: call.end_timestamp ? BigInt(call.end_timestamp) : null,
        disconnectionReason: call.disconnection_reason,
        transcript: call.transcript,
        transcriptObject: (call.transcript_object || []) as unknown as Record<string, string | number | boolean>[],
        transcriptWithToolCalls: (call.transcript_with_tool_calls || []) as unknown as Record<string, string | number | boolean>[],
        metadata: (call.metadata || {}) as Record<string, string | number | boolean>,
        llmDynamicVariables: (call.retell_llm_dynamic_variables || {}) as Record<string, string | number | boolean>,
        appointmentDetails: appointmentDetails ? (appointmentDetails as unknown as Record<string, string | number | boolean>) : undefined,
        optOutSensitiveData: call.opt_out_sensitive_data_storage || false,
      },
    });

    recordId = newRecord.id;
    action = "created";
    console.log("[Retell Webhook] Created call record:", newRecord.id);
  }

  // Update client billing with call minutes
  await updateClientBillingMinutes(clientId, duration);

  return { call_record_id: recordId, action, minutes_tracked: Math.ceil(duration / 60) };
}

/**
 * Handle call_analyzed event
 * Updates call record with AI analysis
 */
async function handleCallAnalyzed(call: RetellWebhookPayload["call"]) {
  console.log("[Retell Webhook] Handling call_analyzed");

  // Update call record with analysis data
  const existingRecord = await prisma.callRecord.findUnique({
    where: { retellCallId: call.call_id },
  });

  if (!existingRecord) {
    console.warn("[Retell Webhook] Call record not found for analysis:", call.call_id);
    return { warning: "Call record not found" };
  }

  // Re-determine outcome with analysis data
  const outcome = determineCallOutcome(call);
  const appointmentDetails = extractAppointmentDetails(call);

  const updatedRecord = await prisma.callRecord.update({
    where: { retellCallId: call.call_id },
    data: {
      outcome,
      appointmentDetails: appointmentDetails ? (appointmentDetails as unknown as Record<string, string | number | boolean>) : undefined,
      updatedAt: new Date(),
    },
  });

  console.log("[Retell Webhook] Updated call record with analysis:", updatedRecord.id);

  return { call_record_id: updatedRecord.id, action: "analyzed" };
}

/**
 * Update client billing minutes
 * Tracks call minutes and updates billing information
 */
async function updateClientBillingMinutes(clientId: string, durationSeconds: number) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      console.error("[Retell Webhook] Client not found for billing update:", clientId);
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
      `[Retell Webhook] Updated billing for client ${clientId}: +${callMinutes} minutes (total: ${newMinutesUsed})`
    );
  } catch (error) {
    console.error("[Retell Webhook] Error updating billing minutes:", error);
  }
}

/**
 * Find client by agent ID
 * Maps Retell agent IDs to BookedSolid clients
 */
async function findClientByAgentId(
  agentId: string,
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

  // Strategy 2: Look up by agent_id in client settings
  // (You'll need to add agent_id to client settings)
  const clients = await prisma.client.findMany({
    select: { id: true, settings: true },
  });

  for (const client of clients) {
    const settings = client.settings as Record<string, unknown>;

    if (settings.retellAgentId === agentId) {
      return client.id;
    }
  }

  // Strategy 3: Default to first active client (for testing)
  // Remove this in production!
  console.warn(
    "[Retell Webhook] Could not find client by agent_id, using default client"
  );

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
    name: "BookedSolid AI - Retell.ai Webhook",
    version: "1.0.0",
    events: ["call_started", "call_ended", "call_analyzed"],
    status: "active",
  });
}
