# Company Portal - API Documentation

## Overview
The XUM AI Company Portal exposes both a **REST API** (via Supabase) and **custom endpoints** (via Edge Functions) for programmatic access.

---

## Authentication

### Method 1: Supabase JWT (Web Dashboard)
Used by the web interface for authenticated sessions.

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'company@example.com',
  password: 'securepassword'
});
```

### Method 2: API Key (Programmatic Access)
For server-to-server integrations.

```bash
curl -X GET "https://your-project.supabase.co/rest/v1/projects" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY"
```

---

## Endpoints

### Projects

#### List Projects
```
GET /rest/v1/projects?company_id=eq.{company_id}
```

#### Create Project
```
POST /rest/v1/projects
Content-Type: application/json

{
  "title": "Nigerian Voice Dataset",
  "description": "10,000 voice recordings in Yoruba",
  "budget_limit": 5000.00,
  "industry_tag": "nlp"
}
```

#### Update Project Status
```
PATCH /rest/v1/projects?id=eq.{project_id}
Content-Type: application/json

{
  "status": "active"
}
```

---

### Tasks

#### Create Task (Linked to Project)
```
POST /rest/v1/tasks
Content-Type: application/json

{
  "project_id": "uuid-here",
  "title": "Record greeting phrase",
  "description": "Say 'Good morning' in Yoruba",
  "task_type": "audio",
  "difficulty": "easy",
  "reward": 0.25,
  "max_submissions": 1000
}
```

#### Get Task Submissions
```
GET /rest/v1/submissions?task_id=eq.{task_id}&status=eq.approved
```

---

### Budget & Escrow

#### Allocate Budget to Project
```sql
-- Call via RPC
SELECT allocate_project_escrow(
  'company-uuid',
  'project-uuid',
  5000.00
);
```

```typescript
const { data, error } = await supabase.rpc('allocate_project_escrow', {
  p_company_id: companyId,
  p_project_id: projectId,
  p_amount: 5000.00
});
```

#### Check Balance
```
GET /rest/v1/company_balances?id=eq.{company_id}
```

---

### Dataset Exports

#### Request Export
```typescript
const { data, error } = await supabase.rpc('request_dataset_export', {
  p_project_id: projectId,
  p_format: 'json',
  p_version: '1.0'
});
// Returns: export_id
```

#### Check Export Status
```
GET /rest/v1/dataset_exports?id=eq.{export_id}
```

Response includes:
- `status`: 'pending' | 'processing' | 'ready' | 'failed'
- `signed_url`: Download link (when ready)
- `file_size_bytes`: File size

---

### Webhooks

#### Register Webhook
```
POST /rest/v1/company_webhooks
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["project.completed", "submission.approved", "export.ready"]
}
```

#### Webhook Payload Format
```json
{
  "event": "project.progress.50",
  "timestamp": "2024-12-30T14:00:00Z",
  "data": {
    "project_id": "uuid",
    "title": "Nigerian Voice Dataset",
    "progress": 50
  }
}
```

---

### API Keys

#### Generate New Key
```typescript
const { data, error } = await supabase.rpc('generate_api_key', {
  p_company_id: companyId,
  p_name: 'Production Server',
  p_permissions: ['read:projects', 'read:exports', 'write:tasks']
});
// Returns: { key_id, api_key, prefix }
// WARNING: api_key is only shown once!
```

#### List Keys (Partial)
```
GET /rest/v1/company_api_keys?company_id=eq.{company_id}
```
Note: Only shows `api_key_last_prefix`, never the full key.

---

### Marketplace

#### Browse Datasets
```
GET /rest/v1/marketplace_datasets?status=eq.published&order=created_at.desc
```

#### Purchase Dataset
```
POST /rest/v1/dataset_purchases
Content-Type: application/json

{
  "dataset_id": "uuid",
  "amount_paid": 499.00,
  "payment_reference": "stripe_pi_xxx"
}
```

#### Download Purchased Dataset
```typescript
const canDownload = await supabase.rpc('check_dataset_access', {
  p_dataset_id: datasetId,
  p_company_id: companyId
});

if (canDownload) {
  // Fetch signed URL or data
}
```

---

## Rate Limits

| Tier | Requests/Minute | Concurrent Exports |
|------|-----------------|-------------------|
| Free | 60 | 1 |
| Starter | 100 | 3 |
| Enterprise | 1000 | 10 |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or expired API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Error - Contact support |

---

## SDKs (Coming Soon)

- JavaScript/TypeScript
- Python
- cURL examples

---

**Version:** 1.0  
**Last Updated:** December 30, 2024
