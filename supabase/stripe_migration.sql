-- ============================================================
-- Stripe Migration
-- Run in Supabase SQL Editor AFTER billing.sql
-- ============================================================

-- 1. Add Stripe fields to billing_subscriptions
ALTER TABLE billing_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id      TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_price_id         TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_billing_subs_stripe_customer
  ON billing_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_stripe_sub
  ON billing_subscriptions(stripe_subscription_id);

-- 2. billing_payments: drop the provider check and add 'stripe'
ALTER TABLE billing_payments
  DROP CONSTRAINT IF EXISTS billing_payments_provider_check;

ALTER TABLE billing_payments
  ADD CONSTRAINT billing_payments_provider_check
  CHECK (provider IN ('netopia', 'stripe'));

-- 3. Add stripe_invoice_id to billing_payments for idempotency
ALTER TABLE billing_payments
  ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT UNIQUE;

-- 4. invoices: add pdf_url + admin_note columns if missing
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS pdf_url    TEXT,
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- Grant access on new columns (permissions were already granted on tables)
GRANT SELECT, INSERT, UPDATE ON billing_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON billing_payments TO authenticated;
GRANT SELECT ON invoices TO authenticated;
