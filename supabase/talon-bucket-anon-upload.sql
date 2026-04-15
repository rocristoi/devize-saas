-- Allow unauthenticated (mobile) devices to upload talon images
-- Only scoped to the scans/ prefix inside the talon-pics bucket

CREATE POLICY "Anon users can upload talon scans"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'talon-pics'
  AND (storage.foldername(name))[1] = 'scans'
);

CREATE POLICY "Anon users can view talon scans"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id = 'talon-pics'
  AND (storage.foldername(name))[1] = 'scans'
);
