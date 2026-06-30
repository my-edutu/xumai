# XUM AI API + Keys — Developer Guide

## 1) What the XUM AI API Does

XUM AI’s API lets enterprise clients (and internal tools) do four main things:

1. Create tasks/projects (data creation, labeling, validation, RLHF)
2. Stream or fetch results (submissions, labels, RLHF preferences)
3. Export datasets (versioned, packaged downloads)
4. Manage webhooks (notifications when jobs complete)

---

## 2) API Key Types (Very Important)

### A) User App Tokens (Mobile users)
- Used by contributors in the app
- Issued after login
- Short-lived access token + refresh token
- **Never use enterprise keys inside the mobile app.**

### B) Enterprise API Keys (Clients)
- Used by companies to submit tasks and fetch results
- Long-lived keys (but rotated)
- Strict scoped permissions

### C) Internal Service Keys (XUM Admin + workers)
- Used by backend services (QC pipeline, export service)
- Highest privilege
- Not exposed externally

---

## 3) Key Security Model (Best Practice)

**Recommended:**
✅ API key = identifier
✅ Secret token = authenticator

**Example:**
- `key_id`: `xum_live_9f82...`
- `secret`: `xum_secret_d3a1...`

**Client sends:**
`Authorization: Bearer <secret>`
or
`X-XUM-KEY-ID + X-XUM-SECRET`

---

## 4) Scopes & Permissions (RBAC for API)

Every enterprise key has scopes like:

**Task scopes**
- `tasks:create`
- `tasks:read`
- `tasks:update`
- `tasks:pause`

**Data scopes**
- `submissions:read`
- `labels:read`
- `exports:read`

**RLHF scopes**
- `rlhf:create`
- `rlhf:read`

**Admin scopes (internal only)**
- `payouts:approve`
- `fraud:manage`
- `users:ban`

**Example scope sets**
- Client key (basic): `tasks:create, tasks:read, submissions:read, exports:read`
- Client key (RLHF): `rlhf:create, rlhf:read`

---

## 5) Key Management Features (Dashboard)

Inside Admin → API & Keys:
- Create key
- Assign scopes
- Set environments:
  - `test`
  - `live`
- Set rate limits (requests/minute)
- Set IP allowlist (optional)
- Rotate secrets
- Revoke key immediately
- View usage logs

---

## 6) API Authentication (How Requests Work)

**Header format**
```http
Authorization: Bearer xum_secret_...
X-XUM-Key-Id: xum_live_...
```

**Backend verifies:**
1. key exists
2. secret matches hash
3. key is not revoked
4. key has required scopes
5. rate limit is not exceeded

---

## 7) Core API Endpoints (Suggested)

### A) Health
`GET /v1/health`

### B) Projects
Create and manage data projects.

**Create project** `POST /v1/projects`

**Body:**
```json
{
  "name": "Hausa Voice Dataset",
  "type": "voice",
  "description": "Collect 20k Hausa voice clips",
  "target_countries": ["NG"],
  "languages": ["ha"],
  "budget_limit": 5000
}
```

**List projects** `GET /v1/projects`

### C) Tasks

**Create task** `POST /v1/tasks`

**Body:**
```json
{
  "project_id": "prj_123",
  "task_type": "data_creation_voice",
  "prompt": "Say: 'Good morning, how are you?' in Hausa",
  "requirements": {
    "min_seconds": 4,
    "max_seconds": 8,
    "no_music": true
  },
  "reward": {
    "amount": 0.10,
    "currency": "USD"
  },
  "validation": {
    "validators": 3,
    "consensus": 2
  },
  "quota": 20000
}
```

**Pause task** `POST /v1/tasks/{task_id}/pause`

**Resume task** `POST /v1/tasks/{task_id}/resume`

**Task status** `GET /v1/tasks/{task_id}`

### D) Submissions / Results

**Fetch submissions** `GET /v1/tasks/{task_id}/submissions?status=approved&limit=100&cursor=...`

**Response:**
```json
{
  "items": [
    {
      "submission_id": "sub_001",
      "status": "approved",
      "media_url": "https://secure-bucket/....wav",
      "labels": {"language": "ha"},
      "metadata": {
        "duration": 6.2,
        "quality_score": 0.91,
        "country": "NG"
      }
    }
  ],
  "next_cursor": "abc"
}
```

### E) RLHF (XUM Judge)

**Create RLHF batch** `POST /v1/rlhf/batches`

**Body:**
```json
{
  "project_id": "prj_123",
  "task_type": "preference_ranking",
  "items": [
    {
      "prompt": "What is a dog?",
      "response_a": "A dog is an animal.",
      "response_b": "A dog is a domesticated mammal..."
    }
  ],
  "reward": {"amount": 0.05, "currency": "USD"},
  "validation": {"raters": 5, "consensus": 3}
}
```

**Fetch RLHF results** `GET /v1/rlhf/batches/{batch_id}/results`

**Output:**
```json
{
  "items": [
    {
      "prompt": "What is a dog?",
      "winner": "B",
      "agreement": 0.8,
      "reasons": ["more accurate", "more complete"]
    }
  ]
}
```

### F) Dataset Exports

**Create export** `POST /v1/exports`

**Body:**
```json
{
  "project_id": "prj_123",
  "filters": {"status": "approved", "quality_min": 0.85},
  "format": "jsonl",
  "include_media": true
}
```

**Check export status** `GET /v1/exports/{export_id}`
*(Download link Response contains: signed URL (expires in minutes), checksum hash)*

### G) Webhooks

**Register webhook** `POST /v1/webhooks`

**Body:**
```json
{
  "url": "https://client.com/xum-webhook",
  "events": ["task.completed", "export.ready", "quality.alert"],
  "secret": "client_webhook_secret"
}
```

**Webhook signature:**
`X-XUM-Signature: HMAC_SHA256(payload, secret)`

---

## 8) Rate Limits (Keep System Safe)

**Per key:**
- 60 req/min default
- higher for enterprise plans
- hard caps for abuse prevention

**Return headers:**
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `Retry-After`

---

## 9) Data Privacy & Access Rules

- Clients can only access their own project data
- Signed URLs expire quickly
- Personal identifiers must not be included
- Location data is coarse by default

---

## 10) Logging & Audit (Must Have)

Log every API action:
- `key_id`
- `endpoint`
- `request_id`
- `time`
- `status`
- `IP`
- `rate-limit outcome`

**Store in audit logs for compliance.**

---

## 11) Key Rotation Policy

- Secrets rotate every 30–90 days
- Admin can force rotation instantly
- Revocation is immediate

**Recommended:**
- allow multiple active secrets for a short overlap window (smooth rotation)

---

## Quick Summary for Your Developer

✅ Use scoped API keys for enterprise
✅ Signed URLs for dataset downloads
✅ Webhooks for async delivery
✅ Audit logs for compliance
✅ Rate limits + IP allowlists for security
✅ Separate mobile user tokens from enterprise keys
