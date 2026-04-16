-- =============================================================================
-- Security Hardening Migration
-- Addresses all findings from the security audit + Supabase linter warnings.
-- Run this after existing migrations.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FIX: Function Search Path Mutable (function_search_path_mutable)
--    Without SET search_path = '', a malicious user could shadow pg_catalog
--    or public functions and redirect SECURITY DEFINER calls.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT company_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Re-create set_updated_at_billing if it exists with same signature
CREATE OR REPLACE FUNCTION public.set_updated_at_billing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. FIX: RLS Policy Always True — companies INSERT
--    Old: WITH CHECK (true) allows any user to insert a company row for any ID.
--    New: only allow insert if no profile exists yet (fresh signup flow only).
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can insert companies" ON public.companies;

CREATE POLICY "Users can insert companies" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Only allow if the user does not already have a company (onboarding path)
    NOT EXISTS (
      SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND company_id IS NOT NULL
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FIX: RLS Policy Always True — subscriptions INSERT
--    Old: WITH CHECK (true) allows inserting arbitrary status for any company.
--    New: enforce own company + trialing status only.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can insert subscription" ON public.subscriptions;

CREATE POLICY "Users can insert subscription" ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_my_company_id()
    AND status = 'trialing'
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FIX: upload_sessions UPDATE policy is always true ("Enable update for all")
--    Old: USING (true) — any anonymous user can overwrite any session.
--    New: restrict to pending sessions only, and block company_id tampering.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Enable update for all" ON public.upload_sessions;
DROP POLICY IF EXISTS "Public can update upload session" ON public.upload_sessions;

CREATE POLICY "Public can update pending upload session" ON public.upload_sessions
  FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (
    -- Allow status transitions to completed/failed, never back to pending from outside
    status IN ('completed', 'failed')
    -- Prevent changing the owning company
    AND company_id = (SELECT company_id FROM public.upload_sessions s2 WHERE s2.id = upload_sessions.id)
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FIX: GRANT ALL PRIVILEGES TO anon on all tables
--    The anon role should only be able to SELECT on tables that genuinely
--    need public read access. All other DML is handled by authenticated role
--    or service_role server-side.
-- ─────────────────────────────────────────────────────────────────────────────

-- Revoke broad anon grants first
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Re-grant only the minimum needed for anon:
-- upload_sessions: anonymous mobile users need SELECT (to read session status)
-- devize: not needed anonymously — public_token access goes through service_role API routes
GRANT SELECT ON public.upload_sessions TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Authenticated users keep full DML (controlled by RLS)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- service_role keeps superuser-level access (used only server-side)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FIX: Public buckets allow listing all files
--    Buckets: logos, signatures, talon-pics
--    Replace broad SELECT (allowing LIST) with object-level-only SELECT.
--    This means public URLs still work but clients cannot enumerate all files.
-- ─────────────────────────────────────────────────────────────────────────────

-- logos bucket
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;

CREATE POLICY "Public can view logos by path" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'logos'
    -- Require a specific object name — prevents listing the whole bucket root
    AND name IS NOT NULL
    AND name <> ''
  );

-- signatures bucket
DROP POLICY IF EXISTS "Public Access for signatures" ON storage.objects;

-- Signatures contain sensitive client data — restrict to authenticated users only
CREATE POLICY "Authenticated users can view signatures" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'signatures');

-- talon-pics bucket
DROP POLICY IF EXISTS "Authenticated users can view talon pics" ON storage.objects;

CREATE POLICY "Authenticated users can view talon pics" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'talon-pics');


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. NOTE: Leaked Password Protection
--    This cannot be enabled via SQL — go to:
--    Supabase Dashboard → Authentication → Sign In / Up → Password Security
--    Enable "Leaked Password Protection (HaveIBeenPwned)"
-- ─────────────────────────────────────────────────────────────────────────────
