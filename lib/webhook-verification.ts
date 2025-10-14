/**
 * Retell.ai Webhook Signature Verification
 * Ensures webhooks are authentic and from Retell.ai
 */

import { createHmac } from "crypto";

/**
 * Verify Retell.ai webhook signature
 * @param payload - Raw webhook payload string
 * @param signature - Signature from x-retell-signature header
 * @param secret - Webhook secret from Retell.ai dashboard
 * @returns true if signature is valid
 */
export function verifyRetellSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Retell uses HMAC-SHA256
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(signature, expectedSignature);
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks by comparing in constant time
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate webhook payload structure
 */
export function validateWebhookPayload(payload: unknown): payload is { event: string; call: Record<string, unknown> } {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const webhookPayload = payload as Record<string, unknown>;

  // Check required fields
  if (!webhookPayload.event || typeof webhookPayload.event !== "string") {
    return false;
  }

  if (!webhookPayload.call || typeof webhookPayload.call !== "object") {
    return false;
  }

  const call = webhookPayload.call as Record<string, unknown>;

  // Validate required call fields
  if (!call.call_id || typeof call.call_id !== "string") {
    return false;
  }

  return true;
}

/**
 * Sanitize webhook payload for logging
 * Removes sensitive data before logging
 */
export function sanitizePayloadForLogging(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...payload };

  // Remove sensitive fields
  if (sanitized.call && typeof sanitized.call === "object") {
    const call = { ...(sanitized.call as Record<string, unknown>) };

    // Mask phone numbers (show last 4 digits)
    if (call.from_number && typeof call.from_number === "string") {
      call.from_number = maskPhoneNumber(call.from_number);
    }

    if (call.to_number && typeof call.to_number === "string") {
      call.to_number = maskPhoneNumber(call.to_number);
    }

    // Remove full transcript (just show length)
    if (call.transcript && typeof call.transcript === "string") {
      call.transcript = `[TRANSCRIPT: ${call.transcript.length} characters]`;
    }

    sanitized.call = call;
  }

  return sanitized;
}

function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) {
    return "****";
  }
  return "****" + phone.slice(-4);
}
