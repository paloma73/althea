import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    .from('knowledge_docs')
    .select('id, filename, file_size, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  return NextResponse.json({ docs: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
  }

  const isPdf = ACCEPTED_TYPES.pdf.includes(file.type)
  const isImage = ACCEPTED_TYPES.image.includes(file.type)

  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: 'Format non supporté. Acceptés : PDF, JPG, PNG, WEBP, GIF.' },
      { status: 400 }
    )
  }

  const arrayBuffer = await file.arrayBuffer()
  let contentText = ''

  if (isPdf) {
    try {
      const buffer = Buffer.from(arrayBuffer)
      const parsed = await pdf(buffer)
      contentText = parsed.text?.trim() ?? ''
    } catch (err) {
      console.error('[knowledge POST] pdf-parse error:', err)
      contentText = ''
    }
  } else {
    // Image → GPT-4o Vision extrait le texte
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
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: 'high',
                },
              },
              {
                type: 'text',
                text: `Transcris fidèlement tout le contenu textuel médical ou clinique visible dans cette image.
Il peut s'agir d'une page de livre, d'un cours, d'un protocole, d'une slide ou de notes manuscrites.
Retranscris le texte de manière structurée en français. Si c'est un tableau, retranscris-le. Si c'est un schéma avec des annotations, décris le schéma puis liste les annotations.
Ne reformule pas — transcris fidèlement le contenu visible.`,
              },
            ],
          },
        ],
        max_tokens: 2000,
      })

      contentText = completion.choices[0]?.message?.content?.trim() ?? ''
    } catch (err) {
      console.error('[knowledge POST] vision error:', err)
      return NextResponse.json({ error: 'Erreur lors de l\'analyse de l\'image' }, { status: 500 })
    }
  }

  const { data, error } = await supabase
    .from('knowledge_docs')
    .insert({
      user_id: user.id,
      filename: file.name,
      content_text: contentText,
      file_size: file.size,
    })
    .select('id, filename, file_size, created_at')
    .single()

  if (error) {
    console.error('[knowledge POST]', error)
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 })
  }

  return NextResponse.json({ doc: data })
}
