"use server";

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceName = formData.get('serviceName') as string
  const cuiCif = formData.get('cuiCif') as string
  const regCom = formData.get('regCom') as string
  const address = formData.get('address') as string
  const cityCounty = formData.get('cityCounty') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const primaryColor = formData.get('primaryColor') as string
  const logoUrl = formData.get('logoUrl') as string
  const pdfHeaderTitle = formData.get('pdfHeaderTitle') as string
  const pdfFilename = formData.get('pdfFilename') as string

  // Insert company structure - needs service_role or specific RLS if not owner yet.
  // We'll use the admin client since the user doesn't have a profile yet to pass RLS.
  const adminAuthClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: company, error: companyError } = await adminAuthClient
    .from('companies')
    .insert({
      service_name: serviceName,
      cui_cif: cuiCif,
      reg_com: regCom,
      address,
      city_county: cityCounty,
      phone,
      email,
      primary_color: primaryColor,
      logo_url: logoUrl,
      pdf_header_title: pdfHeaderTitle,
      pdf_filename: pdfFilename,
      is_onboarding_complete: true,
      current_series_counter: 0,
    })
    .select('id')
    .single()

  if (companyError || !company) {
    console.error('Company creation error:', companyError)
    redirect('/onboarding?error=Creare_firma_a_esuat')
  }

  // Update or insert user profile
  // Because we don't have a trigger yet, we'll try to upsert the profile
  const { error: profileError } = await adminAuthClient
    .from('user_profiles')
    .upsert({
      id: user.id,
      company_id: company.id,
      role: 'owner',
    })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    redirect('/onboarding?error=Actualizare_profil_a_esuat')
  }

  // Automatically start trial subscription
  const { error: subError } = await adminAuthClient
    .from('subscriptions')
    .insert({
      company_id: company.id,
      status: 'trialing',
      plan_id: 'lunar',
    })

  if (subError) {
    console.error('Subscription start error:', subError)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
