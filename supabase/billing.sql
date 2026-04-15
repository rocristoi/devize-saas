-- ============================================================
-- Billing System Schema for Devize Auto Koders SaaS
-- Run AFTER schema.sql (depends on companies, user_profiles)
-- ============================================================

-- ============================================================
-- 1. PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT        NOT NULL,
  price_monthly  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  price_yearly   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  trial_days     INT         NOT NULL DEFAULT 14,
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default plan
INSERT INTO plans (id, name, price_monthly, price_yearly, trial_days)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Pro',
  80.00,
  800.00,
  14
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. BILLING SUBSCRIPTIONS  (new, decoupled from old table)
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id           UUID        NOT NULL REFERENCES companies(id)  ON DELETE CASCADE,
  plan_id              UUID        NOT NULL REFERENCES plans(id),
  status               TEXT        NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'overdue', 'expired', 'canceled')),
  billing_cycle        TEXT        NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  trial_end            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_subs_user_id    ON billing_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_company_id ON billing_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_status     ON billing_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_subs_period_end ON billing_subscriptions(current_period_end);

-- ============================================================
-- 3. BILLING PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_payments (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id     UUID        NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
  amount              NUMERIC(10, 2) NOT NULL,
  currency            TEXT        NOT NULL DEFAULT 'RON',
  status              TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed')),
  provider            TEXT        NOT NULL DEFAULT 'netopia',
  provider_payment_id TEXT        UNIQUE,        -- Netopia orderId — unique enforces idempotency
  provider_response   JSONB,                     -- raw IPN payload for audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_user_id         ON billing_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_subscription_id ON billing_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_status          ON billing_payments(status);

-- ============================================================
-- 4. INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id      UUID        NOT NULL REFERENCES companies(id)  ON DELETE CASCADE,
  subscription_id UUID        NOT NULL REFERENCES billing_subscriptions(id) ON DELETE CASCADE,
  payment_id      UUID        REFERENCES billing_payments(id) ON DELETE SET NULL,
  amount          NUMERIC(10, 2) NOT NULL,
  currency        TEXT        NOT NULL DEFAULT 'RON',
  status          TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'issued', 'canceled')),
  invoice_number  TEXT        UNIQUE,
  issued_at       TIMESTAMPTZ,
  due_date        TIMESTAMPTZ NOT NULL,
  pdf_url         TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id         ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id      ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status          ON invoices(status);

-- ============================================================
-- 5. COUPONS
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT        NOT NULL UNIQUE,
  type        TEXT        NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value       NUMERIC(10, 2) NOT NULL,
  max_uses    INT         NOT NULL DEFAULT 1,
  used_count  INT         NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- ============================================================
-- 6. COUPON REDEMPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coupon_id   UUID        NOT NULL REFERENCES coupons(id)    ON DELETE CASCADE,
  payment_id  UUID        REFERENCES billing_payments(id)    ON DELETE SET NULL,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, coupon_id)   -- one redemption per user per coupon
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id   ON coupon_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON coupon_redemptions(coupon_id);

-- ============================================================
-- 7. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at_billing()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_billing_subs_updated_at') THEN
    CREATE TRIGGER set_billing_subs_updated_at
      BEFORE UPDATE ON billing_subscriptions
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at_billing();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_billing_payments_updated_at') THEN
    CREATE TRIGGER set_billing_payments_updated_at
      BEFORE UPDATE ON billing_payments
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at_billing();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_invoices_updated_at') THEN
    CREATE TRIGGER set_invoices_updated_at
      BEFORE UPDATE ON invoices
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at_billing();
  END IF;
END $$;

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE plans                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions     ENABLE ROW LEVEL SECURITY;

-- Plans: readable by all authenticated users
CREATE POLICY "plans_select_authenticated" ON plans
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- Billing subscriptions: users see only their own
CREATE POLICY "billing_subs_select_own" ON billing_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "billing_subs_insert_own" ON billing_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "billing_subs_update_own" ON billing_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Billing payments: users see only their own
CREATE POLICY "billing_payments_select_own" ON billing_payments
  FOR SELECT USING (user_id = auth.uid());

-- Invoices: users see only their own
CREATE POLICY "invoices_select_own" ON invoices
  FOR SELECT USING (user_id = auth.uid());

-- Coupons: readable by authenticated (only active/non-expired — enforced in app)
CREATE POLICY "coupons_select_authenticated" ON coupons
  FOR SELECT TO authenticated USING (is_active = TRUE);

-- Coupon redemptions: users see their own
CREATE POLICY "coupon_redemptions_select_own" ON coupon_redemptions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- 9. GRANTS  (service_role bypasses RLS — used by API routes)
-- ============================================================
GRANT ALL ON plans, billing_subscriptions, billing_payments,
             invoices, coupons, coupon_redemptions TO service_role;
GRANT SELECT ON plans, billing_subscriptions, billing_payments,
                invoices, coupons, coupon_redemptions TO authenticated;

-- ============================================================
-- 10. HELPER FUNCTIONS
-- ============================================================

-- Atomically increments a coupon's used_count.
-- Called from the billing API after recording a coupon_redemption.
CREATE OR REPLACE FUNCTION increment_coupon_used_count(coupon_id_arg UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id_arg;
$$;

-- Returns the active billing subscription for the current user.
-- Useful for RLS-safe client-side queries.
CREATE OR REPLACE FUNCTION get_my_billing_subscription()
RETURNS SETOF billing_subscriptions
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM billing_subscriptions
  WHERE user_id = auth.uid()
    AND status IN ('trialing', 'active', 'overdue')
  ORDER BY created_at DESC
  LIMIT 1;
$$;
