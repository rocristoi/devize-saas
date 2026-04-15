-- script to create talon-pics bucket and policies

INSERT INTO storage.buckets (id, name, public) 
VALUES ('talon-pics', 'talon-pics', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload talon pics" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'talon-pics');

CREATE POLICY "Authenticated users can view talon pics"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'talon-pics');

CREATE POLICY "Authenticated users can delete their own talon pics"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'talon-pics');
