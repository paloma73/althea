-- ═══════════════════════════════════════════════════════════════
-- ALTHEA — Migration 007 : droits d'écriture base médicale commune
-- À exécuter dans Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Permet aux utilisateurs connectés d'ajouter et supprimer des entrées
CREATE POLICY "Insertion base médicale" ON medical_knowledge
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Suppression base médicale" ON medical_knowledge
  FOR DELETE TO authenticated USING (true);
