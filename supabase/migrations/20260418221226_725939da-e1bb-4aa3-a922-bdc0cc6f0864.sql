-- Storage policies for verification-docs bucket (worker ID uploads)
CREATE POLICY "Workers upload own verification docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Workers read own verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin(auth.uid())
  )
);

CREATE POLICY "Workers update own verification docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for job-photos bucket (hirer uploads, signed-in viewers)
CREATE POLICY "Hirers upload own job photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated can view job photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'job-photos');

CREATE POLICY "Hirers delete own job photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Avatars: public read, owner write
CREATE POLICY "Avatars publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);