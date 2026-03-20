'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Sparkles, Copy, Check, Loader2, FileDown, Mic, LayoutList } from 'lucide-react'
import type { Patient, Bilan, BilanFormData } from '@/types'
import { formatDateLong } from '@/lib/utils'
import BilanFormSection from './BilanFormSection'
import VoiceInput from './VoiceInput'
import VoiceGlobal from './VoiceGlobal'
import VoiceRecorder from './VoiceRecorder'
import TemplateChips from './TemplateChips'
import PdfUploader from '../pdf/PdfUploader'
import { TEMPLATES, ANTECEDENTS_TEMPLATES } from '@/lib/templates'

const EMPTY_FORM: BilanFormData = {
  motif_consultation: '',
  douleur_localisation: '',
  douleur_intensite: '',
  douleur_type: '',
  douleur_evolution: '',
  antecedents_medicaux: '',
  antecedents_chirurgicaux: '',
  antecedents_traumatiques: '',
  traitements_en_cours: '',
  postural_vue_frontale: '',
  postural_vue_sagittale: '',
  postural_vue_posterieure: '',
  postural_observations: '',
  dynamique_marche: '',
  dynamique_course: '',
  dynamique_observations: '',
  podologie_morphologie: '',
  podologie_appuis: '',
  podologie_chaussage: '',
  podologie_observations: '',
  musculo_amplitudes: '',
  musculo_testing: '',
  musculo_tensions: '',
  musculo_observations: '',
  mandibulaire_observations: '',
  oculaire_observations: '',
  conclusion_clinique: '',
  axes_therapeutiques: '',
  exercices_conseils: '',
  notes_libres: '',
}

interface Props {
  patient: Patient
  bilan: (Bilan & { pdf_documents?: Array<{ id: string; filename: string; content_text: string }> }) | null
}

