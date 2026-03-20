import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText } from 'lucide-react'
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
      <h1 className="text-2xl font-semibold text-foreground">Bilans récents</h1>

      {bilans && bilans.length > 0 ? (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date du bilan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Motif</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bilans.map((bilan: Bilan & { patient: Patient }) => (
                <tr key={bilan.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                        {bilan.patient ? getInitials(bilan.patient.prenom, bilan.patient.nom) : '?'}
                      </div>
                      <span className="font-medium">
                        {bilan.patient ? `${bilan.patient.prenom} ${bilan.patient.nom}` : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDate(bilan.date_bilan)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-xs">
                    <span className="line-clamp-1">
                      {bilan.form_data?.motif_consultation || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={bilan.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/patients/${bilan.patient_id}/bilan/${bilan.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Aucun bilan enregistré.</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    brouillon: { label: 'Brouillon', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    genere: { label: 'Généré', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    valide: { label: 'Validé', class: 'bg-green-50 text-green-700 border-green-200' },
  }
  const s = map[status] ?? map.brouillon
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.class}`}>
      {s.label}
    </span>
  )
}
