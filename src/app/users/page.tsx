'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, Users, Shield, User, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface UserProfile {
    id: string
    email: string
    full_name: string | null
    role: string
    created_at: string
}

// Manager email - this account can manage all users
const MANAGER_EMAIL = 'hoangtien020120@gmail.com'

export default function UsersPage() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<{ email: string; role: string } | null>(null)
    const [users, setUsers] = useState<UserProfile[]>([])
    const [editedUsers, setEditedUsers] = useState<Record<string, Partial<UserProfile>>>({})
    const [canManage, setCanManage] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Check if current user is the manager or has admin/lead role
            const isManager = user.email?.toLowerCase() === MANAGER_EMAIL.toLowerCase()

            // Get current user's profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', user.id)
                .single()

            const hasAdminRole = profile?.role === 'admin' || profile?.role === 'lead'

            // Allow access if manager email OR has admin/lead role
            if (!isManager && !hasAdminRole) {
                router.push('/dashboard')
                return
            }

            setCanManage(isManager || hasAdminRole)
            setCurrentUser({
                email: user.email || '',
                role: isManager ? 'admin' : (profile?.role || 'member')
            })

            // Load all users
            const { data: allUsers } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: true })

            if (allUsers) {
                setUsers(allUsers)
            }

            setLoading(false)
        }

        loadData()
    }, [supabase, router])

    const handleFieldChange = (userId: string, field: keyof UserProfile, value: string) => {
        setEditedUsers(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [field]: value
            }
        }))
    }

    const handleSave = async (userId: string) => {
        const changes = editedUsers[userId]
        if (!changes) return

        setSaving(userId)

        const { error } = await supabase
            .from('profiles')
            .update(changes)
            .eq('id', userId)

        if (!error) {
            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, ...changes } : u
            ))
            // Clear edits
            setEditedUsers(prev => {
                const newState = { ...prev }
                delete newState[userId]
                return newState
            })
            alert('Đã lưu thành công!')
        } else {
            alert('Lỗi khi lưu: ' + error.message)
        }

        setSaving(null)
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-500/20 text-red-300 border-red-500/30'
            case 'lead': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return Shield
            case 'lead': return Users
            default: return User
        }
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400">Loading users...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-slate-950">
                <div className="px-6 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Quản lý người dùng</h1>
                        <p className="text-slate-400">Phân quyền và cập nhật thông tin người dùng</p>
                        <p className="text-sm text-purple-400 mt-2">
                            Đang đăng nhập: {currentUser?.email}
                        </p>
                    </div>

                    {/* Role Legend */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-slate-400">Admin - Xem tất cả + Quản lý users</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-slate-400">Lead - Xem tất cả</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                            <span className="text-slate-400">Member - Chỉ xem bản thân</span>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Email</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Tên đầy đủ (khớp Asana)</th>
                                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Quyền</th>
                                    <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => {
                                    const edited = editedUsers[user.id]
                                    const currentRole = edited?.role || user.role
                                    const currentFullName = edited?.full_name !== undefined ? (edited.full_name || '') : (user.full_name || '')
                                    const hasChanges = !!edited
                                    const RoleIcon = getRoleIcon(currentRole)
                                    const isManagerEmail = user.email.toLowerCase() === MANAGER_EMAIL.toLowerCase()

                                    return (
                                        <tr key={user.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${getRoleColor(currentRole)}`}>
                                                        <RoleIcon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <span className="text-white font-medium">{user.email}</span>
                                                        {isManagerEmail && (
                                                            <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full">
                                                                Manager
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <input
                                                    type="text"
                                                    value={currentFullName}
                                                    onChange={e => handleFieldChange(user.id, 'full_name', e.target.value)}
                                                    placeholder="Nhập tên khớp với Asana..."
                                                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                />
                                            </td>
                                            <td className="py-4 px-6">
                                                <select
                                                    value={currentRole}
                                                    onChange={e => handleFieldChange(user.id, 'role', e.target.value)}
                                                    className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                >
                                                    <option value="admin">Admin</option>
                                                    <option value="lead">Lead</option>
                                                    <option value="member">Member</option>
                                                </select>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {hasChanges && (
                                                    <button
                                                        onClick={() => handleSave(user.id)}
                                                        disabled={saving === user.id}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {saving === user.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Save className="w-4 h-4" />
                                                        )}
                                                        Lưu
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {users.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                Chưa có người dùng nào
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <p className="text-amber-300 text-sm">
                            <strong>Lưu ý:</strong> Tên đầy đủ phải khớp chính xác với tên trong Asana để hệ thống lọc đúng data.
                            <br />
                            <strong>Manager:</strong> Tài khoản {MANAGER_EMAIL} luôn có quyền quản lý.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
