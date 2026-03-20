import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/bilans
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('bilans')
    .select('*, patient:patients(id, prenom, nom)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bilans: data })
}

// POST /api/bilans
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { patient_id, date_bilan, form_data, status = 'brouillon' } = body

  if (!patient_id || !date_bilan) {
    return NextResponse.json({ error: 'patient_id et date_bilan requis' }, { status: 400 })
  }

  // Vérifie que le patient appartient bien à cet utilisateur
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patient_id)
    .eq('user_id', user.id)
    .single()

  if (!patient) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 })

  const { data, error } = await supabase
    .from('bilans')
    .insert({
      user_id: user.id,
      patient_id,
      date_bilan,
      form_data: form_data ?? {},
      status,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bilan: data }, { status: 201 })
}
