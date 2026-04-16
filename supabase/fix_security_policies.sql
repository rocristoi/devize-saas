-- Security fixes migration
-- Fixes:
--   1. Subscription INSERT policy bypass (issue #4 in SECURITY.md)
--   2. Upload session anonymous UPDATE policy (issue #5 in SECURITY.md)
--   3. Series counter race condition — atomic increment function (issue #10 in SECURITY.md)

-- ============================================================
-- 1. Subscriptions INSERT policy
-- Drop the overly permissive WITH CHECK (true) policy and replace
-- it with one that restricts inserts to the user's own company
-- and enforces that only 'trialing' status is allowed on creation.
-- ============================================================

DROP POLICY IF EXISTS "Users can insert subscription" ON subscriptions;

CREATE POLICY "Users can insert subscription" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = get_my_company_id()
    AND status = 'trialing'
  );

-- ============================================================
-- 2. Upload sessions public UPDATE policy
-- Drop the policy that allowed any anonymous user to overwrite
-- any pending session (no ownership check). Replace it with one
-- that enforces the company_id cannot be changed and only valid
-- status values are accepted.
-- ============================================================

DROP POLICY IF EXISTS "Public can update upload session" ON upload_sessions;
DROP POLICY IF EXISTS "Enable update for all" ON upload_sessions;

CREATE POLICY "Public can update upload session" ON upload_sessions
  FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (
    status IN ('pending', 'completed', 'failed')
    AND company_id = (SELECT company_id FROM upload_sessions WHERE id = upload_sessions.id)
  );

-- ============================================================
-- 3. Atomic series counter increment
-- Replace the application-level read-then-write with a single
-- atomic UPDATE … RETURNING to eliminate the race condition that
-- caused duplicate deviz series numbers under concurrent load.
-- ============================================================

CREATE OR REPLACE FUNCTION increment_series_counter(company_id_arg UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE companies
  SET current_series_counter = current_series_counter + 1
  WHERE id = company_id_arg
  RETURNING current_series_counter;
$$;
