'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email.'
        : 'Erreur lors de la création du compte. Réessayez.')
      setLoading(false)
      return
    }

    if (data.session) {
      // Confirmation email désactivée → connexion immédiate
      router.push('/')
      router.refresh()
    } else {
      // Confirmation email activée → afficher le message
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-border p-10">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Vérifiez votre email</h2>
            <p className="text-sm text-muted-foreground mb-1">
              Un lien de confirmation a été envoyé à
            </p>
            <p className="text-sm font-medium text-foreground mb-5">{email}</p>
            <p className="text-xs text-muted-foreground">
              Cliquez sur le lien dans l&apos;email pour activer votre compte, puis connectez-vous.
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 text-sm text-primary hover:underline font-medium"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white mb-4 shadow-lg">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Althea</h1>
          <p className="text-sm text-muted-foreground mt-1">Outil de rédaction clinique</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
          <h2 className="text-lg font-medium text-foreground mb-6">Créer un compte praticien</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Adresse email professionnelle
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="praticien@exemple.fr"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Mot de passe <span className="text-muted-foreground font-normal">(8 caractères minimum)</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-foreground mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/5 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Création du compte…' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Le praticien reste responsable de la validation clinique de tous les documents générés.
        </p>
      </div>
    </div>
  )
}
