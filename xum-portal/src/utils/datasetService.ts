import { supabase } from './supabase';

export const companyDatasetService = {
    /**
     * Fetches all available datasets for purchase.
     */
    async getMarketplaceDatasets() {
        const { data, error } = await supabase
            .from('dataset_batches')
            .select('*')
            .eq('status', 'ready');

        if (error) throw error;
        return data;
    },

    /**
     * Fetches datasets currently owned by the company.
     */
    async getOwnedDatasets() {
        const { data, error } = await supabase
            .from('dataset_assignments')
            .select('*, batch:dataset_batches(*)')
            .eq('status', 'active');

        if (error) throw error;
        return data;
    },

    /**
     * Initiates a purchase for a specific dataset.
     */
    async purchaseDataset(batchId: string, price: number) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Unauthorized");

        const { data, error } = await supabase
            .rpc('assign_dataset_to_company', {
                p_batch_id: batchId,
                p_company_id: userData.user.id,
                p_price: price
            });

        if (error) throw error;
        return data;
    }
};
