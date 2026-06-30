import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { authenticate, supabaseAdmin, logApiRequest } from '../_shared/auth.ts'

serve(async (req) => {
    const url = new URL(req.url);
    const path = url.pathname; // Should be /v1/projects
    const method = req.method;

    // Authenticate the request
    const authResult = await authenticate(req, ['tasks:read']); // Adjust scopes as needed

    if (!authResult.authorized) {
        await logApiRequest(authResult.key_id, path, 401, req.headers.get('CF-Connecting-IP') || 'unknown');
        return new Response(JSON.stringify({ error: authResult.error }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Handle Operations
    try {
        if (method === 'GET') {
            // List Projects
            const { data: projects, error } = await supabaseAdmin
                .from('projects') // Make sure this matches actual projects table
                .select('*')
                .limit(10); // Simple pagination placeholder

            await logApiRequest(authResult.key_id, path, 200, req.headers.get('CF-Connecting-IP') || 'unknown');

            return new Response(JSON.stringify(projects), {
                headers: { 'Content-Type': 'application/json' },
            });

        } else if (method === 'POST') {
            // Requires create scope
            const createAuthResult = await authenticate(req, ['tasks:create']);
            if (!createAuthResult.authorized) {
                return new Response(JSON.stringify({ error: 'Missing tasks:create scope.' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const body = await req.json();

            const { data: project, error } = await supabaseAdmin
                .from('projects')
                .insert([body])
                .select()
                .single();

            if (error) throw error;

            await logApiRequest(authResult.key_id, path, 201, req.headers.get('CF-Connecting-IP') || 'unknown');

            return new Response(JSON.stringify(project), {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Method Not Allowed
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });

    } catch (error) {
        await logApiRequest(authResult.key_id, path, 500, req.headers.get('CF-Connecting-IP') || 'unknown');
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
