-- Fix: grant table-level privileges to service_role on billing_info.
-- The RLS policy for service_role existed but Postgres requires explicit
-- GRANT before any policy can fire. Without this, the service role gets
-- error code 42501 (permission denied) instead of bypassing RLS.

GRANT ALL ON TABLE billing_info TO service_role;
