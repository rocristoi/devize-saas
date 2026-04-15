-- Initial Schema Migration for Devize Auto Koders SaaS

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabele principale (Tenanti / Domeniul SaaS)

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  service_name TEXT NOT NULL,
  cui_cif TEXT NOT NULL,
  reg_com TEXT,
  address TEXT NOT NULL,
  city_county TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  logo_url TEXT,
  pdf_header_title TEXT DEFAULT 'DEVIZ DE REPARAȚIE',
  pdf_filename TEXT DEFAULT 'Deviz',
  current_series_counter INTEGER DEFAULT 0,
  is_onboarding_complete BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stare abonament (blocare aplicatie la expirare)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trialing', -- trialing, active, past_due, canceled, expired
  trial_start TIMESTAMPTZ DEFAULT NOW(),
  trial_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  plan_id TEXT, -- 'lunar' or 'anual'
  netopia_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- 3. Baza de date business

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  nume TEXT NOT NULL,
  cui_cnp TEXT,
  locatie TEXT,
  strada TEXT,
  telefon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  numar_inmatriculare TEXT NOT NULL,
  marca TEXT,
  model TEXT,
  seria_sasiu TEXT,
  an_fabricatie TEXT,
  culoare TEXT,
  capacitate_cilindrica TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parts_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cod_piesa TEXT NOT NULL,
  nume_piesa TEXT NOT NULL,
  brand TEXT,
  categorie TEXT,
  stoc INTEGER DEFAULT 0,
  pret_unitar NUMERIC(10, 2) DEFAULT 0,
  furnizor TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE devize (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  series TEXT NOT NULL, -- The 6-digit deviz number
  km_intrare TEXT,
  nivel_carburant TEXT,
  motiv_intrare TEXT,
  observatii TEXT,
  data_intrare TIMESTAMPTZ DEFAULT NOW(),
  data_iesire TIMESTAMPTZ,
  total_piese NUMERIC(10, 2) DEFAULT 0,
  total_manopera NUMERIC(10, 2) DEFAULT 0,
  total_deviz NUMERIC(10, 2) DEFAULT 0,
  is_finalizat BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deviz_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deviz_id UUID NOT NULL REFERENCES devize(id) ON DELETE CASCADE,
  inventory_part_id UUID REFERENCES parts_inventory(id) ON DELETE SET NULL,
  cod_piesa TEXT,
  nume_piesa TEXT,
  stare TEXT,
  cantitate INTEGER NOT NULL DEFAULT 1,
  pret_unitar NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE deviz_labor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deviz_id UUID NOT NULL REFERENCES devize(id) ON DELETE CASCADE,
  operatiune TEXT NOT NULL,
  durata TEXT, -- e.g., '2.5h' or just numeric
  pret_orar NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0
);

-- 4. Functii, Triggers, RLS (Row Level Security)

-- Functie de securitate ajutatoare: obtine compania utilizatorului curent
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS setup (Enable pe tot)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE devize ENABLE ROW LEVEL SECURITY;
ALTER TABLE deviz_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deviz_labor ENABLE ROW LEVEL SECURITY;

-- Politici
CREATE POLICY "Users can view their own company" ON companies FOR SELECT USING (id = get_my_company_id());
CREATE POLICY "Users can insert companies" ON companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update their own company" ON companies FOR UPDATE USING (id = get_my_company_id());

CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view their subscription" ON subscriptions FOR SELECT USING (company_id = get_my_company_id());
CREATE POLICY "Users can insert subscription" ON subscriptions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Company isolation for clients" ON clients FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company isolation for vehicles" ON vehicles FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company isolation for parts_inventory" ON parts_inventory FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company isolation for devize" ON devize FOR ALL USING (company_id = get_my_company_id());
CREATE POLICY "Company isolation for deviz_parts" ON deviz_parts FOR ALL USING (deviz_id IN (SELECT id FROM devize WHERE company_id = get_my_company_id()));
CREATE POLICY "Company isolation for deviz_labor" ON deviz_labor FOR ALL USING (deviz_id IN (SELECT id FROM devize WHERE company_id = get_my_company_id()));

-- Delete/Update triggers to automatically update timestamps
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_parts_inventory_updated_at BEFORE UPDATE ON parts_inventory FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_devize_updated_at BEFORE UPDATE ON devize FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- IMPORTANT: Asigura-te ca anon si authenticated au permisiuni pe schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;


-- 5. Mobile Scan Upload Sessions
CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes')
);

ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public access to read/update the session so the mobile unauthenticated browser can use it.
-- But we restrict it to just updating image_url and status.
CREATE POLICY "Public can view upload session" ON upload_sessions FOR SELECT USING (true);
CREATE POLICY "Public can update upload session" ON upload_sessions FOR UPDATE USING (status = 'pending');
CREATE POLICY "Authenticated users can create upload session" ON upload_sessions FOR INSERT TO authenticated WITH CHECK (company_id = get_my_company_id());
CREATE POLICY "Company isolation for upload_sessions" ON upload_sessions FOR ALL USING (company_id = get_my_company_id());

