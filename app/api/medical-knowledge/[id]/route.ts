import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Accès réservé à l\'administrateur' }, { status: 403 })
  }

  const admin = createServiceClient()
  const { error } = await admin
    .from('medical_knowledge')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  return NextResponse.json({ success: true })
}
