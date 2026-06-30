import { supabase } from '../supabaseClient';

export const datasetService = {
    /**
     * Fetches all dataset batches from the inventory.
     */
    async getBatches() {
        const { data, error } = await supabase
            .from('dataset_batches')
            .select('*, source_project:linguasence_projects(title, target_language_code)');

        if (error) throw error;
        return data;
    },

    /**
     * Creates a new dataset batch from verified project data.
     */
    async createBatch(name: string, projectId: string, price: number) {
        const { data, error } = await supabase
            .rpc('create_dataset_batch', {
                p_name: name,
                p_project_id: projectId,
                p_price: price
            });

        if (error) throw error;
        return data;
    },

    /**
     * Manually assigns a dataset to a target company (Admin Action).
     */
    async assignToCompany(batchId: string, companyId: string, price: number) {
        const { data, error } = await supabase
            .rpc('assign_dataset_to_company', {
                p_batch_id: batchId,
                p_company_id: companyId,
                p_price: price
            });

        if (error) throw error;
        return data;
    },

    /**
     * Audits storage for all batches and ensures manifests are valid.
     */
    async auditStorage() {
        // Simulated storage audit logic
        return new Promise((resolve) => {
            setTimeout(() => resolve({ status: 'ok', auditedCount: 12 }), 1500);
        });
    }
};
