import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/cors.ts';

const allowedMethods = new Set(['paypal', 'bank_transfer', 'mobile_money', 'crypto_usdc', 'crypto_usdt']);

function response(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function sha256(value: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function generateOtp(): string {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return String(bytes[0] % 1_000_000).padStart(6, '0');
}

serve(async (request) => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return response({ error: 'Authentication required.' }, 401);

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authorization } } },
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id || !user.email) return response({ error: 'Authenticated email is required.' }, 401);

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const resendFrom = Deno.env.get('RESEND_FROM_EMAIL');
    if (!resendKey || !resendFrom) return response({ error: 'Withdrawal verification delivery is not configured.' }, 503);

    let body: { amount?: unknown; method?: unknown; details?: unknown };
    try {
        body = await request.json();
    } catch {
        return response({ error: 'Request body must be valid JSON.' }, 400);
    }

    const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount);
    const method = typeof body.method === 'string' ? body.method : '';
    const details = body.details;
    if (!Number.isFinite(amount) || amount < 5 || amount > 100_000 || !allowedMethods.has(method) || !details || typeof details !== 'object' || Array.isArray(details)) {
        return response({ error: 'Invalid withdrawal details.' }, 400);
    }

    const otp = generateOtp();
    const codeHash = await sha256(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { data: withdrawalId, error: requestError } = await supabase.rpc('request_withdrawal_with_otp', {
        p_user_id: user.id,
        p_amount: amount,
        p_method: method,
        p_account_details: details,
        p_code_hash: codeHash,
        p_expires_at: expiresAt,
    });

    if (requestError || !withdrawalId) {
        console.warn('[request-withdrawal] request failed:', requestError?.message || 'No withdrawal ID returned');
        return response({ error: requestError?.message || 'Withdrawal request failed.' }, 400);
    }

    const delivery = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: resendFrom,
            to: [user.email],
            subject: 'XUM AI withdrawal verification code',
            text: `Your XUM AI withdrawal verification code is ${otp}. It expires in 10 minutes. If you did not request this withdrawal, contact support immediately.`,
        }),
    });

    if (!delivery.ok) {
        await supabase.rpc('cancel_unverified_withdrawal', {
            p_user_id: user.id,
            p_withdrawal_id: withdrawalId,
            p_reason: 'Verification email delivery failed',
        });
        return response({ error: 'Verification delivery failed; no funds were withdrawn.' }, 502);
    }

    return response({ id: withdrawalId });
});
