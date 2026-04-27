import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  BorderStyle, PageNumber, Footer, Header, SectionType,
  Table, TableRow, TableCell, WidthType, ShadingType, ImageRun,
} from 'docx'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const bilan_id = searchParams.get('bilan_id')
  if (!bilan_id) return NextResponse.json({ error: 'bilan_id requis' }, { status: 400 })

  const { data: bilan, error: bilanError } = await supabase
    .from('bilans')
    .select('*, patient:patients(*)')
    .eq('id', bilan_id)
    .eq('user_id', user.id)
    .single()

  if (bilanError || !bilan) return NextResponse.json({ error: 'Bilan introuvable' }, { status: 404 })

  const patient = bilan.patient
  if (!patient) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })

  const { data: ps } = await supabase
    .from('praticien_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // ── Données de base ──
  const dateBilan = new Date(bilan.date_bilan).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const age = patient.date_naissance
    ? new Date().getFullYear() - new Date(patient.date_naissance).getFullYear()
    : null

  const nomPraticien = [ps?.titre, ps?.prenom, ps?.nom].filter(Boolean).join(' ')
  const nomCabinet = ps?.nom_cabinet ?? ''
  const tagline = ps?.tagline ?? ''
  const civilite = patient.civilite ?? ''
  const patientLabel = [civilite, patient.prenom, patient.nom.toUpperCase()].filter(Boolean).join(' ')

  // ── Couleurs ──
  const TEAL = '1A7F9E'
  const NAVY = '0B2E4A'
  const TEAL_LIGHT = 'DDF0F5'

  // ── Helpers ──
  function sp(n: number): Paragraph {
    return new Paragraph({ text: '', spacing: { after: n } })
  }

  function sectionHeader(text: string): Paragraph {
    return new Paragraph({
      spacing: { before: 200, after: 100 },
      shading: { type: ShadingType.SOLID, color: TEAL_LIGHT, fill: TEAL_LIGHT },
      children: [
        new TextRun({ text, bold: true, size: 22, color: TEAL }),
      ],
    })
  }

  function bullet(text: string): Paragraph {
    return new Paragraph({
      spacing: { after: 60 },
      indent: { left: 360 },
      children: [new TextRun({ text: `– ${text}`, size: 21 })],
    })
  }

  function subHeader(text: string): Paragraph {
    return new Paragraph({
      spacing: { after: 80, before: 120 },
      children: [new TextRun({ text, bold: true, italics: true, size: 21, color: NAVY })],
    })
  }

  function body(text: string): Paragraph {
    return new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text, size: 21 })],
    })
  }

  function labelValue(label: string, value: string): Paragraph {
    return new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `${label} : `, bold: true, size: 21 }),
        new TextRun({ text: value, size: 21 }),
      ],
    })
  }

  // ── Logo (stocké en data URL base64) ──
  let logoBuffer: Buffer | null = null
  let logoType: 'png' | 'jpg' | 'gif' | 'bmp' = 'png'
  const logoW = ps?.logo_width ?? 180
  const logoH = ps?.logo_height ?? 60

  if (ps?.logo_url) {
    try {
      if (ps.logo_url.startsWith('data:')) {
        const [header, base64] = ps.logo_url.split(',')
        const mime = header.match(/data:([^;]+)/)?.[1] ?? 'image/png'
        if (mime.includes('jpeg') || mime.includes('jpg')) logoType = 'jpg'
        else if (mime.includes('gif')) logoType = 'gif'
        else if (mime.includes('bmp')) logoType = 'bmp'
        logoBuffer = Buffer.from(base64, 'base64')
      } else {
        // URL externe (ancien format)
        const res = await fetch(ps.logo_url)
        if (res.ok) {
          const ct = res.headers.get('content-type') ?? ''
          if (ct.includes('jpeg') || ct.includes('jpg')) logoType = 'jpg'
          logoBuffer = Buffer.from(await res.arrayBuffer())
        }
      }
    } catch {
      // Logo inaccessible — on continue sans
    }
  }

  // ── En-tête cabinet (tableau bordé) ──
  const headerBoxChildren: Paragraph[] = []

  if (logoBuffer) {
    headerBoxChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new ImageRun({
          type: logoType,
          data: logoBuffer,
          transformation: { width: logoW, height: logoH },
        }),
      ],
    }))
  } else if (nomCabinet) {
    headerBoxChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: nomCabinet.toUpperCase(), bold: true, size: 28, color: TEAL })],
    }))
  }

  if (nomPraticien) {
    headerBoxChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: nomPraticien, bold: true, size: 24, color: NAVY })],
    }))
  }

  if (ps?.specialite) {
    headerBoxChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: ps.specialite, size: 20, color: '444444' })],
    }))
  }

  const adresseLigne1 = ps?.adresse_cabinet ?? ''
  const adresseLigne2 = [ps?.code_postal, ps?.commune].filter(Boolean).join(' ')

  if (adresseLigne1) {
    headerBoxChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: adresseLigne2 ? 10 : 30 },
      children: [new TextRun({ text: adresseLigne1, size: 19, color: '666666' })],
    }))
  }
  if (adresseLigne2) {
    headerBoxChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      children: [new TextRun({ text: adresseLigne2, size: 19, color: '666666' })],
    }))
  }

  const contactLine = [
    ps?.telephone_cabinet,
    ps?.email_cabinet,
  ].filter(Boolean).join('  |  ')
  if (contactLine) {
    headerBoxChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 30 },
      children: [new TextRun({ text: contactLine, size: 19, color: '666666' })],
    }))
  }

  if (tagline) {
    headerBoxChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [new TextRun({ text: tagline, size: 18, italics: true, color: TEAL })],
    }))
  }

  if (headerBoxChildren.length === 0) {
    headerBoxChildren.push(new Paragraph({ text: '' }))
  }

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 220, bottom: 200, left: 360, right: 360 },
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 6, color: TEAL },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL },
              left:   { style: BorderStyle.SINGLE, size: 6, color: TEAL },
              right:  { style: BorderStyle.SINGLE, size: 6, color: TEAL },
            },
            children: headerBoxChildren,
          }),
        ],
      }),
    ],
  })

  // ── Corps du document ──
  const children: (Paragraph | Table)[] = []

  // En-tête
  children.push(headerTable)
  children.push(sp(300))

  // Nom du patient
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: patientLabel, bold: true, size: 32, color: NAVY })],
  }))

  // Date
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 300 },
    children: [new TextRun({ text: dateBilan, size: 20, color: '555555' })],
  }))

  // Phrase d'introduction
  if (nomPraticien || age) {
    const agePart = age ? `, ${age} ans` : ''
    const intro = `Veuillez trouver ci-joint le compte rendu clinique de ${patientLabel}${agePart}, réalisé dans le cadre d'un bilan complet.`
    children.push(new Paragraph({
      spacing: { after: 300 },
      children: [new TextRun({ text: intro, size: 21 })],
    }))
  }

  // ── Contenu : compte_rendu_final ou formulaire ──
  if (bilan.compte_rendu_final) {
    // Rendu intelligent ligne par ligne
    const lines = bilan.compte_rendu_final.split('\n')
    let prevEmpty = true

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      if (!trimmed) {
        children.push(sp(80))
        prevEmpty = true
        continue
      }

      if (trimmed.startsWith('▸')) {
        children.push(subHeader(trimmed.replace(/^▸\s*/, '')))
        prevEmpty = false
        continue
      }

      if (trimmed.startsWith('–') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        children.push(bullet(trimmed.replace(/^[–\-•]\s*/, '')))
        prevEmpty = false
        continue
      }

      // Heuristique titre de section : courte + suit une ligne vide + n'est pas une phrase
      const looksLikeTitle = prevEmpty
        && trimmed.length < 80
        && !trimmed.endsWith('.')
        && (trimmed === trimmed[0].toUpperCase() + trimmed.slice(1))

      if (looksLikeTitle) {
        children.push(sectionHeader(trimmed))
      } else {
        children.push(body(trimmed))
      }

      prevEmpty = false
    }
  } else {
    // Fallback : formulaire sans notes_libres
    const f = bilan.form_data
    const sa = ps?.sections_actives as Record<string, boolean> | undefined
    const active = (key: string) => !sa || sa[key] !== false

    if (active('motif') && f.motif_consultation) {
      children.push(sectionHeader('Motif de consultation'))
      children.push(body(f.motif_consultation))
    }

    if (active('douleur') && (f.douleur_localisation || f.douleur_type || f.douleur_intensite || f.douleur_evolution)) {
      children.push(sectionHeader('Douleurs'))
      if (f.douleur_localisation) children.push(labelValue('Localisation', f.douleur_localisation))
      if (f.douleur_type) children.push(labelValue('Type', f.douleur_type))
      if (f.douleur_intensite) children.push(labelValue('Intensité', f.douleur_intensite))
      if (f.douleur_evolution) children.push(labelValue('Évolution', f.douleur_evolution))
    }

    if (active('antecedents') && (f.antecedents_medicaux || f.antecedents_chirurgicaux || f.antecedents_traumatiques || f.traitements_en_cours)) {
      children.push(sectionHeader('Antécédents'))
      if (f.antecedents_medicaux) children.push(labelValue('Médicaux', f.antecedents_medicaux))
      if (f.antecedents_chirurgicaux) children.push(labelValue('Chirurgicaux', f.antecedents_chirurgicaux))
      if (f.antecedents_traumatiques) children.push(labelValue('Traumatiques', f.antecedents_traumatiques))
      if (f.traitements_en_cours) children.push(labelValue('Traitements en cours', f.traitements_en_cours))
    }

    if (active('postural') && (f.postural_vue_frontale || f.postural_vue_sagittale || f.postural_vue_posterieure || f.postural_observations)) {
      children.push(sectionHeader('Examen postural statique'))
      if (f.postural_vue_frontale) children.push(labelValue('Vue frontale', f.postural_vue_frontale))
      if (f.postural_vue_sagittale) children.push(labelValue('Vue sagittale', f.postural_vue_sagittale))
      if (f.postural_vue_posterieure) children.push(labelValue('Vue postérieure', f.postural_vue_posterieure))
      if (f.postural_observations) children.push(body(f.postural_observations))
    }

    if (active('dynamique') && (f.dynamique_marche || f.dynamique_course || f.dynamique_observations)) {
      children.push(sectionHeader('Analyse dynamique'))
      if (f.dynamique_marche) children.push(labelValue('Marche', f.dynamique_marche))
      if (f.dynamique_course) children.push(labelValue('Course / geste sportif', f.dynamique_course))
      if (f.dynamique_observations) children.push(body(f.dynamique_observations))
    }

    if (active('podologie') && (f.podologie_morphologie || f.podologie_appuis || f.podologie_chaussage || f.podologie_observations)) {
      children.push(sectionHeader('Examen podologique'))
      if (f.podologie_morphologie) children.push(labelValue('Morphologie', f.podologie_morphologie))
      if (f.podologie_appuis) children.push(labelValue('Appuis plantaires', f.podologie_appuis))
      if (f.podologie_chaussage) children.push(labelValue('Chaussage', f.podologie_chaussage))
      if (f.podologie_observations) children.push(body(f.podologie_observations))
    }

    if (active('musculo') && (f.musculo_amplitudes || f.musculo_testing || f.musculo_tensions || f.musculo_observations)) {
      children.push(sectionHeader('Analyse musculaire et articulaire'))
      if (f.musculo_amplitudes) children.push(labelValue('Amplitudes', f.musculo_amplitudes))
      if (f.musculo_testing) children.push(labelValue('Testing', f.musculo_testing))
      if (f.musculo_tensions) children.push(labelValue('Tensions', f.musculo_tensions))
      if (f.musculo_observations) children.push(body(f.musculo_observations))
    }

    if (active('mandibulaire') && (f.mandibulaire_observations || f.oculaire_observations)) {
      children.push(sectionHeader('Observations mandibulaires / oculaires'))
      if (f.mandibulaire_observations) children.push(labelValue('Mandibulaire', f.mandibulaire_observations))
      if (f.oculaire_observations) children.push(labelValue('Oculaire', f.oculaire_observations))
    }

    if (active('conclusion') && f.conclusion_clinique) {
      children.push(sectionHeader('Conclusion clinique'))
      children.push(body(f.conclusion_clinique))
    }

    if (active('axes') && f.axes_therapeutiques) {
      children.push(sectionHeader('Axes thérapeutiques'))
      children.push(body(f.axes_therapeutiques))
    }

    if (active('exercices') && f.exercices_conseils) {
      children.push(sectionHeader('Exercices et conseils'))
      children.push(body(f.exercices_conseils))
    }
    // notes_libres intentionnellement exclus
  }

  // ── Signature ──
  children.push(sp(400))
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 80 },
    children: [new TextRun({ text: `Le ${dateBilan}`, size: 20, color: '444444' })],
  }))
  children.push(sp(200))
  if (nomPraticien) {
    children.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 60 },
      children: [new TextRun({ text: nomPraticien, bold: true, size: 22, color: NAVY })],
    }))
  }
  if (ps?.specialite) {
    children.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [new TextRun({ text: ps.specialite, size: 20, color: '666666' })],
    }))
  }

  // ── Construit le document ──
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 21 } },
      },
    },
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: { margin: { top: 1134, bottom: 1134, left: 1440, right: 1440 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: 'Document clinique confidentiel', size: 16, color: 'AAAAAA', italics: true })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', size: 16, color: 'AAAAAA' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: 'AAAAAA' }),
                  new TextRun({ text: ' / ', size: 16, color: 'AAAAAA' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: 'AAAAAA' }),
                ],
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
    .replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '')

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}
