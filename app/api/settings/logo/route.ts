import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/settings/logo — stocke le logo en base64 dans praticien_settings
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const widthStr = formData.get('width') as string | null
  const heightStr = formData.get('height') as string | null

  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Format non supporté. Utilisez PNG ou JPG.' }, { status: 400 })
  }

  // Conversion en data URL base64 — pas besoin de Supabase Storage
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  // Dimensions Word (max 200px de large)
  const origW = widthStr ? parseInt(widthStr) : 200
  const origH = heightStr ? parseInt(heightStr) : 70
  const ratio = Math.min(1, 200 / origW)
  const logoWidth = Math.round(origW * ratio)
  const logoHeight = Math.round(origH * ratio)

  const { error } = await supabase
    .from('praticien_settings')
    .upsert(
      {
        user_id: user.id,
        logo_url: dataUrl,
        logo_width: logoWidth,
        logo_height: logoHeight,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ logo_url: dataUrl, logo_width: logoWidth, logo_height: logoHeight })
}

// DELETE /api/settings/logo — supprime le logo
export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { error } = await supabase
    .from('praticien_settings')
    .upsert(
      {
        user_id: user.id,
        logo_url: null,
        logo_width: 180,
        logo_height: 60,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
