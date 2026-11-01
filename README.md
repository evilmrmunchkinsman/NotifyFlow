# NotifyFlow

**Multi-channel notification infrastructure with intelligent failure observability.**

NotifyFlow is a backend service that lets you send transactional notifications across email, SMS, and webhooks through a single API — and tells you *why* things fail, not just *that* they failed.

---

## The Problem

Most notification services tell you a delivery failed. They don't tell you that 80 of your last 100 emails hard-bounced because your list has stale addresses, or that your SMS failures are clustering around a single carrier between 2–4am, or that your provider has been returning 429s for the last 15 minutes.

NotifyFlow fixes that. Every delivery event is tracked, patterns are detected automatically, and an AI layer explains what went wrong — in technical terms for engineers, or plain English for founders.

---

## Features

- **Multi-channel delivery** — email via Resend, SMS via Twilio, outbound webhooks
- **Async processing** — BullMQ + Redis queue with automatic retries and exponential backoff
- **Dead-letter queue** — permanently failed jobs are captured, not silently dropped
- **Full delivery audit trail** — every status change (accepted → delivered / bounced / failed) is logged as an immutable event
- **Failure pattern detection** — rule-based analysis across 6 failure categories
- **AI-powered explanations** — Claude API explains detected patterns in engineer, plain, or urgent mode
- **Multi-tenant workspace model** — scoped API keys per workspace, reusable notification templates
- **Provider callback handling** — Resend and Twilio webhooks update delivery status in real time

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Queue | BullMQ + Redis (Upstash) |
| Email | Resend API |
| SMS | Twilio API |
| AI | Anthropic Claude API |
| Auth | JWT + refresh token rotation |
| Testing | Jest + Supertest |
| Deployment | Render + Neon + Upstash |

---

## How It Works

### Sending a notification

```
POST /notifications/send
Authorization: Bearer <api_key>

{
  "channel": "email",
  "recipient": "user@example.com",
  "templateId": "welcome-email",
  "payload": { "name": "Rahul" }
}
```

The API validates the request, creates a `Notification` record (status: `pending`), and pushes a job to the BullMQ queue. Response is immediate — delivery happens asynchronously.

### Delivery flow

```
API receives request
  → Notification created in DB (status: pending)
  → Job pushed to BullMQ queue
  → Worker dequeues job
  → Template rendered with payload
  → Provider API called (Resend / Twilio)
  → DeliveryEvent logged: provider_accepted
  → Provider delivers to recipient
  → Provider calls webhook callback
  → DeliveryEvent logged: delivered / bounced / failed
  → Notification status updated
  → Pattern detector runs
  → AI explanation generated if pattern found
```

### Failure pattern detection

NotifyFlow continuously analyzes delivery events and detects:

| Pattern | Description |
|---------|-------------|
| `BOUNCE_CLUSTER` | Hard bounce rate exceeds threshold in a time window |
| `PROVIDER_OUTAGE` | Failure rate spikes across a single provider |
| `CARRIER_THROTTLE` | SMS undelivered rate spikes from a specific carrier |
| `TIME_BASED_FAILURE` | Failures cluster around the same time window repeatedly |
| `SEGMENT_FAILURE` | Failures concentrated in one recipient domain |
| `RATE_LIMIT_HIT` | Provider returning 429 errors |

### AI explanation modes

When a pattern is detected, query the AI layer:

```
GET /analytics/patterns?mode=engineer
```

**engineer** — technical root cause and specific fix  
**plain** — plain English for a non-technical founder  
**urgent** — one sentence problem, one sentence impact, one sentence fix

Example response (`BOUNCE_CLUSTER`, plain mode):
```json
{
  "pattern": "BOUNCE_CLUSTER",
  "severity": "high",
  "affectedCount": 83,
  "explanation": "A large number of your emails are being permanently rejected because the addresses don't exist. This usually means your contact list has old or incorrectly entered email addresses. You should clean your list using an email validation service before sending again."
}
```

---

## Data Model

```
User
 └── Workspace
      ├── ApiKey        (scoped authentication per workspace)
      ├── Template      (reusable notification templates with versioning)
      └── Notification  (each send attempt)
           └── DeliveryEvent  (immutable log of every status change)
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, receive JWT + refresh token |
| POST | `/auth/refresh` | Rotate refresh token |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/workspaces` | Create workspace |
| GET | `/workspaces` | List workspaces |
| POST | `/workspaces/:id/api-keys` | Generate scoped API key |

### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/templates` | Create template |
| GET | `/templates` | List templates |
| PUT | `/templates/:id` | Update template (increments version) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications/send` | Send a notification |
| GET | `/notifications/:id` | Get notification + full event trail |
| GET | `/notifications` | List notifications with filters |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/patterns` | Get detected failure patterns with AI explanation |
| GET | `/analytics/stats` | Delivery stats for a workspace |

### Webhooks (provider callbacks)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/resend` | Resend delivery event callback |
| POST | `/webhooks/twilio` | Twilio status callback |

---

## Local Setup

### Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) account (free PostgreSQL)
- An [Upstash](https://upstash.com) account (free Redis)
- A [Resend](https://resend.com) account (free tier)
- A [Twilio](https://twilio.com) trial account
- An [Anthropic](https://console.anthropic.com) API key

### Installation

```bash
git clone https://github.com/yourusername/notifyflow
cd notifyflow
npm install
```

### Environment variables

```env
DATABASE_URL=postgresql://...         # Neon connection string
REDIS_URL=rediss://...                # Upstash Redis URL

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

ANTHROPIC_API_KEY=sk-ant-...

PORT=3000
```

### Run

```bash
# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev

# Start worker (separate terminal)
npm run worker
```

---

## Project Structure

```
src/
├── app.ts                  # Express app setup
├── server.ts               # Entry point
├── lib/
│   └── prisma.ts           # Prisma client singleton
├── routes/                 # Route definitions
├── controllers/            # Request handlers
├── services/               # Business logic
│   ├── notification.service.ts
│   ├── template.service.ts
│   ├── pattern.detector.ts
│   └── ai.service.ts
├── workers/
│   └── notification.worker.ts   # BullMQ worker
├── queues/
│   └── notification.queue.ts    # Queue definition
├── middlewares/
│   ├── auth.middleware.ts
│   └── apikey.middleware.ts
└── webhooks/
    ├── resend.handler.ts
    └── twilio.handler.ts
```

---

## Why I Built This

I wanted to understand how notification infrastructure works at a systems level — not just "call an API and hope it works," but the full picture: async queues, provider callbacks, delivery guarantees, and failure intelligence.

The pattern detection layer was the interesting engineering problem. A single failure is noise. A cluster of failures with a shared characteristic is a signal. Building the rules to distinguish between the two, and then explaining them in context, is what makes this more than a wrapper around Resend and Twilio.

---

## License

MIT
