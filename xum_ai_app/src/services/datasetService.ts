/**
 * XUM AI — Dataset Service
 *
 * Builds structured AI training datasets from approved submissions.
 *   • Query approved submissions by task type
 *   • Create named datasets and link submission items
 *   • List datasets (admin / company use)
 *   • Aggregate stats for dashboard
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient';

// ============================================================================
// GUARD
// ============================================================================

function ensureSupabase(tag: string): boolean {
    if (!isSupabaseConfigured) {
        console.warn(`[${tag}] Supabase not configured — skipping`);
        return false;
    }
    return true;
}

// ============================================================================
// TYPES
// ============================================================================

export interface Dataset {
    id: string;
    name: string;
    description?: string;
    task_type: string;
    item_count: number;
    status: 'building' | 'ready' | 'exported' | 'active';
    metadata: Record<string, any>;
    created_at: string;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch approved submissions of a specific task type, newest first.
 */
export async function getApprovedSubmissionsByType(
    taskType: string,
    limit: number = 50
): Promise<any[]> {
    if (!ensureSupabase('ApprovedSubs')) return [];
    try {
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('status', 'approved')
            .eq('submission_data->>task_type', taskType)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.warn('[ApprovedSubs] Query error:', error.message);
            return [];
        }
        return data ?? [];
    } catch (err: any) {
        console.warn('[ApprovedSubs] Error:', err.message);
        return [];
    }
}

/**
 * Create a new dataset from a list of approved submission IDs.
 * Inserts into `datasets` and `dataset_items` tables.
 */
export async function createDataset(
    name: string,
    taskType: string,
    submissionIds: string[],
    description?: string
): Promise<{ success: boolean; datasetId?: string; error?: string }> {
    if (!ensureSupabase('CreateDataset')) return { success: false, error: 'Not configured' };
    try {
        const { data, error } = await supabase
            .from('datasets')
            .insert({
                name,
                description: description ?? null,
                task_type: taskType,
                item_count: submissionIds.length,
                status: 'building',
                metadata: {},
            })
            .select()
            .single();

        if (error || !data) {
            console.warn('[CreateDataset] Insert error:', error?.message);
            return { success: false, error: error?.message ?? 'Dataset creation failed' };
        }

        // Insert dataset_items in batch
        if (submissionIds.length > 0) {
            const items = submissionIds.map((sid) => ({
                dataset_id: data.id,
                submission_id: sid,
            }));
            const { error: itemError } = await supabase.from('dataset_items').insert(items);
            if (itemError) {
                console.warn('[CreateDataset] Items insert error:', itemError.message);
            }
        }

        // Mark dataset as ready
        await supabase
            .from('datasets')
            .update({ status: 'ready' })
            .eq('id', data.id);

        return { success: true, datasetId: data.id };
    } catch (err: any) {
        return { success: false, error: err.message ?? 'Unknown error' };
    }
}

/**
 * Trigger the SQL function to generate a lexicon dataset.
 */
