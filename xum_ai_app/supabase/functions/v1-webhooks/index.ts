import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { authenticate, supabaseAdmin, logApiRequest } from '../_shared/auth.ts'

serve(async (req) => {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';

    if (method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        // Requires generic write access or specific webhook scope
        const authResult = await authenticate(req, []);

        if (!authResult.authorized) {
            await logApiRequest(authResult.key_id, path, 401, ip);
            return new Response(JSON.stringify({ error: authResult.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const body = await req.json();

        // Register Webhook
        const { data: webhook, error } = await supabaseAdmin
            .from('webhooks')
            .insert([{
                key_id: authResult.key_id,
                url: body.url,
                events: body.events,
                secret: body.secret
            }])
            .select()
            .single();

        if (error) throw error;

        await logApiRequest(authResult.key_id, path, 201, ip);
        return new Response(JSON.stringify(webhook), { status: 201, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
