# Retell.ai Integration Summary

## What Was Built

A complete, production-ready Retell.ai webhook integration for the BookedSolid AI dashboard. The system receives real-time call events from Retell.ai, processes them securely, and stores them in your PostgreSQL database.

---

## Files Created

### 1. **Type Definitions** - `lib/types/retell.ts`
- Complete TypeScript types for Retell.ai webhook payloads
- Helper functions for outcome detection and data extraction
- Appointment detail extraction from transcripts

### 2. **Webhook Security** - `lib/webhook-verification.ts`
- HMAC-SHA256 signature verification
- Timing-safe comparison to prevent timing attacks
- Payload validation and sanitization

### 3. **Webhook Endpoint** - `app/api/webhooks/retell/route.ts`
- Handles `call_started`, `call_ended`, `call_analyzed` events
- Automatic data mapping to CallRecord schema
- Client identification via agent_id or metadata
- Comprehensive error handling and logging

### 4. **Test Suite** - `scripts/test-webhook.ts`
- Simulates Retell.ai webhooks locally
- Tests all event types with realistic payloads
- Proper signature generation for testing

### 5. **Documentation** - `RETELL_WEBHOOK_SETUP.md`
- Complete setup instructions
- Configuration guide
- Testing procedures
- Troubleshooting section

---

## Database Schema Updates

### New CallRecord Fields

```prisma
model CallRecord {
  // ... existing fields ...

  // Retell.ai specific fields
  retellCallId       String?  @unique
  agentId            String?
  callType           String?
  toNumber           String?
  direction          String?
  callStatus         String?
  startTimestamp     BigInt?
  endTimestamp       BigInt?
  disconnectionReason String?
  transcript         String?  @db.Text
  transcriptObject   Json?
  transcriptWithToolCalls Json?
  metadata           Json?
  llmDynamicVariables Json?
  optOutSensitiveData Boolean @default(false)
}
```

### To Apply

```bash
npx prisma migrate dev --name add_retell_webhook_fields
```

---

## Configuration Required

### 1. Environment Variables

Add to `.env`:

```bash
RETELL_WEBHOOK_SECRET="your_secret_from_retell_dashboard"
```

Get this from: https://dashboard.retellai.com/settings/webhooks

### 2. Retell.ai Dashboard

Configure webhook in Retell:
- **URL**: `https://yourdomain.com/api/webhooks/retell`
- **Events**: call_started, call_ended, call_analyzed
- **Secret**: Use the same value as RETELL_WEBHOOK_SECRET

### 3. Client-Agent Mapping

Map Retell agents to your clients using one of these methods:

**Option A**: Add to client settings (recommended)
```sql
UPDATE "Client"
SET settings = jsonb_set(
  settings::jsonb,
  '{retellAgentId}',
  '"agent_xxxxxxxxxxxx"'
)
WHERE id = 'your_client_id';
```

**Option B**: Pass in webhook metadata
```javascript
// When creating calls via Retell API
{
  "metadata": {
    "client_id": "your_bookedsolid_client_id"
  }
}
```

---

## Data Flow

### 1. Call Started
```
Retell.ai → Webhook → Create CallRecord
                     ↓
                 Dashboard shows "in progress"
```

### 2. Call Ended
```
Retell.ai → Webhook → Update CallRecord
                     ↓
                 - Add transcript
                 - Detect outcome
                 - Extract appointments
                 - Add recording link
                     ↓
                 Dashboard shows complete call
```

### 3. Call Analyzed
```
Retell.ai → Webhook → Update CallRecord
                     ↓
                 - Refine outcome
                 - Add analysis data
                     ↓
                 Dashboard shows final analysis
```

---

## Testing

### Local Testing (3 steps)

**1. Start your dev server:**
```bash
npm run dev
```

**2. Start ngrok tunnel:**
```bash
ngrok http 3000
```

**3. Run test script:**
```bash
npm run test:webhook
```

This will simulate all three webhook events and verify they're processed correctly.

### Verify Database

```sql
SELECT * FROM "CallRecord" WHERE "retellCallId" IS NOT NULL;
```

---

## Key Features

### Security
- ✅ HMAC-SHA256 signature verification
- ✅ Payload validation
- ✅ Sanitized logging (no PII exposure)
- ✅ Environment-based secrets

### Data Mapping
- ✅ Automatic outcome detection (booked, info, voicemail, spam)
- ✅ Appointment extraction from transcripts
- ✅ Customer name extraction
- ✅ Call duration calculation

### Error Handling
- ✅ Invalid signature rejection
- ✅ Malformed payload validation
- ✅ Client identification fallbacks
- ✅ Comprehensive error logging

### Dashboard Integration
- ✅ Seamless CallRecord updates
- ✅ Real-time metrics via existing API
- ✅ Recording and transcript links
- ✅ Appointment detail display

---

## Outcome Detection Logic

The system automatically determines call outcomes:

| Outcome | Detection Logic |
|---------|-----------------|
| **booked** | Transcript contains: "appointment", "booked", "scheduled" |
| **voicemail** | Transcript or disconnection mentions voicemail |
| **transferred** | Call was transferred |
| **spam** | Very short calls (< 10 seconds) |
| **info** | Default for general inquiries |

You can customize this logic in `lib/types/retell.ts:determineCallOutcome()`

---

## Appointment Extraction

Appointments are extracted from:

1. **Metadata** - `metadata.appointment`
2. **Dynamic Variables** - `retell_llm_dynamic_variables.appointment`
3. **Tool Calls** - Any tool named "book_appointment" or similar

