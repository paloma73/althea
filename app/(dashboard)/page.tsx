import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users, FileText, Clock } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import type { Bilan, Patient } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Récupère les derniers bilans avec les données patient
  const { data: bilans } = await supabase
    .from('bilans')
    .select('*, patient:patients(id, prenom, nom)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(8)

  // Compte total patients
  const { count: patientCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  // Compte total bilans
  const { count: bilanCount } = await supabase
    .from('bilans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/patients/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau bilan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-primary" />}
          label="Patients"
          value={patientCount ?? 0}
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-primary" />}
          label="Bilans rédigés"
          value={bilanCount ?? 0}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-primary" />}
          label="Ce mois"
          value={bilans?.filter(b => {
            const d = new Date(b.created_at)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length ?? 0}
        />
      </div>

      {/* Derniers bilans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Bilans récents</h2>
          <Link href="/bilans" className="text-sm text-primary hover:underline">
            Voir tout
          </Link>
        </div>

        {bilans && bilans.length > 0 ? (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date du bilan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Statut</th>
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
                        <span className="font-medium text-foreground">
                          {bilan.patient
                            ? `${bilan.patient.prenom} ${bilan.patient.nom}`
                            : 'Patient supprimé'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatDate(bilan.date_bilan)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
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
            <p className="text-muted-foreground text-sm">Aucun bilan pour l'instant.</p>
            <Link
              href="/patients/new"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary font-medium hover:underline"
            >
              <Plus className="w-4 h-4" />
              Créer un premier dossier patient
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-primary/8 rounded-lg">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
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
