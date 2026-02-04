'use client'

import { Clock, CheckCircle2 } from 'lucide-react'

interface Task {
    assignee_name: string | null
    status: 'done' | 'not_done'
    completed_at: string | null
    due_date: string | null
}

interface DueDateStatsProps {
    tasks: Task[]
}

export default function DueDateStats({ tasks }: DueDateStatsProps) {
    // Process stats
    const stats = tasks.reduce((acc, task) => {
        if (!task.assignee_name || task.status !== 'done' || !task.completed_at || !task.due_date) return acc

        if (!acc[task.assignee_name]) {
            acc[task.assignee_name] = { total: 0, onTime: 0, late: 0 }
        }

        acc[task.assignee_name].total++

        const completedDate = task.completed_at.split('T')[0]
        const dueDate = task.due_date

        if (completedDate > dueDate) {
            acc[task.assignee_name].late++
        } else {
            acc[task.assignee_name].onTime++
        }

        return acc
    }, {} as Record<string, { total: number; onTime: number; late: number }>)

    const statsArray = Object.entries(stats).map(([name, data]) => ({
        name,
        ...data,
        onTimeRate: data.total > 0 ? (data.onTime / data.total) * 100 : 0,
    }))

    // Sort by on-time rate descending
    const sortedStats = [...statsArray].sort((a, b) => b.onTimeRate - a.onTimeRate)

    const getProgressColor = (rate: number) => {
        if (rate >= 80) return 'bg-emerald-500'
        if (rate >= 50) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const getTextColor = (rate: number) => {
        if (rate >= 80) return 'text-emerald-400'
        if (rate >= 50) return 'text-yellow-400'
        return 'text-red-400'
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-semibold text-white">Tỉ Lệ Đúng Deadline</h3>
            </div>

            {sortedStats.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Member</th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Đúng hạn</th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Trễ hạn</th>
                                <th className="text-center py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng</th>
                                <th className="text-right py-3 px-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Tỉ lệ đúng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedStats.map((user, index) => (
                                <tr
                                    key={user.name}
                                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900' :
                                                index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900' :
                                                    index === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-800 text-white' :
                                                        'bg-slate-600 text-slate-300'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <span className="text-sm font-medium text-white">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="text-sm text-emerald-400 font-medium">{user.onTime}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="text-sm text-red-400 font-medium">{user.late}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="text-sm text-slate-400">{user.total}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="w-20 h-2 bg-slate-600 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${getProgressColor(user.onTimeRate)} rounded-full transition-all duration-500`}
                                                    style={{ width: `${user.onTimeRate}%` }}
                                                />
                                            </div>
                                            <span className={`text-sm font-bold ${getTextColor(user.onTimeRate)} w-14 text-right`}>
                                                {user.onTimeRate.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Chưa có dữ liệu deadline</p>
                </div>
            )}
        </div>
    )
}
