'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { startOfWeek, format, addDays, subMonths, subDays, getWeek } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import {
    FilterBar,
    KPICards,
    VideoTypeMixChart,
    StatusDonut,
    Leaderboard,
    TaskTable,
    DueDateStats,
    DailyPointsChart,
    CTSTChart,
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
    ctst: string | null
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
    const [dateRange, setDateRange] = useState(() => ({
        start: subDays(new Date(), 6),
        end: new Date()
    }))
    // Lift filter state from FilterBar to prevent reset on re-render
    const [selectedPreset, setSelectedPreset] = useState<'week' | '7days' | '14days' | '28days' | '30days' | 'custom'>('7days')
    const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set())

    // Data state
    const [allTasks, setAllTasks] = useState<Task[]>([])
    const [assignees, setAssignees] = useState<string[]>([])
    const [targets, setTargets] = useState<Target[]>([])

    // Get current user
    useEffect(() => {
        const MANAGER_EMAIL = 'hoangtien020120@gmail.com'
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const isManager = user.email?.toLowerCase() === MANAGER_EMAIL.toLowerCase()
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single()

                setUser({
                    email: profile?.full_name || user.email || '',
                    role: isManager ? 'admin' : (profile?.role || 'member'),
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
            // Get targets for the selected date range
            const startDateStr = format(dateRange.start, 'yyyy-MM-dd')
            const endDateStr = format(dateRange.end, 'yyyy-MM-dd')

            const { data: targetsData } = await supabase
                .from('targets')
                .select('*')
                .gte('week_start_date', startDateStr)
                .lte('week_start_date', endDateStr)

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
    }, [supabase, weekStart, dateRange]) // Added dateRange dependency

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

    // Filter tasks using dateRange
    const dateRangeStartStr = format(dateRange.start, 'yyyy-MM-dd')
    const dateRangeEndStr = format(dateRange.end, 'yyyy-MM-dd')

    // Debug user role filtering
    console.log('User role:', user?.role, 'fullName:', user?.fullName)
    console.log('Assignees in data:', [...new Set(allTasks.map(t => t.assignee_name))])

    const baseFilteredTasks = allTasks.filter(task => {
        // Role-based filtering: member only sees their own tasks
        // Skip filter if fullName is empty (can't match)
        if (user?.role === 'member' && user.fullName) {
            const taskAssignee = (task.assignee_name || '').toLowerCase().trim()
            const userFullName = user.fullName.toLowerCase().trim()
            if (taskAssignee !== userFullName) return false
        }
        if (selectedAssignees.length > 0 && !selectedAssignees.includes(task.assignee_name || '')) return false
        if (selectedVideoTypes.length > 0 && !selectedVideoTypes.includes(task.video_type || '')) return false
        if (status === 'done' && task.status !== 'done') return false
        if (status === 'not_done' && task.status !== 'not_done') return false
        return true
    })

    const displayTasks = baseFilteredTasks.filter(task => {
        if (task.status === 'done' && task.completed_at) {
            const completedDate = task.completed_at.split('T')[0]
            return completedDate >= dateRangeStartStr && completedDate <= dateRangeEndStr
        }
        return task.status === 'not_done'
    })

    const doneTasks = displayTasks.filter(t => t.status === 'done')
    const notDoneTasks = displayTasks.filter(t => t.status === 'not_done')

    const totalPoints = doneTasks.reduce((sum, t) => sum + (t.points || 0), 0)
    const totalVideos = doneTasks.reduce((sum, t) => sum + (t.video_count || 0), 0)
    const activeAssignees = new Set(doneTasks.map(t => t.assignee_name).filter(Boolean)).size
    const avgPointsPerVideo = totalVideos > 0 ? totalPoints / totalVideos : 0

    // Calculate target for selected date range
    // Target = 160 per member per week (for the current user or selected members)
    const DEFAULT_TARGET_PER_MEMBER_PER_WEEK = 160

    // Calculate number of weeks in selected date range
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const numWeeks = Math.max(1, Math.ceil(daysDiff / 7))

    // Target = 160 per week (per member view, not team total)
    // If member role: show their own target
    // If admin: show per-member target (can view individual stats in table)
    const teamTargetPoints = DEFAULT_TARGET_PER_MEMBER_PER_WEEK * numWeeks
    const teamAchievedPercent = teamTargetPoints > 0 ? (totalPoints / teamTargetPoints) * 100 : 0

    // Calculate weeks achieved (weeks where team total points >= team target for that week)
    // Group done tasks by week and count how many weeks met target
    const pointsByWeek: Record<number, number> = {}
    doneTasks.forEach(task => {
        if (task.completed_at) {
            const completedDate = new Date(task.completed_at)
            const weekNum = getWeek(completedDate, { weekStartsOn: 1 })
            pointsByWeek[weekNum] = (pointsByWeek[weekNum] || 0) + (task.points || 0)
        }
    })
    // Target per week = 160 per member (use teamTargetPoints which is already calculated correctly)
    const weeksAchieved = Object.values(pointsByWeek).filter(weekPoints => weekPoints >= teamTargetPoints).length
    console.log('Points by week:', pointsByWeek, 'Target per week:', teamTargetPoints, 'Weeks achieved:', weeksAchieved)

    const assigneeStats = assignees.map(name => {
        const userTasks = doneTasks.filter(t => t.assignee_name === name)
        // Sum targets for this user across all selected weeks
        const userTargetPoints = targets
            .filter(t => t.user_gid === name)
            .reduce((sum, t) => sum + t.target_points, 0)

        const points = userTasks.reduce((sum, t) => sum + (t.points || 0), 0)
        const videos = userTasks.reduce((sum, t) => sum + (t.video_count || 0), 0)

        // Calculate weeks achieved for this member (weeks where they got >= 160 points)
        const memberPointsByWeek: Record<number, number> = {}
        userTasks.forEach(task => {
            if (task.completed_at) {
                const completedDate = new Date(task.completed_at)
                const weekNum = getWeek(completedDate, { weekStartsOn: 1 })
                memberPointsByWeek[weekNum] = (memberPointsByWeek[weekNum] || 0) + (task.points || 0)
            }
        })
        const memberWeeksAchieved = Object.values(memberPointsByWeek).filter(pts => pts >= DEFAULT_TARGET_PER_MEMBER_PER_WEEK).length

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
            target: userTargetPoints,
            percent: userTargetPoints > 0 ? (points / userTargetPoints) * 100 : 0,
            weeksAchieved: memberWeeksAchieved,
            ...videoTypeMix,
        }
    }).filter(a => a.points > 0 || a.videos > 0 || a.target > 0)

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

    const leaderboardData = assigneeStats.map((a) => ({
        name: a.name,
        points: a.points,
        target: a.target,
        weeksAchieved: a.weeksAchieved,
        totalWeeks: 24, // Total weeks in 6 months
    }))

    if (loading) {
        return (
            <DashboardLayout>
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

    // For TaskTable: filter by user if member
    const filteredTasks = isManager ? displayTasks : displayTasks.filter(t => t.assignee_name === user?.fullName)
    const filteredDoneTasks = filteredTasks.filter(t => t.status === 'done')
    const filteredNotDoneTasks = filteredTasks.filter(t => t.status === 'not_done')

    // For Leaderboard and DueDateStats: always show all team data
    const filteredLeaderboardData = leaderboardData // Always show full team
    const filteredAssigneeStats = assigneeStats // Always show full team (not used anymore)

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-950">
                {/* Top User Bar */}
                <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">Overview</h2>
                            <p className="text-sm text-slate-400">{format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}</p>
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
                        onWeekChange={setWeekStart}
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
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        selectedPreset={selectedPreset}
                        onPresetChange={setSelectedPreset}
                        selectedWeeks={selectedWeeks}
                        onWeeksChange={setSelectedWeeks}
                    />

                    {/* Row 1: KPI Cards */}
                    <KPICards
                        totalPoints={totalPoints}
                        totalVideos={totalVideos}
                        doneTasks={doneTasks.length}
                        notDoneTasks={notDoneTasks.length}
                        activeAssignees={activeAssignees}
                        avgPointsPerVideo={avgPointsPerVideo}
                        teamTargetPoints={teamTargetPoints}
                        teamAchievedPercent={teamAchievedPercent}
                        weeksAchieved={weeksAchieved}
                        totalWeeks={24}
                    />

                    {/* Row 2: Charts (smaller) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        <VideoTypeMixChart data={doneTasks} />
                        <DailyPointsChart tasks={doneTasks} />
                    </div>

                    {/* Row 3: Leaderboard + Due Date Stats + CTST */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <Leaderboard data={filteredLeaderboardData} />
                        <DueDateStats tasks={displayTasks} />
                        <CTSTChart tasks={displayTasks} />
                    </div>

                    {/* Row 4: Task Tables */}
                    <TaskTable doneTasks={filteredDoneTasks} notDoneTasks={filteredNotDoneTasks} />
                </main>
            </div>
        </DashboardLayout>
    )
}
