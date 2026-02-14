import React from 'react'
export default function StatusHeader({ connected, latency }: { connected: boolean, latency: number }) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-white/10">
      <div>
        <h1 className="text-4xl font-extrabold tracking-[0.3em] text-white drop-shadow-[0_0_16px_rgba(0,255,163,0.5)]">LIVEGUARD</h1>
        <p className="text-sm text-white/60 mt-1">Real‑Time Voice Authenticity Monitor</p>
      </div>
      <div className="flex items-center gap-3 text-white/70">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]'}`} />
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
        <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-xs">Latency {latency.toFixed(1)} ms</span>
        <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-xs">Engine: Hybrid EMA</span>
        <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-xs">Mode: Streaming</span>
      </div>
    </div>
  )
}
