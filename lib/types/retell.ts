/**
 * Retell.ai Webhook Type Definitions
 * Documentation: https://docs.retellai.com/features/webhook-overview
 */

export type RetellEventType =
  | "call_started"
  | "call_ended"
  | "call_analyzed";

export type CallType = "phone_call" | "web_call";
export type CallDirection = "inbound" | "outbound";
export type CallStatus = "registered" | "ongoing" | "ended" | "error";

export interface TranscriptSegment {
  role: "agent" | "user";
  content: string;
  timestamp: number;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface TranscriptWithToolCalls extends TranscriptSegment {
  tool_calls?: ToolCall[];
}

export interface RetellCallObject {
  call_id: string;
  call_type: CallType;
  from_number: string;
  to_number: string;
  direction: CallDirection;
  agent_id: string;
  call_status: CallStatus;
  metadata?: Record<string, unknown>;
  retell_llm_dynamic_variables?: Record<string, unknown>;
  start_timestamp: number; // Unix timestamp in milliseconds
  end_timestamp?: number; // Unix timestamp in milliseconds
  disconnection_reason?: string;
  transcript?: string;
  transcript_object?: TranscriptSegment[];
  transcript_with_tool_calls?: TranscriptWithToolCalls[];
  recording_url?: string;
  public_log_url?: string;
  opt_out_sensitive_data_storage?: boolean;
}

export interface RetellWebhookPayload {
  event: RetellEventType;
  call: RetellCallObject;
}

/**
 * Outcome mapping from Retell data
 */
export type CallOutcome = "booked" | "info" | "voicemail" | "transferred" | "spam" | "unknown";

/**
 * Helper to determine call outcome from Retell data
 */
export function determineCallOutcome(call: RetellCallObject): CallOutcome {
  // Check transcript for booking keywords
  const transcript = call.transcript?.toLowerCase() || "";

  if (transcript.includes("appointment") || transcript.includes("booked") || transcript.includes("scheduled")) {
    return "booked";
  }

  if (transcript.includes("voicemail") || call.disconnection_reason?.includes("voicemail")) {
    return "voicemail";
  }

  if (call.disconnection_reason?.includes("transferred")) {
    return "transferred";
  }

  // Check for spam indicators
  if (call.duration && call.duration < 10) {
    return "spam";
  }

  // Default to info request
  return "info";
}

/**
 * Extract caller information from Retell call object
 */
export function extractCallerInfo(call: RetellCallObject): { name: string; phone: string } {
  const phone = call.direction === "inbound" ? call.from_number : call.to_number;

  // Try to get name from dynamic variables
  const name = (call.retell_llm_dynamic_variables?.customer_name as string) ||
               (call.metadata?.customer_name as string) ||
               "Unknown Caller";

  return { name, phone };
}

/**
 * Calculate call duration in seconds
 */
export function calculateDuration(call: RetellCallObject): number {
  if (!call.start_timestamp || !call.end_timestamp) {
    return 0;
  }

  return Math.floor((call.end_timestamp - call.start_timestamp) / 1000);
}

/**
 * Extract appointment details from transcript or metadata
 */
export function extractAppointmentDetails(call: RetellCallObject): Record<string, unknown> | null {
  // Check metadata first
  if (call.metadata?.appointment) {
    return call.metadata.appointment as Record<string, unknown>;
  }

  // Check dynamic variables
  if (call.retell_llm_dynamic_variables?.appointment) {
    return call.retell_llm_dynamic_variables.appointment as Record<string, unknown>;
  }

  // Check tool calls for booking actions
  if (call.transcript_with_tool_calls) {
    const bookingToolCall = call.transcript_with_tool_calls.find(
      segment => segment.tool_calls?.some(tool =>
        tool.name.toLowerCase().includes("book") ||
        tool.name.toLowerCase().includes("appointment")
      )
    );

    if (bookingToolCall?.tool_calls) {
      const bookingTool = bookingToolCall.tool_calls.find(tool =>
        tool.name.toLowerCase().includes("book") ||
        tool.name.toLowerCase().includes("appointment")
      );

      if (bookingTool?.arguments) {
        return bookingTool.arguments;
      }
    }
  }

  return null;
}
