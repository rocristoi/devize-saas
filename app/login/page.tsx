import { login } from '@/app/auth/actions'
import Link from 'next/link'
import { ShieldCheck, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string; next?: string }>
}) {
  const resolvedParams = await searchParams;

  // Handle email magic links or confirmations hitting /login?code=...
  if (resolvedParams?.code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(resolvedParams.code)
    if (!error) {
      redirect(resolvedParams.next || '/')
    } else {
      redirect('/login?error=' + encodeURIComponent('Cod de autentificare invalid sau expirat.'))
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
      {/* Subtle Background Elements */}
      <div className="absolute top-1/4 left-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 h-96 w-96 translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Bine ai revenit</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Autentifică-te pentru a accesa sistemul de devize
          </p>
        </div>

        {resolvedParams?.error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800">
            <ShieldCheck className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm font-medium">{resolvedParams.error}</p>
          </div>
        )}

        <form className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="email">
              Adresă Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all duration-200"
              placeholder="nume@firma.ro"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="password">
                Parolă
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Ai uitat parola?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button
              formAction={login}
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-sm shadow-blue-500/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-[0.98] transition-all duration-200"
            >
              <span>Intră în cont</span>
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Autentificare securizată SSL</span>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Nu ai cont?{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            Creează unul nou (14 zile gratuit)
          </Link>
        </div>
      </div>
    </div>
  )
}
