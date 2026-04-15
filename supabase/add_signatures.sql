-- Migration to add signature fields and storage bucket

-- 1. Add signature fields to companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- 2. Add signature fields and public token to devize
ALTER TABLE public.devize
ADD COLUMN IF NOT EXISTS auto_shop_signature_url TEXT,
ADD COLUMN IF NOT EXISTS client_signature_url TEXT,
DROP COLUMN IF EXISTS public_token,
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE DEFAULT (substr(encode(gen_random_bytes(6), 'base64'), 1, 8)),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Semnat Service', 'Asteapta Semnatura Client', 'Finalizat'));

-- 3. Create a signatures storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS and setup policies for the signatures bucket
CREATE POLICY "Public Access for signatures" ON storage.objects
  FOR SELECT USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can upload signatures" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can update their own signatures" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'signatures');

CREATE POLICY "Authenticated users can delete their own signatures" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'signatures');

-- If you have a supabase local project, you can run this file via `supabase db push` or use the Supabase SQL Editor online.
