'use client'

import { TrendingUp, Video, CheckCircle, XCircle, Trophy } from 'lucide-react'

interface KPICardsProps {
    totalPoints: number
    totalVideos: number
    doneTasks: number
    notDoneTasks: number
    activeAssignees: number
    avgPointsPerVideo: number
    teamTargetPoints: number
    teamAchievedPercent: number
    weeksAchieved?: number
    totalWeeks?: number
}

export default function KPICards({
    totalPoints,
    totalVideos,
    doneTasks,
    notDoneTasks,
    teamTargetPoints,
    weeksAchieved = 0,
    totalWeeks = 24,
}: KPICardsProps) {
    const cards = [
        {
            title: 'Total Videos',
            value: totalVideos.toLocaleString(),
            icon: Video,
            color: 'from-cyan-500 to-blue-600',
            bgColor: 'bg-cyan-500/10',
            textColor: 'text-cyan-400',
        },
        {
            title: 'Done Tasks',
            value: doneTasks.toLocaleString(),
            icon: CheckCircle,
            color: 'from-emerald-500 to-green-600',
            bgColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-400',
        },
        {
            title: 'Not Done',
            value: notDoneTasks.toLocaleString(),
            icon: XCircle,
            color: 'from-amber-500 to-orange-600',
            bgColor: 'bg-amber-500/10',
            textColor: 'text-amber-400',
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 stagger-children">
            {/* Total Points Card - 2 lines: Actual + Target */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600/50 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-default group">
                <div className="inline-flex p-2 rounded-xl bg-violet-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                </div>
                <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-white">
                            {totalPoints % 1 === 0 ? totalPoints : totalPoints.toFixed(1)}
                        </p>
                        <span className="text-xs text-emerald-400">thực tế</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-lg font-semibold text-slate-400">
                            {teamTargetPoints}
                        </p>
                        <span className="text-xs text-purple-400">mục tiêu</span>
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Total Points</p>
            </div>

            {cards.map((card) => (
                <div
                    key={card.title}
                    className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600/50 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-default group"
                >
                    <div className={`inline-flex p-2 rounded-xl ${card.bgColor} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                        <card.icon className={`w-5 h-5 ${card.textColor}`} />
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
                    <p className="text-xs text-slate-400">{card.title}</p>
                </div>
            ))}

            {/* Weeks Achieved Card - shows how many weeks reached target */}
            <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex p-2 rounded-xl bg-purple-500/20 group-hover:scale-110 group-hover:bg-purple-500/30 transition-all duration-300">
                        <Trophy className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${weeksAchieved > 0
                            ? 'text-emerald-300 bg-emerald-500/20'
                            : 'text-slate-300 bg-slate-500/20'
                        }`}>
                        {weeksAchieved > 0 ? '🎉 Đạt!' : 'Chưa đạt'}
                    </span>
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                    {weeksAchieved}/{totalWeeks}
                </p>
                <p className="text-xs text-slate-400">Tuần đạt target</p>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${weeksAchieved > 0
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                                : 'bg-slate-600'
                            }`}
                        style={{ width: `${(weeksAchieved / totalWeeks) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
