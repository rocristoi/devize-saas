import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { isSubscriptionBlocked } from '@/lib/billing'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { SidebarProvider } from '@/components/layout/SidebarProvider'
import { BottomNavigation } from '@/components/layout/BottomNavigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getUserProfile()

  if (!profile?.company?.is_onboarding_complete) {
    redirect('/onboarding')
  }

  // ── Subscription gate (second enforcement layer — middleware is first) ───
  // Read the pathname injected by middleware so we can skip the check on
  // /abonament/* routes (the user must be able to manage/renew their plan).
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isAbonamentRoute = pathname.startsWith('/abonament')

  if (!isAbonamentRoute) {
    const blocked = await isSubscriptionBlocked(user.id)
    if (blocked) {
      redirect('/abonament/blocat')
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-300">
        {/* Sidebar for Desktop */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 transition-colors duration-300 overflow-x-hidden">
          <Header companyName={profile.company.service_name} companyLogoUrl={profile.company.logo_url} />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto animate-slide-in scrollbar-hide pb-24 md:pb-8 p-4 md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-6xl">
              {children}
            </div>
          </main>
          
          <BottomNavigation />
        </div>
      </div>
    </SidebarProvider>
  )
}

