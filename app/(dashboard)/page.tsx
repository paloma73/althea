import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users, FileText, Clock, ArrowRight, TrendingUp } from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'
import type { Bilan, Patient } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bilans } = await supabase
    .from('bilans')
    .select('*, patient:patients(id, prenom, nom)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(8)

  const { count: patientCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const { count: bilanCount } = await supabase
    .from('bilans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)

  const thisMonthCount = bilans?.filter(b => {
    const d = new Date(b.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length ?? 0

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/patients/new"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40"
        >
          <Plus className="w-4 h-4" />
          Nouveau bilan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          icon={<Users className="w-5 h-5 text-white" />}
          label="Patients"
          value={patientCount ?? 0}
          gradient="from-blue-500 to-blue-700"
          shadow="shadow-blue-500/30"
          href="/patients"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-white" />}
          label="Bilans rédigés"
          value={bilanCount ?? 0}
          gradient="from-cyan-500 to-teal-600"
          shadow="shadow-teal-500/30"
          href="/bilans"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          label="Ce mois-ci"
          value={thisMonthCount}
          gradient="from-violet-500 to-purple-700"
          shadow="shadow-violet-500/30"
          href="/bilans"
        />
      </div>

      {/* Bilans récents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Bilans récents</h2>
          <Link href="/bilans" className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
            Voir tout
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bilans && bilans.length > 0 ? (
          <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Patient</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Statut</th>
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
                          {bilan.patient ? `${bilan.patient.prenom} ${bilan.patient.nom}` : 'Patient supprimé'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {formatDate(bilan.date_bilan)}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <StatusBadge status={bilan.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/patients/${bilan.patient_id}/bilan/${bilan.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-semibold text-sm transition-colors"
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
            <p className="text-foreground font-medium">Aucun bilan pour l'instant</p>
            <p className="text-muted-foreground text-sm mt-1">Créez votre premier dossier patient pour commencer.</p>
            <Link
              href="/patients/new"
              className="inline-flex items-center gap-1.5 mt-5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un dossier patient
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, gradient, shadow, href,
}: {
  icon: React.ReactNode; label: string; value: number
  gradient: string; shadow: string; href: string
}) {
  return (
    <Link href={href} className={`stat-card block rounded-2xl p-6 bg-gradient-to-br ${gradient} text-white shadow-lg ${shadow}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
        <ArrowRight className="w-4 h-4 text-white/50" />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-white/70 mt-1 font-medium">{label}</p>
    </Link>
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
