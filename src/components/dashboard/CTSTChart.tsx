'use client'

import { useMemo } from 'react'
import { Wrench } from 'lucide-react'

interface Task {
    assignee_name: string | null
    ctst: string | null
    status: 'done' | 'not_done'
}

interface CTSTChartProps {
    tasks: Task[]
}

const TOOL_COLORS: Record<string, string> = {
    'Translate Tool': 'bg-red-500',
    'Media tool': 'bg-yellow-500',
    'Voice Clone': 'bg-green-500',
    'Flow veo3': 'bg-blue-500',
    'Sora': 'bg-orange-500',
}

export default function CTSTChart({ tasks }: CTSTChartProps) {
    const stats = useMemo(() => {
        // Count CTST usage per user
        const userStats: Record<string, Record<string, number>> = {}
        const toolTotals: Record<string, number> = {}

        tasks.forEach(task => {
            if (!task.ctst || !task.assignee_name || task.status !== 'done') return

            if (!userStats[task.assignee_name]) {
                userStats[task.assignee_name] = {}
            }
            userStats[task.assignee_name][task.ctst] = (userStats[task.assignee_name][task.ctst] || 0) + 1
            toolTotals[task.ctst] = (toolTotals[task.ctst] || 0) + 1
        })

        // Convert to array and sort by total usage
        const users = Object.entries(userStats).map(([name, tools]) => ({
            name,
            tools,
            total: Object.values(tools).reduce((a, b) => a + b, 0)
        })).sort((a, b) => b.total - a.total)

        const allTools = Object.keys(toolTotals).sort((a, b) => toolTotals[b] - toolTotals[a])

        return { users, toolTotals, allTools }
    }, [tasks])

    if (stats.allTools.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Wrench className="w-5 h-5 text-purple-400" />
                    <h3 className="text-base font-semibold text-white">Cải Tiến Sáng Tạo (CTST)</h3>
                </div>
                <p className="text-slate-500 text-sm text-center py-4">Chưa có dữ liệu CTST</p>
            </div>
        )
    }

    const maxTotal = Math.max(...stats.users.map(u => u.total), 1)

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-purple-400" />
                    <h3 className="text-base font-semibold text-white">Cải Tiến Sáng Tạo (CTST)</h3>
                </div>
                <span className="text-xs text-slate-500">
                    {Object.values(stats.toolTotals).reduce((a, b) => a + b, 0)} tasks
                </span>
            </div>

            {/* Tool Legend */}
            <div className="flex flex-wrap gap-2 mb-4">
                {stats.allTools.map(tool => (
                    <div key={tool} className="flex items-center gap-1.5 text-xs">
                        <div className={`w-2.5 h-2.5 rounded-sm ${TOOL_COLORS[tool] || 'bg-slate-500'}`} />
                        <span className="text-slate-400">{tool}</span>
                        <span className="text-slate-600">({stats.toolTotals[tool]})</span>
                    </div>
                ))}
            </div>

            {/* User bars */}
            <div className="space-y-3">
                {stats.users.slice(0, 8).map((user, idx) => (
                    <div key={user.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-300 truncate max-w-[150px]">{user.name}</span>
                            <span className="text-slate-500 text-xs">{user.total}</span>
                        </div>
                        <div className="h-5 bg-slate-700/50 rounded-lg overflow-hidden flex">
                            {stats.allTools.map(tool => {
                                const count = user.tools[tool] || 0
                                if (count === 0) return null
                                const width = (count / maxTotal) * 100
                                return (
                                    <div
                                        key={tool}
                                        className={`h-full ${TOOL_COLORS[tool] || 'bg-slate-500'} transition-all duration-500`}
                                        style={{ width: `${width}%` }}
                                        title={`${tool}: ${count}`}
                                    />
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
