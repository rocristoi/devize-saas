ALTER TABLE public.devize DROP CONSTRAINT IF EXISTS devize_status_check;
ALTER TABLE public.devize ADD CONSTRAINT devize_status_check CHECK (status IN ('Draft', 'Semnat Service', 'Asteapta Semnatura Client', 'Finalizat'));
