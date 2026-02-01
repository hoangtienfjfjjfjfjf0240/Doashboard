'use client'

import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { format, parseISO, isAfter } from 'date-fns'

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
        lateRate: data.total > 0 ? (data.late / data.total) * 100 : 0,
    }))

    // Sort by on-time rate desc, then total count desc
    const bestPerformers = [...statsArray]
        .sort((a, b) => b.onTimeRate - a.onTimeRate || b.total - a.total)
        .slice(0, 3)

    // Sort by late rate desc, then total count desc
    const worstPerformers = [...statsArray]
        .filter(s => s.lateRate > 0)
        .sort((a, b) => b.lateRate - a.lateRate || b.total - a.total)
        .slice(0, 3)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Best Performers - On Time */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">Đúng Deadline Nhất</h3>
                </div>
                <div className="space-y-3">
                    {bestPerformers.length > 0 ? bestPerformers.map((user, index) => (
                        <div key={user.name} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 hover:translate-x-1 transition-all duration-200 cursor-default">
                            <div className="flex items-center gap-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-slate-900 animate-pulse-badge' :
                                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900' :
                                        'bg-gradient-to-br from-orange-600 to-orange-800 text-white'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{user.name}</p>
                                    <p className="text-xs text-slate-400">{user.onTime}/{user.total} tasks đúng hạn</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${user.onTimeRate}%` }}
                                    />
                                </div>
                                <p className="text-lg font-bold text-emerald-400 w-16 text-right">{user.onTimeRate.toFixed(1)}%</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-sm text-slate-500 text-center py-4">Chưa có dữ liệu</p>
                    )}
                </div>
            </div>

            {/* Worst Performers - Late */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-white">Cần Cải Thiện Về Deadline</h3>
                </div>
                <div className="space-y-3">
                    {worstPerformers.length > 0 ? worstPerformers.map((user, index) => (
                        <div key={user.name} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 hover:translate-x-1 transition-all duration-200 cursor-default">
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-300 shadow-lg">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{user.name}</p>
                                    <p className="text-xs text-slate-400">{user.late}/{user.total} tasks trễ hạn</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 rounded-full transition-all duration-500"
                                        style={{ width: `${user.lateRate}%` }}
                                    />
                                </div>
                                <p className="text-lg font-bold text-red-400 w-16 text-right">{user.lateRate.toFixed(1)}%</p>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-6">
                            <p className="text-2xl mb-2">🎉</p>
                            <p className="text-sm text-slate-400">Tất cả đều làm đúng hạn!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
