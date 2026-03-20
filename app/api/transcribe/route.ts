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
    })

    return NextResponse.json({ text: transcription })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur transcription'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
