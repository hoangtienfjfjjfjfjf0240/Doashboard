'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface StatusDonutProps {
    done: number
    notDone: number
}

export default function StatusDonut({ done, notDone }: StatusDonutProps) {
    const data = [
        { name: 'Done', value: done, color: '#10b981' },
        { name: 'Not Done', value: notDone, color: '#f59e0b' },
    ]

    const total = done + notDone
    const donePercent = total > 0 ? ((done / total) * 100).toFixed(0) : 0

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Task Status</h3>
            <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '12px',
                                padding: '12px',
                            }}
                            labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-20px' }}>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">{donePercent}%</p>
                        <p className="text-xs text-slate-400">Complete</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
