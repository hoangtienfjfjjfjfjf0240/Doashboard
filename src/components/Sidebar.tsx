'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutTemplate, Target, Zap, Users, Calendar } from 'lucide-react'

interface SidebarProps {
    userRole?: string
    userName?: string
}

export default function Sidebar({ userRole = 'member' }: SidebarProps) {
    const pathname = usePathname()

    // Show Users menu for all for now - later can restrict to admin/lead only
    const menuItems = [
        {
            title: 'Dashboard Creative',
            path: '/dashboard',
            icon: LayoutTemplate,
        },
        {
            title: 'Ngày Nghỉ',
            path: '/day-offs',
            icon: Calendar,
        },
        {
            title: 'Mục tiêu hướng tới',
            path: '/settings',
            icon: Target,
        },
        {
            title: 'Quản lý Users',
            path: '/users',
            icon: Users,
        }
    ]

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0 transition-all duration-300">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-none">Creative</h1>
                        <span className="text-xs text-purple-400 font-medium">Dashboard</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
                    Menu
                </div>
                {menuItems.map((item) => {
                    const isActive = pathname === item.path
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-purple-600 shadow-lg shadow-purple-900/50 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                            <span className="font-medium">{item.title}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Version - minimal footer */}
            <div className="px-4 pb-4">
                <div className="text-xs text-slate-600 text-center">
                    v1.1.0
                </div>
            </div>
        </aside>
    )
}
