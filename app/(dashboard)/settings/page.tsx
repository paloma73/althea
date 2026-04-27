'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Loader2, Upload, FileText, Trash2, ImageIcon, X } from 'lucide-react'
import type { SectionKey, KnowledgeDoc } from '@/types'
import { DEFAULT_SECTIONS_ACTIVES, DEFAULT_SECTIONS_LABELS } from '@/types'
import Image from 'next/image'

// ─────────────────────────────────────────────
// Section metadata for the compte-rendu tab
// ─────────────────────────────────────────────
const SECTION_KEYS: SectionKey[] = [
  'motif',
  'douleur',
  'antecedents',
  'postural',
  'dynamique',
  'podologie',
  'musculo',
  'mandibulaire',
  'conclusion',
  'axes',
  'exercices',
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profil' | 'compte-rendu' | 'base-doc'>('profil')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Profil state
  const [nomCabinet, setNomCabinet] = useState('')
  const [tagline, setTagline] = useState('')
  const [titre, setTitre] = useState('')
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [specialite, setSpecialite] = useState('')
  const [rpps, setRpps] = useState('')
  const [adresseCabinet, setAdresseCabinet] = useState('')
  const [telephoneCabinet, setTelephoneCabinet] = useState('')
  const [emailCabinet, setEmailCabinet] = useState('')

  // Sections state
  const [sectionsActives, setSectionsActives] = useState<Record<SectionKey, boolean>>({ ...DEFAULT_SECTIONS_ACTIVES })
  const [sectionsLabels, setSectionsLabels] = useState<Record<SectionKey, string>>({ ...DEFAULT_SECTIONS_LABELS })

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Knowledge docs state
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Load settings + knowledge docs on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [settingsRes, docsRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/knowledge'),
        ])

        if (settingsRes.ok) {
          const { settings } = await settingsRes.json()
          if (settings) {
            setLogoUrl(settings.logo_url ?? null)
            setNomCabinet(settings.nom_cabinet ?? '')
            setTagline(settings.tagline ?? '')
            setTitre(settings.titre ?? '')
            setPrenom(settings.prenom ?? '')
            setNom(settings.nom ?? '')
            setSpecialite(settings.specialite ?? '')
            setRpps(settings.rpps ?? '')
            setAdresseCabinet(settings.adresse_cabinet ?? '')
            setTelephoneCabinet(settings.telephone_cabinet ?? '')
            setEmailCabinet(settings.email_cabinet ?? '')
            if (settings.sections_actives) {
              setSectionsActives({ ...DEFAULT_SECTIONS_ACTIVES, ...settings.sections_actives })
            }
            if (settings.sections_labels) {
              setSectionsLabels({ ...DEFAULT_SECTIONS_LABELS, ...settings.sections_labels })
            }
          }
        }

        if (docsRes.ok) {
          const { docs } = await docsRes.json()
          setKnowledgeDocs(docs ?? [])
        }
      } catch (err) {
        console.error('[settings load]', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function saveSettings() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_cabinet: nomCabinet,
          tagline,
          titre,
          prenom,
          nom,
          specialite,
          rpps,
          adresse_cabinet: adresseCabinet,
          telephone_cabinet: telephoneCabinet,
          email_cabinet: emailCabinet,
          sections_actives: sectionsActives,
          sections_labels: sectionsLabels,
        }),
      })
      if (!res.ok) throw new Error()
      showToast('Paramètres enregistrés')
    } catch {
      showToast('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function uploadLogo(file: File) {
    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      setLogoError('Format non supporté. Utilisez PNG, JPG ou SVG.')
      return
    }
    setLogoUploading(true)
    setLogoError(null)
    try {
      const dims = await new Promise<{ width: number; height: number }>(resolve => {
        const img = document.createElement('img')
        const url = URL.createObjectURL(file)
        img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url) }
        img.src = url
      })
      const fd = new FormData()
      fd.append('file', file)
      fd.append('width', String(dims.width))
      fd.append('height', String(dims.height))
      const res = await fetch('/api/settings/logo', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogoUrl(data.logo_url)
      showToast('Logo enregistré')
    } catch {
      setLogoError('Erreur lors de l\'upload du logo.')
    } finally {
      setLogoUploading(false)
    }
  }

  async function deleteLogo() {
    setLogoUploading(true)
    try {
      await fetch('/api/settings/logo', { method: 'DELETE' })
      setLogoUrl(null)
      showToast('Logo supprimé')
    } catch {
      showToast('Erreur lors de la suppression')
    } finally {
      setLogoUploading(false)
    }
  }

  async function uploadKnowledgeDoc(files: FileList) {
    const validFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (validFiles.length === 0) {
      setUploadError('Seuls les fichiers PDF sont acceptés.')
      return
    }

    setUploading(true)
    setUploadError(null)

    for (const file of validFiles) {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/knowledge', { method: 'POST', body: formData })

      if (!res.ok) {
        setUploadError(`Erreur lors de l'upload de "${file.name}"`)
        continue
      }

      const data = await res.json()
      setKnowledgeDocs(prev => [data.doc, ...prev])
    }

    setUploading(false)
  }

  async function deleteKnowledgeDoc(id: string) {
    const res = await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setKnowledgeDocs(prev => prev.filter(d => d.id !== id))
      showToast('Document supprimé')
    }
  }

  function toggleSection(key: SectionKey) {
    setSectionsActives(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function updateLabel(key: SectionKey, label: string) {
    setSectionsLabels(prev => ({ ...prev, [key]: label }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Paramètres</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        <TabButton active={activeTab === 'profil'} onClick={() => setActiveTab('profil')}>
          Profil praticien
        </TabButton>
        <TabButton active={activeTab === 'compte-rendu'} onClick={() => setActiveTab('compte-rendu')}>
          Compte rendu
        </TabButton>
        <TabButton active={activeTab === 'base-doc'} onClick={() => setActiveTab('base-doc')}>
          Base documentaire
        </TabButton>
      </div>

      {/* ── ONGLET PROFIL ── */}
      {activeTab === 'profil' && (
        <div className="space-y-5">
          {/* Logo */}
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Logo du cabinet</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Apparaît en haut de l'export Word. PNG, JPG ou SVG recommandé.</p>
            </div>

            {logoUrl ? (
              <div className="flex items-center gap-4">
                <div className="relative border border-border rounded-xl p-3 bg-muted/20">
                  <img src={logoUrl} alt="Logo cabinet" className="h-16 max-w-[220px] object-contain" />
                </div>
                <button
                  onClick={deleteLogo}
                  disabled={logoUploading}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                >
                  {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Supprimer
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])}
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-2 border-2 border-dashed border-border rounded-xl px-6 py-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition w-full justify-center"
                >
                  {logoUploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Upload en cours…</>
                    : <><ImageIcon className="w-4 h-4" /> Cliquer pour ajouter un logo</>
                  }
                </button>
                {logoError && <p className="text-xs text-destructive mt-2">{logoError}</p>}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground">Informations du praticien</h2>
            <p className="text-xs text-muted-foreground -mt-3">
              Ces informations apparaissent dans l'en-tête des exports Word.
            </p>

            <FormField
              label="Nom du cabinet"
              placeholder="Orthopédie Savoie Mont Blanc"
              value={nomCabinet}
              onChange={setNomCabinet}
            />

            <FormField
              label="Accroche / spécialités (ligne sous l'adresse)"
              placeholder="Analyse podologique – Bilan postural | Semelles orthopédiques sur mesure"
              value={tagline}
              onChange={setTagline}
            />

            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-4">Praticien</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                label="Titre"
                placeholder="Dr, Mme, M."
                value={titre}
                onChange={setTitre}
              />
              <FormField
                label="Prénom"
                placeholder="Jean"
                value={prenom}
                onChange={setPrenom}
              />
              <FormField
                label="Nom"
                placeholder="Dupont"
                value={nom}
                onChange={setNom}
              />
            </div>

            <FormField
              label="Spécialité"
              placeholder="Podologue, Orthopédiste, Posturologue…"
              value={specialite}
              onChange={setSpecialite}
            />

            <FormField
              label="N° RPPS"
              placeholder="10 chiffres"
              value={rpps}
              onChange={setRpps}
            />

            <FormField
              label="Adresse du cabinet"
              placeholder="12 rue des Fleurs, 75001 Paris"
              value={adresseCabinet}
              onChange={setAdresseCabinet}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Téléphone cabinet"
                placeholder="01 23 45 67 89"
                value={telephoneCabinet}
                onChange={setTelephoneCabinet}
              />
              <FormField
                label="Email cabinet"
                placeholder="contact@cabinet.fr"
                value={emailCabinet}
                onChange={setEmailCabinet}
                type="email"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer le profil
            </button>
          </div>
        </div>
      )}

      {/* ── ONGLET COMPTE RENDU ── */}
      {activeTab === 'compte-rendu' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Sections du compte rendu</h2>
            <p className="text-xs text-muted-foreground -mt-2">
              Activez ou désactivez les sections à inclure dans le compte rendu généré. Personnalisez aussi le titre de chaque section.
            </p>

            <div className="space-y-3 divide-y divide-border">
              {SECTION_KEYS.map(key => (
                <div key={key} className="flex items-center gap-4 pt-3 first:pt-0">
                  {/* Toggle switch */}
                  <button
                    type="button"
                    onClick={() => toggleSection(key)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                      sectionsActives[key] ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                    role="switch"
                    aria-checked={sectionsActives[key]}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        sectionsActives[key] ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {/* Label input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={sectionsLabels[key]}
                      onChange={e => updateLabel(key, e.target.value)}
                      disabled={!sectionsActives[key]}
                      className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-40 disabled:bg-muted"
                    />
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    sectionsActives[key]
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {sectionsActives[key] ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer les sections
            </button>
          </div>
        </div>
      )}

      {/* ── ONGLET BASE DOCUMENTAIRE ── */}
      {activeTab === 'base-doc' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground">Base documentaire médicale</h2>
            <p className="text-xs text-muted-foreground -mt-2">
              Importez des PDF de référence (protocoles, guides cliniques). Leur contenu sera automatiquement injecté dans le contexte de l'IA lors de la génération des comptes rendus (3 docs max, 500 caractères par doc).
            </p>

            {/* Zone d'upload */}
            <div
              onDrop={e => { e.preventDefault(); if (e.dataTransfer.files) uploadKnowledgeDoc(e.dataTransfer.files) }}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={e => e.target.files && uploadKnowledgeDoc(e.target.files)}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Extraction du texte en cours…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Glissez vos PDF ici ou <span className="text-primary font-medium">cliquez pour choisir</span>
                  </p>
                  <p className="text-xs text-muted-foreground/60">Protocoles, guides cliniques, références bibliographiques</p>
                </div>
              )}
            </div>

            {uploadError && (
              <p className="text-xs text-destructive">{uploadError}</p>
            )}

            {/* Liste des documents */}
            {knowledgeDocs.length > 0 ? (
              <div className="space-y-2">
                {knowledgeDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between px-4 py-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_size ? `${Math.round(doc.file_size / 1024)} Ko` : ''} —{' '}
                          {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteKnowledgeDoc(doc.id)}
                      className="text-muted-foreground hover:text-destructive transition flex-shrink-0 ml-3"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun document dans la base documentaire.
              </p>
            )}
          </div>
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

// ── Sous-composants ──

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

function FormField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
