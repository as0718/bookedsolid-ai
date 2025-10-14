# Retell.ai Webhook Integration Setup

This guide explains how to set up and test the Retell.ai webhook integration for the BookedSolid AI dashboard.

## Table of Contents
1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The Retell.ai webhook integration receives real-time call events from Retell.ai and stores them in your BookedSolid AI dashboard.

### Supported Events
- **call_started** - Call initiation (creates initial call record)
- **call_ended** - Call completion (updates with transcript, recording, outcome)
- **call_analyzed** - AI analysis results (updates with appointment details)

### Features
- ✅ Webhook signature verification (HMAC-SHA256)
- ✅ Automatic data mapping to CallRecord schema
- ✅ Intelligent outcome detection (booked, info, voicemail, spam)
- ✅ Appointment detail extraction from transcripts
- ✅ Real-time dashboard updates
- ✅ Comprehensive error handling and logging

---

## Setup Instructions

### Step 1: Configure Environment Variables

Add your Retell.ai webhook secret to `.env`:

```bash
RETELL_WEBHOOK_SECRET="your_actual_webhook_secret_from_retell"
```

To get your webhook secret:
1. Go to [Retell.ai Dashboard](https://dashboard.retellai.com)
2. Navigate to **Settings > Webhooks**
3. Copy your webhook secret

### Step 2: Update Database Schema

Run the Prisma migration to add Retell.ai fields:

```bash
npx prisma migrate dev --name add_retell_webhook_fields
```

This adds the following fields to CallRecord:
- `retellCallId` - Unique identifier from Retell
- `agentId` - Retell agent ID
- `transcript` - Full call transcript
- `transcriptObject` - Structured transcript segments
- `recordingUrl` - Link to call recording
- And more...

### Step 3: Configure Retell.ai Dashboard

1. Go to [Retell.ai Webhooks Settings](https://dashboard.retellai.com/settings/webhooks)
2. Add your webhook URL:
   - **Local testing**: Use ngrok (see testing section)
   - **Production**: `https://yourdomain.com/api/webhooks/retell`
3. Select events to send:
   - ✅ call_started
   - ✅ call_ended
   - ✅ call_analyzed
4. Save and test the connection

### Step 4: Map Retell Agents to Clients

Add the Retell agent ID to your client settings in the database.

**Option A: Via Prisma Studio**
```bash
npx prisma studio
```

Navigate to Client > Settings (JSON field) and add:
```json
{
  "retellAgentId": "agent_xxxxxxxxxxxx",
  ...other settings
}
```

**Option B: Direct SQL**
```sql
UPDATE "Client"
SET settings = jsonb_set(
  settings::jsonb,
  '{retellAgentId}',
  '"agent_xxxxxxxxxxxx"'
)
WHERE id = 'your_client_id';
```

**Option C: Pass client_id in webhook metadata**

When making calls via Retell API, include:
```json
{
  "metadata": {
    "client_id": "your_bookedsolid_client_id"
  }
}
```

---

## Configuration

### Data Mapping

The webhook automatically maps Retell.ai data to your CallRecord schema:

| Retell Field | CallRecord Field | Notes |
|--------------|------------------|-------|
| `call_id` | `retellCallId` | Unique identifier |
| `from_number` | `callerPhone` | For inbound calls |
| `to_number` | `toNumber` | Destination number |
| `start_timestamp` | `startTimestamp` | Unix timestamp (ms) |
| `end_timestamp` | `endTimestamp` | Unix timestamp (ms) |
| `transcript` | `transcript` | Full text transcript |
| `transcript_object` | `transcriptObject` | Structured segments |
| `recording_url` | `recordingUrl` | Link to recording |
| `public_log_url` | `transcriptUrl` | Link to public log |

### Outcome Detection

The system automatically determines call outcomes based on:

1. **Booked** - Transcript contains keywords: "appointment", "booked", "scheduled"
2. **Voicemail** - Transcript or disconnection reason mentions voicemail
3. **Transferred** - Call was transferred to another line
4. **Spam** - Very short calls (< 10 seconds)
5. **Info** - General information requests (default)

### Appointment Extraction

Appointment details are extracted from:
1. Webhook metadata (`metadata.appointment`)
2. LLM dynamic variables (`retell_llm_dynamic_variables.appointment`)
3. Tool calls in transcript (e.g., `book_appointment` function)

---

## Testing

### Local Testing with ngrok

1. **Install ngrok** (if not already installed):
   ```bash
   brew install ngrok
   # or
   npm install -g ngrok
   ```

2. **Start your Next.js dev server**:
   ```bash
   npm run dev
   ```

3. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

4. **Copy the forwarding URL** (e.g., `https://abc123.ngrok.io`)

5. **Configure Retell.ai webhook**:
   - URL: `https://abc123.ngrok.io/api/webhooks/retell`
   - Events: call_started, call_ended, call_analyzed

### Testing with curl

```bash
# Test webhook endpoint (returns config)
curl https://yourdomain.com/api/webhooks/retell

# Test with sample payload (will fail signature check)
curl -X POST https://yourdomain.com/api/webhooks/retell \
  -H "Content-Type: application/json" \
  -H "x-retell-signature: test_signature" \
  -d '{
    "event": "call_ended",
    "call": {
      "call_id": "test_call_123",
      "agent_id": "agent_test",
      "call_type": "phone_call",
      "from_number": "+15555551234",
      "to_number": "+15555555678",
      "direction": "inbound",
      "call_status": "ended",
      "start_timestamp": 1704067200000,
      "end_timestamp": 1704067500000,
      "transcript": "Customer called to book an appointment for tomorrow at 2pm"
    }
  }'
```

### Sample Webhook Payloads

**call_started**
```json
{
  "event": "call_started",
  "call": {
    "call_id": "call_abc123xyz",
    "agent_id": "agent_456def",
    "call_type": "phone_call",
    "from_number": "+15555551234",
    "to_number": "+15555555678",
    "direction": "inbound",
    "call_status": "ongoing",
    "start_timestamp": 1704067200000,
    "metadata": {
      "client_id": "client_xyz789"
    }
  }
}
```

**call_ended**
```json
{
  "event": "call_ended",
  "call": {
    "call_id": "call_abc123xyz",
    "agent_id": "agent_456def",
    "call_type": "phone_call",
    "from_number": "+15555551234",
    "to_number": "+15555555678",
    "direction": "inbound",
    "call_status": "ended",
    "start_timestamp": 1704067200000,
    "end_timestamp": 1704067500000,
    "disconnection_reason": "user_hangup",
    "transcript": "Hi, I'd like to book an appointment for a haircut tomorrow at 2pm. Great, I've scheduled you for tomorrow at 2pm with Sarah. See you then!",
    "transcript_object": [
      {
        "role": "user",
        "content": "Hi, I'd like to book an appointment for a haircut tomorrow at 2pm.",
        "timestamp": 1704067210000
      },
      {
        "role": "agent",
        "content": "Great, I've scheduled you for tomorrow at 2pm with Sarah. See you then!",
        "timestamp": 1704067220000
      }
    ],
    "recording_url": "https://storage.retellai.com/recordings/call_abc123xyz.mp3",
    "public_log_url": "https://app.retellai.com/logs/call_abc123xyz",
    "metadata": {
      "client_id": "client_xyz789"
    },
    "retell_llm_dynamic_variables": {
      "customer_name": "John Smith"
    }
  }
}
```

---

## Monitoring

### Webhook Logs

Check your Next.js console for webhook logs:

```
[Retell Webhook] Received webhook request
[Retell Webhook] Event: call_ended
[Retell Webhook] Call ID: call_abc123xyz
[Retell Webhook] Sanitized payload: {...}
[Retell Webhook] Handling call_ended
[Retell Webhook] Updated call record: rec_xyz123
[Retell Webhook] Processed in 145ms
```

### Database Queries

Check recent webhook events:

```sql
-- Recent calls from Retell
SELECT
  id,
  "retellCallId",
  "callerName",
  "callerPhone",
  outcome,
  duration,
  "createdAt"
FROM "CallRecord"
WHERE "retellCallId" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;

-- Calls by outcome
SELECT
  outcome,
  COUNT(*) as count,
  AVG(duration) as avg_duration
FROM "CallRecord"
WHERE "retellCallId" IS NOT NULL
GROUP BY outcome;
```

### Retell Dashboard

Monitor webhook delivery in Retell:
1. Go to [Retell.ai Dashboard](https://dashboard.retellai.com)
2. Navigate to **Webhooks > Activity**
3. View success/failure rates and response times

---

## Troubleshooting

### Error: "Invalid signature"

**Cause**: Webhook secret mismatch or signature verification failed

**Solution**:
1. Verify `RETELL_WEBHOOK_SECRET` in `.env` matches Retell dashboard
2. Ensure webhook secret hasn't been rotated in Retell
3. Check for trailing spaces or quotes in environment variable

### Error: "Client not found for agent"

**Cause**: Agent ID not mapped to any BookedSolid client

**Solution**:
1. Add `retellAgentId` to client settings (see Step 4)
2. Or pass `client_id` in webhook metadata
3. For testing, the webhook falls back to the first active client

### Error: "Missing signature"

**Cause**: Webhook request missing `x-retell-signature` header

**Solution**:
1. Ensure webhook is coming from Retell.ai (not a test request)
2. Check Retell webhook configuration is correct
3. For testing with curl, add proper signature header

### Error: "Invalid payload"

**Cause**: Webhook payload doesn't match expected structure

**Solution**:
1. Check Retell.ai API version (v1 vs v2)
2. Verify payload has required fields: `event`, `call.call_id`
3. Review webhook logs for full payload structure

### No calls appearing in dashboard

**Checklist**:
- [ ] Database connection working
- [ ] Prisma migration applied
- [ ] Webhook secret configured correctly
- [ ] Retell webhook URL pointing to correct endpoint
- [ ] Agent ID mapped to client
- [ ] Check webhook logs for errors

### Signature verification failing consistently

**Debug Steps**:
```bash
# Test webhook endpoint is reachable
curl https://yourdomain.com/api/webhooks/retell

# Check environment variables are loaded
npm run dev 2>&1 | grep RETELL

# Test direct from Retell dashboard
# Go to Webhooks > Test Connection
```

---

## Security Best Practices

1. **Never commit webhook secrets** - Use `.env` files (already in `.gitignore`)
2. **Always verify signatures** - Don't disable signature verification in production
3. **Use HTTPS** - Webhook endpoint must use HTTPS (ngrok provides this)
4. **Rate limiting** - Consider adding rate limits for production
5. **Audit logs** - Keep logs of all webhook activity for debugging

---

## Production Deployment

### Vercel / Netlify / AWS

1. Add `RETELL_WEBHOOK_SECRET` to environment variables
2. Deploy your application
3. Update Retell webhook URL to production domain
4. Test with a real call
5. Monitor logs and database for successful webhook processing

### Domain Verification

Retell may require domain verification. Add TXT record to DNS:
```
_retell-verification=your_verification_code
```

---

## Support

For issues related to:
- **Retell.ai webhooks**: [Retell Documentation](https://docs.retellai.com/features/webhook-overview)
- **BookedSolid AI**: Contact your technical team
- **Database schema**: See `prisma/schema.prisma`

---

## Changelog

### v1.0.0 (2025-01-14)
- Initial webhook integration
- Support for call_started, call_ended, call_analyzed events
- Automatic outcome detection
- Appointment extraction from transcripts
- HMAC-SHA256 signature verification
