import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { toFile } from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await req.formData()
  const audio = formData.get('audio') as File | null

  if (!audio) return NextResponse.json({ error: 'Fichier audio requis' }, { status: 400 })

  // Limite 24 Mo (Whisper max = 25 Mo)
  if (audio.size > 24 * 1024 * 1024) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 24 Mo)' }, { status: 400 })
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const buffer = Buffer.from(await audio.arrayBuffer())
    const file = await toFile(buffer, 'audio.webm', { type: audio.type || 'audio/webm' })

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'fr',
      response_format: 'text',
      prompt: `Dictée médicale en français. Vocabulaire clinique : bilan postural, podologie, orthèse plantaire, semelle orthopédique, posturologie, biomécanique, proprioception, valgus, varus, hallux valgus, pied plat, pied creux, supination, pronation, avant-pied, arrière-pied, métatarse, tibia, péroné, genou, rotule, hanche, bassin, rachis, lordose, cyphose, scoliose, déséquilibre postural, axe de charge, appui plantaire, boîterie, équilibre, tonus musculaire, rétraction, contracture, tendinite, fasciite plantaire, syndrome rotulien, entorse, arthrose, inflammation, douleur chronique, test de Romberg, test de stabilité, examen clinique, antécédents médicaux, traitement, prescription, kinésithérapie, ostéopathie, podologue, rhumatologue, orthopédiste.`,
    })

    return NextResponse.json({ text: transcription })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur transcription'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
