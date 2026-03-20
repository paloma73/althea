'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2, Clock, CheckCircle2 } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
}

// Durée max d'un chunk avant envoi automatique à Whisper (10 minutes)
const CHUNK_DURATION_MS = 10 * 60 * 1000

export default function VoiceGlobal({ value, onChange }: Props) {
  const [recording, setRecording]     = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [elapsed, setElapsed]         = useState(0)       // secondes
  const [chunksDone, setChunksDone]   = useState(0)       // segments transcrits
  const [error, setError]             = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const streamRef        = useRef<MediaStream | null>(null)
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunkTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef     = useRef<number>(0)
  const accTextRef       = useRef<string>('')   // accumule les segments transcrits
  const isStoppingRef    = useRef(false)        // évite les doubles stop

  function formatTime(s: number) {
    const m   = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  // Transcrit un blob audio via l'API Whisper interne
  async function transcribeBlob(blob: Blob): Promise<string> {
    const form = new FormData()
    form.append('audio', blob, 'chunk.webm')
    const res = await fetch('/api/transcribe', { method: 'POST', body: form })
    if (!res.ok) throw new Error('Erreur transcription')
    const data = await res.json()
    return data.text || ''
  }

  // Crée un nouveau MediaRecorder sur le stream existant
  function startChunk(stream: MediaStream, onDone: () => void) {
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
    } catch {
      recorder = new MediaRecorder(stream)
    }
    chunksRef.current = []
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      if (chunksRef.current.length === 0) { onDone(); return }
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      chunksRef.current = []
      setTranscribing(true)
      try {
        const text = await transcribeBlob(blob)
        if (text) {
          accTextRef.current = accTextRef.current
            ? `${accTextRef.current} ${text}`
            : text
          onChange(accTextRef.current)
          setChunksDone(c => c + 1)
        }
      } catch {
        setError('Erreur de transcription sur un segment.')
      } finally {
        setTranscribing(false)
        onDone()
      }
    }

    recorder.start(1000) // collecte des données toutes les secondes
  }

  // Planifie le prochain chunk automatique
  function scheduleChunk(stream: MediaStream) {
    chunkTimerRef.current = setTimeout(() => {
      if (!isStoppingRef.current && mediaRecorderRef.current?.state === 'recording') {
        // Arrête le chunk courant → onstop lance la transcription → recommence
        mediaRecorderRef.current.stop()
        startChunk(stream, () => {
          if (!isStoppingRef.current) scheduleChunk(stream)
        })
      }
    }, CHUNK_DURATION_MS)
  }

  async function startRecording() {
    setError(null)
    isStoppingRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current  = stream
      accTextRef.current = value // conserve le texte existant

      startChunk(stream, () => {
        if (!isStoppingRef.current) scheduleChunk(stream)
      })
      scheduleChunk(stream)

      // Chronomètre
      startTimeRef.current = Date.now()
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      setRecording(true)
    } catch {
      setError('Microphone inaccessible. Vérifiez les permissions du navigateur.')
    }
  }

  function stopRecording() {
    isStoppingRef.current = true
    if (timerRef.current)    clearInterval(timerRef.current)
    if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current)

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop() // déclenche onstop → transcription finale
    }

    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setRecording(false)
  }

  // Nettoyage au démontage du composant
  useEffect(() => {
    return () => {
      isStoppingRef.current = true
      if (timerRef.current)    clearInterval(timerRef.current)
      if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className="space-y-4">

      {/* Zone de texte principale */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 flex-wrap gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">Dictée longue durée</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enregistrement continu jusqu'à 1h — transcription automatique par Whisper (OpenAI)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {chunksDone > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {chunksDone} segment{chunksDone > 1 ? 's' : ''} transcrit{chunksDone > 1 ? 's' : ''}
              </span>
            )}
            {recording && (
              <span className="flex items-center gap-1.5 text-xs text-red-500 animate-pulse font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                {formatTime(elapsed)}
              </span>
            )}
            {transcribing && (
              <span className="flex items-center gap-1.5 text-xs text-blue-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Transcription…
              </span>
            )}
          </div>
        </div>

        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={16}
          placeholder="Cliquez sur « Démarrer la dictée » et parlez librement. La transcription apparaît automatiquement. Vous pouvez aussi écrire directement ici…"
          className="w-full px-5 py-4 text-sm leading-relaxed resize-none focus:outline-none bg-white"
        />
      </div>

      {/* Boutons */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
            recording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
          }`}
        >
          {recording ? (
            <><MicOff className="w-5 h-5" /> Arrêter la dictée</>
          ) : (
            <><Mic className="w-5 h-5" /> Démarrer la dictée</>
          )}
        </button>

        {recording && (
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Enregistrement en cours — parlez librement
          </span>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Aide téléphone */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 leading-relaxed">
        <strong>📱 Sur téléphone :</strong> l'enregistrement continue en arrière-plan sous
        <strong> Chrome Android</strong> même écran verrouillé.
        Sur <strong>iPhone</strong> (Safari / Chrome iOS), gardez l'écran allumé pendant la dictée.
        La transcription s'effectue automatiquement toutes les 10 minutes et à l'arrêt.
      </div>
    </div>
  )
}
