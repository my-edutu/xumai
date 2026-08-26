import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../shared/cors.ts';

const allowedModalities = new Set(['voice', 'image', 'video', 'text']);

function response(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
    if (userError || !user) return response({ error: 'Authentication required.' }, 401);

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const model = Deno.env.get('GEMINI_MODEL');
    if (!geminiKey || !model) return response({ error: 'Prompt generation is not configured.' }, 503);

    let body: { goal?: unknown; context?: unknown; modality?: unknown; count?: unknown };
    try {
        body = await request.json();
    } catch {
        return response({ error: 'Request body must be valid JSON.' }, 400);
    }

    const goal = typeof body.goal === 'string' ? body.goal.trim() : '';
    const context = typeof body.context === 'string' ? body.context.trim() : '';
    const modality = typeof body.modality === 'string' ? body.modality : '';
    const count = typeof body.count === 'number' ? Math.floor(body.count) : 0;
    if (!goal || !context || context.length > 500 || !allowedModalities.has(modality) || count < 1 || count > 50) {
        return response({ error: 'Invalid prompt generation parameters.' }, 400);
    }

    const instruction = [
        'Generate safe, specific, culturally respectful data-collection prompts for human contributors.',
        'Return JSON only in the shape {"prompts":[{"text":"...","difficulty":1}]} with no markdown.',
        `Goal: ${goal}`,
        `Topic/context: ${context}`,
        `Modality: ${modality}`,
        `Quantity: ${count}`,
        'Difficulty must be an integer from 1 to 3.',
    ].join('\n');

    try {
        const providerResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: instruction }] }],
                    generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
                }),
            },
        );
        if (!providerResponse.ok) return response({ error: 'Prompt provider request failed.' }, 502);

        const providerBody = await providerResponse.json();
        const text = providerBody?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text !== 'string') return response({ error: 'Prompt provider returned no content.' }, 502);

        const parsed = JSON.parse(text.replace(/^```json\s*/i, '').replace(/\s*```$/, ''));
        const prompts = (Array.isArray(parsed?.prompts) ? parsed.prompts : [])
            .filter((item: unknown): item is { text: string; difficulty?: number } => (
                !!item && typeof item === 'object' && typeof (item as { text?: unknown }).text === 'string'
            ))
            .slice(0, count)
            .map((item) => ({
                id: crypto.randomUUID(),
                text: item.text.trim(),
                category: context,
                type: modality,
                difficulty: Number.isInteger(item.difficulty) && item.difficulty >= 1 && item.difficulty <= 3 ? item.difficulty : 2,
                isSelected: true,
                source: 'ai_generated',
            }))
            .filter((item) => item.text.length > 0 && item.text.length <= 1000);

        if (prompts.length === 0) return response({ error: 'Prompt provider returned no valid prompts.' }, 502);
        return response({ prompts, generatedBy: model });
    } catch {
        return response({ error: 'Prompt generation failed.' }, 502);
    }
});
