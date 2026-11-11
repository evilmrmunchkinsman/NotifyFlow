
<div align="center">

# NotifyFlow

**Multi-channel notification infrastructure with intelligent failure observability.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?logo=postgresql)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-red?logo=redis)](https://upstash.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Live Demo](https://notifyflow-4yix.onrender.com/health) · [API Docs](#api-reference)

</div>

---

## The Problem

Most notification services tell you a delivery failed. They don't tell you that 80 of your last 100 emails hard-bounced because your list has stale addresses — or that your SMS failures are spiking on a single channel — or that your provider has been returning 429s for the last 15 minutes.

**NotifyFlow fixes that.**

Send notifications across email and SMS through one API. Every delivery event is tracked in an immutable audit log. Failure patterns are detected automatically and explained by an AI layer — in technical terms for engineers, plain English for founders, or brutally honest roast mode when you need to hear it straight.

---

## 📸 Endpoint Screenshots

**1. Sending a Notification (Returns `201 Created` instantly, queue processes in background)**
<img width="715" height="358" alt="567a06bd-e410-4bd2-b3ee-3bac40966e23" src="https://github.com/user-attachments/assets/de56f21b-a202-4208-af16-cb482a434bae" />
<img width="719" height="411" alt="b986d53f-c908-4abc-8b19-9584f6e01bd7" src="https://github.com/user-attachments/assets/9c05ccf5-3c94-4652-9f78-ffbaa60d86aa" />
<img width="607" height="401" alt="15568a5c-a13a-4e4a-aa85-03c85a6506de" src="https://github.com/user-attachments/assets/f24efe7b-e41d-4029-9aaa-910e9a5a9453" />


**2. Listing Notifications with Filters (Querying by status)**
<img width="701" height="666" alt="f16c683f-faa4-41ea-8af1-6a0a86807371" src="https://github.com/user-attachments/assets/540196e8-d367-494b-8577-c557afcd60a3" />



**3. Intelligence & AI Layer (Roast Mode detecting a bounce cluster)**
<img width="736" height="654" alt="753d1d4d-852d-4c31-98e8-454248289c26" src="https://github.com/user-attachments/assets/f21052de-3f92-4d54-a1d6-50b2ad07f812" />


---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-channel delivery** | Email (Resend), SMS (Fast2SMS) through one unified API |
| **Async queue processing** | BullMQ + Redis — API returns instantly, delivery happens in background |
| **Automatic retries** | Exponential backoff on failure — 1s → 5s → 30s → dead-letter queue |
| **Immutable audit trail** | Every status change logged as a DeliveryEvent — provider accepted, delivered, bounced, failed |
| **Provider callbacks** | Resend webhook receivers update delivery status in real time |
| **Multi-tenant workspaces** | Scoped API keys, templates, and notifications per workspace |
| **Hashed API keys** | SHA-256 hashed, shown once on creation — same pattern as Stripe and Resend |
| **Template versioning** | Reusable templates with `{{placeholder}}` syntax, version increments on update |
| **Failure pattern detection** | Rule-based analysis — BOUNCE_CLUSTER, PROVIDER_OUTAGE, RATE_LIMIT_HIT |
| **AI explanations** | Detected patterns explained by Groq API in four modes |
| **Idempotency** | Prevent duplicate sends if the client accidentally sends the same request twice |

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
GET /api/intelligence/analyze/:workspaceId?mode=roast
```

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
│   Layer (Layer 5)   │  → AI explanation via Groq API
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
| SMS | [Fast2SMS](https://fast2sms.com) |
| AI | [Groq API](https://groq.com) |
| Auth | JWT + refresh token rotation |
| Deployment | [Render](https://render.com) |

---

## Local Setup

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account — free PostgreSQL
- An [Upstash](https://upstash.com) account — free Redis
- A [Resend](https://resend.com) account — free email tier
- A [Fast2SMS](https://fast2sms.com) account — free SMS credits (India)
- A [Groq](https://console.groq.com) API key

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
REFRESH_SECRET=another_long_random_secret

# Email
RESEND_API_KEY=re_...

# SMS (India)
FAST2SMS_API_KEY=...

# AI
GROQ_API_KEY=...

PORT=3000
```

### Run

```bash
# Run database migrations
npx prisma migrate dev

# Start the API server (this also starts the BullMQ worker)
npm run dev
```

The API will be running at `http://localhost:3000`. Health check: `GET /health`.

---

## API Reference

### Authentication

All endpoints except `/api/auth/*` require a Bearer token:
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
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login — returns JWT + refresh token |
| `POST` | `/api/auth/refresh` | Rotate refresh token |

#### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/workspaces` | Create workspace |
| `GET` | `/api/workspaces` | List your workspaces |
| `POST` | `/api/workspaces/:id/keys` | Generate scoped API key (shown once) |

#### Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/templates` | Create template |
| `GET` | `/api/templates` | List templates in workspace |
| `PUT` | `/api/templates/:id` | Update template (auto-increments version) |

#### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/notifications/send` | Send a notification |
| `GET` | `/api/notifications` | List notifications with filters |

#### Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/intelligence/analyze/:workspaceId` | Detect failure patterns with AI explanation |

#### Provider Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/webhooks/resend` | Resend delivery callback |

---

## Why I Built This

I wanted to understand how notification infrastructure works at a systems level — not just "call an API and hope it works," but the full picture: async queues, provider callbacks, delivery guarantees, and failure intelligence.

The pattern detection layer was the core engineering problem. A single failure is noise. A cluster of failures with a shared characteristic — same domain, same provider, same time window — is a signal. Building the rules to reliably distinguish between the two, and then explaining them in context using AI, is what makes NotifyFlow more than a wrapper around Resend and Fast2SMS.

---

## License

MIT
```
