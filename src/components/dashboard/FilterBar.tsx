'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Users, Filter, RefreshCw, Settings, BarChart3 } from 'lucide-react'
import { format, startOfWeek, addWeeks, subWeeks, getWeek, getYear, startOfYear } from 'date-fns'
import Link from 'next/link'

interface FilterBarProps {
    weekStart: Date
    onWeekChange: (date: Date) => void
    assignees: string[]
    selectedAssignees: string[]
    onAssigneesChange: (assignees: string[]) => void
    status: 'all' | 'done' | 'not_done'
    onStatusChange: (status: 'all' | 'done' | 'not_done') => void
    videoTypes: string[]
    selectedVideoTypes: string[]
    onVideoTypesChange: (types: string[]) => void
    onSync: () => void
    syncing: boolean
    lastSync?: string
    timeRange?: '1month' | '3months' | '6months'
    onTimeRangeChange?: (range: '1month' | '3months' | '6months') => void
}

const VIDEO_TYPES = ['S1', 'S2A', 'S2B', 'S3A', 'S3B', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9A', 'S9B', 'S9C']

// Generate weeks for 2026
function getWeeksOf2026() {
    const weeks: { weekNum: number; start: Date; label: string }[] = []
    let date = startOfYear(new Date(2026, 0, 1))
    date = startOfWeek(date, { weekStartsOn: 1 })

    for (let i = 1; i <= 52; i++) {
        const weekStart = addWeeks(startOfWeek(new Date(2026, 0, 1), { weekStartsOn: 1 }), i - 1)
        if (getYear(weekStart) === 2026 || (i === 1 && getYear(addWeeks(weekStart, 0)) <= 2026)) {
            weeks.push({
                weekNum: i,
                start: weekStart,
                label: `Week ${i} (${format(weekStart, 'MMM d')} - ${format(addWeeks(weekStart, 0), 'MMM d')})`
            })
        }
    }
    return weeks
}

export default function FilterBar({
    weekStart,
    onWeekChange,
    assignees,
    selectedAssignees,
    onAssigneesChange,
    status,
    onStatusChange,
    selectedVideoTypes,
    onVideoTypesChange,
    onSync,
    syncing,
    lastSync,
    timeRange,
    onTimeRangeChange,
}: FilterBarProps) {
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
    const [showTypeDropdown, setShowTypeDropdown] = useState(false)
    const [showWeekDropdown, setShowWeekDropdown] = useState(false)
    const [assigneeSearch, setAssigneeSearch] = useState('')

    const assigneeRef = useRef<HTMLDivElement>(null)
    const typeRef = useRef<HTMLDivElement>(null)
    const weekRef = useRef<HTMLDivElement>(null)

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
                setShowAssigneeDropdown(false)
            }
            if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
                setShowTypeDropdown(false)
            }
            if (weekRef.current && !weekRef.current.contains(event.target as Node)) {
                setShowWeekDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const currentWeekNum = getWeek(weekStart, { weekStartsOn: 1 })
    const weeks2026 = getWeeksOf2026()

    const filteredAssignees = assignees.filter(a =>
        a.toLowerCase().includes(assigneeSearch.toLowerCase())
    )

    const toggleAssignee = (assignee: string) => {
        if (selectedAssignees.includes(assignee)) {
            onAssigneesChange(selectedAssignees.filter(a => a !== assignee))
        } else {
            onAssigneesChange([...selectedAssignees, assignee])
        }
    }

    const toggleVideoType = (type: string) => {
        if (selectedVideoTypes.includes(type)) {
            onVideoTypesChange(selectedVideoTypes.filter(t => t !== type))
        } else {
            onVideoTypesChange([...selectedVideoTypes, type])
        }
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 mb-6 relative z-[100]">
            <div className="flex flex-wrap items-center gap-4">
                {/* Week Picker with Dropdown */}
                <div className="relative" ref={weekRef}>
                    <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl p-1">
                        <button
                            onClick={() => onWeekChange(subWeeks(weekStart, 1))}
                            className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-300" />
                        </button>
                        <button
                            onClick={() => setShowWeekDropdown(!showWeekDropdown)}
                            className="flex items-center gap-2 px-3 py-1 hover:bg-slate-600/50 rounded-lg transition-colors"
                        >
                            <Calendar className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-white whitespace-nowrap">
                                Week {currentWeekNum} • {format(weekStart, 'MMM d')} - {format(addWeeks(weekStart, 0), 'MMM d, yyyy')}
                            </span>
                        </button>
                        <button
                            onClick={() => onWeekChange(addWeeks(weekStart, 1))}
                            className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                    </div>

                    {showWeekDropdown && (
                        <div className="absolute top-full mt-2 left-0 w-72 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-[200] max-h-80 overflow-y-auto animate-slide-down">
                            <div className="sticky top-0 bg-slate-800/95 backdrop-blur-xl p-2 border-b border-slate-700">
                                <p className="text-xs text-slate-400 font-medium px-2">Select Week in 2026</p>
                            </div>
                            <div className="p-2">
                                {weeks2026.map(week => (
                                    <button
                                        key={week.weekNum}
                                        onClick={() => {
                                            onWeekChange(week.start)
                                            setShowWeekDropdown(false)
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${currentWeekNum === week.weekNum
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : 'text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        Week {week.weekNum} ({format(week.start, 'MMM d')})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Time Range Filter */}
                {onTimeRangeChange && (
                    <div className="flex items-center gap-1 bg-slate-700/50 rounded-xl p-1">
                        {(['1month', '3months', '6months'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => onTimeRangeChange(range)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${timeRange === range
                                    ? 'bg-purple-500 text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-600'
                                    }`}
                            >
                                {range === '1month' ? '1 Tháng' : range === '3months' ? '3 Tháng' : '6 Tháng'}
                            </button>
                        ))}
                    </div>
                )}

                {/* Assignee Filter */}
                <div className="relative" ref={assigneeRef}>
                    <button
                        onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-colors"
                    >
                        <Users className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-white">
                            {selectedAssignees.length === 0 ? 'All Members' : `${selectedAssignees.length} selected`}
                        </span>
                    </button>

                    {showAssigneeDropdown && (
                        <div className="absolute top-full mt-2 left-0 w-64 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-[200] max-h-80 overflow-hidden animate-slide-down">
                            <div className="p-2 border-b border-slate-700">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={assigneeSearch}
                                    onChange={e => setAssigneeSearch(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div className="max-h-60 overflow-y-auto p-2">
                                <button
                                    onClick={() => {
                                        onAssigneesChange([])
                                        setShowAssigneeDropdown(false)
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedAssignees.length === 0 ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    All Members
                                </button>
                                {filteredAssignees.map(assignee => (
                                    <button
                                        key={assignee}
                                        onClick={() => toggleAssignee(assignee)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedAssignees.includes(assignee) ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        {assignee}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center bg-slate-700/50 rounded-xl p-1">
                    {(['all', 'done', 'not_done'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => onStatusChange(s)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${status === s
                                ? 'bg-purple-500 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {s === 'all' ? 'All' : s === 'done' ? 'Done' : 'Not Done'}
                        </button>
                    ))}
                </div>

                {/* Video Type Filter */}
                <div className="relative" ref={typeRef}>
                    <button
                        onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-colors"
                    >
                        <Filter className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-white">
                            {selectedVideoTypes.length === 0 ? 'All Types' : `${selectedVideoTypes.length} types`}
                        </span>
                    </button>

                    {showTypeDropdown && (
                        <div className="absolute top-full mt-2 left-0 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-[200] p-2 animate-slide-down">
                            <button
                                onClick={() => {
                                    onVideoTypesChange([])
                                    setShowTypeDropdown(false)
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedVideoTypes.length === 0 ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                All Types
                            </button>
                            {VIDEO_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleVideoType(type)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedVideoTypes.includes(type) ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sync Button */}
                <div className="ml-auto flex items-center gap-3">
                    {lastSync && (
                        <span className="text-xs text-slate-500">
                            Last sync: {format(new Date(lastSync), 'HH:mm')}
                        </span>
                    )}
                    <button
                        onClick={onSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                </div>
            </div>

            {/* Active Filters */}
            {(selectedAssignees.length > 0 || selectedVideoTypes.length > 0 || status !== 'all') && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700/50">
                    {selectedAssignees.map(a => (
                        <span
                            key={a}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-lg text-xs text-purple-300"
                        >
                            {a}
                            <button onClick={() => toggleAssignee(a)} className="hover:text-white">×</button>
                        </span>
                    ))}
                    {selectedVideoTypes.map(t => (
                        <span
                            key={t}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 rounded-lg text-xs text-cyan-300"
                        >
                            {t}
                            <button onClick={() => toggleVideoType(t)} className="hover:text-white">×</button>
                        </span>
                    ))}
                    <button
                        onClick={() => {
                            onAssigneesChange([])
                            onVideoTypesChange([])
                            onStatusChange('all')
                        }}
                        className="text-xs text-slate-500 hover:text-white transition-colors"
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>
    )
}
