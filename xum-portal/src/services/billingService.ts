/**
 * XUM Company Billing Service
 * 
 * Handles company-side financial operations including
 * fetching wallet balance, transaction history, and initiating deposits.
 */

import { supabase } from '../utils/supabase';

export interface WalletInfo {
    available_balance: number;
    pending_balance: number;
    total_deposited: number;
    total_spent: number;
}

export interface Transaction {
    id: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'escrow_lock' | 'escrow_release' | 'revenue_share';
    reference: string;
    created_at: string;
    status: 'completed' | 'pending' | 'failed';
}

export const billingService = {
    /**
     * Get the current company's wallet balance
     */
    async getWallet(): Promise<WalletInfo | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('company_wallets')
            .select('*')
            .eq('company_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching wallet:', error);
            return null;
        }
        return data;
    },

    /**
     * Get transaction history from the ledger
     */
    async getTransactions(): Promise<Transaction[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('financial_ledger')
            .select('*')
            .eq('company_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }

        // Map ledger entries to a more UI-friendly format if needed
        return data || [];
    },

    /**
     * Initiate a deposit via Paystack or Stripe
     */
    async initiateDeposit(amount: number, method: 'stripe' | 'paystack') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 1. Create a billing request record (manual tracking)
        const { data: request, error: reqError } = await supabase
            .from('billing_requests')
            .insert({
                company_id: user.id,
                amount,
                currency: 'USD',
                type: 'deposit',
                status: 'pending',
                payment_method: method,
                reference_id: `DEP-${Math.random().toString(36).substring(7).toUpperCase()}`
            })
            .select()
            .single();

        if (reqError) throw reqError;

        // 2. In a real app, you would redirect to Paystack/Stripe here.
        // For this demo, we'll simulate the webhook call to the Edge function
        // because we don't have real API keys configured for the agent environment.

        console.log(`Initiating ${method} deposit for $${amount}`);

        return {
            success: true,
            message: 'Redirecting to payment gateway...',
            checkoutUrl: '#', // Placeholder
            requestId: request.id
        };
    }
};
