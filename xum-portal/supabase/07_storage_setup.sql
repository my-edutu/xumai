-- Storage Setup for Company Datasets
-- Version: 1.0

-- 1. Create Datasets Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for Datasets Bucket
-- Only authenticated users (admins or the company owner) can access files

-- Companies can only see their own folders (convention: datasets/company_id/...)
CREATE POLICY "Companies can view their own dataset exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'datasets' AND 
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
);

-- Note: Functions will use service_role to upload, so no need for INSERT/UPDATE policies 
-- unless we want companies to manually upload (which they don't in this flow).
