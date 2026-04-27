import type { Patient, Bilan, SectionKey } from '@/types'

/**
 * Construit le prompt système pour la génération de compte rendu.
 * Positionne l'IA comme assistant de rédaction, pas comme médecin.
 */
export function buildSystemPrompt(
  knowledgeTexts: string[] = [],
  medicalTexts: string[] = []
): string {
  let prompt = `Tu es un assistant de rédaction clinique pour un professionnel de santé (orthopédiste, orthésiste, podologue, posturologue).

Ton rôle est d'aider à rédiger un compte rendu clinique structuré et professionnel à partir des données saisies par le praticien.

RÈGLES ABSOLUES :
- Tu rédiges un document de synthèse clinique, pas un diagnostic médical automatique.
- Le praticien reste entièrement responsable de la validation et des décisions cliniques.
- Ton texte doit être sobre, professionnel, lisible, sans jargon excessif ni ton marketing.
- Pas de puces ou listes sauf si elles apportent une vraie clarté.
- Pas de phrases d'introduction inutiles comme "Voici le compte rendu de...".
- Commence directement par le contenu clinique.
- Structure le document avec des titres clairs séparés par une ligne vide.
- N'invente aucune donnée clinique. Si une section est vide, ne la mentionne pas.
- Longueur : complète mais concise. Adapte la longueur aux données disponibles.
- Langue : français professionnel médical.`

  if (medicalTexts.length > 0) {
    const medicalContent = medicalTexts.join('\n')
    prompt += `\n\nBASE DE CONNAISSANCES MÉDICALE (terminologie et références cliniques) :\n${medicalContent}\n\nUtilise cette base pour enrichir la terminologie et la précision clinique du compte rendu.`
  }

  if (knowledgeTexts.length > 0) {
    const knowledgeContent = knowledgeTexts
      .slice(0, 3)
      .map((t, i) => `--- Document praticien ${i + 1} ---\n${t.substring(0, 500)}`)
      .join('\n\n')
    prompt += `\n\nDOCUMENTS PERSONNELS DU PRATICIEN :\n${knowledgeContent}\n\nPriorise ces documents pour la terminologie spécifique au praticien.`
  }

  return prompt
}

/**
 * Construit le prompt utilisateur à partir des données patient, bilan et PDF.
 * sectionsActives permet de n'inclure que les sections activées par le praticien.
 */
