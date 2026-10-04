'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui'

import { SiteNav } from '@/components/SiteNav'
import { RadarArt } from '@/components/home/Art'
export default function AuthPage() {
  const router = useRouter()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isLogin = mode === 'login'

  function switchMode() {
    setMode(isLogin ? 'register' : 'login')
    setError('')
    setSuccess('')
    setPassword('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
          return
        }

        router.push('/owner/manage-claims')
        router.refresh()
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ')

      setMode('login')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <SiteNav />
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 pb-16 pt-28 font-sans text-fg antialiased">
      <div aria-hidden="true" className="frl-auth-bloom" />
      <div className="relative grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div className="hidden lg:block" data-fx="left">
          <p className="frl-eyebrow text-label text-primary-hover" data-fx="line"><Tr s={"Financial Reputation Layer"} /></p>
          <h2 className="frl-display mt-5 text-[clamp(1.8rem,3.4vw,2.8rem)] leading-[1.1] text-white">
            <Tr s={"Evidence before opinion."} /></h2>
          <p className="mt-4 max-w-sm text-body text-fg-muted"><Tr s={"No conclusion without a record behind it."} /></p>
          <div className="mt-8 h-72 w-72">
            <RadarArt />
          </div>
        </div>
      <div className="w-full max-w-md justify-self-center" data-fx="scale">
        <div className="frl-panel frl-spot p-6 sm:p-8">

          <div className="mb-7">
            <p className="text-caption font-medium text-primary-hover">
              <Tr s={"Financial Reputation Layer"} /></p>

            <h1 className="mt-2 text-h2 text-white">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>

            <p className="mt-2 text-body-sm text-fg-muted">
              {isLogin
                ? 'Log in to manage your claims.'
                : 'Create an account to manage your claims.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="frl-auth-email"
                className="mb-1.5 block text-caption font-medium text-fg-secondary"
              >
                <Tr s={"Email"} /></label>

              <input
                id="frl-auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="h-11 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-slate-100 transition-[border-color,background-color] duration-[var(--frl-dur-fast)] placeholder:text-fg-subtle hover:border-white/25 focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div>
              <label
                htmlFor="frl-auth-password"
                className="mb-1.5 block text-caption font-medium text-fg-secondary"
              >
                <Tr s={"Password"} /></label>

              <input
                id="frl-auth-password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="h-11 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-slate-100 transition-[border-color,background-color] duration-[var(--frl-dur-fast)] placeholder:text-fg-subtle hover:border-white/25 focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-body-sm leading-relaxed text-rose-300"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-body-sm leading-relaxed text-emerald-300"
              >
                {success}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading}>
              {loading ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={switchMode}
              className="inline-flex min-h-6 items-center rounded-sm text-body-sm text-primary-hover transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover"
            >
              {isLogin
                ? 'Do not have an account? Create one'
                : 'Already have an account? Log in'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="inline-flex min-h-6 items-center rounded-sm text-body-sm text-fg-muted transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover"
            >
              <Tr s={"← Back to FRL"} /></Link>
          </div>

        </div>
      </div>
      </div>
    </main>
    </>
  )
}
import { Tr } from '@/lib/i18n';