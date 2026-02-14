import React from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

export default function RiskTimeline({ data }: { data: number[] }) {
  const chartData = data.map((v, i) => ({ idx: i, value: v }))
  const color = (v: number) => v > 0.7 ? '#ff2757' : v >= 0.3 ? '#ffd84d' : '#00ffa3'
  const shape = (props: any) => {
    const { x, y, width, height, payload } = props
    return <rect x={x} y={y} width={width} height={height} rx={6} ry={6} fill={color(payload.value)} />
  }
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="idx" hide />
          <YAxis domain={[0,1]} hide />
          <Bar dataKey="value" shape={shape} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
