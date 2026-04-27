import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import KnowledgeAdmin from './KnowledgeAdmin'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) redirect('/')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Base médicale commune — visible par tous les praticiens, modifiable par l&apos;administrateur uniquement.
        </p>
      </div>
      <KnowledgeAdmin />
    </div>
  )
}
