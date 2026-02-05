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

const TOOL_BAR_COLORS: Record<string, string> = {
    'Translate Tool': 'from-red-500 to-red-600',
    'Media tool': 'from-yellow-500 to-yellow-600',
    'Voice Clone': 'from-green-500 to-green-600',
    'Flow veo3': 'from-blue-500 to-blue-600',
    'Sora': 'from-orange-500 to-orange-600',
}

export default function CTSTChart({ tasks }: CTSTChartProps) {
    const stats = useMemo(() => {
        const toolTotals: Record<string, number> = {}
        let totalCTST = 0

        tasks.forEach(task => {
            if (!task.ctst || task.status !== 'done') return
            toolTotals[task.ctst] = (toolTotals[task.ctst] || 0) + 1
            totalCTST++
        })

        // Sort by count descending
        const toolsWithPercent = Object.entries(toolTotals)
            .map(([name, count]) => ({
                name,
                count,
                percent: totalCTST > 0 ? (count / totalCTST) * 100 : 0
            }))
            .sort((a, b) => b.count - a.count)

        return { toolsWithPercent, totalCTST }
    }, [tasks])

    if (stats.toolsWithPercent.length === 0) {
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

    const maxPercent = Math.max(...stats.toolsWithPercent.map(t => t.percent), 1)

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-purple-400" />
                    <h3 className="text-base font-semibold text-white">Cải Tiến Sáng Tạo (CTST)</h3>
                </div>
                <span className="text-xs text-slate-500">
                    {stats.totalCTST} tasks
                </span>
            </div>

            {/* Bar chart showing percentage for each tool */}
            <div className="space-y-3">
                {stats.toolsWithPercent.map((tool) => (
                    <div key={tool.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-sm ${TOOL_COLORS[tool.name] || 'bg-slate-500'}`} />
                                <span className="text-slate-300">{tool.name}</span>
                            </div>
                            <span className="text-slate-400 font-medium">
                                {tool.percent.toFixed(1)}% <span className="text-slate-600">({tool.count})</span>
                            </span>
                        </div>
                        <div className="h-6 bg-slate-700/50 rounded-lg overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${TOOL_BAR_COLORS[tool.name] || 'from-slate-500 to-slate-600'} transition-all duration-500 rounded-lg flex items-center justify-end pr-2`}
                                style={{ width: `${(tool.percent / maxPercent) * 100}%` }}
                            >
                                {tool.percent >= 15 && (
                                    <span className="text-xs text-white font-medium">
                                        {tool.percent.toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