export default function BilanEditor({ patient, bilan }: Props) {
  const router = useRouter()
  const [formData, setFormData] = useState<BilanFormData>(bilan?.form_data ?? EMPTY_FORM)
  const [dateBilan, setDateBilan] = useState(bilan?.date_bilan?.substring(0, 10) ?? new Date().toISOString().substring(0, 10))
  const [pdfIds, setPdfIds] = useState<string[]>(bilan?.pdf_documents?.map(p => p.id) ?? [])
  const [bilanId, setBilanId] = useState<string | null>(bilan?.id ?? null)
  const [compteRendu, setCompteRendu] = useState(bilan?.compte_rendu ?? '')
  const [compteRenduFinal, setCompteRenduFinal] = useState(bilan?.compte_rendu_final ?? '')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'formulaire' | 'rendu'>('formulaire')
  const [inputMode, setInputMode] = useState<'formulaire' | 'dictee'>('formulaire')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [exportingDocx, setExportingDocx] = useState(false)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  function updateField(field: keyof BilanFormData, value: string) {
    setFormData(f => ({ ...f, [field]: value }))
  }

  // Insère du texte (voix ou template) dans un champ
  function appendToField(field: keyof BilanFormData, text: string) {
    setFormData(f => ({ ...f, [field]: f[field] ? `${f[field]} ${text}` : text }))
  }

  // Sauvegarde du bilan (brouillon)
  async function saveBilan() {
    setSaving(true)
    try {
      const payload = {
        patient_id: patient.id,
        date_bilan: dateBilan,
        form_data: formData,
        status: 'brouillon',
      }

      const url = bilanId ? `/api/bilans/${bilanId}` : '/api/bilans'
      const method = bilanId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()
      const data = await res.json()

      if (!bilanId) {
        setBilanId(data.bilan.id)
        router.replace(`/patients/${patient.id}/bilan/${data.bilan.id}`)
      }

      showToast('Bilan sauvegardé')
    } catch {
      showToast('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Génération IA
  async function generateCompteRendu() {
    // Sauvegarde d'abord si nécessaire
    if (!bilanId) await saveBilan()

    setGenerating(true)
    setActiveTab('rendu')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bilan_id: bilanId }),
      })

      if (!res.ok) throw new Error()
      const data = await res.json()

      setCompteRendu(data.compte_rendu)
      setCompteRenduFinal(data.compte_rendu)
      showToast('Compte rendu généré')
    } catch {
      showToast('Erreur lors de la génération IA')
    } finally {
      setGenerating(false)
    }
  }

  // Export Word
  async function exportDocx() {
    if (!bilanId) {
      showToast('Sauvegardez le bilan avant d\'exporter')
      return
    }
    setExportingDocx(true)
    try {
      const res = await fetch(`/api/export/docx?bilan_id=${bilanId}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('content-disposition') ?? ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      a.download = match ? match[1] : `bilan_${bilanId}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Export Word téléchargé')
    } catch {
      showToast('Erreur lors de l\'export Word')
    } finally {
      setExportingDocx(false)
    }
  }

  // Copie du compte rendu
  async function copyCompteRendu() {
    await navigator.clipboard.writeText(compteRenduFinal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Sauvegarde version finale validée
  async function saveFinal() {
    if (!bilanId) return
    setSaving(true)
    try {
      await fetch(`/api/bilans/${bilanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compte_rendu: compteRendu,
          compte_rendu_final: compteRenduFinal,
          status: 'valide',
        }),
      })
      showToast('Version finale enregistrée')
    } catch {
      showToast('Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/patients/${patient.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {patient.prenom} {patient.nom}
          </Link>
          <h1 className="text-xl font-semibold text-foreground">
            {bilan ? `Bilan du ${formatDateLong(bilan.date_bilan)}` : 'Nouveau bilan'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveBilan}
            disabled={saving}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-lg text-sm font-medium transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>
          <button
            onClick={generateCompteRendu}
            disabled={generating || saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Générer le compte rendu
          </button>
        </div>
      </div>

      {/* Date du bilan */}
      <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-5 py-3">
        <label className="text-sm font-medium text-foreground whitespace-nowrap">Date du bilan</label>
        <input
          type="date"
          value={dateBilan}
          onChange={e => setDateBilan(e.target.value)}
          className="text-sm border border-input rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        <TabButton active={activeTab === 'formulaire'} onClick={() => setActiveTab('formulaire')}>
          Formulaire clinique
        </TabButton>
        <TabButton active={activeTab === 'rendu'} onClick={() => setActiveTab('rendu')}>
          Compte rendu
          {compteRendu && <span className="ml-2 w-2 h-2 rounded-full bg-primary inline-block" />}
        </TabButton>
      </div>

      {/* ── ONGLET FORMULAIRE ── */}
      {activeTab === 'formulaire' && (
        <div className="space-y-4">
          {/* Switcher de mode */}
          <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-5 py-3">
            <span className="text-sm font-medium text-foreground">Mode de saisie :</span>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setInputMode('formulaire')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  inputMode === 'formulaire'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Formulaire
              </button>
              <button
                type="button"
                onClick={() => setInputMode('dictee')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  inputMode === 'dictee'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                Dictée globale
              </button>
            </div>
          </div>

          {/* ── MODE DICTÉE GLOBALE — longue durée via Whisper ── */}
          {inputMode === 'dictee' && (
            <VoiceRecorder
              value={formData.notes_libres}
              onChange={v => updateField('notes_libres', v)}
            />
          )}

          {/* ── MODE FORMULAIRE ── */}
          {inputMode === 'formulaire' && (
            <>
              {/* Section motif */}
              <BilanFormSection title="1. Motif de consultation">
                <TextareaField
                  label="Motif"
                  value={formData.motif_consultation}
                  onChange={v => updateField('motif_consultation', v)}
                  rows={2}
                />
                <TemplateChips
                  templates={TEMPLATES.motif_consultation}
                  onSelect={t => appendToField('motif_consultation', t)}
                />
                <VoiceInput onTranscript={t => appendToField('motif_consultation', t)} />
              </BilanFormSection>

              {/* Douleurs */}
              <BilanFormSection title="2. Douleurs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <TextareaField label="Localisation" value={formData.douleur_localisation} onChange={v => updateField('douleur_localisation', v)} rows={2} />
                    <TemplateChips templates={TEMPLATES.douleur_localisation} onSelect={t => appendToField('douleur_localisation', t)} />
                  </div>
                  <div>
                    <TextareaField label="Type de douleur" value={formData.douleur_type} onChange={v => updateField('douleur_type', v)} rows={2} />
                    <TemplateChips templates={TEMPLATES.douleur_type} onSelect={t => appendToField('douleur_type', t)} />
                  </div>
                  <InputField label="Intensité (ex: 6/10 EVA)" value={formData.douleur_intensite} onChange={v => updateField('douleur_intensite', v)} />
                  <InputField label="Évolution" value={formData.douleur_evolution} onChange={v => updateField('douleur_evolution', v)} />
                </div>
                <VoiceInput onTranscript={t => appendToField('douleur_localisation', t)} />
              </BilanFormSection>

              {/* Antécédents */}
              <BilanFormSection title="3. Antécédents">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <TextareaField label="Médicaux" value={formData.antecedents_medicaux} onChange={v => updateField('antecedents_medicaux', v)} rows={2} />
                    <TemplateChips templates={ANTECEDENTS_TEMPLATES.antecedents_medicaux} onSelect={t => appendToField('antecedents_medicaux', t)} />
                  </div>
                  <div>
                    <TextareaField label="Chirurgicaux" value={formData.antecedents_chirurgicaux} onChange={v => updateField('antecedents_chirurgicaux', v)} rows={2} />
                    <TemplateChips templates={ANTECEDENTS_TEMPLATES.antecedents_chirurgicaux} onSelect={t => appendToField('antecedents_chirurgicaux', t)} />
                  </div>
                  <div>
                    <TextareaField label="Traumatiques" value={formData.antecedents_traumatiques} onChange={v => updateField('antecedents_traumatiques', v)} rows={2} />
                    <TemplateChips templates={ANTECEDENTS_TEMPLATES.antecedents_traumatiques} onSelect={t => appendToField('antecedents_traumatiques', t)} />
                  </div>
                  <TextareaField label="Traitements en cours" value={formData.traitements_en_cours} onChange={v => updateField('traitements_en_cours', v)} rows={2} />
                </div>
              </BilanFormSection>

              {/* Examen postural statique */}
              <BilanFormSection title="4. Examen postural statique">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <TextareaField label="Vue frontale" value={formData.postural_vue_frontale} onChange={v => updateField('postural_vue_frontale', v)} rows={3} />
                    <TemplateChips templates={TEMPLATES.postural_vue_frontale} onSelect={t => appendToField('postural_vue_frontale', t)} />
                  </div>
                  <div>
                    <TextareaField label="Vue sagittale" value={formData.postural_vue_sagittale} onChange={v => updateField('postural_vue_sagittale', v)} rows={3} />
                    <TemplateChips templates={TEMPLATES.postural_vue_sagittale} onSelect={t => appendToField('postural_vue_sagittale', t)} />
                  </div>
                  <div>
                    <TextareaField label="Vue postérieure" value={formData.postural_vue_posterieure} onChange={v => updateField('postural_vue_posterieure', v)} rows={3} />
                    <TemplateChips templates={TEMPLATES.postural_vue_posterieure} onSelect={t => appendToField('postural_vue_posterieure', t)} />
                  </div>
                </div>
                <TextareaField label="Observations générales" value={formData.postural_observations} onChange={v => updateField('postural_observations', v)} rows={2} />
                <VoiceInput onTranscript={t => appendToField('postural_observations', t)} />
              </BilanFormSection>

              {/* Analyse dynamique */}
              <BilanFormSection title="5. Analyse dynamique">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <TextareaField label="Marche" value={formData.dynamique_marche} onChange={v => updateField('dynamique_marche', v)} rows={3} />
                    <TemplateChips templates={TEMPLATES.dynamique_marche} onSelect={t => appendToField('dynamique_marche', t)} />
                  </div>
                  <TextareaField label="Course / geste sportif" value={formData.dynamique_course} onChange={v => updateField('dynamique_course', v)} rows={3} />
                </div>
                <TextareaField label="Observations" value={formData.dynamique_observations} onChange={v => updateField('dynamique_observations', v)} rows={2} />
                <VoiceInput onTranscript={t => appendToField('dynamique_observations', t)} />
              </BilanFormSection>

              {/* Examen podologique */}
              <BilanFormSection title="6. Examen podologique">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <TextareaField label="Morphologie du pied" value={formData.podologie_morphologie} onChange={v => updateField('podologie_morphologie', v)} rows={3} />
                    <TemplateChips templates={TEMPLATES.podologie_morphologie} onSelect={t => appendToField('podologie_morphologie', t)} />
                  </div>
                  <div>
                    <TextareaField label="Appuis plantaires" value={formData.podologie_appuis} onChange={v => updateField('podologie_appuis', v)} rows={3} />
                    <TemplateChips templates={TEMPLATES.podologie_appuis} onSelect={t => appendToField('podologie_appuis', t)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Chaussage" value={formData.podologie_chaussage} onChange={v => updateField('podologie_chaussage', v)} />
                  <TextareaField label="Observations" value={formData.podologie_observations} onChange={v => updateField('podologie_observations', v)} rows={2} />
                </div>
              </BilanFormSection>

              {/* Musculaire et articulaire */}
              <BilanFormSection title="7. Analyse musculaire et articulaire">
                <div className="grid grid-cols-2 gap-4">
                  <TextareaField label="Amplitudes articulaires" value={formData.musculo_amplitudes} onChange={v => updateField('musculo_amplitudes', v)} rows={3} />
                  <TextareaField label="Testing musculaire" value={formData.musculo_testing} onChange={v => updateField('musculo_testing', v)} rows={3} />
                  <TextareaField label="Tensions / raideurs" value={formData.musculo_tensions} onChange={v => updateField('musculo_tensions', v)} rows={3} />
                  <TextareaField label="Observations" value={formData.musculo_observations} onChange={v => updateField('musculo_observations', v)} rows={3} />
                </div>
                <VoiceInput onTranscript={t => appendToField('musculo_observations', t)} />
              </BilanFormSection>

              {/* Mandibulaire / oculaire */}
              <BilanFormSection title="8. Observations mandibulaires / oculaires">
                <div className="grid grid-cols-2 gap-4">
                  <TextareaField label="Mandibulaire" value={formData.mandibulaire_observations} onChange={v => updateField('mandibulaire_observations', v)} rows={3} />
                  <TextareaField label="Oculaire" value={formData.oculaire_observations} onChange={v => updateField('oculaire_observations', v)} rows={3} />
                </div>
              </BilanFormSection>

              {/* Conclusion */}
              <BilanFormSection title="9. Conclusion clinique">
                <TextareaField label="Conclusion" value={formData.conclusion_clinique} onChange={v => updateField('conclusion_clinique', v)} rows={4} />
                <TemplateChips templates={TEMPLATES.conclusion_clinique} onSelect={t => appendToField('conclusion_clinique', t)} />
                <VoiceInput onTranscript={t => appendToField('conclusion_clinique', t)} />
              </BilanFormSection>

              {/* Axes thérapeutiques */}
              <BilanFormSection title="10. Axes thérapeutiques">
                <TextareaField label="Axes thérapeutiques" value={formData.axes_therapeutiques} onChange={v => updateField('axes_therapeutiques', v)} rows={3} />
                <TemplateChips templates={TEMPLATES.axes_therapeutiques} onSelect={t => appendToField('axes_therapeutiques', t)} />
              </BilanFormSection>

              {/* Exercices / conseils */}
              <BilanFormSection title="11. Exercices et conseils">
                <TextareaField label="Exercices / conseils au patient" value={formData.exercices_conseils} onChange={v => updateField('exercices_conseils', v)} rows={3} />
                <TemplateChips templates={TEMPLATES.exercices_conseils} onSelect={t => appendToField('exercices_conseils', t)} />
              </BilanFormSection>

              {/* Notes libres */}
              <BilanFormSection title="Notes libres">
                <TextareaField
                  label="Zone de saisie libre — dictée vocale ou texte"
                  value={formData.notes_libres}
                  onChange={v => updateField('notes_libres', v)}
                  rows={5}
                  placeholder="Ajoutez ici toute observation complémentaire…"
                />
                <VoiceInput onTranscript={t => appendToField('notes_libres', t)} label="Dicter dans les notes libres" />
              </BilanFormSection>

              {/* Import PDF */}
              {bilanId && (
                <BilanFormSection title="Documents PDF">
                  <PdfUploader
                    bilanId={bilanId}
                    existingDocs={bilan?.pdf_documents ?? []}
                    onUploaded={id => setPdfIds(ids => [...ids, id])}
                  />
                </BilanFormSection>
              )}
              {!bilanId && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-700">
                  Sauvegardez d'abord le bilan pour pouvoir joindre des PDF.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── ONGLET COMPTE RENDU ── */}
      {activeTab === 'rendu' && (
        <div className="space-y-4">
          {generating && (
            <div className="bg-white border border-border rounded-xl p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Génération en cours…</p>
              <p className="text-xs text-muted-foreground mt-1">L'IA analyse les données cliniques et rédige le compte rendu.</p>
            </div>
          )}

          {!generating && !compteRendu && (
            <div className="bg-white border border-border rounded-xl p-12 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun compte rendu généré.</p>
              <button
                onClick={generateCompteRendu}
                className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Générer le compte rendu
              </button>
            </div>
          )}

          {!generating && compteRendu && (
            <div className="space-y-4">
              {/* Avertissement praticien */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-sm text-blue-700">
                Ce document est une aide à la rédaction. Le praticien reste responsable de sa validation clinique avant tout usage.
              </div>

              {/* Éditeur du compte rendu */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">Compte rendu — modifiable avant validation</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportDocx}
                      disabled={exportingDocx || !bilanId}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition border border-border rounded-lg px-3 py-1.5 disabled:opacity-50"
                      title="Exporter en Word (.docx)"
                    >
                      {exportingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                      Exporter Word
                    </button>
                    <button
                      onClick={copyCompteRendu}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition border border-border rounded-lg px-3 py-1.5"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                    <button
                      onClick={saveFinal}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-3 py-1.5 transition"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Valider et enregistrer
                    </button>
                  </div>
                </div>
                <textarea
                  value={compteRenduFinal}
                  onChange={e => setCompteRenduFinal(e.target.value)}
                  rows={28}
                  className="w-full px-6 py-5 text-sm font-mono leading-relaxed resize-none focus:outline-none"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-foreground text-background px-4 py-3 rounded-xl text-sm font-medium shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  )
}

// ── Sous-composants utilitaires ──

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function InputField({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}

function TextareaField({
  label, value, onChange, rows = 3, placeholder = '',
}: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring resize-y"
      />
    </div>
  )
}
