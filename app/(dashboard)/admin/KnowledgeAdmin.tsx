'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, FileText, ImageIcon, Trash2, Loader2, ChevronDown } from 'lucide-react'
import type { MedicalKnowledge } from '@/types'

const SPECIALTIES = ['général', 'podologie', 'orthopédie', 'posturologie', 'biomécanique', 'neuro-postural', 'rhumatologie', 'kinésithérapie']
const CATEGORIES = ['référence', 'physiopathologie', 'diagnostic', 'test', 'orthèse', 'exercice', 'orientation', 'red_flag']

export default function KnowledgeAdmin() {
  const [entries, setEntries] = useState<MedicalKnowledge[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [specialty, setSpecialty] = useState('général')
  const [category, setCategory] = useState('référence')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    fetch('/api/medical-knowledge')
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpload(files: FileList) {
    const accepted = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
    const valid = Array.from(files).filter(f => accepted.includes(f.type))
    if (valid.length === 0) { setError('Format non supporté. Acceptés : PDF, JPG, PNG, WEBP.'); return }

    setUploading(true)
    setError(null)

    for (const file of valid) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('specialty', specialty)
      fd.append('category', category)
      const res = await fetch('/api/medical-knowledge', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? `Erreur pour "${file.name}"`)
        continue
      }
      const data = await res.json()
      setEntries(prev => [data.entry, ...prev])
      showToast(`"${file.name}" ajouté`)
    }
    setUploading(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/medical-knowledge/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setEntries(prev => prev.filter(e => e.id !== id))
      showToast('Entrée supprimée')
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Ajouter un document</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          PDF ou photo (page de livre, cours, protocole, article). Le texte est extrait automatiquement par IA.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Spécialité</label>
            <select
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catégorie</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div
          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files) handleUpload(e.dataTransfer.files) }}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleUpload(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Extraction en cours…</p>
              <p className="text-xs text-muted-foreground/60">Les images sont analysées par IA, patientez quelques secondes.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2 text-muted-foreground">
                <FileText className="w-5 h-5" />
                <ImageIcon className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                Glissez vos fichiers ici ou <span className="text-primary font-medium">cliquez pour choisir</span>
              </p>
              <p className="text-xs text-muted-foreground/60">PDF, JPG, PNG, WEBP — livres, cours, protocoles</p>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Contenu de la base ({entries.length} entrées)
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune entrée.</p>
        ) : (
          <div className="space-y-2">
            {entries.map(entry => (
              <div key={entry.id} className="border border-border rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{entry.specialty}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{entry.category}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{entry.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded === entry.id ? 'rotate-180' : ''}`} />
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(entry.id) }}
                      className="text-muted-foreground hover:text-destructive transition p-1 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {expanded === entry.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-10">
                      {entry.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-foreground text-background px-4 py-3 rounded-xl text-sm font-medium shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
