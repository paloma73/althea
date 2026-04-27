import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import type { BilanFormData } from '@/types'

interface MedicalEntry {
  specialty: string
  category: string
  title: string
  content: string
  tags: string[]
}

interface KnowledgeDoc {
  filename: string
  content_text: string
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { form_data, bilan_id, patient_id } = await req.json()
  if (!form_data) return NextResponse.json({ error: 'form_data requis' }, { status: 400 })

  const formText = Object.values(form_data as BilanFormData).filter(Boolean).join(' ')
  if (formText.trim().length < 15) {
    return NextResponse.json({ error: 'Données insuffisantes pour l\'analyse' }, { status: 400 })
  }

  // Base médicale commune
  const { data: medicalKnowledge } = await supabase
    .from('medical_knowledge')
    .select('specialty, category, title, content, tags')
    .eq('active', true)
    .order('specialty')

  // Base personnelle de l'utilisateur
  const { data: knowledgeDocs } = await supabase
    .from('knowledge_docs')
    .select('filename, content_text')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Historique patient si disponible
  let patientHistory = ''
  if (patient_id) {
    const { data: previousBilans } = await supabase
      .from('bilans')
      .select('date_bilan, form_data, compte_rendu_final')
      .eq('patient_id', patient_id)
      .eq('user_id', user.id)
      .neq('id', bilan_id ?? 'none')
      .order('date_bilan', { ascending: false })
      .limit(2)

    if (previousBilans && previousBilans.length > 0) {
      patientHistory = previousBilans.map(b => {
        const dateStr = new Date(b.date_bilan).toLocaleDateString('fr-FR')
        const summary = b.compte_rendu_final?.substring(0, 400) ||
          Object.entries(b.form_data ?? {})
            .filter(([, v]) => v)
            .slice(0, 5)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
        return `Bilan du ${dateStr} : ${summary}`
      }).join('\n\n')
    }
  }

  const systemPrompt = buildSystemPrompt(medicalKnowledge ?? [], knowledgeDocs ?? [])
  const userPrompt = buildUserPrompt(form_data as BilanFormData, patientHistory)

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content ?? '{}'
    const result = JSON.parse(content)

    return NextResponse.json({ result })
  } catch (err) {
    console.error('[copilot] Error:', err)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse copilote' }, { status: 500 })
  }
}

function buildSystemPrompt(knowledge: MedicalEntry[], docs: KnowledgeDoc[]): string {
  const byCategory: Record<string, string[]> = {}
  for (const entry of knowledge) {
    if (!byCategory[entry.category]) byCategory[entry.category] = []
    byCategory[entry.category].push(`[${entry.specialty}] ${entry.title}: ${entry.content.substring(0, 350)}`)
  }

  const knowledgeSection = Object.entries(byCategory)
    .map(([cat, entries]) => `### ${cat.toUpperCase()}\n${entries.join('\n\n')}`)
    .join('\n\n')

  let prompt = `Tu es un copilote clinique pour un professionnel de santé spécialisé en podologie, posturologie, biomécanique et orthopédie fonctionnelle.

TON RÔLE :
- Analyser les signes cliniques saisis dans le formulaire de bilan
- Proposer des hypothèses cliniques structurées et des pistes de raisonnement
- Suggérer des tests complémentaires pertinents à réaliser
- Identifier les red flags éventuels
- Proposer des orientations thérapeutiques adaptées

RÈGLES ABSOLUES :
- Tu n'établis PAS de diagnostic médical définitif
- Tu proposes uniquement des HYPOTHÈSES et des PISTES DE RAISONNEMENT clinique
- Tu t'appuies sur les données saisies et sur la base de connaissances fournie
- Réponds UNIQUEMENT en JSON valide avec exactement la structure demandée ci-dessous
- Toutes les réponses sont en français médical professionnel
- Si les données sont insuffisantes pour une catégorie, retourne un tableau vide []
- Ne génère pas plus de 5 éléments par catégorie

FORMAT JSON OBLIGATOIRE (respecter exactement cette structure) :
{
  "hypotheses": [
    {
      "titre": "nom court de l'hypothèse clinique",
      "description": "explication clinique concise (2-3 phrases maximum)",
      "priorite": "haute"
    }
  ],
  "diagnostics_differentiels": [
    "diagnostic différentiel 1",
    "diagnostic différentiel 2"
  ],
  "tests_complementaires": [
    {
      "titre": "nom du test clinique",
      "description": "comment réaliser ce test en 1 phrase",
      "indication": "pourquoi ce test dans ce contexte clinique spécifique"
    }
  ],
  "red_flags": [
    {
      "titre": "nom du red flag",
      "description": "signe clinique à surveiller",
      "action": "conduite à tenir recommandée"
    }
  ],
  "orientations": [
    "orientation thérapeutique ou vers spécialiste 1",
    "orientation 2"
  ]
}

BASE DE CONNAISSANCES MÉDICALES :
${knowledgeSection}`

  if (docs.length > 0) {
    const docsContent = docs
      .map(d => `${d.filename}:\n${d.content_text.substring(0, 500)}`)
      .join('\n\n---\n\n')
    prompt += `\n\nDOCUMENTS PERSONNELS DU PRATICIEN :\n${docsContent}`
  }

  return prompt
}

