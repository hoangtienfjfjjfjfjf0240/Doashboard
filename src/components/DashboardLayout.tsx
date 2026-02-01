'use client'

import React from 'react'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
    children: React.ReactNode
    userRole?: string
    userName?: string
}

export default function DashboardLayout({ children, userRole, userName }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            <Sidebar userRole={userRole} userName={userName} />
            <main className="flex-1 overflow-y-auto min-w-0 bg-slate-950">
                {children}
            </main>
        </div>
    )
}
