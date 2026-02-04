'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'

interface Task {
    video_type: string | null
    video_count: number
}

interface VideoTypeMixChartProps {
    data: Task[]
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

export default function VideoTypeMixChart({ data }: VideoTypeMixChartProps) {
    // Group by video type and count
    const videoTypeStats = data.reduce((acc, task) => {
        if (!task.video_type) return acc
        if (!acc[task.video_type]) {
            acc[task.video_type] = { count: 0, videos: 0 }
        }
        acc[task.video_type].count++
        acc[task.video_type].videos += task.video_count || 0
        return acc
    }, {} as Record<string, { count: number; videos: number }>)

    // Convert to array and sort by count
    const chartData = Object.entries(videoTypeStats)
        .map(([type, stats]) => ({
            name: type,
            count: stats.count,
            videos: stats.videos,
            color: VIDEO_TYPE_COLORS[type] || '#94a3b8'
        }))
        .sort((a, b) => b.videos - a.videos)

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-4">Phân Bổ Loại Video</h3>
            <div className="h-80">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ left: 10, right: 10, bottom: 30, top: 20 }}
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
                                formatter={(value, name) => [
                                    value,
                                    name === 'videos' ? 'Videos' : 'Tasks'
                                ]}
                            />
                            <Bar dataKey="videos" name="videos" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#fff', fontSize: 14, fontWeight: 'bold' }}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        Chưa có dữ liệu
                    </div>
                )}
            </div>
        </div>
    )
}
