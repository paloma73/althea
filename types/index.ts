// ─────────────────────────────────────────────
// Types globaux de l'application Althea
// ─────────────────────────────────────────────

export interface Patient {
  id: string
  user_id: string
  civilite: string | null
  prenom: string
  nom: string
  date_naissance: string | null
  telephone: string | null
  email: string | null
  notes_generales: string | null
  created_at: string
  updated_at: string
}

export interface PdfDocument {
  id: string
  bilan_id: string
  filename: string
  content_text: string
  file_size: number
  created_at: string
}

// Données du formulaire clinique structuré
export interface BilanFormData {
  // Section 1 – Motif de consultation
  motif_consultation: string

  // Section 2 – Douleurs
  douleur_localisation: string
  douleur_intensite: string
  douleur_type: string
  douleur_evolution: string

  // Section 3 – Antécédents
  antecedents_medicaux: string
  antecedents_chirurgicaux: string
  antecedents_traumatiques: string
  traitements_en_cours: string

  // Section 4 – Examen postural statique
  postural_vue_frontale: string
  postural_vue_sagittale: string
  postural_vue_posterieure: string
  postural_observations: string

  // Section 5 – Analyse dynamique
  dynamique_marche: string
  dynamique_course: string
  dynamique_observations: string

  // Section 6 – Examen podologique
  podologie_morphologie: string
  podologie_appuis: string
  podologie_chaussage: string
  podologie_observations: string

  // Section 7 – Analyse musculaire et articulaire
  musculo_amplitudes: string
  musculo_testing: string
  musculo_tensions: string
  musculo_observations: string

  // Section 8 – Observations mandibulaires / oculaires
  mandibulaire_observations: string
  oculaire_observations: string

  // Section 9 – Conclusion clinique
  conclusion_clinique: string

  // Section 10 – Axes thérapeutiques
  axes_therapeutiques: string

  // Section 11 – Exercices et conseils
  exercices_conseils: string

  // Zone notes libres
  notes_libres: string
}

export type BilanStatus = 'brouillon' | 'genere' | 'valide'

export interface Bilan {
  id: string
  patient_id: string
  user_id: string
  date_bilan: string
  form_data: BilanFormData
  compte_rendu: string | null
  compte_rendu_final: string | null
  status: BilanStatus
  created_at: string
  updated_at: string
  // Relations
  patient?: Patient
  pdf_documents?: PdfDocument[]
}

// Payload de création
export type CreatePatientPayload = Omit<Patient, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type CreateBilanPayload = Omit<Bilan, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'patient' | 'pdf_documents'>

// ─────────────────────────────────────────────
// Praticien Settings
// ─────────────────────────────────────────────

export type SectionKey =
  | 'motif'
  | 'douleur'
  | 'antecedents'
  | 'postural'
  | 'dynamique'
  | 'podologie'
  | 'musculo'
  | 'mandibulaire'
  | 'conclusion'
  | 'axes'
  | 'exercices'

export interface PraticienSettings {
  id: string
  user_id: string
  nom_cabinet: string
  tagline: string
  logo_url: string | null
  logo_width: number
  logo_height: number
  titre: string
  prenom: string
  nom: string
  specialite: string
  rpps: string
  adresse_cabinet: string
  telephone_cabinet: string
  email_cabinet: string
  sections_actives: Record<SectionKey, boolean>
  sections_labels: Record<SectionKey, string>
  created_at: string
  updated_at: string
}

export const DEFAULT_SECTIONS_ACTIVES: Record<SectionKey, boolean> = {
  motif: true,
  douleur: true,
  antecedents: true,
  postural: true,
  dynamique: true,
  podologie: true,
  musculo: true,
  mandibulaire: true,
  conclusion: true,
  axes: true,
  exercices: true,
}

export const DEFAULT_SECTIONS_LABELS: Record<SectionKey, string> = {
  motif: 'Motif de consultation',
  douleur: 'Douleurs',
  antecedents: 'Antécédents',
  postural: 'Examen postural statique',
  dynamique: 'Analyse dynamique',
  podologie: 'Examen podologique',
  musculo: 'Analyse musculaire et articulaire',
  mandibulaire: 'Observations mandibulaires / oculaires',
  conclusion: 'Conclusion clinique',
  axes: 'Axes thérapeutiques',
  exercices: 'Exercices et conseils',
}

// ─────────────────────────────────────────────
// Knowledge Docs
// ─────────────────────────────────────────────

export interface KnowledgeDoc {
  id: string
  user_id: string
  filename: string
  content_text: string
  file_size: number
  created_at: string
}
