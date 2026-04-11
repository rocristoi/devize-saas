import { login } from '@/app/auth/actions'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex items-center justify-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Autentificare Devize Auto Koders</h2>
        </div>

        {resolvedParams?.error && (
          <div className="mb-6 p-4 rounded-md bg-red-50 text-red-900 border border-red-200">
            Eroare: {resolvedParams.error}
          </div>
        )}

        <form className="space-y-6">
          <div>
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              placeholder="nume@firma.ro"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="password">
              Parolă
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              placeholder="••••••••"
            />
          </div>

          <button
            formAction={login}
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Intră în cont
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Nu ai cont?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Creează unul nou
          </Link>
        </div>
      </div>
    </div>
  )
}
