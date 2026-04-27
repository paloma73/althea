'use client'

import { useState } from 'react'
import {
  Brain, FlaskConical, AlertTriangle, GitBranch,
  Compass, Loader2, Sparkles, RefreshCw,
} from 'lucide-react'
import type { BilanFormData, CopilotResult, ClinicalHypothesis, ClinicalTest, RedFlag } from '@/types'

interface Props {
  formData: BilanFormData
  bilanId: string | null
  patientId: string
}

export default function CopilotePanel({ formData, bilanId, patientId }: Props) {
  const [result, setResult] = useState<CopilotResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_data: formData,
          bilan_id: bilanId,
          patient_id: patientId,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erreur')
      }
      const data = await res.json()
      setResult(data.result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'analyse. Vérifiez que le formulaire contient des données cliniques.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3 items-start">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Outil d&apos;aide au raisonnement clinique uniquement.</strong> Le copilote propose des
          hypothèses et des pistes de réflexion à partir des données saisies. Il ne remplace pas le
          jugement clinique du praticien et ne formule pas de diagnostic médical définitif. Le praticien
          reste seul responsable de ses décisions cliniques.
        </p>
      </div>

      {/* État initial */}
      {!result && !loading && (
        <div className="bg-white border border-border rounded-xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/30">
            <Brain className="w-7 h-7" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Copilote clinique</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            Analyse les données du formulaire pour proposer des hypothèses cliniques, des tests
            recommandés et des orientations thérapeutiques.
          </p>
          {error && (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          )}
          <button
            onClick={analyze}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-600/20"
          >
            <Sparkles className="w-4 h-4" />
            Analyser avec le Copilote
          </button>
        </div>
      )}

      {/* Chargement */}
      {loading && (
        <div className="bg-white border border-border rounded-xl p-14 flex flex-col items-center gap-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Analyse en cours…</p>
          <p className="text-xs text-muted-foreground">Croisement des données avec la base médicale.</p>
        </div>
      )}

      {/* Résultats */}
      {result && !loading && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={analyze}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-analyser
            </button>
          </div>

          {result.hypotheses.length > 0 && (
            <ResultCard
              icon={<Brain className="w-4 h-4" />}
              title="Hypothèses cliniques"
              color="blue"
            >
              <div className="space-y-3">
                {result.hypotheses.map((h: ClinicalHypothesis, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <PriorityBadge priority={h.priorite} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{h.titre}</p>
                      {h.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{h.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ResultCard>
          )}

          {result.diagnostics_differentiels.length > 0 && (
            <ResultCard
              icon={<GitBranch className="w-4 h-4" />}
              title="Diagnostics différentiels"
              color="purple"
            >
              <ul className="space-y-1.5">
                {result.diagnostics_differentiels.map((d: string, i: number) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-purple-400 flex-shrink-0 mt-px">–</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </ResultCard>
          )}

          {result.tests_complementaires.length > 0 && (
            <ResultCard
              icon={<FlaskConical className="w-4 h-4" />}
              title="Tests complémentaires recommandés"
              color="green"
            >
              <div className="space-y-3">
                {result.tests_complementaires.map((t: ClinicalTest, i: number) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-foreground">{t.titre}</p>
                    {(t.indication || t.description) && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {t.indication && <><em>Indication :</em> {t.indication}{t.description ? ' — ' : ''}</>}
                        {t.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ResultCard>
          )}

          {result.red_flags.length > 0 && (
            <ResultCard
              icon={<AlertTriangle className="w-4 h-4" />}
              title="Red flags à vérifier"
              color="red"
            >
              <div className="space-y-3">
                {result.red_flags.map((r: RedFlag, i: number) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-foreground">{r.titre}</p>
                    {(r.action || r.description) && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {r.action && <><em>Conduite à tenir :</em> {r.action}{r.description ? ' — ' : ''}</>}
                        {r.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ResultCard>
          )}

          {result.orientations.length > 0 && (
            <ResultCard
              icon={<Compass className="w-4 h-4" />}
              title="Orientations thérapeutiques"
              color="teal"
            >
              <ul className="space-y-1.5">
                {result.orientations.map((o: string, i: number) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-teal-500 flex-shrink-0 mt-px">–</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </ResultCard>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sous-composants ────────────────────────────────────────────

type CardColor = 'blue' | 'purple' | 'green' | 'red' | 'teal'

const cardStyles: Record<CardColor, { wrap: string; header: string }> = {
  blue:   { wrap: 'bg-blue-50 border-blue-200',     header: 'text-blue-700' },
  purple: { wrap: 'bg-purple-50 border-purple-200', header: 'text-purple-700' },
  green:  { wrap: 'bg-green-50 border-green-200',   header: 'text-green-700' },
  red:    { wrap: 'bg-red-50 border-red-200',       header: 'text-red-700' },
  teal:   { wrap: 'bg-teal-50 border-teal-200',     header: 'text-teal-700' },
}

function ResultCard({
  icon, title, color, children,
}: {
  icon: React.ReactNode
  title: string
  color: CardColor
  children: React.ReactNode
}) {
  const s = cardStyles[color]
  return (
    <div className={`rounded-xl border p-4 ${s.wrap}`}>
      <div className={`flex items-center gap-2 text-sm font-semibold mb-3 ${s.header}`}>
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

type Priority = 'haute' | 'moyenne' | 'basse'

const priorityStyles: Record<Priority, string> = {
  haute:   'bg-red-100 text-red-700',
  moyenne: 'bg-orange-100 text-orange-700',
  basse:   'bg-gray-100 text-gray-600',
}

const priorityLabels: Record<Priority, string> = {
  haute:   'Prioritaire',
  moyenne: 'À considérer',
  basse:   'Secondaire',
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 mt-0.5 ${priorityStyles[priority] ?? priorityStyles.basse}`}>
      {priorityLabels[priority] ?? priority}
    </span>
  )
}
