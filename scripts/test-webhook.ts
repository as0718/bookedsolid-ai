/**
 * Retell.ai Webhook Testing Script
 *
 * Usage:
 *   npm run test:webhook
 *   or
 *   npx ts-node scripts/test-webhook.ts
 *
 * This script simulates a Retell.ai webhook and tests your endpoint locally
 */

import { createHmac } from "crypto";

const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3000/api/webhooks/retell";
const WEBHOOK_SECRET = process.env.RETELL_WEBHOOK_SECRET || "test_secret";

/**
 * Create HMAC signature for webhook payload
 */
function createSignature(payload: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  return hmac.digest("hex");
}

/**
 * Send test webhook
 */
async function sendTestWebhook(eventType: "call_started" | "call_ended" | "call_analyzed") {
  const payload = generateTestPayload(eventType);
  const payloadString = JSON.stringify(payload);
  const signature = createSignature(payloadString, WEBHOOK_SECRET);

  console.log("\n=== Testing Retell.ai Webhook ===");
  console.log("Event Type:", eventType);
  console.log("Webhook URL:", WEBHOOK_URL);
  console.log("Call ID:", payload.call.call_id);
  console.log("\n");

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-retell-signature": signature,
      },
      body: payloadString,
    });

    const responseData = await response.json();

    console.log("Status:", response.status, response.statusText);
    console.log("Response:", JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log("\n✅ Webhook test successful!");
    } else {
      console.log("\n❌ Webhook test failed!");
    }

    return response.ok;
  } catch (error) {
    console.error("\n❌ Error sending webhook:", error);
    return false;
  }
}

/**
 * Generate test payload for different event types
 */
function generateTestPayload(eventType: "call_started" | "call_ended" | "call_analyzed") {
  const baseCall = {
    call_id: `test_call_${Date.now()}`,
    agent_id: "agent_test123",
    call_type: "phone_call" as const,
    from_number: "+15555551234",
    to_number: "+15555555678",
    direction: "inbound" as const,
    start_timestamp: Date.now() - 300000, // 5 minutes ago
    metadata: {
      client_id: "test_client_id",
      source: "test_script",
    },
    retell_llm_dynamic_variables: {
      customer_name: "John Smith",
    },
  };

  switch (eventType) {
    case "call_started":
      return {
        event: "call_started",
        call: {
          ...baseCall,
          call_status: "ongoing",
        },
      };

    case "call_ended":
      return {
        event: "call_ended",
        call: {
          ...baseCall,
          call_status: "ended",
          end_timestamp: Date.now(),
          disconnection_reason: "user_hangup",
          transcript: "Hi, I'd like to book an appointment for a haircut tomorrow at 2pm. Great, I've scheduled you for tomorrow at 2pm with Sarah. Your appointment is confirmed!",
          transcript_object: [
            {
              role: "user",
              content: "Hi, I'd like to book an appointment for a haircut tomorrow at 2pm.",
              timestamp: Date.now() - 280000,
            },
            {
              role: "agent",
              content: "Great, I've scheduled you for tomorrow at 2pm with Sarah. Your appointment is confirmed!",
              timestamp: Date.now() - 270000,
            },
          ],
          transcript_with_tool_calls: [
            {
              role: "user",
              content: "Hi, I'd like to book an appointment for a haircut tomorrow at 2pm.",
              timestamp: Date.now() - 280000,
            },
            {
              role: "agent",
              content: "Let me check availability and book that for you.",
              timestamp: Date.now() - 275000,
              tool_calls: [
                {
                  name: "book_appointment",
                  arguments: {
                    service: "haircut",
                    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
                    time: "14:00",
                    stylist: "Sarah",
                    customer: "John Smith",
                  },
                  result: {
                    success: true,
                    appointment_id: "apt_test123",
                  },
                },
              ],
            },
            {
              role: "agent",
              content: "Great, I've scheduled you for tomorrow at 2pm with Sarah. Your appointment is confirmed!",
              timestamp: Date.now() - 270000,
            },
          ],
          recording_url: "https://storage.retellai.com/recordings/test_call.mp3",
          public_log_url: "https://app.retellai.com/logs/test_call",
          opt_out_sensitive_data_storage: false,
        },
      };

    case "call_analyzed":
      return {
        event: "call_analyzed",
        call: {
          ...baseCall,
          call_status: "ended",
          end_timestamp: Date.now(),
          metadata: {
            ...baseCall.metadata,
            appointment: {
              service: "haircut",
              date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
              time: "14:00",
              stylist: "Sarah",
              estimatedValue: 45,
            },
          },
        },
      };
  }
}

/**
 * Run all webhook tests
 */
async function runAllTests() {
  console.log("Starting Retell.ai Webhook Tests...\n");
  console.log("Make sure your Next.js server is running on localhost:3000");
  console.log("And that RETELL_WEBHOOK_SECRET is set correctly\n");

  const tests = [
    { name: "Call Started", type: "call_started" as const },
    { name: "Call Ended", type: "call_ended" as const },
    { name: "Call Analyzed", type: "call_analyzed" as const },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`Test: ${test.name}`);
    console.log(`${"=".repeat(50)}`);

    const success = await sendTestWebhook(test.type);

    if (success) {
      passed++;
    } else {
      failed++;
    }

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("Test Summary");
  console.log(`${"=".repeat(50)}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`${"=".repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