export function buildUserPrompt(
  patient: Patient,
  bilan: Bilan,
  pdfTexts: string[],
  sectionsActives?: Partial<Record<SectionKey, boolean>>
): string {
  const f = bilan.form_data
  const age = patient.date_naissance
    ? `${new Date().getFullYear() - new Date(patient.date_naissance).getFullYear()} ans`
    : 'âge non renseigné'

  // Helper to check if a section is active (defaults to true if not specified)
  const isActive = (key: SectionKey): boolean => {
    if (!sectionsActives) return true
    return sectionsActives[key] !== false
  }

  const sections: string[] = []

  sections.push(`PATIENT : ${patient.prenom} ${patient.nom} — ${age}`)
  sections.push(`Date du bilan : ${new Date(bilan.date_bilan).toLocaleDateString('fr-FR')}`)

  if (isActive('motif') && f.motif_consultation) {
    sections.push(`\nMOTIF DE CONSULTATION\n${f.motif_consultation}`)
  }

  // Douleurs
  if (isActive('douleur')) {
    const douleurParts = [
      f.douleur_localisation && `Localisation : ${f.douleur_localisation}`,
      f.douleur_intensite && `Intensité : ${f.douleur_intensite}`,
      f.douleur_type && `Type : ${f.douleur_type}`,
      f.douleur_evolution && `Évolution : ${f.douleur_evolution}`,
    ].filter(Boolean)
    if (douleurParts.length > 0) {
      sections.push(`\nDOULEURS\n${douleurParts.join('\n')}`)
    }
  }

  // Antécédents
  if (isActive('antecedents')) {
    const antecedentsParts = [
      f.antecedents_medicaux && `Médicaux : ${f.antecedents_medicaux}`,
      f.antecedents_chirurgicaux && `Chirurgicaux : ${f.antecedents_chirurgicaux}`,
      f.antecedents_traumatiques && `Traumatiques : ${f.antecedents_traumatiques}`,
      f.traitements_en_cours && `Traitements en cours : ${f.traitements_en_cours}`,
    ].filter(Boolean)
    if (antecedentsParts.length > 0) {
      sections.push(`\nANTÉCÉDENTS\n${antecedentsParts.join('\n')}`)
    }
  }

  // Examen postural
  if (isActive('postural')) {
    const posturalParts = [
      f.postural_vue_frontale && `Vue frontale : ${f.postural_vue_frontale}`,
      f.postural_vue_sagittale && `Vue sagittale : ${f.postural_vue_sagittale}`,
      f.postural_vue_posterieure && `Vue postérieure : ${f.postural_vue_posterieure}`,
      f.postural_observations && `Observations : ${f.postural_observations}`,
    ].filter(Boolean)
    if (posturalParts.length > 0) {
      sections.push(`\nEXAMEN POSTURAL STATIQUE\n${posturalParts.join('\n')}`)
    }
  }

  // Analyse dynamique
  if (isActive('dynamique')) {
    const dynamiqueParts = [
      f.dynamique_marche && `Marche : ${f.dynamique_marche}`,
      f.dynamique_course && `Course : ${f.dynamique_course}`,
      f.dynamique_observations && `Observations : ${f.dynamique_observations}`,
    ].filter(Boolean)
    if (dynamiqueParts.length > 0) {
      sections.push(`\nANALYSE DYNAMIQUE\n${dynamiqueParts.join('\n')}`)
    }
  }

  // Examen podologique
  if (isActive('podologie')) {
    const podologieParts = [
      f.podologie_morphologie && `Morphologie : ${f.podologie_morphologie}`,
      f.podologie_appuis && `Appuis : ${f.podologie_appuis}`,
      f.podologie_chaussage && `Chaussage : ${f.podologie_chaussage}`,
      f.podologie_observations && `Observations : ${f.podologie_observations}`,
    ].filter(Boolean)
    if (podologieParts.length > 0) {
      sections.push(`\nEXAMEN PODOLOGIQUE\n${podologieParts.join('\n')}`)
    }
  }

  // Musculo-articulaire
  if (isActive('musculo')) {
    const musculoParts = [
      f.musculo_amplitudes && `Amplitudes articulaires : ${f.musculo_amplitudes}`,
      f.musculo_testing && `Testing musculaire : ${f.musculo_testing}`,
      f.musculo_tensions && `Tensions / raideurs : ${f.musculo_tensions}`,
      f.musculo_observations && `Observations : ${f.musculo_observations}`,
    ].filter(Boolean)
    if (musculoParts.length > 0) {
      sections.push(`\nANALYSE MUSCULAIRE ET ARTICULAIRE\n${musculoParts.join('\n')}`)
    }
  }

  // Mandibulaire / oculaire
  if (isActive('mandibulaire')) {
    const mandibParts = [
      f.mandibulaire_observations && `Mandibulaire : ${f.mandibulaire_observations}`,
      f.oculaire_observations && `Oculaire : ${f.oculaire_observations}`,
    ].filter(Boolean)
    if (mandibParts.length > 0) {
      sections.push(`\nOBSERVATIONS COMPLÉMENTAIRES\n${mandibParts.join('\n')}`)
    }
  }

  if (isActive('conclusion') && f.conclusion_clinique) {
    sections.push(`\nCONCLUSION CLINIQUE\n${f.conclusion_clinique}`)
  }

  if (isActive('axes') && f.axes_therapeutiques) {
    sections.push(`\nAXES THÉRAPEUTIQUES\n${f.axes_therapeutiques}`)
  }

  if (isActive('exercices') && f.exercices_conseils) {
    sections.push(`\nEXERCICES ET CONSEILS\n${f.exercices_conseils}`)
  }

  if (f.notes_libres) {
    sections.push(`\nNOTES COMPLÉMENTAIRES\n${f.notes_libres}`)
  }

  // Contexte PDF
  if (pdfTexts.length > 0) {
    const pdfContent = pdfTexts
      .map((t, i) => `--- Document ${i + 1} ---\n${t.substring(0, 3000)}`)
      .join('\n\n')
    sections.push(`\nDOCUMENTS CLINIQUES FOURNIS PAR LE PRATICIEN\n${pdfContent}`)
  }

  sections.push(`\n---\nÀ partir de ces données, rédige un compte rendu clinique structuré et professionnel.`)

  return sections.join('\n')
}
