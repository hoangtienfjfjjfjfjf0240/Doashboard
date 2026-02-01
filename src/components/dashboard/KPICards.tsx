'use client'

import { TrendingUp, Video, CheckCircle, XCircle, Users, Target, Zap, BarChart3 } from 'lucide-react'

interface KPICardsProps {
    totalPoints: number
    totalVideos: number
    doneTasks: number
    notDoneTasks: number
    activeAssignees: number
    avgPointsPerVideo: number
    teamTargetPoints: number
    teamAchievedPercent: number
}

export default function KPICards({
    totalPoints,
    totalVideos,
    doneTasks,
    notDoneTasks,
    activeAssignees,
    avgPointsPerVideo,
    teamTargetPoints,
    teamAchievedPercent,
}: KPICardsProps) {
    const cards = [
        {
            title: 'Total Points',
            value: totalPoints.toLocaleString(),
            icon: TrendingUp,
            color: 'from-violet-500 to-purple-600',
            bgColor: 'bg-violet-500/10',
            textColor: 'text-violet-400',
        },
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
        {
            title: 'Active Members',
            value: activeAssignees.toLocaleString(),
            icon: Users,
            color: 'from-pink-500 to-rose-600',
            bgColor: 'bg-pink-500/10',
            textColor: 'text-pink-400',
        },
        {
            title: 'Avg Points/Video',
            value: avgPointsPerVideo.toFixed(1),
            icon: Zap,
            color: 'from-yellow-500 to-amber-600',
            bgColor: 'bg-yellow-500/10',
            textColor: 'text-yellow-400',
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6 stagger-children">
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

            {/* Target Completion - Special Card */}
            <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex p-2 rounded-xl bg-purple-500/20 group-hover:scale-110 group-hover:bg-purple-500/30 transition-all duration-300">
                        <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-purple-300 bg-purple-500/10 px-2 py-1 rounded-full">{teamTargetPoints} target</span>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{teamAchievedPercent.toFixed(0)}%</p>
                <p className="text-xs text-slate-400">Target Completion</p>
                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-1000 ease-out animate-progress"
                        style={{ width: `${Math.min(100, teamAchievedPercent)}%` }}
                    />
                </div>
            </div>
        </div>
    )
}
