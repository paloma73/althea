import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Phone, Mail, CalendarDays, StickyNote } from 'lucide-react'
import { formatDate, formatDateLong, getInitials } from '@/lib/utils'
import BilanHistorique from '@/components/bilan/BilanHistorique'

interface Props {
  params: { id: string }
}

export default async function PatientPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!patient) notFound()

  const { data: bilans } = await supabase
    .from('bilans')
    .select('id, date_bilan, status, created_at, form_data')
    .eq('patient_id', patient.id)
    .eq('user_id', user!.id)
    .order('date_bilan', { ascending: false })

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux patients
      </Link>

      {/* Fiche patient */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Bandeau couleur */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />

        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xl font-bold flex items-center justify-center shadow-md shadow-blue-500/30 flex-shrink-0">
                {getInitials(patient.prenom, patient.nom)}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">
                  {patient.prenom} {patient.nom}
                </h1>
                {patient.date_naissance && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Né(e) le {formatDateLong(patient.date_naissance)}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/patients/${patient.id}/bilan/new`}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-600/25 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nouveau bilan
            </Link>
          </div>

          {/* Infos */}
          {(patient.telephone || patient.email || patient.created_at) && (
            <div className="flex flex-wrap gap-5 mt-5 pt-5 border-t border-border">
              {patient.telephone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{patient.telephone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-foreground truncate">{patient.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Dossier créé le <span className="font-medium text-foreground">{formatDate(patient.created_at)}</span></span>
              </div>
            </div>
          )}

          {patient.notes_generales && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <StickyNote className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground whitespace-pre-wrap">{patient.notes_generales}</p>
            </div>
          )}
        </div>
      </div>

      {/* Historique bilans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">
            Historique des bilans
            <span className="ml-2 text-sm font-normal text-muted-foreground">({bilans?.length ?? 0})</span>
          </h2>
        </div>
        <BilanHistorique patientId={patient.id} bilans={bilans ?? []} />
      </div>
    </div>
  )
}
