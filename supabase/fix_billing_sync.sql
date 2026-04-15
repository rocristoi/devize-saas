-- ============================================================
-- Fix billing_subscriptions: remove 'pending' status and
-- deduplicate rows so each user has at most one row.
--
-- Run in Supabase SQL Editor AFTER stripe_migration.sql
-- ============================================================

-- 1. Migrate any rows stuck in 'pending' status to 'trialing'
--    (they were created by the old checkout code before a Stripe
--     subscription was linked — treat them as still starting).
UPDATE billing_subscriptions
SET status = 'trialing'
WHERE status = 'pending';

-- 2. Drop the old CHECK constraint and recreate it without 'pending'
ALTER TABLE billing_subscriptions
  DROP CONSTRAINT IF EXISTS billing_subscriptions_status_check;

ALTER TABLE billing_subscriptions
  ADD CONSTRAINT billing_subscriptions_status_check
  CHECK (status IN ('trialing', 'active', 'overdue', 'expired', 'canceled'));

-- 3. Deduplicate: for each user, keep only the most-recently-created row
--    and delete the rest.
--
--    Strategy:
--      a) For each user, find the row with the latest stripe_subscription_id
--         (i.e. the one actually linked to Stripe). If none is linked, take
--         the most-recently created row.
--      b) Delete all other rows for that user.
--
--    We use a CTE to rank rows per user and delete the non-winners.
WITH ranked AS (
  SELECT
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        -- Prefer rows that are actually linked to Stripe
        (stripe_subscription_id IS NOT NULL)::int DESC,
        -- Among those, prefer the most recently updated
        updated_at DESC,
        created_at DESC
    ) AS rn
  FROM billing_subscriptions
)
DELETE FROM billing_subscriptions
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- 4. Add a partial unique index so future code cannot accidentally insert
--    a second active/trialing row for the same user.
--    We allow multiple 'canceled'/'expired' rows historically, but enforce
--    at most one non-terminal row per user.
--
--    NOTE: This is a best-effort guard. The application code (checkout route)
--    is the primary enforcer — it always upserts rather than inserting.
DROP INDEX IF EXISTS idx_billing_subs_one_active_per_user;
CREATE UNIQUE INDEX idx_billing_subs_one_active_per_user
  ON billing_subscriptions (user_id)
  WHERE status IN ('trialing', 'active', 'overdue');
