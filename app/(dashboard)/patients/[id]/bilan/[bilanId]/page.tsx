import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BilanEditor from '@/components/bilan/BilanEditor'

interface Props {
  params: { id: string; bilanId: string }
}

export default async function BilanPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: patient }, { data: bilan }] = await Promise.all([
    supabase
      .from('patients')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('bilans')
      .select('*, pdf_documents(*)')
      .eq('id', params.bilanId)
      .eq('user_id', user!.id)
      .single(),
  ])

  if (!patient || !bilan) notFound()

  return <BilanEditor patient={patient} bilan={bilan} />
}
