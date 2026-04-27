import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/openai/prompts'
import type { SectionKey } from '@/types'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { bilan_id } = await req.json()
  if (!bilan_id) return NextResponse.json({ error: 'bilan_id requis' }, { status: 400 })

  // Récupère le bilan avec patient et PDFs
  const { data: bilan, error: bilanError } = await supabase
    .from('bilans')
    .select('*, patient:patients(*), pdf_documents(*)')
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

  // Textes PDF disponibles
  const pdfTexts: string[] = (bilan.pdf_documents ?? [])
    .map((doc: { content_text: string }) => doc.content_text)
    .filter(Boolean)

  // Récupère les paramètres praticien (sections_actives)
  const { data: praticienSettings } = await supabase
    .from('praticien_settings')
    .select('sections_actives')
    .eq('user_id', user.id)
    .single()

  const sectionsActives = praticienSettings?.sections_actives as Partial<Record<SectionKey, boolean>> | undefined

  // Récupère les documents de la base personnelle du praticien
  const { data: knowledgeDocs } = await supabase
    .from('knowledge_docs')
    .select('content_text')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const knowledgeTexts: string[] = (knowledgeDocs ?? [])
    .map((doc: { content_text: string }) => doc.content_text)
    .filter(Boolean)

  // Récupère la base médicale commune (entrées les plus pertinentes par catégorie)
  const { data: medicalKnowledge } = await supabase
    .from('medical_knowledge')
    .select('specialty, category, title, content')
    .eq('active', true)
    .in('category', ['physiopathologie', 'diagnostic', 'orthèse', 'exercice'])
    .limit(20)

  const medicalTexts: string[] = (medicalKnowledge ?? [])
    .map((e: { specialty: string; category: string; title: string; content: string }) =>
      `[${e.specialty} — ${e.category}] ${e.title}: ${e.content.substring(0, 200)}`
    )

  // Construction des prompts
  const systemPrompt = buildSystemPrompt(knowledgeTexts, medicalTexts)
  const userPrompt = buildUserPrompt(patient, bilan, pdfTexts, sectionsActives)

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,        // Peu de créativité pour un texte médical
      max_tokens: 2000,
    })

    const compte_rendu = completion.choices[0]?.message?.content?.trim() ?? ''

    // Sauvegarde du compte rendu dans le bilan
    await supabase
      .from('bilans')
      .update({
        compte_rendu,
        compte_rendu_final: compte_rendu,
        status: 'genere',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bilan_id)
      .eq('user_id', user.id)

    return NextResponse.json({ compte_rendu })
  } catch (err) {
    console.error('[generate] OpenAI error:', err)
    return NextResponse.json({ error: 'Erreur lors de la génération IA' }, { status: 500 })
  }
}
