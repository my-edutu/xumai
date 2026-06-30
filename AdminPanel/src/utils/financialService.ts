/**
 * XUM Admin Financial Service
 *
 * Handles all financial operations from the Admin Panel, including
 * payout approvals, wallet management, and billing processing.
 */

import { supabase } from '../supabaseClient';

export interface WorkerPayout {
    id: string;
    user_id: string;
    amount: number;
    contribution_count: number;
    contribution_weight: number;
    status: 'pending' | 'approved' | 'paid' | 'failed';
    created_at: string;
    user?: {
        full_name: string;
        email: string;
    };
    revenue_split?: {
        assignment_id: string;
    };
}

export interface CompanyWallet {
    id: string;
    company_id: string;
    available_balance: number;
    pending_balance: number;
    total_deposited: number;
    total_spent: number;
    currency: string;
    company?: {
        full_name: string;
        email: string;
    };
}

export interface BillingRequest {
    id: string;
    company_id: string;
    amount: number;
    currency: string;
    type: 'deposit' | 'subscription' | 'data_purchase';
    status: 'pending' | 'approved' | 'declined' | 'processing';
    payment_method: string;
    reference_id: string;
    created_at: string;
    company?: {
        full_name: string;
        email: string;
    };
}

export const financialService = {
    /**
     * Fetch pending payouts for workers
     */
    async getPendingPayouts(): Promise<WorkerPayout[]> {
        const { data, error } = await supabase
            .from('worker_payout_queue')
            .select(`
                *,
                user:users(full_name, email),
                revenue_split:dataset_revenue_splits(assignment_id)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching payouts:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Approve a worker payout
     */
    async approvePayout(payoutId: string) {
        // In a real system, this might trigger an external transfer via API
        // For now we update the status and transition the funds
        const { data, error } = await supabase
            .from('worker_payout_queue')
            .update({ status: 'approved' })
            .eq('id', payoutId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Fetch all company wallets
     */
    async getCompanyWallets(): Promise<CompanyWallet[]> {
        const { data, error } = await supabase
            .from('company_wallets')
            .select(`
                *,
                company:users(full_name, email)
            `);

        if (error) {
            console.error('Error fetching wallets:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Fetch company billing requests
     */
    async getBillingRequests(): Promise<BillingRequest[]> {
        const { data, error } = await supabase
            .from('billing_requests')
            .select(`
                *,
                company:users(full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching billing requests:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Approve a manual deposit request
     */
    async approveDeposit(billingId: string) {
        // Fetch the request first
        const { data: request, error: fetchError } = await supabase
            .from('billing_requests')
            .select('*')
            .eq('id', billingId)
            .single();

        if (fetchError || !request) throw new Error('Request not found');

        // Call the secure RPC function to process deposit
        const { data, error } = await supabase.rpc('handle_company_deposit', {
            p_company_id: request.company_id,
            p_amount: request.amount,
            p_reference: request.reference_id || `MANUAL-${request.id.substring(0, 8)}`,
            p_provider: 'manual_admin'
        });

        if (error) throw error;
        return data;
    },

    /**
     * Get platform-wide financial summary
     */
    async getFinancialStats() {
        const { data: wallets } = await supabase.from('company_wallets').select('available_balance, total_deposited');
        const { data: payouts } = await supabase.from('worker_payout_queue').select('amount').eq('status', 'paid');

        const totalLiquidity = wallets?.reduce((sum, w) => sum + Number(w.available_balance), 0) || 0;
        const totalDeposited = wallets?.reduce((sum, w) => sum + Number(w.total_deposited), 0) || 0;
        const totalPaid = payouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        return {
            totalLiquidity,
            totalDeposited,
            totalPaid,
            platformRevenue: totalDeposited * 0.20 // Assuming 20% average fee
        };
    }
};