export async function generateLexiconDataset(
    name: string,
    category?: string
): Promise<{ success: boolean; dataset?: any; error?: string }> {
    if (!ensureSupabase('GenLexDataset')) return { success: false, error: 'Not configured' };
    try {
        const { data, error } = await supabase.rpc('generate_lexicon_dataset', {
            p_name: name,
            p_category: category ?? null
        });

        if (error) {
            console.warn('[GenLexDataset] RPC error:', error.message);
            return { success: false, error: error.message };
        }

        return { success: true, dataset: data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * List all datasets, optionally filtered by status.
 */
export async function getDatasets(status?: string): Promise<Dataset[]> {
    if (!ensureSupabase('Datasets')) return [];
    try {
        let query = supabase
            .from('datasets')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) {
            console.warn('[Datasets] Query error:', error.message);
            return [];
        }
        return data ?? [];
    } catch (err: any) {
        console.warn('[Datasets] Error:', err.message);
        return [];
    }
}

// ============================================================================
// MARKETPLACE TYPES
// ============================================================================

export interface MarketplaceDataset {
    id: string;
    name: string;
    description?: string;
    language: string;
    task_type: string;
    size_mb: number;
    quality_score: number;
    price_usd: number;
    samples_count: number;
    status: 'available' | 'sold_out' | 'draft';
    created_at: string;
}

export interface DatasetPurchase {
    id: string;
    user_id: string;
    dataset_id: string;
    price_paid: number;
    purchased_at: string;
    download_url?: string;
    datasets?: MarketplaceDataset;
}

// ============================================================================
// MARKETPLACE QUERIES
// ============================================================================

/**
 * Fetch datasets available for purchase in the marketplace.
 */
export async function getMarketplaceDatasets(filters?: {
    language?: string;
    task_type?: string;
    sort?: 'price_asc' | 'price_desc' | 'quality' | 'size';
}): Promise<MarketplaceDataset[]> {
    if (!ensureSupabase('MarketplaceDatasets')) return [];
    try {
        let query = supabase
            .from('marketplace_datasets')
            .select('*')
            .eq('status', 'available');

        if (filters?.language) query = query.eq('language', filters.language);
        if (filters?.task_type) query = query.eq('task_type', filters.task_type);

        switch (filters?.sort) {
            case 'price_asc': query = query.order('price_usd', { ascending: true }); break;
            case 'price_desc': query = query.order('price_usd', { ascending: false }); break;
            case 'quality': query = query.order('quality_score', { ascending: false }); break;
            case 'size': query = query.order('size_mb', { ascending: false }); break;
            default: query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query.limit(50);
        if (error) {
            console.warn('[MarketplaceDatasets] Query error:', error.message);
            return [];
        }
        return data ?? [];
    } catch (err: any) {
        console.warn('[MarketplaceDatasets] Error:', err.message);
        return [];
    }
}

/**
 * Purchase a dataset — calls the purchase_dataset RPC.
 */
export async function purchaseDataset(
    userId: string,
    datasetId: string
): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
    if (!ensureSupabase('PurchaseDataset')) return { success: false, error: 'Not configured' };
    try {
        const { data, error } = await supabase.rpc('purchase_dataset', {
            p_user_id: userId,
            p_dataset_id: datasetId,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, purchaseId: data };
    } catch (err: any) {
        return { success: false, error: err.message ?? 'Unknown error' };
    }
}

/**
 * Fetch the datasets purchased by a user.
 * Tries the likely purchase table names and falls back to a plain row query
 * if the relation alias is not available in the current schema.
 */
export async function getUserPurchases(userId: string): Promise<DatasetPurchase[]> {
    if (!ensureSupabase('UserPurchases')) return [];

    const candidateTables = ['dataset_purchases', 'marketplace_purchases', 'purchases'];

    for (const tableName of candidateTables) {
        const joinedResult = await fetchUserPurchasesFromTable(tableName, userId, true);
        if (joinedResult.ok) {
            return joinedResult.rows;
        }

        const plainResult = await fetchUserPurchasesFromTable(tableName, userId, false);
        if (plainResult.ok) {
            return plainResult.rows;
        }
    }

    return [];
}

async function fetchUserPurchasesFromTable(
    tableName: string,
    userId: string,
    includeDatasetJoin: boolean
): Promise<{ ok: boolean; rows: DatasetPurchase[] }> {
    try {
        const selectClause = includeDatasetJoin
            ? 'id, user_id, dataset_id, price_paid, purchased_at, download_url, datasets:marketplace_datasets(*)'
            : 'id, user_id, dataset_id, price_paid, purchased_at, download_url';

        const { data, error } = await supabase
            .from(tableName)
            .select(selectClause)
            .eq('user_id', userId)
            .order('purchased_at', { ascending: false });

        if (error) {
            const relationLabel = includeDatasetJoin ? 'with join' : 'without join';
            console.warn(`[UserPurchases] ${tableName} query ${relationLabel} failed:`, error.message);
            return { ok: false, rows: [] };
        }

        return {
            ok: true,
            rows: (data ?? []).map((row: any) => ({
                id: row.id,
                user_id: row.user_id,
                dataset_id: row.dataset_id,
                price_paid: Number(row.price_paid ?? 0),
                purchased_at: row.purchased_at,
                download_url: row.download_url ?? undefined,
                datasets: row.datasets
                    ? {
                        id: row.datasets.id,
                        name: row.datasets.name,
                        description: row.datasets.description ?? undefined,
                        language: row.datasets.language,
                        task_type: row.datasets.task_type,
                        size_mb: Number(row.datasets.size_mb ?? 0),
                        quality_score: Number(row.datasets.quality_score ?? 0),
                        price_usd: Number(row.datasets.price_usd ?? 0),
                        samples_count: Number(row.datasets.samples_count ?? 0),
                        status: row.datasets.status,
                        created_at: row.datasets.created_at,
                    }
                    : undefined,
            })),
        };
    } catch (err: any) {
        console.warn(`[UserPurchases] ${tableName} query error:`, err.message);
        return { ok: false, rows: [] };
    }
}

/**
 * Transitions an internal dataset to the public marketplace.
 */
export async function publishDatasetToMarketplace(
    datasetId: string,
    params: {
        priceUsd: number;
        language: string;
        description?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    if (!ensureSupabase('PublishDataset')) return { success: false, error: 'Not configured' };
    try {
        // 1. Fetch source dataset
        const { data: source, error: fetchError } = await supabase
            .from('datasets')
            .select('*')
            .eq('id', datasetId)
            .single();

        if (fetchError || !source) {
            return { success: false, error: fetchError?.message ?? 'Source dataset not found' };
        }

        // 2. Insert into marketplace_datasets
        const { error: insertError } = await supabase
            .from('marketplace_datasets')
            .insert({
                name: source.name,
                description: params.description ?? source.description,
                language: params.language,
                task_type: source.task_type,
                price_usd: params.priceUsd,
                samples_count: source.item_count,
                quality_score: 85, // Default/Assumed quality for verified datasets
                status: 'available',
            });

        if (insertError) {
            console.warn('[PublishDataset] Insert error:', insertError.message);
            return { success: false, error: insertError.message };
        }

        // 3. Update source status
        await supabase
            .from('datasets')
            .update({ status: 'exported' })
            .eq('id', datasetId);

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message ?? 'Unknown error' };
    }
}

/**
 * Count approved submissions grouped by task type — for dashboard stats.
 */
export async function getDatasetStats(): Promise<Record<string, number>> {
    if (!ensureSupabase('DatasetStats')) return {};
    try {
        const { data } = await supabase
            .from('submissions')
            .select('submission_data')
            .eq('status', 'approved');

        const counts: Record<string, number> = {};
        (data ?? []).forEach((row: any) => {
            const type: string = (row.submission_data as any)?.task_type ?? 'unknown';
            counts[type] = (counts[type] ?? 0) + 1;
        });

        return counts;
    } catch (err: any) {
        console.warn('[DatasetStats] Error:', err.message);
        return {};
    }
}
