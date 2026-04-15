-- Migration: billing_info table
-- Stores the billing contact for SaaS invoices (separate from the 'companies'
-- table which describes the user's own auto-repair shop).
--
-- Supports two entity types:
--   'juridica'  → Persoană Juridică (CUI, Denumire, Reg. Com, Adresă)
--   'fizica'    → Persoană Fizică   (Nume + Prenume, Adresă)

CREATE TABLE IF NOT EXISTS billing_info (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('juridica', 'fizica')),

  -- Persoană Juridică fields (required when type = 'juridica')
  company_name  TEXT,
  cui           TEXT,
  reg_com       TEXT,

  -- Persoană Fizică fields (required when type = 'fizica')
  first_name    TEXT,
  last_name     TEXT,

  -- Shared address fields
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  county      TEXT NOT NULL,

  -- Contact (used for invoice emails)
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  -- One billing profile per user
  UNIQUE (user_id)
);

-- Auto-update updated_at
CREATE TRIGGER set_billing_info_updated_at
  BEFORE UPDATE ON billing_info
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- RLS
ALTER TABLE billing_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own billing info"
  ON billing_info FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own billing info"
  ON billing_info FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own billing info"
  ON billing_info FOR UPDATE
  USING (user_id = auth.uid());

-- Allow service role full access (needed by /api/payments/create)
CREATE POLICY "Service role full access to billing_info"
  ON billing_info FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant table-level privileges so RLS policies can actually fire
-- (Supabase does not auto-grant these for manually created tables)
GRANT SELECT, INSERT, UPDATE ON billing_info TO anon, authenticated;
GRANT ALL ON TABLE billing_info TO service_role;
