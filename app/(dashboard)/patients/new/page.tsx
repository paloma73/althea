'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewPatientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    civilite: '',
    prenom: '',
    nom: '',
    date_naissance: '',
    telephone: '',
    email: '',
    notes_generales: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent, redirect: 'bilan' | 'patient') {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      setError('Erreur lors de la création du patient.')
      setLoading(false)
      return
    }

    const { patient } = await res.json()

    if (redirect === 'bilan') {
      router.push(`/patients/${patient.id}/bilan/new`)
    } else {
      router.push(`/patients/${patient.id}`)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux patients
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Nouveau patient</h1>
        <p className="text-sm text-muted-foreground mt-1">Renseignez les informations de base du patient.</p>
      </div>

      <form className="bg-white rounded-2xl border border-border p-6 space-y-5 shadow-sm">
        {/* Civilité + Prénom + Nom */}
        <div className="grid grid-cols-[120px_1fr_1fr] gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Civilité</label>
            <select
              name="civilite"
              value={form.civilite}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
            >
              <option value="">—</option>
              <option value="Mme">Mme</option>
              <option value="M.">M.</option>
              <option value="Dr">Dr</option>
              <option value="Pr">Pr</option>
            </select>
          </div>
          <Field label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} required />
          <Field label="Nom *" name="nom" value={form.nom} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date de naissance" name="date_naissance" type="date" value={form.date_naissance} onChange={handleChange} />
          <Field label="Téléphone" name="telephone" type="tel" value={form.telephone} onChange={handleChange} />
        </div>

        <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Notes générales</label>
          <textarea
            name="notes_generales"
            value={form.notes_generales}
            onChange={handleChange}
            rows={3}
            placeholder="Informations complémentaires, contexte général…"
            className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/5 px-3 py-2 rounded-xl">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={e => handleSubmit(e, 'bilan')}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-md shadow-blue-600/25 disabled:opacity-60"
          >
            Créer et saisir un bilan
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={e => handleSubmit(e, 'patient')}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2.5 px-4 rounded-xl text-sm transition disabled:opacity-60"
          >
            Enregistrer le patient
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label, name, value, onChange, type = 'text', required = false
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
      />
    </div>
  )
}
