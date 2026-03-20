-- ═══════════════════════════════════════════════════════════════
-- ALTHEA — Migration 002 : praticien_settings + knowledge_docs
-- À exécuter dans Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- TABLE PRATICIEN_SETTINGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS praticien_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre               TEXT DEFAULT '',
  prenom              TEXT DEFAULT '',
  nom                 TEXT DEFAULT '',
  specialite          TEXT DEFAULT '',
  rpps                TEXT DEFAULT '',
  adresse_cabinet     TEXT DEFAULT '',
  telephone_cabinet   TEXT DEFAULT '',
  email_cabinet       TEXT DEFAULT '',
  sections_actives    JSONB DEFAULT '{"motif":true,"douleur":true,"antecedents":true,"postural":true,"dynamique":true,"podologie":true,"musculo":true,"mandibulaire":true,"conclusion":true,"axes":true,"exercices":true}'::jsonb,
  sections_labels     JSONB DEFAULT '{"motif":"Motif de consultation","douleur":"Douleurs","antecedents":"Antécédents","postural":"Examen postural statique","dynamique":"Analyse dynamique","podologie":"Examen podologique","musculo":"Analyse musculaire et articulaire","mandibulaire":"Observations mandibulaires / oculaires","conclusion":"Conclusion clinique","axes":"Axes thérapeutiques","exercices":"Exercices et conseils"}'::jsonb,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_praticien_settings_user_id ON praticien_settings(user_id);

-- ─────────────────────────────────────────────
-- TABLE KNOWLEDGE_DOCS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_docs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  content_text TEXT DEFAULT '',
  file_size    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_docs_user_id ON knowledge_docs(user_id);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE praticien_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_docs ENABLE ROW LEVEL SECURITY;

-- praticien_settings : CRUD pour le propriétaire
CREATE POLICY "praticien_settings_select" ON praticien_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "praticien_settings_insert" ON praticien_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "praticien_settings_update" ON praticien_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "praticien_settings_delete" ON praticien_settings FOR DELETE USING (auth.uid() = user_id);

-- knowledge_docs : CRUD pour le propriétaire
CREATE POLICY "knowledge_docs_select" ON knowledge_docs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "knowledge_docs_insert" ON knowledge_docs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "knowledge_docs_delete" ON knowledge_docs FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Trigger updated_at pour praticien_settings
-- ─────────────────────────────────────────────
CREATE TRIGGER praticien_settings_updated_at
  BEFORE UPDATE ON praticien_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
