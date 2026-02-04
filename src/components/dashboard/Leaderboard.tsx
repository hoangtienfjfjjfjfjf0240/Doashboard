'use client'

import { Trophy } from 'lucide-react'

interface LeaderboardEntry {
    name: string
    weeksAchieved: number
    totalWeeks: number
    points: number
    target: number
}

interface LeaderboardProps {
    data: LeaderboardEntry[]
}

export default function Leaderboard({ data }: LeaderboardProps) {
    // Sort by weeks achieved (desc), then by points (desc)
    const sortedData = [...data]
        .sort((a, b) => {
            if (b.weeksAchieved !== a.weeksAchieved) {
                return b.weeksAchieved - a.weeksAchieved
            }
            return b.points - a.points
        })
        .slice(0, 10)

    const getRankStyle = (rank: number) => {
        if (rank === 1) return { bg: 'bg-gradient-to-br from-yellow-500 to-amber-600', text: 'text-white' }
        if (rank === 2) return { bg: 'bg-gradient-to-br from-slate-300 to-slate-400', text: 'text-slate-800' }
        if (rank === 3) return { bg: 'bg-gradient-to-br from-amber-600 to-orange-700', text: 'text-white' }
        return { bg: 'bg-slate-700', text: 'text-slate-300' }
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-base font-semibold text-white">Leaderboard - Số Tuần Đạt Target</h3>
            </div>

            <div className="space-y-2">
                {sortedData.map((entry, index) => {
                    const rank = index + 1
                    const style = getRankStyle(rank)
                    const progressPercent = (entry.weeksAchieved / entry.totalWeeks) * 100

                    return (
                        <div
                            key={entry.name}
                            className="flex items-center gap-3 p-2.5 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all"
                        >
                            {/* Rank Badge */}
                            <div className={`w-7 h-7 rounded-lg ${style.bg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                <span className={`text-xs font-bold ${style.text}`}>{rank}</span>
                            </div>

                            {/* Name & Progress */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{entry.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1 bg-slate-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, progressPercent)}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                        {entry.points.toFixed(0)} pts
                                    </span>
                                </div>
                            </div>

                            {/* Weeks Achieved - Inline */}
                            <div className="flex items-baseline gap-0.5 flex-shrink-0">
                                <span className={`text-base font-bold ${entry.weeksAchieved > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {entry.weeksAchieved}
                                </span>
                                <span className="text-xs text-slate-500">/{entry.totalWeeks} tuần</span>
                            </div>
                        </div>
                    )
                })}

                {sortedData.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        Chưa có dữ liệu
                    </div>
                )}
            </div>
        </div>
    )
}
