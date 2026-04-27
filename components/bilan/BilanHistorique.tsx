'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Trash2, Loader2, Plus, ArrowRight, Clock } from 'lucide-react'
import { formatDateLong } from '@/lib/utils'
import type { Bilan } from '@/types'

interface Props {
  patientId: string
  bilans: Pick<Bilan, 'id' | 'date_bilan' | 'status' | 'created_at' | 'form_data'>[]
}

export default function BilanHistorique({ patientId, bilans: initialBilans }: Props) {
  const router = useRouter()
  const [bilans, setBilans] = useState(initialBilans)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function deleteBilan(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/bilans/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setBilans(prev => prev.filter(b => b.id !== id))
      router.refresh()
    } catch {
      alert('Erreur lors de la suppression.')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  if (bilans.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-10 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-blue-400" />
        </div>
        <p className="text-foreground font-medium">Aucun bilan pour ce patient</p>
        <Link
          href={`/patients/${patientId}/bilan/new`}
          className="inline-flex items-center gap-1.5 mt-4 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Créer le premier bilan
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {bilans.map((bilan) => (
        <div key={bilan.id} className="relative group">
          <Link
            href={`/patients/${patientId}/bilan/${bilan.id}`}
            className="flex items-center justify-between bg-white rounded-2xl border border-border px-5 py-4 hover:border-blue-200 hover:bg-blue-50/30 transition-all shadow-sm pr-14"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-50 rounded-xl flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
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
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
            </div>
          </Link>

          {/* Bouton supprimer */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {confirmId === bilan.id ? (
              <div className="flex items-center gap-1.5 bg-white border border-red-200 rounded-xl px-2.5 py-1.5 shadow-md">
                <span className="text-xs text-red-600 font-semibold whitespace-nowrap">Supprimer ?</span>
                <button
                  onClick={() => deleteBilan(bilan.id)}
                  disabled={deletingId === bilan.id}
                  className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded-lg font-semibold transition-colors"
                >
                  {deletingId === bilan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Oui'}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs text-muted-foreground hover:text-foreground px-1 font-medium"
                >
                  Non
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.preventDefault(); setConfirmId(bilan.id) }}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"
                title="Supprimer ce bilan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
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
