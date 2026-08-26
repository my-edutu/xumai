import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { authenticate, supabaseAdmin, logApiRequest } from '../_shared/auth.ts'

serve(async (req) => {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';

    try {
        // 1. Authenticate Request
        const authResult = await authenticate(req, ['tasks:read']); // Baseline scope

        if (!authResult.authorized) {
            await logApiRequest(authResult.key_id, path, 401, ip);
            return new Response(JSON.stringify({ error: authResult.error }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Route by Method and Path
        // e.g., /v1-tasks
        // e.g., /v1-tasks/{task_id}
        // e.g., /v1-tasks/{task_id}/pause
        // e.g., /v1-tasks/{task_id}/submissions
        const parts = path.split('/').filter(Boolean);
        const taskId = parts.length > 1 ? parts[1] : null;
        const action = parts.length > 2 ? parts[2] : null;

        if (method === 'GET') {
            if (taskId && action === 'submissions') {
                const { data: submissions, error } = await supabaseAdmin
                    .from('submissions')
                    .select('*')
                    .eq('task_id', taskId)
                    .limit(10); // simplistic pagination

                await logApiRequest(authResult.key_id, path, 200, ip);
                return new Response(JSON.stringify({ items: submissions || [] }), { headers: { 'Content-Type': 'application/json' } });
            }
            else if (taskId && !action) {
                // GET /v1/tasks/{task_id} -> Task status
                const { data: task, error } = await supabaseAdmin
                    .from('tasks')
                    .select('*')
                    .eq('id', taskId)
                    .single();

                await logApiRequest(authResult.key_id, path, 200, ip);
                return new Response(JSON.stringify(task || {}), { headers: { 'Content-Type': 'application/json' } });
            }
        }

        else if (method === 'POST') {
            if (!taskId) {
                // Create Task
                const createAuthResult = await authenticate(req, ['tasks:create']);
                if (!createAuthResult.authorized) return new Response('Forbidden', { status: 403 });

                const body = await req.json();
                const { data: task, error } = await supabaseAdmin
                    .from('tasks')
                    .insert([body])
                    .select()
                    .single();

                if (error) throw error;
                await logApiRequest(authResult.key_id, path, 201, ip);
                return new Response(JSON.stringify(task), { status: 201, headers: { 'Content-Type': 'application/json' } });
            }
            else if (taskId && action === 'pause') {
                // Pause Task
                const updateAuthResult = await authenticate(req, ['tasks:pause']);
                if (!updateAuthResult.authorized) {
                    await logApiRequest(authResult.key_id, path, 403, ip);
                    return new Response(JSON.stringify({ error: updateAuthResult.error || 'Forbidden' }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                const { data: task, error } = await supabaseAdmin
                    .from('tasks')
                    .update({ status: 'paused' })
                    .eq('id', taskId)
                    .select('id, status')
                    .single();

                if (error || !task) {
                    await logApiRequest(authResult.key_id, path, 404, ip);
                    return new Response(JSON.stringify({ error: error?.message || 'Task not found.' }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                await logApiRequest(authResult.key_id, path, 200, ip);
                return new Response(JSON.stringify({ success: true, task }), { headers: { 'Content-Type': 'application/json' } });
            }
            else if (taskId && action === 'resume') {
                // Resume Task
                const updateAuthResult = await authenticate(req, ['tasks:update']);
                if (!updateAuthResult.authorized) {
                    await logApiRequest(authResult.key_id, path, 403, ip);
                    return new Response(JSON.stringify({ error: updateAuthResult.error || 'Forbidden' }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                const { data: task, error } = await supabaseAdmin
                    .from('tasks')
                    .update({ status: 'active' })
                    .eq('id', taskId)
                    .select('id, status')
                    .single();

                if (error || !task) {
                    await logApiRequest(authResult.key_id, path, 404, ip);
                    return new Response(JSON.stringify({ error: error?.message || 'Task not found.' }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                await logApiRequest(authResult.key_id, path, 200, ip);
                return new Response(JSON.stringify({ success: true, task }), { headers: { 'Content-Type': 'application/json' } });
            }
        }

        await logApiRequest(authResult.key_id, path, 404, ip);
        return new Response(JSON.stringify({ error: 'Route not found.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error.';
        await logApiRequest('', path, 500, ip);
        return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
