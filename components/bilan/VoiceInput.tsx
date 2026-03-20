'use client'

import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onTranscript: (text: string) => void
  label?: string
}

// Typage minimal pour l'API Web Speech (non standard, absent des lib DOM TypeScript)
interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  start(): void
  stop(): void
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}
interface ISpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

export default function VoiceInput({ onTranscript, label = 'Dicter' }: Props) {
  const [recording, setRecording] = useState(false)
  const [supported] = useState(() =>
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognitionRef.current = recognition

    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const results = Array.from(event.results as unknown as SpeechRecognitionResult[])
        .filter((r: SpeechRecognitionResult) => r.isFinal)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join(' ')

      if (results) onTranscript(results)
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

  if (!supported) return null

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
          recording
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 animate-pulse'
            : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent'
        )}
        title={recording ? 'Arrêter la dictée' : label}
      >
        {recording ? (
          <>
            <MicOff className="w-3.5 h-3.5" />
            Arrêter
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            {label}
          </>
        )}
      </button>
      {recording && (
        <span className="text-xs text-red-500 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Écoute en cours…
        </span>
      )}
    </div>
  )
}
