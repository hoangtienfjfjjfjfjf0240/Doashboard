'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutTemplate, Target, Users, Calendar } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

export default function Sidebar() {
    const pathname = usePathname()
    const { user } = useUser()
    const userRole = user?.role || 'member'

    // Menu items with role-based visibility
    const allMenuItems = [
        {
            title: 'Dashboard Creative',
            path: '/dashboard',
            icon: LayoutTemplate,
            roles: ['member', 'admin', 'lead', 'editor'],
        },
        {
            title: 'Ngày Nghỉ',
            path: '/day-offs',
            icon: Calendar,
            roles: ['member', 'admin', 'lead', 'editor'],
        },
        {
            title: 'Mục tiêu hướng tới',
            path: '/settings',
            icon: Target,
            roles: ['admin', 'lead'],
        },
        {
            title: 'Quản lý Users',
            path: '/users',
            icon: Users,
            roles: ['admin', 'lead'],
        }
    ]

    // Filter menu items based on user role
    const menuItems = allMenuItems.filter(item =>
        item.roles.includes(userRole) || userRole === 'admin'
    )

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <Image
                        src="/ikame-logo.png"
                        alt="iKame Logo"
                        width={44}
                        height={44}
                        className="rounded-xl"
                    />
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
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group ${isActive
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

            {/* Version */}
            <div className="px-4 pb-4">
                <div className="text-xs text-slate-600 text-center">
                    v1.1.0
                </div>
            </div>
        </aside>
    )
}
