-- Master SQL file to apply all XUM AI modules in order
-- Instructions: Run this in the Supabase SQL Editor

\ir 00_schema.sql
\ir 01_auth_triggers.sql
\ir 02_rls_policies.sql
\ir 03_business_logic.sql
\ir 04_monitoring.sql
