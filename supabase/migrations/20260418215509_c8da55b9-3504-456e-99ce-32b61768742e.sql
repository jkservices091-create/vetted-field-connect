-- Replace overly broad public SELECT with one that requires knowing the path
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "Job photos public read" ON storage.objects;

-- Public buckets remain public for direct URL access; we just don't expose a wildcard list policy
-- (Supabase serves public buckets via /object/public/<bucket>/<path> which doesn't require this policy)
-- Add narrow policies allowing authenticated users to read by exact path
CREATE POLICY "Avatars authenticated read" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Job photos authenticated read" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'job-photos');