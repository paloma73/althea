import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import type { Patient } from '@/types'

interface Props {
  searchParams: { q?: string }
}

export default async function PatientsPage({ searchParams }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const q = searchParams.q?.trim() ?? ''

  let query = supabase
    .from('patients')
    .select('*')
    .eq('user_id', user!.id)
    .order('nom', { ascending: true })

  if (q) {
    query = query.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%`)
  }

  const { data: patients } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Patients</h1>
        <Link
          href="/patients/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau patient
        </Link>
      </div>

      {/* Recherche */}
      <form method="get" className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un patient…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
        />
      </form>

      {/* Liste */}
      {patients && patients.length > 0 ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date de naissance</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Téléphone</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map((patient: Patient) => (
                <tr key={patient.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                        {getInitials(patient.prenom, patient.nom)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{patient.prenom} {patient.nom}</p>
                        {patient.email && (
                          <p className="text-xs text-muted-foreground">{patient.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDate(patient.date_naissance)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {patient.telephone ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">
            {q ? `Aucun résultat pour "${q}"` : 'Aucun patient enregistré.'}
          </p>
          {!q && (
            <Link
              href="/patients/new"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary font-medium hover:underline"
            >
              <Plus className="w-4 h-4" />
              Créer un premier patient
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
