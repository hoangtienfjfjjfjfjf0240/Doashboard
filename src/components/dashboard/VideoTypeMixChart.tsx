'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts'

interface AssigneeVideoTypeData {
    name: string
    S1: number
    S2A: number
    S2B: number
    S3A: number
    S3B: number
    S4: number
    S5: number
    S6: number
    S7?: number
    S8?: number
    S9A?: number
    S9B?: number
    S9C?: number
}

interface VideoTypeMixChartProps {
    data: AssigneeVideoTypeData[]
}

const VIDEO_TYPE_COLORS: Record<string, string> = {
    S1: '#94a3b8',
    S2A: '#60a5fa',
    S2B: '#38bdf8',
    S3A: '#34d399',
    S3B: '#4ade80',
    S4: '#fbbf24',
    S5: '#f97316',
    S6: '#ef4444',
    S7: '#ec4899',
    S8: '#a855f7',
    S9A: '#6366f1',
    S9B: '#8b5cf6',
    S9C: '#a78bfa',
}

// Get all video types that have data
const getActiveVideoTypes = (data: AssigneeVideoTypeData[]) => {
    const activeTypes: string[] = []
    Object.keys(VIDEO_TYPE_COLORS).forEach(type => {
        const hasData = data.some((d: any) => d[type] && d[type] > 0)
        if (hasData) activeTypes.push(type)
    })
    return activeTypes
}

export default function VideoTypeMixChart({ data }: VideoTypeMixChartProps) {
    const sortedData = [...data].slice(0, 8)
    const activeVideoTypes = getActiveVideoTypes(sortedData)

    // Get the last (top) video type for showing labels on top of stacked bars
    const topVideoType = activeVideoTypes[activeVideoTypes.length - 1]

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-4">Phân Bổ Loại Video</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        margin={{ left: 10, right: 10, bottom: 30, top: 30 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={11}
                            angle={0}
                            textAnchor="middle"
                            height={40}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #475569',
                                borderRadius: '8px',
                                padding: '10px',
                            }}
                            labelStyle={{ color: '#f1f5f9', fontWeight: 600, fontSize: 12 }}
                            itemStyle={{ fontSize: 11 }}
                        />
                        <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 10 }}>{value}</span>}
                        />
                        {activeVideoTypes.map((type, index) => (
                            <Bar
                                key={type}
                                dataKey={type}
                                stackId="a"
                                fill={VIDEO_TYPE_COLORS[type]}
                            >
                                {/* Show label on top of each stacked bar column */}
                                {index === activeVideoTypes.length - 1 && (
                                    <LabelList
                                        dataKey={(entry: any) => {
                                            // Calculate total for this bar
                                            return activeVideoTypes.reduce((sum, t) => sum + (entry[t] || 0), 0)
                                        }}
                                        position="top"
                                        fill="#a855f7"
                                        fontSize={11}
                                        fontWeight={600}
                                    />
                                )}
                            </Bar>
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
