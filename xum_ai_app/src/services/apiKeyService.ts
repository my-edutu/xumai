import { supabase } from '../supabaseClient';
import * as Crypto from 'expo-crypto';

export interface ApiKey {
  id: string;
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
      // 1. Generate a raw secure secret
      // Prefix with xum_[env]_ to make it identifiable
      const randomBytes = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString() + Date.now().toString()
      );
      const rawSecret = `xum_${environment}_${randomBytes.substring(0, 32)}`;

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
          client_name: clientName,
          hashed_secret: hashedSecret,
          environment: environment,
          scopes: ['tasks:read', 'tasks:create', 'projects:read'], // Default scopes
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error inserting API key:', error);
        return { key: null, rawSecret: null, error: error.message };
      }

      // Return both the DB record (the Key/ID) and the raw secret (to show the user ONCE)
      return { key: data as ApiKey, rawSecret, error: null };
    } catch (err: any) {
      console.error('Failed to generate API key:', err);
      return { key: null, rawSecret: null, error: err.message };
    }
  },

  /**
   * Fetches all API keys for the current company/user.
   */
  async getApiKeys(): Promise<{ keys: ApiKey[], error: string | null }> {
    try {
      // In a real multi-tenant app, you'd filter by company_id. 
      // For now, we fetch all keys (assuming RLS handles visibility or it's a single-tenant admin view)
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, client_name, scopes, status, environment, created_at, last_used_at')
        .order('created_at', { ascending: false });

      if (error) {
        return { keys: [], error: error.message };
      }

      return { keys: data as ApiKey[], error: null };
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
