import React, { useEffect, useRef } from 'react'

export default function WaveformCanvas({ analyser }: { analyser: AnalyserNode | null }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    let raf: number
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')!
    const loop = () => {
      const w = cvs.width
      const h = cvs.height
      ctx.clearRect(0,0,w,h)
      if (analyser) {
        const data = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(data)
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(180,220,255,0.9)'
        ctx.beginPath()
        const step = Math.ceil(data.length / w)
        for (let x=0; x<w; x++) {
          let sum = 0
          for (let i=0; i<step; i++) {
            const idx = x*step + i
            if (idx < data.length) sum += data[idx]
          }
          const v = (sum/step) * 0.5 + 0.5
          const y = (1 - v) * h
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [analyser])

  return <canvas ref={ref} width={800} height={180} className="w-full h-[180px] rounded-xl border border-white/10 bg-black/20" />
}
