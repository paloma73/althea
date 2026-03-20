'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onTranscript: (text: string) => void
  label?: string
}

export default function VoiceInput({ onTranscript, label = 'Dicter' }: Props) {
  const [recording,   setRecording]   = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const streamRef        = useRef<MediaStream | null>(null)

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

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
        stream.getTracks().forEach(t => t.stop())
        if (chunksRef.current.length === 0) return

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []
        setTranscribing(true)
        try {
          const form = new FormData()
          form.append('audio', blob, 'audio.webm')
          const res = await fetch('/api/transcribe', { method: 'POST', body: form })
          if (!res.ok) throw new Error()
          const data = await res.json()
          if (data.text) onTranscript(data.text)
        } catch {
          setError('Erreur transcription')
        } finally {
          setTranscribing(false)
        }
      }

      recorder.start(1000)
      setRecording(true)
    } catch {
      setError('Micro inaccessible')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  // Nettoyage
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [])

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={recording ? stopRecording : startRecording}
        disabled={transcribing}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
          recording
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 animate-pulse'
            : transcribing
              ? 'bg-muted border-border text-muted-foreground opacity-60 cursor-not-allowed'
              : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-accent'
        )}
        title={recording ? 'Arrêter' : label}
      >
        {transcribing ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Transcription…</>
        ) : recording ? (
          <><MicOff className="w-3.5 h-3.5" /> Arrêter</>
        ) : (
          <><Mic className="w-3.5 h-3.5" /> {label}</>
        )}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
