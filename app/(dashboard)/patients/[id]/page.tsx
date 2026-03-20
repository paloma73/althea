import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText, Calendar } from 'lucide-react'
import { formatDate, formatDateLong } from '@/lib/utils'
import type { Bilan } from '@/types'

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
      <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux patients
      </Link>

      {/* Fiche patient */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {patient.prenom} {patient.nom}
            </h1>
            {patient.date_naissance && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Né(e) le {formatDateLong(patient.date_naissance)}
              </p>
            )}
          </div>
          <Link
            href={`/patients/${patient.id}/bilan/new`}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau bilan
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-border text-sm">
          {patient.telephone && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Téléphone</p>
              <p className="font-medium">{patient.telephone}</p>
            </div>
          )}
          {patient.email && (
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Email</p>
              <p className="font-medium">{patient.email}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Dossier créé le</p>
            <p className="font-medium">{formatDate(patient.created_at)}</p>
          </div>
        </div>

        {patient.notes_generales && (
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Notes générales</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{patient.notes_generales}</p>
          </div>
        )}
      </div>

      {/* Historique des bilans */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Bilans ({bilans?.length ?? 0})
        </h2>

        {bilans && bilans.length > 0 ? (
          <div className="space-y-2">
            {bilans.map((bilan) => (
              <Link
                key={bilan.id}
                href={`/patients/${patient.id}/bilan/${bilan.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-border px-5 py-4 hover:border-primary/40 hover:bg-primary/2 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/8 rounded-lg">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      Bilan du {formatDateLong(bilan.date_bilan)}
                    </p>
                    {bilan.form_data?.motif_consultation && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {bilan.form_data.motif_consultation}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={bilan.status} />
                  <Calendar className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Aucun bilan pour ce patient.</p>
            <Link
              href={`/patients/${patient.id}/bilan/new`}
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary font-medium hover:underline"
            >
              <Plus className="w-4 h-4" />
              Créer le premier bilan
            </Link>
          </div>
        )}
      </div>
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
