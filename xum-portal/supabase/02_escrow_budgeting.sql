-- Escrow & Budgeting System for Company Portal
-- Version: 1.0
-- Ensures financial integrity between companies and contributors

-- 1. Company Balance Ledger (Main wallet for companies)
CREATE TABLE IF NOT EXISTS public.company_balances (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    main_balance DECIMAL(12,2) DEFAULT 0.00,
    escrow_balance DECIMAL(12,2) DEFAULT 0.00,
    total_deposited DECIMAL(12,2) DEFAULT 0.00,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Escrow Allocations (Links budget to specific projects)
CREATE TABLE IF NOT EXISTS public.escrow_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    allocated_amount DECIMAL(12,2) NOT NULL,
    released_amount DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    released_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_status CHECK (status IN ('active', 'partially_released', 'fully_released', 'refunded'))
);

-- 3. Function: Allocate Budget to Escrow
CREATE OR REPLACE FUNCTION allocate_project_escrow(
    p_company_id UUID,
    p_project_id UUID,
    p_amount DECIMAL
)
RETURNS UUID
AS $$
DECLARE
    v_allocation_id UUID;
    v_current_balance DECIMAL;
BEGIN
    -- Lock company balance row
    SELECT main_balance INTO v_current_balance
    FROM company_balances
    WHERE id = p_company_id
    FOR UPDATE;
    
    IF v_current_balance IS NULL THEN
        RAISE EXCEPTION 'Company balance record not found';
    END IF;
    
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Available: $%, Requested: $%', v_current_balance, p_amount;
    END IF;
    
    -- Move funds from main to escrow
    UPDATE company_balances
    SET 
        main_balance = main_balance - p_amount,
        escrow_balance = escrow_balance + p_amount,
        updated_at = now()
    WHERE id = p_company_id;
    
    -- Create allocation record
    INSERT INTO escrow_allocations (company_id, project_id, allocated_amount)
    VALUES (p_company_id, p_project_id, p_amount)
    RETURNING id INTO v_allocation_id;
    
    -- Log the transaction
    INSERT INTO company_transactions (company_id, amount, type, project_id, description)
    VALUES (p_company_id, -p_amount, 'spending', p_project_id, 'Escrow allocation for project');
    
    -- Update project budget
    UPDATE projects
    SET budget_limit = p_amount, updated_at = now()
    WHERE id = p_project_id;
    
    RETURN v_allocation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: Release Escrow on Approved Submission
CREATE OR REPLACE FUNCTION release_escrow_for_submission(
    p_submission_id UUID
)
RETURNS BOOLEAN
AS $$
DECLARE
    v_task RECORD;
    v_project RECORD;
    v_allocation RECORD;
    v_contributor_id UUID;
BEGIN
    -- Get submission details
    SELECT task_id, user_id INTO v_contributor_id, v_task
    FROM submissions
    WHERE id = p_submission_id AND status = 'approved';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Get task and project
    SELECT t.*, p.company_id, p.id as proj_id
    INTO v_task
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = (SELECT task_id FROM submissions WHERE id = p_submission_id);
    
    IF v_task.proj_id IS NULL THEN
        RETURN FALSE; -- Task not linked to a project
    END IF;
    
    -- Get escrow allocation
    SELECT * INTO v_allocation
    FROM escrow_allocations
    WHERE project_id = v_task.proj_id AND status IN ('active', 'partially_released')
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Release the reward amount from escrow
    UPDATE company_balances
    SET 
        escrow_balance = escrow_balance - v_task.reward,
        total_spent = total_spent + v_task.reward,
        updated_at = now()
    WHERE id = v_task.company_id;
    
    -- Update allocation
    UPDATE escrow_allocations
    SET 
        released_amount = released_amount + v_task.reward,
        status = CASE 
            WHEN released_amount + v_task.reward >= allocated_amount THEN 'fully_released'
            ELSE 'partially_released'
        END
    WHERE id = v_allocation.id;
    
    -- Update project spending
    UPDATE projects
    SET budget_spent = budget_spent + v_task.reward, updated_at = now()
    WHERE id = v_task.proj_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: Auto-release escrow when submission is approved
CREATE OR REPLACE FUNCTION trigger_release_escrow()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        PERFORM release_escrow_for_submission(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_submission_approved ON submissions;
CREATE TRIGGER on_submission_approved
    AFTER UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_release_escrow();

-- 6. RLS for new tables
ALTER TABLE public.company_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own balance" ON public.company_balances FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Companies can view own allocations" ON public.escrow_allocations FOR SELECT USING (auth.uid() = company_id);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_escrow_company ON escrow_allocations(company_id);
CREATE INDEX IF NOT EXISTS idx_escrow_project ON escrow_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_allocations(status);
