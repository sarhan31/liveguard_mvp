import { useEffect, useRef, useState } from 'react'

const envWs = (import.meta as any).env?.VITE_WS_URL as string | undefined
function inferWsUrl(): string {
  if (envWs && typeof envWs === 'string' && envWs.trim()) return envWs
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const hostBased = `${proto}://${window.location.host}/ws/audio`
    if ((import.meta as any).env?.DEV) {
      return 'ws://localhost:8000/ws/audio'
    }
    return hostBased
  }
  return 'ws://localhost:8000/ws/audio'
}
const WS_URL = inferWsUrl()
const SAMPLE_RATE = 16000
const CHUNK_SECONDS = 1.5
const CHUNK_SAMPLES = Math.floor(SAMPLE_RATE * CHUNK_SECONDS)

export type Msg = {
  probability: number
  risk: number
  level: 'GREEN'|'YELLOW'|'RED'
  latency_ms: number
}

export function useWebSocketAudio() {
  const [connected, setConnected] = useState(false)
  const [lastMsg, setLastMsg] = useState<Msg | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const bufferRef = useRef<Float32Array>(new Float32Array(0))
  const runningRef = useRef(false)

  const start = async () => {
    if (runningRef.current) return
    runningRef.current = true
    const ws = new WebSocket(WS_URL)
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        if (typeof msg?.risk === 'number') setLastMsg(msg)
      } catch {}
    }
    wsRef.current = ws

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE })
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false
    })
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    const processor = audioCtx.createScriptProcessor(4096, 1, 1)
    source.connect(analyser)
    analyser.connect(processor)
    processor.connect(audioCtx.destination)
    audioCtxRef.current = audioCtx
    sourceRef.current = source
    analyserRef.current = analyser
    processorRef.current = processor
    bufferRef.current = new Float32Array(0)

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      if (!runningRef.current) return
      const input = e.inputBuffer
      const mono = input.getChannelData(0)
      const prev = bufferRef.current
      const out = new Float32Array(prev.length + mono.length)
      out.set(prev, 0)
      out.set(mono, prev.length)
      bufferRef.current = out
      let buf = bufferRef.current
      while (buf.length >= CHUNK_SAMPLES) {
        const chunk = buf.subarray(0, CHUNK_SAMPLES)
        buf = buf.subarray(CHUNK_SAMPLES)
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const ab = new Float32Array(chunk).buffer
          wsRef.current.send(ab)
        }
      }
      bufferRef.current = buf
    }
  }

  const stop = () => {
    runningRef.current = false
    try { processorRef.current?.disconnect() } catch {}
    try { analyserRef.current?.disconnect() } catch {}
    try { sourceRef.current?.disconnect() } catch {}
    try { audioCtxRef.current?.close() } catch {}
    try { wsRef.current?.close() } catch {}
  }

  useEffect(() => {
    return () => stop()
  }, [])

  return {
    connected,
    lastMsg,
    analyser: analyserRef.current,
    start,
    stop
  }
}
