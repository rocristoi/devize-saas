-- ─────────────────────────────────────────────────────────────────────────────
-- FIX: After security_hardening.sql revoked all anon grants and re-granted only
-- SELECT on upload_sessions, the mobile upload flow was broken because:
--   1. Anon needs UPDATE on upload_sessions (to set status=completed + image_url)
--   2. Anon needs INSERT on storage.objects for the talon-pics bucket
-- The existing RLS policies already restrict UPDATE to pending sessions only,
-- so granting UPDATE at the table level is safe.
-- ─────────────────────────────────────────────────────────────────────────────

-- Allow anonymous mobile users to update their upload session
GRANT UPDATE ON public.upload_sessions TO anon;

-- Allow anonymous mobile users to insert files into storage
-- (RLS on storage.objects already restricts this to the talon-pics bucket)
GRANT INSERT ON storage.objects TO anon;
