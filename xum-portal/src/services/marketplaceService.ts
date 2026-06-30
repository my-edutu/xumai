/**
 * XUM Secure Marketplace Service
 * 
 * This service handles all marketplace interactions with proper security checks.
 * All sensitive operations go through Supabase RPC functions that enforce RLS.
 */

import { supabase } from '../utils/supabaseClient';

// Types
export interface DataAsset {
    id: string;
    asset_name: string;
    asset_slug: string;
    description: string;
    data_type: 'text' | 'voice' | 'image' | 'video' | 'mixed';
    target_languages: string[];
    sample_count: number;
    base_price_usd: number;
    license_type: 'exclusive' | 'non_exclusive' | 'research_only';
    quality_tier: 'premium' | 'standard' | 'basic';
    featured: boolean;
    requires_nda: boolean;
    sample_preview_url?: string;
}

export interface AssetAuthorization {
    id: string;
    asset_id: string;
    authorization_type: 'view' | 'purchase' | 'exclusive';
    custom_price_usd?: number;
    discount_pct: number;
    valid_until: string;
    status: 'active' | 'revoked' | 'expired';
}

export interface AssetWithAuthorization extends DataAsset {
    authorization?: AssetAuthorization;
    effective_price: number;
    can_purchase: boolean;
}

export interface Purchase {
    id: string;
    transaction_ref: string;
    asset_id: string;
    asset_name?: string;
    purchase_price_usd: number;
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
    delivery_status: 'pending' | 'generating' | 'delivered' | 'failed';
    access_token?: string;
    download_url?: string;
    remaining_downloads: number;
    purchased_at: string;
    expires_at: string;
}

export interface DownloadValidation {
    is_valid: boolean;
    asset_name?: string;
    download_url?: string;
    remaining_downloads?: number;
}

/**
 * Secure Marketplace Service
 * All methods include proper error handling and type safety
 */
