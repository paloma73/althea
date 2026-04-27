import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/settings/logo — upload du logo praticien
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const widthStr = formData.get('width') as string | null
  const heightStr = formData.get('height') as string | null

  if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  if (!['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) {
    return NextResponse.json({ error: 'Format non supporté (PNG, JPG, SVG)' }, { status: 400 })
  }

  const path = `${user.id}/logo.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

  // Dimensions pour l'export Word (on cible max 200px de large)
  const origW = widthStr ? parseInt(widthStr) : 200
  const origH = heightStr ? parseInt(heightStr) : 70
  const maxW = 200
  const ratio = Math.min(1, maxW / origW)
  const logoWidth = Math.round(origW * ratio)
  const logoHeight = Math.round(origH * ratio)

  await supabase
    .from('praticien_settings')
    .upsert(
      { user_id: user.id, logo_url: publicUrl, logo_width: logoWidth, logo_height: logoHeight, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  return NextResponse.json({ logo_url: publicUrl, logo_width: logoWidth, logo_height: logoHeight })
}

// DELETE /api/settings/logo — suppression du logo
export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Cherche le fichier existant
  const { data: files } = await supabase.storage.from('logos').list(user.id)
  if (files && files.length > 0) {
    const paths = files.map(f => `${user.id}/${f.name}`)
    await supabase.storage.from('logos').remove(paths)
  }

  await supabase
    .from('praticien_settings')
    .upsert(
      { user_id: user.id, logo_url: null, logo_width: 180, logo_height: 60, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  return NextResponse.json({ success: true })
}
