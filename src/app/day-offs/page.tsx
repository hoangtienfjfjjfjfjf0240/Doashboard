'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Calendar, Plus, Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import DashboardLayout from '@/components/DashboardLayout'

interface DayOff {
    id: string
    user_email: string
    date: string
    reason: string | null
    is_half_day: boolean
    created_at: string
}

interface User {
    email: string
    full_name: string
    role: string
}

const POINTS_PER_DAY = 32
const POINTS_PER_HALF_DAY = 16

export default function DayOffsPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [dayOffs, setDayOffs] = useState<DayOff[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [reason, setReason] = useState('')
    const [isHalfDay, setIsHalfDay] = useState(false)
    const [adding, setAdding] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchUser()
    }, [])

    useEffect(() => {
        if (user) {
            fetchDayOffs()
        }
    }, [currentMonth, user])

    const fetchUser = async () => {
        const MANAGER_EMAIL = 'hoangtien020120@gmail.com'
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
            const isManager = authUser.email?.toLowerCase() === MANAGER_EMAIL.toLowerCase()
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single()
            if (data) {
                setUser({
                    email: authUser.email || '',
                    full_name: data.full_name || authUser.email || '',
                    role: isManager ? 'admin' : (data.role || 'member')
                })
            } else {
                setUser({
                    email: authUser.email || '',
                    full_name: authUser.email || '',
                    role: isManager ? 'admin' : 'member'
                })
            }
        }
        setLoading(false)
    }

    const fetchDayOffs = async () => {
        if (!user) return

        const startStr = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
        const endStr = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

        const { data } = await supabase
            .from('day_offs')
            .select('*')
            .eq('user_email', user.email)
            .gte('date', startStr)
            .lte('date', endStr)
            .order('date', { ascending: true })

        if (data) setDayOffs(data)
    }

    const getDayOff = (date: Date) => {
        return dayOffs.find(d => d.date === format(date, 'yyyy-MM-dd'))
    }

    const handleDayClick = (date: Date) => {
        const existing = getDayOff(date)
        if (existing) {
            return
        }
        setSelectedDate(date)
        setIsHalfDay(false)
        setReason('')
    }

    const addDayOff = async () => {
        if (!selectedDate || !user) return
        setAdding(true)

        const { data, error } = await supabase
            .from('day_offs')
            .insert({
                user_email: user.email,
                date: format(selectedDate, 'yyyy-MM-dd'),
                reason: reason || null,
                is_half_day: isHalfDay
            })
            .select()
            .single()

        if (data && !error) {
            setDayOffs(prev => [...prev, data])
        }

        setSelectedDate(null)
        setReason('')
        setIsHalfDay(false)
        setAdding(false)
    }

    const deleteDayOff = async (id: string) => {
        await supabase.from('day_offs').delete().eq('id', id)
        setDayOffs(prev => prev.filter(d => d.id !== id))
    }

    // Calendar grid
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const startDayOfWeek = getDay(monthStart)
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

    // Calculate target reduction
    const targetReduction = dayOffs.reduce((sum, d) => {
        return sum + (d.is_half_day ? POINTS_PER_HALF_DAY : POINTS_PER_DAY)
    }, 0)

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-950 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-600/20 rounded-xl">
                                <Calendar className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Ngày Nghỉ</h1>
                                <p className="text-slate-400 text-sm">Đăng ký ngày nghỉ để điều chỉnh target</p>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl px-4 py-2 border border-slate-700">
                            <p className="text-xs text-slate-400">Target giảm tháng này</p>
                            <p className={`text-xl font-bold ${targetReduction > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                -{targetReduction} pts
                            </p>
                        </div>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4 bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <h2 className="text-lg font-semibold text-white">
                            {format(currentMonth, 'MMMM yyyy', { locale: vi })}
                        </h2>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Calendar */}
                            <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                                {/* Day headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                                        <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: adjustedStartDay }).map((_, i) => (
                                        <div key={`empty-${i}`} className="aspect-square" />
                                    ))}

                                    {calendarDays.map(date => {
                                        const dayOff = getDayOff(date)
                                        const isToday = isSameDay(date, new Date())
                                        const isWeekend = getDay(date) === 0 || getDay(date) === 6
                                        const isSelected = selectedDate && isSameDay(date, selectedDate)

                                        return (
                                            <button
                                                key={date.toISOString()}
                                                onClick={() => handleDayClick(date)}
                                                disabled={!!dayOff}
                                                className={`
                                                    aspect-square rounded-lg text-sm font-medium transition-all relative
                                                    ${dayOff
                                                        ? dayOff.is_half_day
                                                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-default'
                                                            : 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-default'
                                                        : isSelected
                                                            ? 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-lg'
                                                            : isWeekend
                                                                ? 'bg-slate-700/30 text-slate-500 hover:bg-slate-700/50'
                                                                : 'bg-slate-700/30 text-slate-300 hover:bg-purple-600/30 hover:text-white cursor-pointer'
                                                    }
                                                    ${isToday && !isSelected ? 'ring-2 ring-purple-500' : ''}
                                                `}
                                                title={dayOff?.reason || (isWeekend ? 'Cuối tuần' : 'Click để đánh dấu nghỉ')}
                                            >
                                                {format(date, 'd')}
                                                {dayOff && (
                                                    <div className={`absolute -top-1 -right-1 w-3 h-3 ${dayOff.is_half_day ? 'bg-orange-500' : 'bg-red-500'} rounded-full`} />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-700">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
                                        <span>Nghỉ cả ngày (-{POINTS_PER_DAY} pts)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <div className="w-3 h-3 rounded bg-orange-500/30 border border-orange-500/50" />
                                        <span>Nghỉ nửa ngày (-{POINTS_PER_HALF_DAY} pts)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <div className="w-3 h-3 rounded bg-purple-600" />
                                        <span>Đang chọn</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <div className="w-3 h-3 rounded ring-2 ring-purple-500 bg-slate-700" />
                                        <span>Hôm nay</span>
                                    </div>
                                </div>
                            </div>

                            {/* Side panel */}
                            <div className="space-y-4">
                                {/* Add Day Off Form */}
                                {selectedDate && (
                                    <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                                        <h3 className="text-sm font-semibold text-purple-400 mb-3">
                                            Thêm ngày nghỉ: {format(selectedDate, 'dd/MM/yyyy')}
                                        </h3>

                                        {/* Half day toggle */}
                                        <div className="flex gap-2 mb-3">
                                            <button
                                                onClick={() => setIsHalfDay(false)}
                                                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${!isHalfDay
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                                    : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
                                                    }`}
                                            >
                                                Cả ngày<br />
                                                <span className="text-xs opacity-70">-{POINTS_PER_DAY} pts</span>
                                            </button>
                                            <button
                                                onClick={() => setIsHalfDay(true)}
                                                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${isHalfDay
                                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                                                    : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
                                                    }`}
                                            >
                                                Nửa ngày<br />
                                                <span className="text-xs opacity-70">-{POINTS_PER_HALF_DAY} pts</span>
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Lý do (không bắt buộc)"
                                            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 mb-3"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={addDayOff}
                                                disabled={adding}
                                                className="flex-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center gap-2"
                                            >
                                                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                                Thêm
                                            </button>
                                            <button
                                                onClick={() => { setSelectedDate(null); setReason(''); setIsHalfDay(false) }}
                                                className="px-3 py-2 text-sm bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* List of day offs */}
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-purple-400" />
                                        Danh sách ngày nghỉ ({dayOffs.length})
                                    </h3>

                                    {dayOffs.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-4">
                                            Chưa có ngày nghỉ nào trong tháng
                                        </p>
                                    ) : (
                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {dayOffs.map(dayOff => (
                                                <div
                                                    key={dayOff.id}
                                                    className={`flex items-center justify-between p-2 rounded-lg ${dayOff.is_half_day ? 'bg-orange-500/10' : 'bg-red-500/10'
                                                        }`}
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-white">
                                                            {format(new Date(dayOff.date), 'EEEE, dd/MM', { locale: vi })}
                                                            <span className={`ml-2 text-xs ${dayOff.is_half_day ? 'text-orange-400' : 'text-red-400'}`}>
                                                                ({dayOff.is_half_day ? 'Nửa ngày' : 'Cả ngày'})
                                                            </span>
                                                        </p>
                                                        {dayOff.reason && (
                                                            <p className="text-xs text-slate-400">{dayOff.reason}</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => deleteDayOff(dayOff.id)}
                                                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {dayOffs.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-700 text-center">
                                            <p className="text-xs text-slate-400">
                                                Tổng giảm: <span className="text-yellow-400 font-bold">-{targetReduction} pts</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
