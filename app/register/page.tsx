import { signup } from '@/app/auth/actions'
import Link from 'next/link'
import { Mail, ShieldCheck } from 'lucide-react'
import { SubmitButton } from '@/components/ui/SubmitButton'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, success?: string }>
}) {
  const resolvedParams = await searchParams;

  if (resolvedParams?.success) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 left-1/4 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 translate-y-1/2 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Verificați adresa de email</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            V-am trimis un link de confirmare pe email. Vă rugăm să vă verificați inbox-ul (și folderul Spam) pentru a vă activa contul și a începe trial-ul gratuit de 14 zile.
          </p>
          <Link
            href="/login"
            className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            Înapoi la Autentificare
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
      {/* Subtle Background Elements */}
      <div className="absolute top-1/4 left-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 h-96 w-96 translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Creează un cont</h2>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Începe acum perioada de <span className="font-semibold text-blue-600 dark:text-blue-400">trial gratuit de 14 zile</span>. <br className='hidden sm:block' /> Nu necesită card bancar.
          </p>
        </div>

        {resolvedParams?.error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800">
            <ShieldCheck className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm font-medium">{resolvedParams.error}</p>
          </div>
        )}

        <form action={signup} className="space-y-5">
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
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="password">
              Parolă
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="confirmPassword">
              Confirmă Parola
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <SubmitButton
              label="Înregistrare"
              loadingLabel="Se creează contul..."
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-sm shadow-blue-500/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            />
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Ai deja cont?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            Intră în cont aici
          </Link>
        </div>
      </div>
    </div>
  )
}
