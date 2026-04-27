-- ═══════════════════════════════════════════════════════════════
-- ALTHEA — Migration 003 : nom_cabinet, tagline, civilite
-- À exécuter dans Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Ajout du nom du cabinet et de l'accroche dans praticien_settings
ALTER TABLE praticien_settings
  ADD COLUMN IF NOT EXISTS nom_cabinet TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS tagline     TEXT DEFAULT '';

-- Ajout de la civilité dans patients
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS civilite TEXT DEFAULT '';
