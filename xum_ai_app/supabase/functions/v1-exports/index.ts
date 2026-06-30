import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { authenticate, supabaseAdmin, logApiRequest } from '../_shared/auth.ts'

serve(async (req) => {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';

    try {
        const authResult = await authenticate(req, ['exports:read']);

        if (!authResult.authorized) {
            await logApiRequest(authResult.key_id, path, 401, ip);
            return new Response(JSON.stringify({ error: authResult.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const parts = path.split('/').filter(Boolean);
        const exportId = parts.length > 2 ? parts[2] : null;

        if (method === 'GET' && exportId) {
            // Check export status
            const { data: exp, error } = await supabaseAdmin
                .from('dataset_exports')
                .select('*')
                .eq('id', exportId)
                .single();

            await logApiRequest(authResult.key_id, path, 200, ip);
            return new Response(JSON.stringify(exp || {}), { headers: { 'Content-Type': 'application/json' } });

        } else if (method === 'POST') {
            // Create export
            const body = await req.json();

            // Simulate export job creation
            const { data: exp, error } = await supabaseAdmin
                .from('dataset_exports')
                .insert([{ ...body, status: 'processing' }])
                .select()
                .single();

            if (error) throw error;

            await logApiRequest(authResult.key_id, path, 201, ip);
            return new Response(JSON.stringify(exp), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: 'Route not found' }), { status: 400 });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
