import { forgotPassword } from '@/app/auth/actions'
import Link from 'next/link'
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const resolvedParams = await searchParams

  if (resolvedParams?.success) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 p-4">
        <div className="absolute top-1/4 left-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 h-96 w-96 translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
            <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
            Verifică-ți emailul
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Am trimis un link de resetare a parolei pe adresa ta de email. Verifică inbox-ul și folderul Spam. Link-ul este valabil <span className="font-semibold">1 oră</span>.
          </p>
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la autentificare
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
            <Mail className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Ai uitat parola?
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Introdu adresa de email asociată contului și îți vom trimite un link de resetare a parolei.
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
              autoComplete="email"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all duration-200"
              placeholder="nume@firma.ro"
            />
          </div>

          <div className="pt-2">
            <button
              formAction={forgotPassword}
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-sm shadow-blue-500/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-[0.98] transition-all duration-200"
            >
              Trimite link de resetare
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi la autentificare
          </Link>
        </div>
      </div>
    </div>
  )
}
