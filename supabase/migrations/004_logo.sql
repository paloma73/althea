-- ═══════════════════════════════════════════════════════════════
-- ALTHEA — Migration 004 : logo praticien
-- À exécuter dans Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Colonnes logo dans praticien_settings
ALTER TABLE praticien_settings
  ADD COLUMN IF NOT EXISTS logo_url    TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS logo_width  INTEGER DEFAULT 180,
  ADD COLUMN IF NOT EXISTS logo_height INTEGER DEFAULT 60;

-- Bucket de stockage des logos (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies : chaque praticien gère son propre dossier
CREATE POLICY IF NOT EXISTS "logos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY IF NOT EXISTS "logos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY IF NOT EXISTS "logos_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY IF NOT EXISTS "logos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
