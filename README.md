<div align="center">

# NotifyFlow

**Multi-channel notification infrastructure with intelligent failure observability.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?logo=postgresql)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-red?logo=redis)](https://upstash.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Live Demo](#) · [API Docs](#api-reference) · [Report Bug](issues)

</div>

---

## The Problem

Most notification services tell you a delivery failed. They don't tell you that 80 of your last 100 emails hard-bounced because your list has stale addresses — or that your SMS failures are spiking on a single channel — or that your provider has been returning 429s for the last 15 minutes.

**NotifyFlow fixes that.**

Send notifications across email, SMS, and webhooks through one API. Every delivery event is tracked in an immutable audit log. Failure patterns are detected automatically and explained by an AI layer — in technical terms for engineers, plain English for founders, or brutally honest roast mode when you need to hear it straight.

---

## Demo

> **Sending a notification**

```bash
curl -X POST https://notifyflow.onrender.com/notifications/send \
  -H "Authorization: Bearer nf_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email",
    "recipient": "user@example.com",
    "templateId": "welcome-email",
    "payload": { "name": "Rahul" }
  }'
```

```json
{
  "id": "clx9abc123",
  "status": "pending",
  "channel": "email",
  "recipient": "user@example.com",
  "message": "Notification queued for delivery"
}
```

> **Checking for failure patterns**

```bash
curl https://notifyflow.onrender.com/analytics/ws_abc123/patterns?mode=engineer \
  -H "Authorization: Bearer <jwt_token>"
```

```json
{
  "detectedAt": "2026-11-11T10:30:00.000Z",
  "patternCount": 1,
  "patterns": [
    {
      "type": "BOUNCE_CLUSTER",
      "severity": "critical",
      "description": "High bounce rate detected for domain: yahoo.com",
      "evidence": [
        "47 bounces from yahoo.com in the last hour",
        "Likely cause: stale or invalid email addresses"
      ],
      "explanation": {
        "summary": "Your yahoo.com recipients are hard-bouncing at an abnormal rate.",
        "rootCause": "47 hard bounces in 60 minutes from a single domain indicates your contact list contains stale or invalid yahoo.com addresses. Yahoo's mail servers permanently reject these without a retry.",
        "immediateAction": "Pause sending to yahoo.com recipients and run your list through an email validation service (ZeroBounce, NeverBounce) before resuming.",
        "preventionTip": "Implement double opt-in and set up automated list hygiene to remove addresses after two consecutive hard bounces.",
        "confidence": "HIGH"
      }
    }
  ]
}
```

<!-- SCREENSHOT: paste a terminal screenshot of the above response here -->

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-channel delivery** | Email (Resend), SMS (Fast2SMS), webhooks through one unified API |
| **Async queue processing** | BullMQ + Redis — API returns instantly, delivery happens in background |
| **Automatic retries** | Exponential backoff on failure — 1s → 5s → 30s → dead-letter queue |
| **Immutable audit trail** | Every status change logged as a DeliveryEvent — provider accepted, delivered, bounced, failed |
| **Provider callbacks** | Resend and Fast2SMS webhook receivers update delivery status in real time |
| **Multi-tenant workspaces** | Scoped API keys, templates, and notifications per workspace |
| **Hashed API keys** | SHA-256 hashed, shown once on creation — same pattern as Stripe and Resend |
| **Template versioning** | Reusable templates with `{{placeholder}}` syntax, version increments on update |
| **Failure pattern detection** | Rule-based analysis — BOUNCE_CLUSTER, PROVIDER_OUTAGE, RATE_LIMIT_HIT |
| **AI explanations** | Detected patterns explained by Gemini API in four modes |

---

## AI Explanation Modes

Same failure data. Four completely different outputs based on who's reading it.

| Mode | Audience | Style |
|------|----------|-------|
| `engineer` | Backend developers | Technical root cause, specific fix with implementation detail |
| `plain` | Non-technical founders | Plain English, business impact, simple next steps |
| `urgent` | On-call / critical alert | One sentence problem, one sentence impact, one sentence fix |
| `roast` | When you need honesty | Brutally accurate, with humor — still gives the actual fix |

```bash
# Change the mode in the query param
GET /analytics/:workspaceId/patterns?mode=roast
```

<!-- SCREENSHOT: paste a comparison of the same pattern explained in engineer vs roast mode -->

---

## Architecture

```
Client Request
      │
      ▼
┌─────────────────────┐
│   Express API       │  Validates request, creates Notification record,
│   (Layer 1)         │  pushes job to queue — returns immediately
└──────────┬──────────┘
           │ job { notificationId }
           ▼
┌─────────────────────┐
│   BullMQ Queue      │  Redis-backed job queue
│   (Layer 2)         │  Handles retries, backoff, dead-letter
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Worker            │  Fetches notification, renders template,
│   (Layer 3)         │  calls Resend / Fast2SMS, logs DeliveryEvent
└──────────┬──────────┘
           │ provider callback (webhook)
           ▼
┌─────────────────────┐
│   Tracking Layer    │  Receives provider callbacks,
│   (Layer 4)         │  logs DeliveryEvents, updates status
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Intelligence      │  Pattern detection over DeliveryEvents
│   Layer (Layer 5)   │  → AI explanation via Gemini API
└─────────────────────┘
```

---

## Data Model

```
User
 └── Workspace                    (multi-tenant isolation)
      ├── ApiKey                  (scoped auth, SHA-256 hashed)
      ├── Template                (reusable content, versioned)
      └── Notification            (one record per send attempt)
           └── DeliveryEvent      (append-only audit log)
```

Every `Notification` has a full timeline of `DeliveryEvent` records — one for each status change. This append-only pattern is what makes failure pattern detection possible.

<!-- SCREENSHOT: Prisma Studio or DB view showing a Notification with its DeliveryEvent trail -->

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Framework | Express |
| Database | PostgreSQL via [Neon](https://neon.tech) |
| ORM | Prisma |
| Queue | BullMQ |
| Cache | Redis via [Upstash](https://upstash.com) |
| Email | [Resend](https://resend.com) |
| SMS | [Fast2SMS](https://fast2sms.com) (India) |
| AI | Google Gemini API |
| Auth | JWT + refresh token rotation |
| Testing | Jest + Supertest |
| Deployment | [Render](https://render.com) |

---

## Local Setup

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account — free PostgreSQL
- An [Upstash](https://upstash.com) account — free Redis
- A [Resend](https://resend.com) account — free email tier
- A [Fast2SMS](https://fast2sms.com) account — free SMS credits (India)
- A [Google AI Studio](https://aistudio.google.com) API key — free Gemini access

### Installation

```bash
git clone https://github.com/yourusername/notifyflow
cd notifyflow
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=rediss://...

# Auth
JWT_SECRET=your_long_random_secret
JWT_REFRESH_SECRET=another_long_random_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
RESEND_API_KEY=re_...

# SMS (India)
FAST2SMS_API_KEY=...

# AI
GEMINI_API_KEY=...

PORT=3000
```

### Run

```bash
# Run database migrations
npx prisma migrate dev

# Start the API server
npm run dev

# Start the worker (separate terminal)
npm run worker
```

The API will be running at `http://localhost:3000`. Health check: `GET /health`.

---

## API Reference

### Authentication

All endpoints except `/auth/*` require a Bearer token:
```
Authorization: Bearer <access_token>
```

Notification send endpoints accept workspace API keys:
```
Authorization: Bearer nf_live_<api_key>
```

### Endpoints

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Login — returns JWT + refresh token |
| `POST` | `/auth/refresh` | Rotate refresh token |

#### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/workspaces` | Create workspace |
| `GET` | `/workspaces` | List your workspaces |
| `POST` | `/workspaces/:id/api-keys` | Generate scoped API key (shown once) |

#### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/templates` | Create template |
| `GET` | `/templates` | List templates in workspace |
| `PUT` | `/templates/:id` | Update template (auto-increments version) |

#### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/notifications/send` | Send a notification |
| `GET` | `/notifications/:id` | Get notification + full event trail |
| `GET` | `/notifications` | List notifications with filters |

#### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/:workspaceId/patterns` | Detect failure patterns with AI explanation |

#### Provider Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhooks/resend` | Resend delivery callback |
| `POST` | `/webhooks/fast2sms` | Fast2SMS status callback |

---

## Project Structure

```
src/
├── app.ts                        # Express app setup
├── server.ts                     # Entry point
├── lib/
│   └── prisma.ts                 # Prisma client singleton
├── routes/                       # Route definitions
├── controllers/                  # Request/response handlers
├── services/
│   ├── auth.service.ts           # Auth logic
│   ├── notification.service.ts   # Notification creation
│   ├── template.service.ts       # Template rendering
│   ├── pattern.detector.ts       # Failure pattern detection
│   └── ai.service.ts             # Gemini API integration
├── workers/
│   └── notification.worker.ts    # BullMQ job processor
├── queues/
│   └── notification.queue.ts     # Queue definition
├── middlewares/
│   ├── auth.middleware.ts        # JWT authentication
│   └── apikey.middleware.ts      # API key authentication
└── webhooks/
    ├── resend.handler.ts         # Resend callback handler
    └── fast2sms.handler.ts       # Fast2SMS callback handler
```

---

## Why I Built This

I wanted to understand how notification infrastructure works at a systems level — not just "call an API and hope it works," but the full picture: async queues, provider callbacks, delivery guarantees, and failure intelligence.

The pattern detection layer was the core engineering problem. A single failure is noise. A cluster of failures with a shared characteristic — same domain, same provider, same time window — is a signal. Building the rules to reliably distinguish between the two, and then explaining them in context using AI, is what makes NotifyFlow more than a wrapper around Resend and Fast2SMS.

The SMS provider architecture is worth noting: Twilio's DLT registration requirements make it unusable for Indian numbers on a development project. NotifyFlow uses Fast2SMS for Indian delivery and is architected to be provider-agnostic — swapping providers is a one-file change in `sms.service.ts`.

---

## License

MIT![alt text](image.png)
