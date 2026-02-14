import Gauge from './components/Gauge'
import WaveformCanvas from './components/WaveformCanvas'
import RiskTimeline from './components/RiskTimeline'
import StatusHeader from './components/StatusHeader'
import ControlBar from './components/ControlBar'
import React, { useEffect, useMemo, useState } from 'react'
import { useWebSocketAudio } from './hooks/useWebSocketAudio'

export default function App() {
  const { connected, lastMsg, analyser, start, stop } = useWebSocketAudio()
  const [timeline, setTimeline] = useState<number[]>([])
  const [rms, setRms] = useState(0)
  const level = lastMsg?.level ?? 'GREEN'
  const target = lastMsg?.risk ?? 0
  const probability = lastMsg?.probability ?? 0
  const latency = lastMsg?.latency_ms ?? 0

  useEffect(() => {
    if (typeof lastMsg?.risk === 'number') {
      setTimeline(prev => {
        const arr = [...prev, lastMsg.risk]
        if (arr.length > 10) arr.shift()
        return arr
      })
    }
  }, [lastMsg])

  useEffect(() => {
    let raf: number
    const loop = () => {
      if (analyser) {
        const data = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(data)
        let s = 0
        for (let i=0;i<data.length;i++) s += data[i]*data[i]
        setRms(Math.sqrt(s / data.length))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [analyser])

  const glow = useMemo(() => {
    if (level === 'RED') return 'shadow-[0_0_40px_rgba(255,39,87,0.18)] animate-pulseGlow'
    if (level === 'YELLOW') return 'shadow-[0_0_30px_rgba(255,216,77,0.14)]'
    return 'shadow-[0_0_30px_rgba(0,255,163,0.12)]'
  }, [level])

  return (
    <div className={`relative min-h-screen text-white`} style={{ background: 'radial-gradient(1200px 1200px at 20% 10%, #0e1a2b 0%, #0b1220 40%, #070b14 100%)' }}>
      <div className="bg-aurora animate-aurora"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className={`rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6 ${glow}`}>
          <StatusHeader connected={connected} latency={latency} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <div className="flex flex-col items-center">
              <Gauge target={target} level={level} />
              <div className="grid grid-cols-3 gap-3 w-full mt-2">
                <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center">
                  <div className="text-xs text-white/60">Risk</div>
                  <div className="text-2xl font-bold">{(target*100).toFixed(1)}%</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center">
                  <div className="text-xs text-white/60">Chunk Prob</div>
                  <div className="text-2xl font-bold">{(probability*100).toFixed(1)}%</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center">
                  <div className="text-xs text-white/60">Latency</div>
                  <div className="text-2xl font-bold">{latency.toFixed(1)} ms</div>
                </div>
              </div>
              <div className={`mt-3 text-center text-sm ${level === 'RED' ? 'text-rose-300' : level === 'YELLOW' ? 'text-yellow-300' : 'text-emerald-300'}`}>
                {level === 'RED' ? 'High risk detected – verify speaker identity' : level === 'YELLOW' ? 'Moderate risk – monitor closely' : 'Low risk – normal operation'}
              </div>
            </div>

            <div className="flex flex-col">
              <WaveformCanvas analyser={analyser ?? null} />
              <div className="mt-4 rounded-xl border border-white/10 bg-white/10 p-3">
                <div className="text-sm text-white/60 mb-2">Risk Timeline (last 10)</div>
                <RiskTimeline data={timeline} />
              </div>
              <ControlBar rms={rms} onStart={start} onStop={stop} status={connected ? 'Streaming' : 'Idle'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
