import { supabase } from '../supabaseClient';
import * as Crypto from 'expo-crypto';

export interface ApiKey {
  id: string;
  key_id: string;
  client_name: string;
  scopes: string[];
  status: 'active' | 'revoked';
  environment: 'test' | 'live';
  created_at: string;
  last_used_at: string | null;
}

/**
 * Service to manage Enterprise API Keys for a company.
 */
export const ApiKeyService = {
  /**
   * Generates a new API key and secret.
   * Returns the raw secret ONLY ONCE. The database only stores a hash.
   */
  async generateApiKey(companyId: string, clientName: string, environment: 'test' | 'live' = 'live'): Promise<{ key: ApiKey | null, rawSecret: string | null, error: string | null }> {
    try {
      // 1. Generate cryptographically secure identifiers. Never use Math.random
      // for credentials and never send the raw secret back to the API.
      const bytes = await Crypto.getRandomBytesAsync(32);
      const randomHex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
      const keyId = `xum_${environment}_${randomHex.substring(0, 16)}`;
      const rawSecret = `xum_${environment}_${randomHex}`;

      // 2. Hash the secret before storing it (NEVER store raw secrets)
      const hashedSecret = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawSecret
      );

      // 3. Insert into database
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          company_id: companyId,
          key_id: keyId,
          name: clientName,
          secret_hash: hashedSecret,
          environment: environment,
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error inserting API key:', error);
        return { key: null, rawSecret: null, error: error.message };
      }

      const scopes = ['tasks:read', 'tasks:create', 'projects:read'];
      const { error: scopesError } = await supabase
        .from('api_key_scopes')
        .insert(scopes.map(scope => ({ key_id: keyId, scope })));

      if (scopesError) {
        await supabase.from('api_keys').delete().eq('id', data.id);
        return { key: null, rawSecret: null, error: scopesError.message };
      }

      // Return both the DB record (the Key/ID) and the raw secret (to show the user ONCE)
      return {
        key: { ...data, key_id: data.key_id, client_name: data.name, scopes, last_used_at: null } as ApiKey,
        rawSecret,
        error: null
      };
    } catch (err: any) {
      console.error('Failed to generate API key:', err);
      return { key: null, rawSecret: null, error: err.message };
    }
  },

  /**
   * Fetches API keys owned by the current company/user.
   */
  async getApiKeys(companyId: string): Promise<{ keys: ApiKey[], error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, key_id, name, status, environment, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        return { keys: [], error: error.message };
      }

      const keys = await Promise.all((data || []).map(async (key: any) => {
        const { data: scopeRows } = await supabase
          .from('api_key_scopes')
          .select('scope')
          .eq('key_id', key.key_id);
        return {
          ...key,
          client_name: key.name,
          scopes: (scopeRows || []).map((row: { scope: string }) => row.scope),
          last_used_at: null,
        } as ApiKey;
      }));

      return { keys, error: null };
    } catch (err: any) {
      return { keys: [], error: err.message };
    }
  },

  /**
   * Revokes an active API key immediately.
   */
  async revokeApiKey(keyId: string): Promise<{ success: boolean, error: string | null }> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ status: 'revoked' })
        .eq('id', keyId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};
