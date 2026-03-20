'use client'

/**
 * VoiceRecorder — enregistrement audio longue durée via MediaRecorder + Whisper API
 *
 * Fonctionnement :
 * - Enregistre en continu via MediaRecorder (audio/webm)
 * - Découpe automatiquement en chunks toutes les CHUNK_MINUTES minutes
 * - Chaque chunk est envoyé à /api/transcribe (Whisper) dès qu'il est prêt
 * - Le texte transcrit s'accumule dans la zone de texte en temps réel
 * - Wake Lock API : empêche l'écran de se verrouiller automatiquement
 * - Durée illimitée : fonctionne pour des consultations d'1h+
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Loader2, AlertCircle, Clock } from 'lucide-react'

// Intervalle de découpe automatique (en ms) — 10 minutes
const CHUNK_INTERVAL_MS = 10 * 60 * 1000

interface Props {
  value: string
  onChange: (value: string) => void
}

type RecordingStatus = 'idle' | 'recording' | 'transcribing' | 'error'

export default function VoiceRecorder({ value, onChange }: Props) {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [chunkCount, setChunkCount] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const accumulatedTextRef = useRef(value)

  // Maintient la ref synchronisée avec la prop
  useEffect(() => {
    accumulatedTextRef.current = value
  }, [value])

  // Demande le Wake Lock pour garder l'écran allumé
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      // Wake Lock non supporté ou refusé — on continue sans
    }
  }

  function releaseWakeLock() {
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
  }

  // Transcrit un blob audio via Whisper
  const transcribeBlob = useCallback(async (blob: Blob) => {
    if (blob.size < 1000) return // Ignore les chunks trop petits (silence)

    setIsTranscribing(true)
    try {
      const fd = new FormData()
      fd.append('audio', blob, 'chunk.webm')
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      const { text } = await res.json()
      if (text?.trim()) {
        const prev = accumulatedTextRef.current
        const next = prev ? `${prev} ${text.trim()}` : text.trim()
        accumulatedTextRef.current = next
        onChange(next)
        setChunkCount(c => c + 1)
      }
    } catch (err) {
      console.error('Transcription chunk error:', err)
    } finally {
      setIsTranscribing(false)
    }
  }, [onChange])

  // Démarre un nouveau MediaRecorder sur le stream existant
  const startMediaRecorder = useCallback((stream: MediaStream) => {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

    const mr = new MediaRecorder(stream, { mimeType })
    chunksRef.current = []

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      transcribeBlob(blob)
      chunksRef.current = []
    }

    mr.start(1000) // collecte des données toutes les secondes
    mediaRecorderRef.current = mr
  }, [transcribeBlob])

  // Découpe le chunk courant et en démarre un nouveau
  const rotateChunk = useCallback(() => {
    const mr = mediaRecorderRef.current
    const stream = streamRef.current
    if (!mr || !stream || mr.state !== 'recording') return

    mr.stop() // déclenche onstop → transcription
    // Relance immédiatement un nouveau MediaRecorder sur le même stream
    setTimeout(() => {
      if (streamRef.current) startMediaRecorder(streamRef.current)
    }, 200)
  }, [startMediaRecorder])

  async function startRecording() {
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      await requestWakeLock()
      startMediaRecorder(stream)

      setStatus('recording')
      startTimeRef.current = Date.now()
      setElapsedSeconds(0)
      setChunkCount(0)

      // Timer d'affichage
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      // Timer de découpe automatique toutes les CHUNK_INTERVAL_MS
      chunkTimerRef.current = setInterval(rotateChunk, CHUNK_INTERVAL_MS)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microphone inaccessible'
      setErrorMsg(`Impossible d'accéder au microphone : ${msg}`)
      setStatus('error')
    }
  }

  function stopRecording() {
    // Arrête les timers
    if (timerRef.current) clearInterval(timerRef.current)
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current)

    // Arrête le MediaRecorder (déclenche transcription du dernier chunk)
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    // Libère le microphone
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null

    releaseWakeLock()
    setStatus('idle')
  }

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      releaseWakeLock()
    }
  }, [])

  function formatTime(s: number) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}h${String(m).padStart(2, '0')}m${String(sec).padStart(2, '0')}s`
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const isRecording = status === 'recording'

  return (
    <div className="space-y-4">
      {/* Zone de texte transcrit */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <div>
            <p className="text-sm font-medium text-foreground">Dictée longue durée</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enregistrement continu — transcription automatique par Whisper IA toutes les 10 min
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isTranscribing && (
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <Loader2 className="w-3 h-3 animate-spin" />
                Transcription…
              </span>
            )}
            {isRecording && (
              <span className="flex items-center gap-1.5 text-xs text-red-500 animate-pulse font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                REC
              </span>
            )}
          </div>
        </div>

        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={16}
          placeholder="Cliquez sur 'Démarrer l'enregistrement' et parlez librement. La transcription apparaît ici automatiquement toutes les 10 minutes. Vous pouvez aussi taper directement…"
          className="w-full px-5 py-4 text-sm leading-relaxed resize-none focus:outline-none bg-white"
        />
      </div>

      {/* Contrôles */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
          }`}
        >
          {isRecording ? (
            <><MicOff className="w-5 h-5" />Arrêter l'enregistrement</>
          ) : (
            <><Mic className="w-5 h-5" />Démarrer l'enregistrement</>
          )}
        </button>

        {/* Chronomètre */}
        {isRecording && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2.5 rounded-xl font-mono">
            <Clock className="w-4 h-4 text-red-500" />
            {formatTime(elapsedSeconds)}
            {chunkCount > 0 && (
              <span className="text-xs text-primary font-sans">
                · {chunkCount} segment{chunkCount > 1 ? 's' : ''} transcrit{chunkCount > 1 ? 's' : ''}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Message d'erreur */}
      {status === 'error' && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Consignes */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 space-y-1.5">
        <p className="text-xs font-semibold text-blue-800">Conseils pour une bonne dictée</p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Gardez l'écran allumé (l'application maintient l'écran actif automatiquement)</li>
          <li>La transcription se déclenche automatiquement toutes les 10 minutes</li>
          <li>Dictez section par section : <em>"Motif : douleur plantaire… Examen : …"</em></li>
          <li>Durée illimitée — convient pour une consultation d'1h et plus</li>
          <li>Fonctionne sur Chrome, Edge et Safari (iPhone)</li>
        </ul>
      </div>
    </div>
  )
}
