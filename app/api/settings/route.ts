import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('praticien_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found, which is fine for new users
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  return NextResponse.json({ settings: data ?? null })
}

export async function PUT(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()

  const payload = {
    user_id: user.id,
    nom_cabinet: body.nom_cabinet ?? '',
    tagline: body.tagline ?? '',
    titre: body.titre ?? '',
    prenom: body.prenom ?? '',
    nom: body.nom ?? '',
    specialite: body.specialite ?? '',
    rpps: body.rpps ?? '',
    adresse_cabinet: body.adresse_cabinet ?? '',
    code_postal: body.code_postal ?? '',
    commune: body.commune ?? '',
    telephone_cabinet: body.telephone_cabinet ?? '',
    email_cabinet: body.email_cabinet ?? '',
    sections_actives: body.sections_actives ?? null,
    sections_labels: body.sections_labels ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('praticien_settings')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('[settings PUT]', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}
