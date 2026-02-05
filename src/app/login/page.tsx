'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [magicLinkSent, setMagicLinkSent] = useState(false)
    const [loginMode, setLoginMode] = useState<'password' | 'magic'>('password')
    const router = useRouter()
    const supabase = createClient()

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                }
            })

            if (error) {
                setError(error.message)
            } else {
                setMagicLinkSent(true)
            }
        } catch {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (magicLinkSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Kiểm tra email!</h2>
                        <p className="text-slate-400 mb-4">
                            Chúng tôi đã gửi link đăng nhập đến <br />
                            <span className="text-purple-400 font-medium">{email}</span>
                        </p>
                        <p className="text-sm text-slate-500">
                            Click vào link trong email để đăng nhập tự động
                        </p>
                        <button
                            onClick={() => setMagicLinkSent(false)}
                            className="mt-6 text-purple-400 hover:text-purple-300 text-sm"
                        >
                            ← Quay lại
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/25 mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Creative Dashboard</h1>
                    <p className="text-slate-400 mt-2">Track your team&apos;s performance</p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-6">Đăng nhập</h2>

                    {/* Toggle Mode */}
                    <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setLoginMode('password')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${loginMode === 'password'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Mật khẩu
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginMode('magic')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${loginMode === 'magic'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            ✨ Magic Link
                        </button>
                    </div>

                    <form onSubmit={loginMode === 'password' ? handlePasswordLogin : handleMagicLink} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        {loginMode === 'password' && (
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                                    Mật khẩu
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        )}

                        {loginMode === 'magic' && (
                            <p className="text-sm text-slate-400 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                                💡 Nhập email, chúng tôi sẽ gửi link đăng nhập. Không cần nhớ mật khẩu!
                            </p>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    {loginMode === 'password' ? 'Đang đăng nhập...' : 'Đang gửi...'}
                                </span>
                            ) : (
                                loginMode === 'password' ? 'Đăng nhập' : 'Gửi Magic Link'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400">
                            Chưa có tài khoản?{' '}
                            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                                Đăng ký
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Creative Team Performance Dashboard
                </p>
            </div>
        </div>
    )
}
