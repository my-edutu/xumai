import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create a Supabase client with the service role key to bypass RLS and read api_keys
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function authenticate(req: Request, requiredScopes: string[] = []): Promise<{ key_id: string; authorized: boolean; error?: string }> {
    const keyId = req.headers.get('X-XUM-Key-Id');
    const authHeader = req.headers.get('Authorization');

    if (!keyId || !authHeader || !authHeader.startsWith('Bearer ')) {
        return { key_id: '', authorized: false, error: 'Missing or invalid authentication headers. Expected X-XUM-Key-Id and Authorization: Bearer <secret>' };
    }

    const secret = authHeader.replace('Bearer ', '');

    // Fetch the API Key from the database
    const { data: apiKey, error } = await supabaseAdmin
        .from('api_keys')
        .select('key_id, secret_hash, status, rate_limit')
        .eq('key_id', keyId)
        .single();

    if (error || !apiKey) {
        return { key_id: keyId, authorized: false, error: 'Invalid API Key ID.' };
    }

    if (apiKey.status !== 'active') {
        return { key_id: keyId, authorized: false, error: 'API Key is revoked or inactive.' };
    }

    const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(secret),
    );
    const computedHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const isMatch = constantTimeEqual(computedHash, apiKey.secret_hash);
    if (!isMatch) {
        return { key_id: keyId, authorized: false, error: 'Invalid API Secret.' };
    }

    // Check Scopes if required
    if (requiredScopes.length > 0) {
        const { data: scopesData, error: scopesError } = await supabaseAdmin
            .from('api_key_scopes')
            .select('scope')
            .eq('key_id', keyId);

        if (scopesError || !scopesData) {
            return { key_id: keyId, authorized: false, error: 'Failed to verify API key scopes.' };
        }

        const assignedScopes = scopesData.map(s => s.scope);
        const hasAllRequiredScopes = requiredScopes.every(scope => assignedScopes.includes(scope));

        if (!hasAllRequiredScopes) {
            return { key_id: keyId, authorized: false, error: 'API Key does not have the required scopes.' };
        }
    }

    return { key_id: keyId, authorized: true };
}

function constantTimeEqual(left: string, right: string): boolean {
    if (left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) {
        difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return difference === 0;
}

export async function logApiRequest(keyId: string, endpoint: string, status: number, ipAddress: string) {
    try {
        await supabaseAdmin.from('api_logs').insert([
            {
                key_id: keyId,
                endpoint,
                status,
                ip_address: ipAddress
            }
        ]);
    } catch (err) {
        console.error('Failed to log API request', err);
    }
}
