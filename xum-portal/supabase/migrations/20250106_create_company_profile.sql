-- Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'Free',
    plan_code TEXT NOT NULL DEFAULT 'FREE',
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policy for reading public company data (or restrict as needed)
CREATE POLICY "Allow read access to company data"
ON companies FOR SELECT
USING (true);

-- Insert Global AI Corp data if it doesn't exist
INSERT INTO companies (name, plan, plan_code, logo_url)
SELECT 'Global AI Corp', 'Premium Plan', 'GA', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM companies WHERE name = 'Global AI Corp'
);

-- Output the inserted/existing ID for reference (optional usage in frontend)
SELECT * FROM companies WHERE name = 'Global AI Corp';
