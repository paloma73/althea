import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import pdfParse from 'pdf-parse'

export const config = { api: { bodyParser: false } }

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const bilanId = formData.get('bilan_id') as string | null

  if (!file || !bilanId) {
    return NextResponse.json({ error: 'Fichier et bilan_id requis' }, { status: 400 })
  }

  // Vérifie que le bilan appartient à cet utilisateur
  const { data: bilan } = await supabase
    .from('bilans')
    .select('id')
    .eq('id', bilanId)
    .eq('user_id', user.id)
    .single()

  if (!bilan) return NextResponse.json({ error: 'Bilan introuvable' }, { status: 404 })

  // Limite taille : 10 Mo
  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 })
  }

  // Extraction du texte
  let contentText = ''
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await pdfParse(buffer)
    contentText = parsed.text?.trim() ?? ''
  } catch {
    // PDF illisible (scanné sans OCR) → on continue sans texte
    contentText = ''
  }

  // Sauvegarde en base
  const { data, error } = await supabase
    .from('pdf_documents')
    .insert({
      bilan_id: bilanId,
      filename: file.name,
      content_text: contentText,
      file_size: file.size,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ document: data }, { status: 201 })
}
