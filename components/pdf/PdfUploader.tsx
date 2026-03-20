'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, Loader2, ChevronDown } from 'lucide-react'

interface PdfDoc {
  id: string
  filename: string
  content_text: string
}

interface Props {
  bilanId: string
  existingDocs: PdfDoc[]
  onUploaded: (id: string) => void
}

export default function PdfUploader({ bilanId, existingDocs, onUploaded }: Props) {
  const [docs, setDocs] = useState<PdfDoc[]>(existingDocs)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    const validFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (validFiles.length === 0) {
      setError('Seuls les fichiers PDF sont acceptés.')
      return
    }

    setUploading(true)
    setError(null)

    for (const file of validFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bilan_id', bilanId)

      const res = await fetch('/api/pdf', { method: 'POST', body: formData })

      if (!res.ok) {
        setError(`Erreur lors de l'upload de "${file.name}"`)
        continue
      }

      const data = await res.json()
      setDocs(d => [...d, data.document])
      onUploaded(data.document.id)
    }

    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  async function deleteDoc(id: string) {
    await fetch(`/api/pdf/${id}`, { method: 'DELETE' })
    setDocs(d => d.filter(doc => doc.id !== id))
  }

  return (
    <div className="space-y-3">
      {/* Zone de dépôt */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/2 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
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
            <p className="text-xs text-muted-foreground/60">Le texte sera automatiquement extrait et inclus dans le contexte IA</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Liste des docs uploadés */}
      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate max-w-xs">
                    {doc.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedId === doc.id ? 'rotate-180' : ''}`} />
                    Voir texte
                  </button>
                  <button
                    onClick={() => deleteDoc(doc.id)}
                    className="text-muted-foreground hover:text-destructive transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedId === doc.id && (
                <div className="px-4 pb-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mt-3 mb-1.5">Texte extrait :</p>
                  <pre className="text-xs text-foreground bg-muted/30 p-3 rounded-lg overflow-auto max-h-40 whitespace-pre-wrap font-mono">
                    {doc.content_text || 'Aucun texte extractible dans ce PDF.'}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
