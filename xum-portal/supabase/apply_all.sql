-- Apply All Company Schema Migrations
-- Run this file to apply all company-specific tables and functions

-- Base schema (profiles, projects, transactions)
\i 'company_schema.sql'

-- Financial integrity (escrow, budgeting)
\i '02_escrow_budgeting.sql'

-- Dataset packaging and versioning
\i '03_dataset_exports.sql'

-- Webhook notifications
\i '04_webhooks.sql'

-- API key management
\i '05_api_keys.sql'

-- Marketplace for selling datasets
\i '06_marketplace.sql'

-- Verify all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'company_profiles',
    'projects',
    'company_transactions',
    'company_api_keys',
    'company_balances',
    'escrow_allocations',
    'dataset_exports',
    'dataset_versions',
    'export_queue',
    'company_webhooks',
    'webhook_events',
    'api_request_logs',
    'marketplace_datasets',
    'dataset_purchases',
    'dataset_reviews'
);
