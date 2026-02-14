import React, { useEffect, useRef, useState } from 'react'

export default function Gauge({ target, level }: { target: number, level: 'GREEN'|'YELLOW'|'RED' }) {
  const [val, setVal] = useState(0)
  const rafRef = useRef<number | null>(null)
  const r = 86
  const C = 2 * Math.PI * r

  useEffect(() => {
    const loop = () => {
      setVal(v => v + (target - v) * 0.08)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target])

  const offset = C * (1 - Math.max(0, Math.min(1, val)))
  const pulse = level === 'RED' ? 'animate-pulseGlow' : ''

  return (
    <div className={`relative w-[360px] h-[360px] grid place-items-center ${pulse}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 drop-shadow-lg">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ffa3"/>
            <stop offset="50%" stopColor="#f7d200"/>
            <stop offset="100%" stopColor="#ff2757"/>
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} className="fill-none stroke-white/10" strokeWidth="18" />
        <circle cx="100" cy="100" r={r} className="fill-none stroke-[url(#gaugeGrad)]" strokeWidth="18" strokeLinecap="round"
          style={{ strokeDasharray: C, strokeDashoffset: offset }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-5xl font-extrabold drop-shadow-[0_0_18px_rgba(0,255,163,0.45)]">{Math.round(val*100)}%</div>
      </div>
    </div>
  )
}
