import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  PageNumber,
  Footer,
  Header,
  SectionType,
} from 'docx'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const bilan_id = searchParams.get('bilan_id')

  if (!bilan_id) {
    return NextResponse.json({ error: 'bilan_id requis' }, { status: 400 })
  }

  // Récupère le bilan avec patient
  const { data: bilan, error: bilanError } = await supabase
    .from('bilans')
    .select('*, patient:patients(*)')
    .eq('id', bilan_id)
    .eq('user_id', user.id)
    .single()

  if (bilanError || !bilan) {
    return NextResponse.json({ error: 'Bilan introuvable' }, { status: 404 })
  }

  const patient = bilan.patient
  if (!patient) {
    return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })
  }

  // Récupère les paramètres praticien
  const { data: praticienSettings } = await supabase
    .from('praticien_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const f = bilan.form_data
  const dateBilan = new Date(bilan.date_bilan).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const age = patient.date_naissance
    ? `${new Date().getFullYear() - new Date(patient.date_naissance).getFullYear()} ans`
    : null

  const dob = patient.date_naissance
    ? new Date(patient.date_naissance).toLocaleDateString('fr-FR')
    : null

  // Helper : crée un paragraphe de titre de section
  function sectionTitle(text: string): Paragraph {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 120 },
      border: {
        bottom: { color: '3B82F6', size: 4, style: BorderStyle.SINGLE },
      },
    })
  }

  // Helper : crée un paragraphe de label+valeur
  function labelValue(label: string, value: string): Paragraph {
    return new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: `${label} : `, bold: true, size: 22 }),
        new TextRun({ text: value, size: 22 }),
      ],
    })
  }

  // Helper : crée un paragraphe de texte simple
  function bodyParagraph(text: string): Paragraph {
    return new Paragraph({
      text,
      spacing: { after: 100 },
      style: 'Normal',
    })
  }

  // Contenu principal
  const children: Paragraph[] = []

  // ── En-tête praticien ──
  if (praticienSettings) {
    const nomPraticien = [
      praticienSettings.titre,
      praticienSettings.prenom,
      praticienSettings.nom,
    ].filter(Boolean).join(' ')

    if (nomPraticien) {
      children.push(new Paragraph({
        children: [new TextRun({ text: nomPraticien, bold: true, size: 28 })],
        spacing: { after: 60 },
      }))
    }
    if (praticienSettings.specialite) {
      children.push(new Paragraph({
        children: [new TextRun({ text: praticienSettings.specialite, size: 24, color: '6B7280' })],
        spacing: { after: 60 },
      }))
    }
    if (praticienSettings.adresse_cabinet) {
      children.push(new Paragraph({
        children: [new TextRun({ text: praticienSettings.adresse_cabinet, size: 20, color: '6B7280' })],
        spacing: { after: 40 },
      }))
    }
    if (praticienSettings.telephone_cabinet) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Tél : ${praticienSettings.telephone_cabinet}`, size: 20, color: '6B7280' })],
        spacing: { after: 40 },
      }))
    }
    if (praticienSettings.rpps) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `N° RPPS : ${praticienSettings.rpps}`, size: 20, color: '6B7280' })],
        spacing: { after: 40 },
      }))
    }
    children.push(new Paragraph({ text: '', spacing: { after: 200 } }))
  }

  // ── Titre du document ──
  children.push(new Paragraph({
    text: 'COMPTE RENDU DE BILAN',
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  }))

  children.push(new Paragraph({
    children: [new TextRun({ text: `Date d'examen : ${dateBilan}`, size: 22, italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }))

  // ── Informations patient ──
  children.push(sectionTitle('Informations Patient'))

  children.push(labelValue('Nom', `${patient.prenom} ${patient.nom}`))
  if (dob) {
    children.push(labelValue('Date de naissance', `${dob}${age ? ` (${age})` : ''}`))
  }
  if (patient.telephone) {
    children.push(labelValue('Téléphone', patient.telephone))
  }

  // ── Sections cliniques ──
  const sectionsActives = praticienSettings?.sections_actives
  const isActive = (key: string): boolean => {
    if (!sectionsActives) return true
    return (sectionsActives as Record<string, boolean>)[key] !== false
  }

  if (isActive('motif') && f.motif_consultation) {
    children.push(sectionTitle('Motif de consultation'))
    children.push(bodyParagraph(f.motif_consultation))
  }

  // Douleurs
  if (isActive('douleur')) {
    const hasDouleur = f.douleur_localisation || f.douleur_intensite || f.douleur_type || f.douleur_evolution
    if (hasDouleur) {
      children.push(sectionTitle('Douleurs'))
      if (f.douleur_localisation) children.push(labelValue('Localisation', f.douleur_localisation))
      if (f.douleur_type) children.push(labelValue('Type', f.douleur_type))
      if (f.douleur_intensite) children.push(labelValue('Intensité', f.douleur_intensite))
      if (f.douleur_evolution) children.push(labelValue('Évolution', f.douleur_evolution))
    }
  }

  // Antécédents
  if (isActive('antecedents')) {
    const hasAnt = f.antecedents_medicaux || f.antecedents_chirurgicaux || f.antecedents_traumatiques || f.traitements_en_cours
    if (hasAnt) {
      children.push(sectionTitle('Antécédents'))
      if (f.antecedents_medicaux) children.push(labelValue('Médicaux', f.antecedents_medicaux))
      if (f.antecedents_chirurgicaux) children.push(labelValue('Chirurgicaux', f.antecedents_chirurgicaux))
      if (f.antecedents_traumatiques) children.push(labelValue('Traumatiques', f.antecedents_traumatiques))
      if (f.traitements_en_cours) children.push(labelValue('Traitements en cours', f.traitements_en_cours))
    }
  }

  // Examen postural
  if (isActive('postural')) {
    const hasPost = f.postural_vue_frontale || f.postural_vue_sagittale || f.postural_vue_posterieure || f.postural_observations
    if (hasPost) {
      children.push(sectionTitle('Examen postural statique'))
      if (f.postural_vue_frontale) children.push(labelValue('Vue frontale', f.postural_vue_frontale))
      if (f.postural_vue_sagittale) children.push(labelValue('Vue sagittale', f.postural_vue_sagittale))
      if (f.postural_vue_posterieure) children.push(labelValue('Vue postérieure', f.postural_vue_posterieure))
      if (f.postural_observations) children.push(labelValue('Observations', f.postural_observations))
    }
  }

  // Analyse dynamique
  if (isActive('dynamique')) {
    const hasDyn = f.dynamique_marche || f.dynamique_course || f.dynamique_observations
    if (hasDyn) {
      children.push(sectionTitle('Analyse dynamique'))
      if (f.dynamique_marche) children.push(labelValue('Marche', f.dynamique_marche))
      if (f.dynamique_course) children.push(labelValue('Course / geste sportif', f.dynamique_course))
      if (f.dynamique_observations) children.push(labelValue('Observations', f.dynamique_observations))
    }
  }

  // Examen podologique
  if (isActive('podologie')) {
    const hasPod = f.podologie_morphologie || f.podologie_appuis || f.podologie_chaussage || f.podologie_observations
    if (hasPod) {
      children.push(sectionTitle('Examen podologique'))
      if (f.podologie_morphologie) children.push(labelValue('Morphologie', f.podologie_morphologie))
      if (f.podologie_appuis) children.push(labelValue('Appuis plantaires', f.podologie_appuis))
      if (f.podologie_chaussage) children.push(labelValue('Chaussage', f.podologie_chaussage))
      if (f.podologie_observations) children.push(labelValue('Observations', f.podologie_observations))
    }
  }

  // Musculo-articulaire
  if (isActive('musculo')) {
    const hasMus = f.musculo_amplitudes || f.musculo_testing || f.musculo_tensions || f.musculo_observations
    if (hasMus) {
      children.push(sectionTitle('Analyse musculaire et articulaire'))
      if (f.musculo_amplitudes) children.push(labelValue('Amplitudes articulaires', f.musculo_amplitudes))
      if (f.musculo_testing) children.push(labelValue('Testing musculaire', f.musculo_testing))
      if (f.musculo_tensions) children.push(labelValue('Tensions / raideurs', f.musculo_tensions))
      if (f.musculo_observations) children.push(labelValue('Observations', f.musculo_observations))
    }
  }

  // Mandibulaire / oculaire
  if (isActive('mandibulaire')) {
    const hasMandb = f.mandibulaire_observations || f.oculaire_observations
    if (hasMandb) {
      children.push(sectionTitle('Observations mandibulaires / oculaires'))
      if (f.mandibulaire_observations) children.push(labelValue('Mandibulaire', f.mandibulaire_observations))
      if (f.oculaire_observations) children.push(labelValue('Oculaire', f.oculaire_observations))
    }
  }

  if (isActive('conclusion') && f.conclusion_clinique) {
    children.push(sectionTitle('Conclusion clinique'))
    children.push(bodyParagraph(f.conclusion_clinique))
  }

  if (isActive('axes') && f.axes_therapeutiques) {
    children.push(sectionTitle('Axes thérapeutiques'))
    children.push(bodyParagraph(f.axes_therapeutiques))
  }

  if (isActive('exercices') && f.exercices_conseils) {
    children.push(sectionTitle('Exercices et conseils'))
    children.push(bodyParagraph(f.exercices_conseils))
  }

  if (f.notes_libres) {
    children.push(sectionTitle('Notes complémentaires'))
    children.push(bodyParagraph(f.notes_libres))
  }

  // Si compte rendu final disponible
  if (bilan.compte_rendu_final) {
    children.push(new Paragraph({ text: '', spacing: { after: 200 } }))
    children.push(sectionTitle('Compte rendu synthétique (généré par IA)'))
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Ce document est une aide à la rédaction. Le praticien reste responsable de sa validation.', italics: true, size: 18, color: '6B7280' })],
      spacing: { after: 120 },
    }))
    // Découpe le compte rendu en paragraphes
    bilan.compte_rendu_final.split('\n').forEach((line: string) => {
      if (line.trim()) {
        children.push(new Paragraph({
          text: line,
          spacing: { after: 80 },
        }))
      }
    })
  }

  // Construit le document Word
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          run: { bold: true, size: 32, color: '1E3A5F' },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          run: { bold: true, size: 24, color: '1D4ED8' },
        },
      ],
    },
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Althea — Dossier clinique confidentiel',
                    size: 16,
                    color: '9CA3AF',
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Document généré par Althea — Aide à la rédaction clinique — ',
                    size: 16,
                    color: '9CA3AF',
                  }),
                  new TextRun({
                    children: ['Page ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: '9CA3AF',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)

  const filename = `bilan_${patient.nom.toLowerCase()}_${patient.prenom.toLowerCase()}_${bilan.date_bilan}.docx`
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.-]/g, '')

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}
