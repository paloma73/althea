import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BilanEditor from '@/components/bilan/BilanEditor'

interface Props {
  params: { id: string }
}

export default async function NewBilanPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!patient) notFound()

  return <BilanEditor patient={patient} bilan={null} />
}
