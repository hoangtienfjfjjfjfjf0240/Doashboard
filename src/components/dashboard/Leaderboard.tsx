'use client'

import { Trophy, TrendingUp, Target } from 'lucide-react'

interface LeaderboardEntry {
    name: string
    points: number
    target: number
    percent: number
    rank: number
}

interface LeaderboardProps {
    data: LeaderboardEntry[]
}

export default function Leaderboard({ data }: LeaderboardProps) {
    const sortedData = [...data].sort((a, b) => b.percent - a.percent).slice(0, 10)

    const getRankBadge = (rank: number) => {
        if (rank === 1) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '🥇' }
        if (rank === 2) return { bg: 'bg-slate-400/20', text: 'text-slate-300', icon: '🥈' }
        if (rank === 3) return { bg: 'bg-amber-600/20', text: 'text-amber-500', icon: '🥉' }
        return { bg: 'bg-slate-700/50', text: 'text-slate-400', icon: rank.toString() }
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
            </div>

            <div className="space-y-3">
                {sortedData.map((entry, index) => {
                    const badge = getRankBadge(index + 1)
                    const progressColor = entry.percent >= 100 ? 'bg-emerald-500' :
                        entry.percent >= 75 ? 'bg-purple-500' :
                            entry.percent >= 50 ? 'bg-yellow-500' : 'bg-slate-500'

                    return (
                        <div
                            key={entry.name}
                            className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors"
                        >
                            {/* Rank */}
                            <div className={`w-8 h-8 rounded-lg ${badge.bg} flex items-center justify-center`}>
                                <span className={`text-sm font-bold ${badge.text}`}>
                                    {index < 3 ? badge.icon : badge.icon}
                                </span>
                            </div>

                            {/* Name & Progress */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{entry.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                                            style={{ width: `${Math.min(100, entry.percent)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-400 whitespace-nowrap">
                                        {entry.percent.toFixed(0)}%
                                    </span>
                                </div>
                            </div>

                            {/* Points */}
                            <div className="text-right">
                                <p className="text-sm font-bold text-white">{entry.points}</p>
                                <p className="text-xs text-slate-500">/ {entry.target}</p>
                            </div>
                        </div>
                    )
                })}

                {sortedData.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        No data available
                    </div>
                )}
            </div>
        </div>
    )
}