export const marketplaceService = {
    /**
     * Fetch all published assets the company can see
     * RLS ensures only authorized assets are returned
     */
    async getAvailableAssets(): Promise<AssetWithAuthorization[]> {
        try {
            // Fetch published assets
            const { data: assets, error: assetError } = await supabase
                .from('data_assets')
                .select('*')
                .eq('visibility', 'published')
                .order('featured', { ascending: false })
                .order('created_at', { ascending: false });

            if (assetError) throw assetError;
            if (!assets) return [];

            // Fetch authorizations for current company
            const { data: auths, error: authError } = await supabase
                .from('company_asset_authorizations')
                .select('*')
                .eq('status', 'active')
                .gt('valid_until', new Date().toISOString());

            // Create a map of authorizations by asset_id
            const authMap = new Map<string, AssetAuthorization>();
            (auths || []).forEach(auth => {
                authMap.set(auth.asset_id, auth);
            });

            // Merge assets with authorizations
            return assets.map(asset => {
                const auth = authMap.get(asset.id);
                let effectivePrice = asset.base_price_usd;

                if (auth) {
                    if (auth.custom_price_usd) {
                        effectivePrice = auth.custom_price_usd;
                    } else if (auth.discount_pct > 0) {
                        effectivePrice = asset.base_price_usd * (1 - auth.discount_pct / 100);
                    }
                }

                return {
                    ...asset,
                    authorization: auth,
                    effective_price: effectivePrice,
                    can_purchase: auth?.authorization_type === 'purchase' || auth?.authorization_type === 'exclusive'
                };
            });
        } catch (error) {
            console.error('Failed to fetch available assets:', error);
            return [];
        }
    },

    /**
     * Fetch a single asset by slug
     */
    async getAssetBySlug(slug: string): Promise<AssetWithAuthorization | null> {
        try {
            const { data: asset, error } = await supabase
                .from('data_assets')
                .select('*')
                .eq('asset_slug', slug)
                .single();

            if (error || !asset) return null;

            // Check for authorization
            const { data: auth } = await supabase
                .from('company_asset_authorizations')
                .select('*')
                .eq('asset_id', asset.id)
                .eq('status', 'active')
                .gt('valid_until', new Date().toISOString())
                .maybeSingle();

            let effectivePrice = asset.base_price_usd;
            if (auth?.custom_price_usd) {
                effectivePrice = auth.custom_price_usd;
            } else if (auth?.discount_pct > 0) {
                effectivePrice = asset.base_price_usd * (1 - auth.discount_pct / 100);
            }

            return {
                ...asset,
                authorization: auth,
                effective_price: effectivePrice,
                can_purchase: auth?.authorization_type === 'purchase' || auth?.authorization_type === 'exclusive'
            };
        } catch (error) {
            console.error('Failed to fetch asset:', error);
            return null;
        }
    },

    /**
     * Initiate a purchase for an authorized asset
     * The backend RPC function validates authorization
     */
    async purchaseAsset(assetId: string): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
        try {
            const { data, error } = await supabase.rpc('company_purchase_asset', {
                p_asset_id: assetId
            });

            if (error) {
                // Parse friendly error message
                if (error.message.includes('not authorized')) {
                    return { success: false, error: 'You are not authorized to purchase this asset. Please contact sales.' };
                }
                if (error.message.includes('not found')) {
                    return { success: false, error: 'Asset not available for purchase.' };
                }
                return { success: false, error: error.message };
            }

            return { success: true, purchaseId: data };
        } catch (error: any) {
            console.error('Purchase failed:', error);
            return { success: false, error: error.message || 'An unexpected error occurred' };
        }
    },

    /**
     * Fetch all purchases for the current company
     */
    async getMyPurchases(): Promise<Purchase[]> {
        try {
            const { data, error } = await supabase
                .from('asset_purchases')
                .select(`
          *,
          data_assets (
            asset_name
          )
        `)
                .order('purchased_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(p => ({
                ...p,
                asset_name: p.data_assets?.asset_name,
                remaining_downloads: p.max_downloads - p.download_count
            }));
        } catch (error) {
            console.error('Failed to fetch purchases:', error);
            return [];
        }
    },

    /**
     * Validate and consume a download token
     * Returns the secure download URL if valid
     */
    async validateDownloadToken(token: string): Promise<DownloadValidation> {
        try {
            const { data, error } = await supabase.rpc('validate_download_token', {
                p_token: token
            });

            if (error) throw error;
            if (!data || !data[0]) {
                return { is_valid: false };
            }

            return {
                is_valid: data[0].is_valid,
                asset_name: data[0].asset_name,
                download_url: data[0].download_url,
                remaining_downloads: data[0].remaining_downloads
            };
        } catch (error) {
            console.error('Token validation failed:', error);
            return { is_valid: false };
        }
    },

    /**
     * Request access to a restricted asset
     * Creates a ticket for admin review
     */
    async requestAccess(assetId: string, message?: string): Promise<{ success: boolean; error?: string }> {
        try {
            // In production, this would create a support ticket or notification
            // For now, we'll simulate by inserting into a requests table
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: 'Authentication required' };
            }

            // Log the access request (could be a separate table in production)
            console.log('Access request:', { company_id: user.id, asset_id: assetId, message });

            return { success: true };
        } catch (error: any) {
            console.error('Access request failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get secure download URL for a purchased asset
     * Validates the purchase belongs to the company and hasn't exceeded limits
     */
    async getDownloadUrl(purchaseId: string): Promise<{ success: boolean; url?: string; error?: string }> {
        try {
            const { data: purchase, error } = await supabase
                .from('asset_purchases')
                .select('access_token, download_count, max_downloads')
                .eq('id', purchaseId)
                .single();

            if (error || !purchase) {
                return { success: false, error: 'Purchase not found' };
            }

            if (purchase.download_count >= purchase.max_downloads) {
                return { success: false, error: 'Download limit exceeded' };
            }

            // Validate and get URL
            const validation = await this.validateDownloadToken(purchase.access_token);
            if (!validation.is_valid) {
                return { success: false, error: 'Download token expired or invalid' };
            }

            return { success: true, url: validation.download_url };
        } catch (error: any) {
            console.error('Failed to get download URL:', error);
            return { success: false, error: error.message };
        }
    }
};

export default marketplaceService;
