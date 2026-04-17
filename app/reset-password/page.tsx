'use client'

import { useState, useEffect, useTransition, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Lock, CheckCircle2, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Supabase sends the recovery token in the URL hash (#access_token=...&type=recovery)
  // We need to exchange it client-side so the session is established
  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true)
        } else if (event === 'SIGNED_IN' && session) {
          // Also covers cases where the session was already set via the callback route
          setSessionReady(true)
        }
      }
    )

    // Check if there's already an active session (came via /auth/callback redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc.')
      return
    }

    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        // Sign out so user logs in fresh with the new password
        setTimeout(async () => {
          await supabase.auth.signOut()
          router.push('/login')
        }, 3000)
      }
    })
  }

  if (success) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
        <div className="absolute top-1/4 left-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 h-96 w-96 translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
            Parolă schimbată!
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
            Parola ta a fost actualizată cu succes.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
            Vei fi redirecționat la pagina de autentificare în câteva secunde...
          </p>
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            Mergi la autentificare
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 h-96 w-96 translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
            <KeyRound className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Resetează parola
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {sessionReady
              ? 'Alege o parolă nouă pentru contul tău.'
              : 'Se verifică link-ul de resetare...'}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800">
            <ShieldCheck className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!sessionReady ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Se verifică autentificarea...</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Dacă această pagină nu se încarcă, link-ul poate fi expirat.{' '}
              <Link href="/forgot-password" className="text-blue-600 hover:underline dark:text-blue-400">
                Solicită un link nou.
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="password">
                Parolă nouă
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 pr-11 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="confirmPassword">
                Confirmă parola nouă
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 pr-11 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => {
                    const strength =
                      password.length >= 12 ? 4
                      : password.length >= 8 ? 3
                      : password.length >= 6 ? 2
                      : 1
                    return (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i < strength
                            ? strength === 1 ? 'bg-red-500'
                              : strength === 2 ? 'bg-orange-400'
                              : strength === 3 ? 'bg-yellow-400'
                              : 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )
                  })}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {password.length < 6
                    ? 'Minim 6 caractere'
                    : password.length < 8
                    ? 'Parolă slabă — adaugă mai multe caractere'
                    : password.length < 12
                    ? 'Parolă medie — poți face mai bine!'
                    : 'Parolă puternică ✓'}
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-sm shadow-blue-500/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Se salvează...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Salvează parola nouă
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {sessionReady && (
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la autentificare
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
