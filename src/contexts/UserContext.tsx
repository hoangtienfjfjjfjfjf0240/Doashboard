'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

const MANAGER_EMAIL = 'hoangtien020120@gmail.com'

interface UserContextType {
    user: {
        email: string
        role: string
        fullName: string
    } | null
    loading: boolean
}

const UserContext = createContext<UserContextType>({ user: null, loading: true })

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserContextType['user']>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        // Check localStorage first for cached role
        const cached = localStorage.getItem('user_role_cache')
        if (cached) {
            try {
                const parsed = JSON.parse(cached)
                setUser(parsed)
                setLoading(false)
            } catch { }
        }

        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
                const isManager = authUser.email?.toLowerCase() === MANAGER_EMAIL.toLowerCase()
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', authUser.id)
                    .single()

                const userData = {
                    email: authUser.email || '',
                    role: isManager ? 'admin' : (profile?.role || 'member'),
                    fullName: profile?.full_name || '',
                }
                setUser(userData)
                // Cache in localStorage
                localStorage.setItem('user_role_cache', JSON.stringify(userData))
            }
            setLoading(false)
        }

        fetchUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setUser(null)
                localStorage.removeItem('user_role_cache')
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <UserContext.Provider value={{ user, loading }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    return useContext(UserContext)
}
