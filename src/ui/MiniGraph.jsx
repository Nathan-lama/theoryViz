import { useMemo } from 'react'

export default function MiniGraph({ data = [], width = 160, height = 40, color }) {
    const { path, trend, fillPath } = useMemo(() => {
        if (data.length < 2) return { path: '', trend: 0, fillPath: '' }

        const max = Math.max(...data, 1)
        const min = Math.min(...data, 0)
        const range = max - min || 1

        const points = data.map((v, i) => {
            const x = (i / (data.length - 1)) * width
            const y = height - ((v - min) / range) * (height - 4) - 2
            return `${x},${y}`
        })

        const path = `M ${points.join(' L ')}`

        // Fill path (area under curve)
        const fillPath = `${path} L ${width},${height} L 0,${height} Z`

        // Trend: compare last value to average of first quarter
        const firstQuarter = data.slice(0, Math.max(1, Math.floor(data.length / 4)))
        const avg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length
        const lastVal = data[data.length - 1]
        const trend = lastVal >= avg ? 1 : -1

        return { path, trend, fillPath }
    }, [data, width, height])

    const lineColor = color || (trend >= 0 ? '#4CAF50' : '#F44336')
    const fillColor = color || (trend >= 0 ? '#4CAF50' : '#F44336')

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            {/* Fill */}
            <path
                d={fillPath}
                fill={fillColor}
                opacity={0.15}
            />
            {/* Line */}
            <path
                d={path}
                fill="none"
                stroke={lineColor}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    )
}