Example extracted data:
```json
{
  "service": "haircut",
  "date": "2025-01-15",
  "time": "14:00",
  "stylist": "Sarah",
  "estimatedValue": 45
}
```

---

## Dashboard Updates

### Existing API Already Works

Your existing `/api/calls` endpoint will automatically return the new Retell data:

```typescript
// app/dashboard/page.tsx already fetches this
const response = await fetch('/api/calls');
const { calls } = await response.json();

// New fields are now available:
calls.forEach(call => {
  console.log(call.transcript);        // Full transcript
  console.log(call.recordingUrl);      // Recording link
  console.log(call.transcriptUrl);     // Public log link
  console.log(call.retellCallId);      // Retell call ID
});
```

### No Dashboard Changes Needed!

The integration is backward compatible. Existing dashboard components continue to work without modifications.

### Optional Enhancements

If you want to display new Retell data:

**Show transcript:**
```tsx
{call.transcript && (
  <div className="mt-4">
    <h4 className="font-semibold">Transcript</h4>
    <p className="text-sm text-muted-foreground">{call.transcript}</p>
  </div>
)}
```

**Show recording link:**
```tsx
{call.recordingUrl && (
  <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">
    Listen to Recording
  </a>
)}
```

---

## Production Checklist

Before deploying to production:

- [ ] Database migration applied
- [ ] `RETELL_WEBHOOK_SECRET` set in production environment
- [ ] Webhook URL configured in Retell dashboard
- [ ] All clients have `retellAgentId` in settings
- [ ] HTTPS enabled (required by Retell)
- [ ] Test with real call
- [ ] Monitor logs for errors
- [ ] Verify data appears in dashboard

---

## Monitoring

### Webhook Logs

Check your server logs for:
```
[Retell Webhook] Received webhook request
[Retell Webhook] Event: call_ended
[Retell Webhook] Call ID: call_abc123
[Retell Webhook] Updated call record: rec_xyz789
[Retell Webhook] Processed in 145ms
```

### Database Metrics

```sql
-- Call volume by outcome
SELECT outcome, COUNT(*) as count
FROM "CallRecord"
WHERE "retellCallId" IS NOT NULL
GROUP BY outcome;

-- Average call duration
SELECT AVG(duration) as avg_seconds
FROM "CallRecord"
WHERE "retellCallId" IS NOT NULL;

-- Booking conversion rate
SELECT
  COUNT(*) FILTER (WHERE outcome = 'booked') * 100.0 / COUNT(*) as booking_rate
FROM "CallRecord"
WHERE "retellCallId" IS NOT NULL;
```

---

## Next Steps

### Immediate (Required)
1. Run database migration
2. Add `RETELL_WEBHOOK_SECRET` to .env
3. Configure webhook in Retell dashboard
4. Map agents to clients
5. Test with `npm run test:webhook`

### Short-term (Recommended)
1. Test with real Retell call
2. Verify data in dashboard
3. Set up monitoring/alerts
4. Document your agent-to-client mappings

### Long-term (Optional)
1. Add real-time dashboard updates (WebSocket/SSE)
2. Create analytics dashboard for call metrics
3. Add webhook retry logic
4. Implement rate limiting

---

## Support & Documentation

- **Retell Docs**: https://docs.retellai.com/features/webhook-overview
- **Setup Guide**: See `RETELL_WEBHOOK_SETUP.md`
- **Test Script**: `npm run test:webhook`
- **Database Schema**: `prisma/schema.prisma`

---

## Technical Decisions

### Why These Approaches?

**HMAC-SHA256 Signature Verification**
- Industry standard for webhook security
- Prevents replay attacks
- Ensures webhooks are from Retell

**BigInt for Timestamps**
- JavaScript's Number is unsafe for large Unix timestamps
- PostgreSQL BIGINT provides full precision
- Handles millisecond timestamps from Retell

**JSON Fields for Flexible Data**
- Transcript objects vary by call
- Tool calls are dynamic
- Metadata is client-specific
- JSON provides flexibility without schema changes

**Client Identification Strategies**
- Primary: Agent ID in client settings
- Fallback: Metadata client_id
- Test fallback: First active client
- Flexible for different deployment scenarios

**Outcome Detection Heuristics**
- Simple keyword matching for MVP
- Can be enhanced with NLP later
- Transcript-based (most reliable)
- Duration-based for spam detection

---

## Performance Considerations

- **Database indexes** on retellCallId, callStatus, direction for fast queries
- **Unique constraint** on retellCallId prevents duplicates
- **Upsert logic** handles both call_started and call_ended gracefully
- **Sanitized logging** prevents massive log files from long transcripts
- **Timing-safe comparison** prevents timing attacks on signatures

---

## Architecture Diagram

```
┌──────────────┐
│  Retell.ai   │
│   Platform   │
└──────┬───────┘
       │ HTTPS POST
       │ + signature
       ▼
┌──────────────────────────────┐
│ /api/webhooks/retell         │
│                              │
│ 1. Verify signature          │
│ 2. Validate payload          │
│ 3. Map to CallRecord         │
│ 4. Store in PostgreSQL       │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  PostgreSQL Database         │
│  CallRecord table            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  /api/calls endpoint         │
│  (existing, no changes)      │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Dashboard UI                │
│  (existing, no changes)      │
└──────────────────────────────┘
```

---

## Version History

**v1.0.0** (2025-01-14)
- Initial release
- Full webhook integration
- All event types supported
- Production ready
