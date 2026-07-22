
CREATE POLICY "empresa_logos_select_own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'empresa-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "empresa_logos_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'empresa-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "empresa_logos_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'empresa-logos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'empresa-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "empresa_logos_delete_own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'empresa-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
