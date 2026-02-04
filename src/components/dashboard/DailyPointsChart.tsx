'use client'

import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Task {
    id: string
    completed_at?: string | null
    points?: number | null
    assignee_name?: string | null
}

interface DailyPointsChartProps {
    tasks: Task[]
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6']
const WEEKDAY_COLORS = ['#f97316', '#22c55e', '#ec4899', '#60a5fa', '#06b6d4']

export default function DailyPointsChart({ tasks }: DailyPointsChartProps) {
    // Group points by day of week (Mon-Fri = 1-5)
    const pointsByDay: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    tasks.forEach(task => {
        if (task.completed_at && task.points) {
            const date = new Date(task.completed_at)
            const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ...
            // Only count Mon-Fri (1-5)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                pointsByDay[dayOfWeek] = (pointsByDay[dayOfWeek] || 0) + task.points
            }
        }
    })

    const chartData = [1, 2, 3, 4, 5].map((day, index) => ({
        day: WEEKDAY_LABELS[index],
        points: pointsByDay[day] || 0,
        color: WEEKDAY_COLORS[index]
    }))

    const maxPoints = Math.max(...chartData.map(d => d.points), 1)

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
                📊 Points Theo Ngày Trong Tuần
            </h3>

            {chartData.every(d => d.points === 0) ? (
                <div className="flex items-center justify-center h-[200px] text-slate-400">
                    Chưa có dữ liệu
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} margin={{ top: 30, right: 10, left: -10, bottom: 0 }}>
                        <XAxis
                            dataKey="day"
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            axisLine={{ stroke: '#475569' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            axisLine={{ stroke: '#475569' }}
                            tickLine={false}
                            domain={[0, Math.ceil(maxPoints * 1.2)]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #475569',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            formatter={(value) => [`${value} points`, 'Points']}
                        />
                        <Bar
                            dataKey="points"
                            radius={[8, 8, 0, 0]}
                            maxBarSize={60}
                            label={{ position: 'top', fill: '#fff', fontSize: 16, fontWeight: 'bold' }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}

            {/* Legend */}
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {chartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-slate-400">
                            {item.day}: {item.points} pts
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
