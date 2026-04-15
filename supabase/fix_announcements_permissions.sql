-- 1. Grant base PostgreSQL permissions missing for PostgREST
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.announcements TO anon, authenticated, service_role;
GRANT ALL ON public.announcements TO service_role;

-- 2. Drop any confusing RLS policies
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.announcements;
DROP POLICY IF EXISTS "Announcements are viewable by authenticated users" ON public.announcements;

-- 3. Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 4. Add the SELECT policy for both anon and authenticated users just to be safe
CREATE POLICY "Announcements are viewable by everyone"
ON public.announcements FOR SELECT
USING (true);
