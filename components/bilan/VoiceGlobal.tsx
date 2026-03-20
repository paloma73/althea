'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

// Typage minimal pour l'API Web Speech
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function VoiceGlobal({ value, onChange }: Props) {
  const [recording, setRecording] = useState(false)
  const [supported] = useState(() =>
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const results = Array.from(event.results)
        .filter(r => r.isFinal)
        .map(r => r[0].transcript)
        .join(' ')

      if (results) {
        onChange(value ? `${value} ${results}` : results)
      }
    }

    recognition.onerror = () => setRecording(false)
    recognition.onend = () => setRecording(false)

    recognition.start()
    setRecording(true)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  return (
    <div className="space-y-4">
      {/* Grande zone de dictée */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div>
            <p className="text-sm font-medium text-foreground">Dictée globale</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dictez l'ensemble de votre bilan en une seule fois. Le texte sera enregistré dans les notes libres.
            </p>
          </div>
          {recording && (
            <span className="flex items-center gap-1.5 text-xs text-red-500 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
              Enregistrement en cours
            </span>
          )}
        </div>

        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={16}
          placeholder="Cliquez sur 'Démarrer la dictée' et parlez librement. Vous pouvez aussi taper directement ici…"
          className="w-full px-5 py-4 text-sm leading-relaxed resize-none focus:outline-none bg-white"
        />
      </div>

      {/* Bouton dictée */}
      {supported ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              recording
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 animate-pulse'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
            }`}
          >
            {recording ? (
              <>
                <MicOff className="w-5 h-5" />
                Arrêter la dictée
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Démarrer la dictée
              </>
            )}
          </button>
          {recording && (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Parlez clairement en français…
            </span>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-sm text-amber-700">
          La reconnaissance vocale n'est pas supportée par votre navigateur. Utilisez Chrome ou Edge pour cette fonctionnalité.
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Conseil : dictez section par section (ex: "Motif : douleur plantaire bilatérale. Douleur : type mécanique, intensité 6 sur 10…")
      </div>
    </div>
  )
}
