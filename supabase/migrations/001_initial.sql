-- ═══════════════════════════════════════════════════════════════
-- ALTHEA — Schéma initial
-- À exécuter dans Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- TABLE PATIENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom          TEXT NOT NULL,
  nom             TEXT NOT NULL,
  date_naissance  DATE,
  telephone       TEXT,
  email           TEXT,
  notes_generales TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche par nom / prénom
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_nom ON patients(nom);

-- ─────────────────────────────────────────────
-- TABLE BILANS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bilans (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date_bilan          DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Formulaire clinique stocké en JSON flexible (évolutif)
  form_data           JSONB DEFAULT '{}',
  -- Compte rendu brut généré par l'IA
  compte_rendu        TEXT,
  -- Version finale validée / modifiée par le praticien
  compte_rendu_final  TEXT,
  -- brouillon | genere | valide
  status              TEXT NOT NULL DEFAULT 'brouillon',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bilans_user_id ON bilans(user_id);
CREATE INDEX IF NOT EXISTS idx_bilans_patient_id ON bilans(patient_id);
CREATE INDEX IF NOT EXISTS idx_bilans_date ON bilans(date_bilan DESC);

-- ─────────────────────────────────────────────
-- TABLE PDF_DOCUMENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pdf_documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bilan_id     UUID NOT NULL REFERENCES bilans(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  content_text TEXT DEFAULT '',   -- Texte extrait par pdf-parse
  file_size    INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdf_bilan_id ON pdf_documents(bilan_id);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- Chaque utilisateur ne voit QUE ses propres données
-- ─────────────────────────────────────────────

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bilans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;

-- Patients : CRUD pour le propriétaire uniquement
CREATE POLICY "patients_select" ON patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "patients_update" ON patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "patients_delete" ON patients FOR DELETE USING (auth.uid() = user_id);

-- Bilans : CRUD pour le propriétaire
CREATE POLICY "bilans_select" ON bilans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bilans_insert" ON bilans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bilans_update" ON bilans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bilans_delete" ON bilans FOR DELETE USING (auth.uid() = user_id);

-- PDF : visible si le bilan parent appartient à l'utilisateur
CREATE POLICY "pdf_select" ON pdf_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bilans b WHERE b.id = bilan_id AND b.user_id = auth.uid()
  ));
CREATE POLICY "pdf_insert" ON pdf_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM bilans b WHERE b.id = bilan_id AND b.user_id = auth.uid()
  ));
CREATE POLICY "pdf_delete" ON pdf_documents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM bilans b WHERE b.id = bilan_id AND b.user_id = auth.uid()
  ));

-- ─────────────────────────────────────────────
-- Trigger : mise à jour automatique de updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bilans_updated_at
  BEFORE UPDATE ON bilans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
