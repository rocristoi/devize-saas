import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { SidebarProvider } from '@/components/layout/SidebarProvider'

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

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-300">
        {/* Sidebar for Desktop */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 transition-colors duration-300 overflow-x-hidden">
          <Header companyName={profile.company.service_name} />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 animate-slide-in scrollbar-hide">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
