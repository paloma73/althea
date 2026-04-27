import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import pdf from 'pdf-parse'

const ACCEPTED_TYPES = {
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic'],
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('medical_knowledge')
    .select('id, specialty, category, title, content, tags, created_at')
    .order('specialty')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })

  return NextResponse.json({ entries: data ?? [] })
}

function isAdmin(email: string | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  return !!adminEmail && email === adminEmail
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (!isAdmin(user.email)) return NextResponse.json({ error: 'Accès réservé à l\'administrateur' }, { status: 403 })

  const admin = createServiceClient()
  const contentType = req.headers.get('content-type') ?? ''

  // ── Entrée manuelle (JSON) ──────────────────────────────────
  if (contentType.includes('application/json')) {
    const body = await req.json()
    const { specialty, category, title, content, tags } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Titre et contenu requis' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('medical_knowledge')
      .insert({
        specialty: specialty || 'général',
        category: category || 'référence',
        title: title.trim(),
        content: content.trim(),
        tags: tags ?? [],
        active: true,
      })
      .select('id, specialty, category, title, content, tags, created_at')
      .single()

    if (error) return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 })
    return NextResponse.json({ entry: data })
  }

  // ── Upload fichier (PDF ou image) ───────────────────────────
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const specialty = (formData.get('specialty') as string) || 'général'
  const category = (formData.get('category') as string) || 'référence'

  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  const isPdf = ACCEPTED_TYPES.pdf.includes(file.type)
  const isImage = ACCEPTED_TYPES.image.includes(file.type)

  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: 'Format non supporté. Acceptés : PDF, JPG, PNG, WEBP.' },
      { status: 400 }
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  let contentText = ''

  if (isPdf) {
    try {
      const parsed = await pdf(Buffer.from(arrayBuffer))
      contentText = parsed.text?.trim() ?? ''
    } catch (err) {
      console.error('[medical-knowledge POST] pdf-parse error:', err)
      contentText = ''
    }
  } else {
    try {
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = file.type === 'image/heic' ? 'image/jpeg' : file.type

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' },
              },
              {
                type: 'text',
                text: `Transcris fidèlement tout le contenu textuel médical ou clinique visible dans cette image (page de livre, cours, protocole, slide, notes manuscrites, tableaux, schémas annotés).
Retranscris le texte de manière structurée en français professionnel.
Ne reformule pas — transcris fidèlement ce qui est écrit.`,
              },
            ],
          },
        ],
        max_tokens: 2500,
      })
      contentText = completion.choices[0]?.message?.content?.trim() ?? ''
    } catch (err) {
      console.error('[medical-knowledge POST] vision error:', err)
      return NextResponse.json({ error: 'Erreur lors de l\'analyse de l\'image' }, { status: 500 })
    }
  }

  if (!contentText) {
    return NextResponse.json({ error: 'Impossible d\'extraire du texte de ce fichier' }, { status: 422 })
  }

  const { data, error } = await admin
    .from('medical_knowledge')
    .insert({
      specialty,
      category,
      title: file.name.replace(/\.[^.]+$/, ''),
      content: contentText,
      tags: [],
      active: true,
    })
    .select('id, specialty, category, title, content, tags, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 })
  return NextResponse.json({ entry: data })
}
