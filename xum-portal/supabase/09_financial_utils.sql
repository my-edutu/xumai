-- Financial Utilities
-- Version: 1.1

CREATE OR REPLACE FUNCTION handle_company_deposit(
    p_company_id UUID,
    p_amount DECIMAL,
    p_reference TEXT
)
RETURNS VOID
AS $$
BEGIN
    -- Update balance
    INSERT INTO public.company_balances (id, main_balance, total_deposited)
    VALUES (p_company_id, p_amount, p_amount)
    ON CONFLICT (id) DO UPDATE
    SET 
        main_balance = company_balances.main_balance + p_amount,
        total_deposited = company_balances.total_deposited + p_amount,
        updated_at = now();
    
    -- Log transaction
    INSERT INTO public.company_transactions (company_id, amount, type, description, metadata)
    VALUES (
        p_company_id, 
        p_amount, 
        'deposit', 
        'Deposit via payment gateway', 
        jsonb_build_object('reference', p_reference)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
