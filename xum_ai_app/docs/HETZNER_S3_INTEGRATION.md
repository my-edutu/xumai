# Hetzner Object Storage Integration Guide

This document provides a comprehensive guide for integrating **Hetzner Object Storage** (S3-compatible) with the XUM AI platform for storing user-submitted media files (audio, video, images).

---

## 🎯 Overview

XUM AI allows contributors to capture and upload various media types as part of AI data grounding tasks. This media needs to be stored securely, efficiently, and cost-effectively. Hetzner Object Storage provides an S3-compatible solution that integrates seamlessly with our existing `StorageService`.

### Why Hetzner Object Storage?
-   **S3 Compatibility:** Works with any standard S3 SDK or tool.
-   **Cost-Effective:** Significantly cheaper than AWS S3 for similar storage and bandwidth.
-   **European Data Residency:** Data centers in Germany (Falkenstein, Nuremberg) and Finland (Helsinki).
-   **High Availability:** Built on Ceph cluster with built-in redundancy.

---

## 🛠 Setup Steps

### 1. Create a Hetzner Cloud Account
1.  Go to [Hetzner Cloud Console](https://console.hetzner.cloud/).
2.  Sign up or log in.
3.  Navigate to **Object Storage** in the left sidebar.

### 2. Create a Bucket
1.  Click **Create Bucket**.
2.  Choose a region:
    -   `fsn1` (Falkenstein, Germany)
    -   `nbg1` (Nuremberg, Germany)
    -   `hel1` (Helsinki, Finland)
3.  Name your bucket (e.g., `xum-raw-submissions`).
4.  Set visibility to **Private** (we use pre-signed URLs for access).

### 3. Generate S3 Credentials
1.  In the Object Storage section, go to **S3 Credentials**.
2.  Click **Generate Credentials**.
3.  **IMPORTANT:** Copy both the **Access Key** and **Secret Key** immediately. The secret key is only shown once.

---

## 🔗 Endpoint Configuration

Hetzner uses location-specific S3 endpoints. Use the endpoint matching your bucket's region:

| Region | Endpoint URL |
| :--- | :--- |
| Falkenstein | `https://fsn1.your-objectstorage.com` |
| Nuremberg | `https://nbg1.your-objectstorage.com` |
| Helsinki | `https://hel1.your-objectstorage.com` |

---

## 🔐 Environment Variables

Add the following secrets to your Supabase project (or `.env.local` for local dev):

```env
# Hetzner S3 Configuration
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_ACCESS_KEY_ID=your_access_key_here
S3_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=xum-raw-submissions
S3_REGION=fsn1
```

**For Supabase Edge Functions:**
1.  Go to your Supabase Dashboard > Project Settings > Secrets.
2.  Add each of the above as a new secret.

---

## 📦 Supabase Edge Function: `storage-manager`

The `storage-manager` edge function handles generating pre-signed URLs for secure uploads. Here is the recommended implementation:

```typescript
// supabase/functions/storage-manager/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, bucket, fileName, contentType } = await req.json();

    const s3Client = new S3Client({
      region: Deno.env.get('S3_REGION') || 'fsn1',
      endpoint: Deno.env.get('S3_ENDPOINT'),
      credentials: {
        accessKeyId: Deno.env.get('S3_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('S3_SECRET_ACCESS_KEY')!,
      },
      forcePathStyle: true, // Required for Hetzner S3 compatibility
    });

    if (action === 'GET-UPLOAD-URL') {
      const command = new PutObjectCommand({
        Bucket: bucket || Deno.env.get('S3_BUCKET_NAME'),
        Key: fileName,
        ContentType: contentType,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry

      return new Response(JSON.stringify({ url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 📱 Client-Side Usage (Already Implemented)

The `StorageService` in `src/screens/TaskScreens.tsx` handles the client-side upload flow:

```typescript
export const StorageService = {
  getUploadUrl: async (fileName: string, contentType: string) => {
    const { data, error } = await supabase.functions.invoke('storage-manager', {
      body: {
        action: 'GET-UPLOAD-URL',
        bucket: 'xum-raw-submissions',
        fileName: `raw/${Date.now()}_${fileName}`,
        contentType
      }
    });
    if (error) throw error;
    return data.url;
  },

  uploadToS3: async (url: string, blob: Blob) => {
    const response = await fetch(url, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': blob.type }
    });
    return response.ok;
  }
};
```

---

## 🗂 Recommended Bucket Structure

```
xum-raw-submissions/
├── raw/                    # Unprocessed user uploads
│   ├── audio/
│   ├── video/
│   └── image/
├── processed/              # AI-validated and cleaned data
│   ├── audio/
│   ├── video/
│   └── image/
└── exports/                # Dataset exports (Parquet, JSON)
```

---

## 🛡 Security Best Practices

1.  **Never expose S3 credentials in client-side code.** Always use pre-signed URLs generated by a secure backend (Supabase Edge Function).
2.  **Set short expiry times** for pre-signed URLs (1 hour max).
3.  **Use separate buckets** for raw submissions vs. validated/processed data.
4.  **Enable bucket versioning** for accidental deletion recovery.
5.  **Implement CORS policies** on the bucket if needed for direct browser uploads.

---

## 🧰 CLI Tools for Management

You can manage your Hetzner buckets using S3-compatible CLI tools:

### MinIO Client (Recommended)
```bash
# Install
brew install minio/stable/mc  # macOS
# Configure
mc alias set hetzner https://fsn1.your-objectstorage.com ACCESS_KEY SECRET_KEY
# List buckets
mc ls hetzner
# Upload file
mc cp ./file.mp3 hetzner/xum-raw-submissions/raw/audio/
```

### AWS CLI
```bash
# Configure
aws configure set aws_access_key_id YOUR_ACCESS_KEY
aws configure set aws_secret_access_key YOUR_SECRET_KEY

# List bucket contents
aws s3 ls s3://xum-raw-submissions --endpoint-url https://fsn1.your-objectstorage.com
```

---

## 📊 Cost Estimation

Hetzner Object Storage pricing (as of 2024):
-   **Storage:** ~€0.0052/GB/month
-   **Outgoing Traffic:** ~€0.01/GB (incoming is free)
-   **Base Price:** Includes initial quota

For XUM AI with ~10,000 monthly uploads averaging 5MB each:
-   Storage: ~50GB/month = ~€0.26/month
-   Egress (assuming 20% retrieval): ~10GB = ~€0.10/month
-   **Total: < €1/month** for moderate usage

---

## 🔗 Related Documentation

-   [Hetzner Object Storage Docs](https://docs.hetzner.com/cloud/object-storage/)
-   [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
-   [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

© 2025 XUM AI. All Rights Reserved.