function buildUserPrompt(f: BilanFormData, patientHistory: string): string {
  const sections: string[] = [
    'Analyse les données cliniques suivantes et retourne le JSON demandé.\n'
  ]

  if (f.motif_consultation) sections.push(`MOTIF DE CONSULTATION :\n${f.motif_consultation}`)

  const douleurParts = [
    f.douleur_localisation && `Localisation : ${f.douleur_localisation}`,
    f.douleur_type && `Type : ${f.douleur_type}`,
    f.douleur_intensite && `Intensité : ${f.douleur_intensite}`,
    f.douleur_evolution && `Évolution : ${f.douleur_evolution}`,
  ].filter(Boolean)
  if (douleurParts.length > 0) sections.push(`DOULEURS :\n${douleurParts.join('\n')}`)

  const antecedentsParts = [
    f.antecedents_medicaux && `Médicaux : ${f.antecedents_medicaux}`,
    f.antecedents_chirurgicaux && `Chirurgicaux : ${f.antecedents_chirurgicaux}`,
    f.antecedents_traumatiques && `Traumatiques : ${f.antecedents_traumatiques}`,
    f.traitements_en_cours && `Traitements : ${f.traitements_en_cours}`,
  ].filter(Boolean)
  if (antecedentsParts.length > 0) sections.push(`ANTÉCÉDENTS :\n${antecedentsParts.join('\n')}`)

  const posturalParts = [
    f.postural_vue_frontale && `Frontale : ${f.postural_vue_frontale}`,
    f.postural_vue_sagittale && `Sagittale : ${f.postural_vue_sagittale}`,
    f.postural_vue_posterieure && `Postérieure : ${f.postural_vue_posterieure}`,
    f.postural_observations && `Obs : ${f.postural_observations}`,
  ].filter(Boolean)
  if (posturalParts.length > 0) sections.push(`EXAMEN POSTURAL STATIQUE :\n${posturalParts.join('\n')}`)

  const dynamiqueParts = [
    f.dynamique_marche && `Marche : ${f.dynamique_marche}`,
    f.dynamique_course && `Course : ${f.dynamique_course}`,
    f.dynamique_observations && `Obs : ${f.dynamique_observations}`,
  ].filter(Boolean)
  if (dynamiqueParts.length > 0) sections.push(`ANALYSE DYNAMIQUE :\n${dynamiqueParts.join('\n')}`)

  const podologieParts = [
    f.podologie_morphologie && `Morphologie : ${f.podologie_morphologie}`,
    f.podologie_appuis && `Appuis : ${f.podologie_appuis}`,
    f.podologie_chaussage && `Chaussage : ${f.podologie_chaussage}`,
    f.podologie_observations && `Obs : ${f.podologie_observations}`,
  ].filter(Boolean)
  if (podologieParts.length > 0) sections.push(`EXAMEN PODOLOGIQUE :\n${podologieParts.join('\n')}`)

  const musculoParts = [
    f.musculo_amplitudes && `Amplitudes : ${f.musculo_amplitudes}`,
    f.musculo_testing && `Testing : ${f.musculo_testing}`,
    f.musculo_tensions && `Tensions : ${f.musculo_tensions}`,
    f.musculo_observations && `Obs : ${f.musculo_observations}`,
  ].filter(Boolean)
  if (musculoParts.length > 0) sections.push(`MUSCULO-ARTICULAIRE :\n${musculoParts.join('\n')}`)

  const mandibParts = [
    f.mandibulaire_observations && `Mandibulaire : ${f.mandibulaire_observations}`,
    f.oculaire_observations && `Oculaire : ${f.oculaire_observations}`,
  ].filter(Boolean)
  if (mandibParts.length > 0) sections.push(`OBSERVATIONS COMPLÉMENTAIRES :\n${mandibParts.join('\n')}`)

  if (f.conclusion_clinique) sections.push(`CONCLUSION PROVISOIRE DU PRATICIEN :\n${f.conclusion_clinique}`)
  if (f.notes_libres) sections.push(`NOTES LIBRES :\n${f.notes_libres}`)

  if (patientHistory) {
    sections.push(`HISTORIQUE CLINIQUE DU PATIENT (bilans précédents) :\n${patientHistory}`)
  }

  return sections.join('\n\n')
}
