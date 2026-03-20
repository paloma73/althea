import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import pdf from 'pdf-parse'

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

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Seuls les fichiers PDF sont acceptés' }, { status: 400 })
  }

  // Extrait le texte du PDF
  let contentText = ''
  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const parsed = await pdf(buffer)
    contentText = parsed.text?.trim() ?? ''
  } catch (err) {
    console.error('[knowledge POST] pdf-parse error:', err)
    contentText = ''
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
