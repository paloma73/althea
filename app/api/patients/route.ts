import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/patients — liste tous les patients de l'utilisateur
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
    .order('nom', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ patients: data })
}

// POST /api/patients — crée un nouveau patient
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { civilite, prenom, nom, date_naissance, telephone, email, notes_generales } = body

  if (!prenom || !nom) {
    return NextResponse.json({ error: 'Prénom et nom requis' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('patients')
    .insert({
      user_id: user.id,
      civilite: civilite || null,
      prenom: prenom.trim(),
      nom: nom.trim(),
      date_naissance: date_naissance || null,
      telephone: telephone || null,
      email: email || null,
      notes_generales: notes_generales || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ patient: data }, { status: 201 })
}
