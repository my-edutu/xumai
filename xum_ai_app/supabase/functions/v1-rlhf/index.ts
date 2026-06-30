import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { authenticate, supabaseAdmin, logApiRequest } from '../_shared/auth.ts'

serve(async (req) => {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';

    try {
        const authResult = await authenticate(req, ['rlhf:read']); // Baseline

        if (!authResult.authorized) {
            await logApiRequest(authResult.key_id, path, 401, ip);
            return new Response(JSON.stringify({ error: authResult.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const parts = path.split('/').filter(Boolean);
        const batchId = parts.length > 2 && parts[1] === 'batches' ? parts[2] : null;
        const action = parts.length > 3 ? parts[3] : null;

        if (method === 'GET' && batchId && action === 'results') {
            // Fetch RLHF results
            const { data: results, error } = await supabaseAdmin
                .from('rlhf_results')
                .select('*')
                .eq('batch_id', batchId);

            await logApiRequest(authResult.key_id, path, 200, ip);
            return new Response(JSON.stringify({ items: results || [] }), { headers: { 'Content-Type': 'application/json' } });

        } else if (method === 'POST' && !batchId) {
            // Create RLHF batch
            const createAuthResult = await authenticate(req, ['rlhf:create']);
            if (!createAuthResult.authorized) return new Response('Forbidden', { status: 403 });

            const body = await req.json();
            const { data: batch, error } = await supabaseAdmin
                .from('rlhf_batches')
                .insert([body])
                .select()
                .single();

            if (error) throw error;
            await logApiRequest(authResult.key_id, path, 201, ip);
            return new Response(JSON.stringify(batch), { status: 201, headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: 'Route not found' }), { status: 400 });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
