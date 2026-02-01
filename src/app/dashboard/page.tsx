'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { startOfWeek, format, addDays, subMonths } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    FilterBar,
    KPICards,
    PointsChart,
    VideosChart,
    VideoTypeMixChart,
    WeeklyTrendChart,
    StatusDonut,
    Leaderboard,
    TaskTable,
    DueDateStats,
} from '@/components/dashboard'

interface Task {
    id: string
    asana_id: string
    name: string
    assignee_name: string | null
    assignee_email: string | null
    video_type: string | null
    video_count: number
    points: number
    due_date: string | null
    completed_at: string | null
    status: 'done' | 'not_done'
    tags: string[]
}

interface Target {
    user_gid: string
    target_points: number
}

const POINT_CONFIG: Record<string, number> = {
    S1: 3, S2A: 2, S2B: 2.5, S3A: 2,
    S3B: 5, S4: 5, S5: 6, S6: 7,
    S7: 10, S8: 48, S9A: 2.5, S9B: 4, S9C: 7,
}

export default function DashboardPage() {
    const router = useRouter()
    const supabase = createClient()

    // State
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [lastSync, setLastSync] = useState<string>()
    const [user, setUser] = useState<{ email: string; role: string; fullName: string } | null>(null)

    // Filter state
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
    const [status, setStatus] = useState<'all' | 'done' | 'not_done'>('all')
    const [selectedVideoTypes, setSelectedVideoTypes] = useState<string[]>([])
    const [timeRange, setTimeRange] = useState<'1month' | '3months' | '6months'>('1month')
    const [filterMode, setFilterMode] = useState<'week' | 'range'>('week')

    // Data state
    const [allTasks, setAllTasks] = useState<Task[]>([])
    const [assignees, setAssignees] = useState<string[]>([])
    const [targets, setTargets] = useState<Target[]>([])

    // Get current user
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single()

                setUser({
                    email: profile?.full_name || user.email || '',
                    role: profile?.role || 'member',
                    fullName: profile?.full_name || '',
                })
            }
        }
        getUser()
    }, [supabase])

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .order('updated_at', { ascending: false })

            if (tasks) {
                setAllTasks(tasks)
                const uniqueAssignees = [...new Set(tasks.map(t => t.assignee_name).filter(Boolean))] as string[]
                setAssignees(uniqueAssignees.sort())
            }

            const weekStartStr = format(weekStart, 'yyyy-MM-dd')
            const { data: targetsData } = await supabase
                .from('targets')
                .select('*')
                .eq('week_start_date', weekStartStr)

            if (targetsData) {
                setTargets(targetsData)
            }

            const { data: syncLogs } = await supabase
                .from('sync_logs')
                .select('*')
                .order('started_at', { ascending: false })
                .limit(1)

            if (syncLogs?.[0]) {
                setLastSync(syncLogs[0].started_at)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }, [supabase, weekStart])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        const autoSync = async () => {
            if (!loading && allTasks.length === 0 && !syncing) {
                console.log('No tasks found, auto-syncing from Asana...')
                await handleSync()
            }
        }
        autoSync()
    }, [loading, allTasks.length])

    const handleSync = async () => {
        setSyncing(true)
        try {
            const response = await fetch('/api/asana/sync', { method: 'POST' })
            if (response.ok) {
                await fetchData()
            }
        } catch (error) {
            console.error('Sync error:', error)
        } finally {
            setSyncing(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    // Filter tasks
    const weekEndDate = addDays(weekStart, 6)
    const weekStartStr = format(weekStart, 'yyyy-MM-dd')
    const weekEndStr = format(weekEndDate, 'yyyy-MM-dd')

    const now = new Date()
    const getTimeRangeStart = () => {
        switch (timeRange) {
            case '1month': return subMonths(now, 1)
            case '3months': return subMonths(now, 3)
            case '6months': return subMonths(now, 6)
        }
    }
    const timeRangeStart = format(getTimeRangeStart(), 'yyyy-MM-dd')
    const timeRangeEnd = format(now, 'yyyy-MM-dd')

    const baseFilteredTasks = allTasks.filter(task => {
        if (selectedAssignees.length > 0 && !selectedAssignees.includes(task.assignee_name || '')) return false
        if (selectedVideoTypes.length > 0 && !selectedVideoTypes.includes(task.video_type || '')) return false
        if (status === 'done' && task.status !== 'done') return false
        if (status === 'not_done' && task.status !== 'not_done') return false
        return true
    })

    const displayTasks = baseFilteredTasks.filter(task => {
        if (filterMode === 'range') {
            if (task.status === 'done' && task.completed_at) {
                const completedDate = task.completed_at.split('T')[0]
                if (completedDate < timeRangeStart || completedDate > timeRangeEnd) return false
            }
            return true
        } else {
            if (task.status === 'done' && task.completed_at) {
                const completedDate = task.completed_at.split('T')[0]
                return completedDate >= weekStartStr && completedDate <= weekEndStr
            }
            return task.status === 'not_done'
        }
    })

    const doneTasks = displayTasks.filter(t => t.status === 'done')
    const notDoneTasks = displayTasks.filter(t => t.status === 'not_done')

    const totalPoints = doneTasks.reduce((sum, t) => sum + (t.points || 0), 0)
    const totalVideos = doneTasks.reduce((sum, t) => sum + (t.video_count || 0), 0)
    const activeAssignees = new Set(doneTasks.map(t => t.assignee_name).filter(Boolean)).size
    const avgPointsPerVideo = totalVideos > 0 ? totalPoints / totalVideos : 0
    const teamTargetPoints = targets.reduce((sum, t) => sum + t.target_points, 0)
    const teamAchievedPercent = teamTargetPoints > 0 ? (totalPoints / teamTargetPoints) * 100 : 0

    const assigneeStats = assignees.map(name => {
        const userTasks = doneTasks.filter(t => t.assignee_name === name)
        const userTarget = targets.find(t => t.user_gid === name)
        const points = userTasks.reduce((sum, t) => sum + (t.points || 0), 0)
        const videos = userTasks.reduce((sum, t) => sum + (t.video_count || 0), 0)
        const target = userTarget?.target_points || 0

        const videoTypeMix: Record<string, number> = {}
        userTasks.forEach(t => {
            if (t.video_type) {
                videoTypeMix[t.video_type] = (videoTypeMix[t.video_type] || 0) + (t.video_count || 0)
            }
        })

        return {
            name,
            points,
            videos,
            target,
            percent: target > 0 ? (points / target) * 100 : 0,
            ...videoTypeMix,
        }
    }).filter(a => a.points > 0 || a.videos > 0)

    const dailyData = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i)
        const dayStr = format(date, 'yyyy-MM-dd')
        const dayTasks = doneTasks.filter(t => {
            if (t.completed_at) {
                return t.completed_at.split('T')[0] === dayStr
            }
            return false
        })
        return {
            day: format(date, 'EEE'),
            points: dayTasks.reduce((sum, t) => sum + (t.points || 0), 0),
            tasks: dayTasks.length,
        }
    })

    const leaderboardData = assigneeStats.map((a, index) => ({
        name: a.name,
        points: a.points,
        target: a.target || 160,
        percent: a.target > 0 ? (a.points / a.target) * 100 : (a.points / 160) * 100,
        rank: index + 1,
    }))

    if (loading) {
        return (
            <DashboardLayout userRole={user?.role} userName={user?.email}>
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400">Loading dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    // Role-based filtering: only filter if user is explicitly a 'member' with a valid fullName
    // If profile is not set or fullName is empty, show all data (manager behavior)
    const isManager = !user?.role || user?.role === 'admin' || user?.role === 'lead' || !user?.fullName
    const filteredTasks = isManager ? displayTasks : displayTasks.filter(t => t.assignee_name === user?.fullName)
    const filteredDoneTasks = filteredTasks.filter(t => t.status === 'done')
    const filteredNotDoneTasks = filteredTasks.filter(t => t.status === 'not_done')
    const filteredAssigneeStats = isManager ? assigneeStats : assigneeStats.filter(a => a.name === user?.fullName)
    const filteredLeaderboardData = isManager ? leaderboardData : leaderboardData.filter(l => l.name === user?.fullName)

    return (
        <DashboardLayout userRole={user?.role} userName={user?.email}>
            <div className="min-h-screen bg-slate-950">
                {/* Top User Bar */}
                <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">Overview</h2>
                            <p className="text-sm text-slate-400">Week {format(weekStart, 'w')} • {format(weekStart, 'MMM d')} - {format(weekEndDate, 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-white">{user?.email}</p>
                                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="px-6 py-6">
                    {/* Filter Bar */}
                    <FilterBar
                        weekStart={weekStart}
                        onWeekChange={(d) => {
                            setWeekStart(d)
                            setFilterMode('week')
                        }}
                        assignees={assignees}
                        selectedAssignees={selectedAssignees}
                        onAssigneesChange={setSelectedAssignees}
                        status={status}
                        onStatusChange={setStatus}
                        videoTypes={Object.keys(POINT_CONFIG)}
                        selectedVideoTypes={selectedVideoTypes}
                        onVideoTypesChange={setSelectedVideoTypes}
                        onSync={handleSync}
                        syncing={syncing}
                        lastSync={lastSync}
                        timeRange={timeRange}
                        onTimeRangeChange={(r) => {
                            setTimeRange(r)
                            setFilterMode('range')
                        }}
                    />

                    {/* KPI Cards */}
                    <KPICards
                        totalPoints={totalPoints}
                        totalVideos={totalVideos}
                        doneTasks={doneTasks.length}
                        notDoneTasks={notDoneTasks.length}
                        activeAssignees={activeAssignees}
                        avgPointsPerVideo={avgPointsPerVideo}
                        teamTargetPoints={teamTargetPoints}
                        teamAchievedPercent={teamAchievedPercent}
                    />

                    {/* Due Date Stats */}
                    <DueDateStats tasks={displayTasks} />

                    {/* Row 1: Points & Videos by Assignee */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <PointsChart data={filteredAssigneeStats} />
                        <VideosChart data={filteredAssigneeStats} />
                    </div>

                    {/* Row 2: Video Type Mix, Weekly Trend */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <VideoTypeMixChart data={filteredAssigneeStats as any} />
                        <WeeklyTrendChart data={dailyData} />
                    </div>

                    {/* Row 3: Leaderboard, Status Donut */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2">
                            <Leaderboard data={filteredLeaderboardData} />
                        </div>
                        <StatusDonut done={filteredDoneTasks.length} notDone={filteredNotDoneTasks.length} />
                    </div>

                    {/* Row 4: Task Tables */}
                    <TaskTable doneTasks={filteredDoneTasks} notDoneTasks={filteredNotDoneTasks} />
                </main>
            </div>
        </DashboardLayout>
    )
}
