
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS combustivel_modo text NOT NULL DEFAULT 'manual'
    CHECK (combustivel_modo IN ('manual','auto_m2')),
  ADD COLUMN IF NOT EXISTS pdf_url text;

-- Storage policies para bucket privado 'propostas-pdf'
DROP POLICY IF EXISTS "prop_pdf_read_own" ON storage.objects;
DROP POLICY IF EXISTS "prop_pdf_write_own" ON storage.objects;
DROP POLICY IF EXISTS "prop_pdf_update_own" ON storage.objects;
DROP POLICY IF EXISTS "prop_pdf_delete_own" ON storage.objects;

CREATE POLICY "prop_pdf_read_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'propostas-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "prop_pdf_write_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'propostas-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "prop_pdf_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'propostas-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "prop_pdf_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'propostas-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);
