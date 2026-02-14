import React from 'react'
export default function ControlBar({ rms, onStart, onStop, status }: { rms: number, onStart: () => void, onStop: () => void, status: string }) {
  const width = Math.max(0, Math.min(100, rms * 120))
  return (
    <div className="mt-5 flex items-center gap-4">
      <div className="flex-1">
        <div className="h-3 rounded-full bg-white/10 border border-white/10 overflow-hidden">
          <div className="h-full" style={{ width: `${width}%`, background: 'linear-gradient(90deg, #00ffa3, #ffd84d 60%, #ff2757 100%)' }} />
        </div>
        <div className="text-xs text-white/60 mt-1">Mic Level</div>
      </div>
      <button onClick={onStart} className="px-4 py-2 rounded-lg bg-emerald-500/30 border border-emerald-400/40 text-white hover:shadow-[0_0_18px_rgba(16,185,129,0.6)] transition">Start</button>
      <button onClick={onStop} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20">Stop</button>
      <div className="text-sm text-white/70">{status}</div>
    </div>
  )
}
