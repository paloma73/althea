import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, ArrowRight } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import type { Bilan, Patient } from '@/types'

export default async function BilansPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bilans } = await supabase
    .from('bilans')
    .select('*, patient:patients(id, prenom, nom)')
    .eq('user_id', user!.id)
    .order('date_bilan', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bilans</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {bilans?.length ?? 0} bilan{(bilans?.length ?? 0) !== 1 ? 's' : ''} au total
        </p>
      </div>

      {bilans && bilans.length > 0 ? (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Patient</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Motif</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Statut</th>
                <th className="text-right px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bilans.map((bilan: Bilan & { patient: Patient }) => (
                <tr key={bilan.id} className="hover:bg-blue-50/40 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                        {bilan.patient ? getInitials(bilan.patient.prenom, bilan.patient.nom) : '?'}
                      </div>
                      <span className="font-semibold text-foreground">
                        {bilan.patient ? `${bilan.patient.prenom} ${bilan.patient.nom}` : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                    {formatDate(bilan.date_bilan)}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell max-w-xs">
                    <span className="line-clamp-1">
                      {bilan.form_data?.motif_consultation || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={bilan.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/patients/${bilan.patient_id}/bilan/${bilan.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-semibold transition-colors"
                    >
                      Ouvrir
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
            <FileText className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-foreground font-medium">Aucun bilan enregistré</p>
          <p className="text-muted-foreground text-sm mt-1">Les bilans apparaîtront ici une fois créés.</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    brouillon: { label: 'Brouillon', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    genere:    { label: 'Généré',    class: 'bg-blue-50 text-blue-700 border-blue-200' },
    valide:    { label: 'Validé',    class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }
  const s = map[status] ?? map.brouillon
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.class}`}>
      {s.label}
    </span>
  )
}
