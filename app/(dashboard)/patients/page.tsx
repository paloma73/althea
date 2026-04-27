import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, ArrowRight, UserPlus } from 'lucide-react'
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {patients?.length ?? 0} dossier{(patients?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/patients/new"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-600/30"
        >
          <Plus className="w-4 h-4" />
          Nouveau patient
        </Link>
      </div>

      {/* Barre de recherche */}
      <form method="get" className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un patient…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring shadow-sm transition"
        />
      </form>

      {/* Liste */}
      {patients && patients.length > 0 ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Patient</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Naissance</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Téléphone</th>
                <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map((patient: Patient) => (
                <tr key={patient.id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold flex items-center justify-center shadow-sm">
                        {getInitials(patient.prenom, patient.nom)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{patient.prenom} {patient.nom}</p>
                        {patient.email && (
                          <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                    {formatDate(patient.date_naissance) || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                    {patient.telephone ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-semibold transition-colors"
                    >
                      Voir
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-14 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-foreground font-medium">
            {q ? `Aucun résultat pour « ${q} »` : 'Aucun patient enregistré'}
          </p>
          {!q && (
            <Link
              href="/patients/new"
              className="inline-flex items-center gap-1.5 mt-5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors"
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
