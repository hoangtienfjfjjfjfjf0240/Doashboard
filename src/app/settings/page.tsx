'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, Target } from 'lucide-react'
import { format, startOfWeek, addWeeks, getWeek } from 'date-fns'
import DashboardLayout from '@/components/DashboardLayout'

interface AssigneeTarget {
    assignee_name: string
    targets: Record<number, number>
}

function getWeeksOf2026() {
    const weeks: { weekNum: number; start: Date; label: string }[] = []
    for (let i = 1; i <= 52; i++) {
        const weekStart = addWeeks(startOfWeek(new Date(2026, 0, 1), { weekStartsOn: 1 }), i - 1)
        weeks.push({
            weekNum: i,
            start: weekStart,
            label: `W${i}`
        })
    }
    return weeks
}

export default function SettingsPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [user, setUser] = useState<{ role: string; fullName: string } | null>(null)
    const [assignees, setAssignees] = useState<string[]>([])
    const [targets, setTargets] = useState<AssigneeTarget[]>([])
    const [defaultTarget, setDefaultTarget] = useState(160)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const weeks2026 = getWeeksOf2026()
    const currentWeekNum = getWeek(new Date(), { weekStartsOn: 1 })

    useEffect(() => {
        const checkAccess = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', authUser.id)
                .single()

            const role = profile?.role || 'admin' // Default to admin if no profile (allow access)

            setUser({
                role,
                fullName: profile?.full_name || '',
            })
        }
        checkAccess()
    }, [supabase, router])

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return

            setLoading(true)
            try {
                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('assignee_name')
                    .not('assignee_name', 'is', null)

                if (tasks) {
                    const uniqueAssignees = [...new Set(tasks.map(t => t.assignee_name))].filter(Boolean) as string[]
                    setAssignees(uniqueAssignees.sort())

                    const { data: existingTargets } = await supabase
                        .from('targets')
                        .select('*')

                    const targetsMap: Record<string, Record<number, number>> = {}
                    uniqueAssignees.forEach(name => {
                        targetsMap[name] = {}
                    })

                    if (existingTargets) {
                        existingTargets.forEach(t => {
                            const weekStart = new Date(t.week_start_date)
                            const weekNum = getWeek(weekStart, { weekStartsOn: 1 })
                            if (!targetsMap[t.user_gid]) {
                                targetsMap[t.user_gid] = {}
                            }
                            targetsMap[t.user_gid][weekNum] = t.target_points
                        })
                    }

                    const targetsArray = uniqueAssignees.map(name => ({
                        assignee_name: name,
                        targets: targetsMap[name] || {}
                    }))
                    setTargets(targetsArray)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [supabase, user])

    const updateTarget = (assigneeName: string, weekNum: number, value: number) => {
        setTargets(prev => prev.map(t => {
            if (t.assignee_name === assigneeName) {
                return {
                    ...t,
                    targets: { ...t.targets, [weekNum]: value }
                }
            }
            return t
        }))
    }

    const applyDefaultToAll = () => {
        setTargets(prev => prev.map(t => {
            const newTargets = { ...t.targets }
            weeks2026.forEach(w => {
                if (!newTargets[w.weekNum]) {
                    newTargets[w.weekNum] = defaultTarget
                }
            })
            return { ...t, targets: newTargets }
        }))
        setMessage({ type: 'success', text: 'Đã áp dụng cho tất cả ô trống' })
        setTimeout(() => setMessage(null), 3000)
    }

    const saveTargets = async () => {
        setSaving(true)
        try {
            const records: { user_gid: string; week_start_date: string; target_points: number }[] = []

            targets.forEach(t => {
                Object.entries(t.targets).forEach(([weekNum, points]) => {
                    const weekStart = addWeeks(startOfWeek(new Date(2026, 0, 1), { weekStartsOn: 1 }), parseInt(weekNum) - 1)
                    records.push({
                        user_gid: t.assignee_name,
                        week_start_date: format(weekStart, 'yyyy-MM-dd'),
                        target_points: points
                    })
                })
            })

            await supabase.from('targets').delete().neq('id', '00000000-0000-0000-0000-000000000000')

            if (records.length > 0) {
                const { error } = await supabase.from('targets').insert(records)
                if (error) throw error
            }

            setMessage({ type: 'success', text: 'Đã lưu mục tiêu thành công!' })
            setTimeout(() => setMessage(null), 3000)
        } catch (error) {
            console.error('Error saving targets:', error)
            setMessage({ type: 'error', text: 'Lỗi khi lưu mục tiêu' })
        } finally {
            setSaving(false)
        }
    }

    if (loading || !user) {
        return (
            <DashboardLayout userRole={user?.role} userName={user?.fullName}>
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400">Loading settings...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout userRole={user?.role} userName={user?.fullName}>
            <div className="min-h-screen bg-slate-950">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Target className="w-6 h-6 text-purple-400" />
                            <div>
                                <h2 className="text-xl font-bold text-white">Weekly Targets Settings</h2>
                                <p className="text-sm text-slate-400">Configure target points for each member per week in 2026</p>
                            </div>
                        </div>
                        <button
                            onClick={saveTargets}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 shadow-lg shadow-green-900/30"
                        >
                            <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} />
                            {saving ? 'Saving...' : 'Save All'}
                        </button>
                    </div>
                </header>

                {/* Message */}
                {message && (
                    <div className="px-6 mt-4">
                        <div className={`p-3 rounded-xl ${message.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border border-red-500/20 text-red-400'
                            }`}>
                            {message.text}
                        </div>
                    </div>
                )}

                <main className="p-6">
                    {/* Quick Actions */}
                    <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-slate-300">Default Target:</span>
                            <input
                                type="number"
                                value={defaultTarget}
                                onChange={(e) => setDefaultTarget(parseInt(e.target.value) || 0)}
                                className="w-24 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-sm text-slate-500">points/week</span>
                        </div>
                        <button
                            onClick={applyDefaultToAll}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-sm text-purple-300 transition-colors"
                        >
                            + Apply to all empty cells
                        </button>
                    </div>

                    {/* Targets Table - Horizontal Layout */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-700/30 sticky top-0 z-10">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap sticky left-0 bg-slate-800 z-20 min-w-[120px]">
                                            👤 Member
                                        </th>
                                        {weeks2026.map(week => (
                                            <th
                                                key={week.weekNum}
                                                className={`px-2 py-3 text-xs font-medium text-center whitespace-nowrap min-w-[60px] ${week.weekNum === currentWeekNum
                                                    ? 'bg-purple-600/30 text-purple-300'
                                                    : 'text-slate-400'
                                                    }`}
                                            >
                                                {week.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {targets.map((member) => (
                                        <tr key={member.assignee_name} className="hover:bg-slate-700/20">
                                            <td className="px-4 py-3 text-sm font-medium text-white whitespace-nowrap sticky left-0 bg-slate-800/95 z-10">
                                                {member.assignee_name}
                                            </td>
                                            {weeks2026.map(week => (
                                                <td
                                                    key={week.weekNum}
                                                    className={`px-1 py-2 text-center ${week.weekNum === currentWeekNum ? 'bg-purple-600/20' : ''
                                                        }`}
                                                >
                                                    <input
                                                        type="number"
                                                        value={member.targets[week.weekNum] || ''}
                                                        onChange={(e) => updateTarget(
                                                            member.assignee_name,
                                                            week.weekNum,
                                                            parseInt(e.target.value) || 0
                                                        )}
                                                        placeholder="0"
                                                        className={`w-14 px-1 py-1 rounded text-center text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 ${member.targets[week.weekNum]
                                                            ? 'bg-slate-700 text-white'
                                                            : 'bg-slate-800/50 text-slate-500'
                                                            }`}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-purple-600/30 rounded" />
                            <span>Current week (W{currentWeekNum})</span>
                        </div>
                    </div>
                </main>
            </div>
        </DashboardLayout>
    )
}
