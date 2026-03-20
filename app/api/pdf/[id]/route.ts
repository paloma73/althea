import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/pdf/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Vérifie que le PDF appartient à un bilan de cet utilisateur
  const { data: doc } = await supabase
    .from('pdf_documents')
    .select('id, bilan:bilans(user_id)')
    .eq('id', params.id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  // Sécurité : l'utilisateur doit être propriétaire du bilan parent
  const bilanRaw = doc.bilan
  const bilan = (Array.isArray(bilanRaw) ? bilanRaw[0] : bilanRaw) as { user_id: string } | null
  if (!bilan || bilan.user_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { error } = await supabase
    .from('pdf_documents')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
