-- ═══════════════════════════════════════════════════════════════
-- ALTHEA — Migration 005 : code postal + commune cabinet
-- À exécuter dans Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE praticien_settings
  ADD COLUMN IF NOT EXISTS code_postal TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS commune     TEXT DEFAULT '';
