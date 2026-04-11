import 'server-only'
import { createClient } from './server'

export async function getUserProfile() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  return profile
}
