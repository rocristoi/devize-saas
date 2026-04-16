"use server";

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getStripe, getOrCreateStripeCustomer, getPriceId } from '@/lib/stripe'

export interface OnboardingInput {
  // Company fields
  serviceName: string
  cuiCif?: string
  regCom?: string
  address: string
  cityCounty: string
  phone: string
  email?: string
  primaryColor?: string
  pdfHeaderTitle?: string
  // Logo / signature — handled separately as File objects passed in FormData
}

export interface OnboardingResult {
  error?: string
}

/**
 * Saves company profile + billing info, then creates a Stripe 14-day free trial
 * subscription (no credit card required). Redirects to '/' on success.
 */
export async function completeOnboarding(formData: FormData): Promise<OnboardingResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceName = formData.get('serviceName') as string
  const cuiCif = formData.get('cuiCif') as string
  const regCom = formData.get('regCom') as string
  const address = formData.get('address') as string
  const cityCounty = formData.get('cityCounty') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const primaryColor = (formData.get('primaryColor') as string) || '#2563eb'
  const pdfHeaderTitle = (formData.get('pdfHeaderTitle') as string) || 'DEVIZ DE REPARAȚIE'
  const logoFile = formData.get('logoFile') as File | null
  const signatureDataUrl = formData.get('signatureDataUrl') as string | null

  // Billing info fields
  const billingType = formData.get('billing_type') as 'juridica' | 'fizica'
  const billingCompanyName = formData.get('billing_company_name') as string
  const billingCui = formData.get('billing_cui') as string
  const billingRegCom = formData.get('billing_reg_com') as string
  const billingFirstName = formData.get('billing_first_name') as string
  const billingLastName = formData.get('billing_last_name') as string
  const billingAddress = formData.get('billing_address') as string
  const billingCity = formData.get('billing_city') as string
  const billingCounty = formData.get('billing_county') as string
  const billingEmail = formData.get('billing_email') as string
  const billingPhone = formData.get('billing_phone') as string

  if (!serviceName || !address || !cityCounty || !phone) {
    return { error: 'Completează câmpurile obligatorii.' }
  }

  const adminAuthClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Upload logo ──────────────────────────────────────────────────────────────
  let logoUrl: string | null = null
  if (logoFile && logoFile.size > 0) {
    const ALLOWED_LOGO_MIME = ['image/jpeg', 'image/png', 'image/webp']
    const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2 MB

    if (!ALLOWED_LOGO_MIME.includes(logoFile.type)) {
      return { error: 'Tip fișier invalid. Sunt acceptate doar JPEG, PNG și WebP.' }
    }
    if (logoFile.size > MAX_LOGO_SIZE) {
      return { error: 'Fișierul este prea mare. Dimensiunea maximă este 2 MB.' }
    }

    const arrayBuffer = await logoFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate magic bytes to prevent MIME-type spoofing
    const magicBytes = buffer.slice(0, 4)
    const isPng = magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4e && magicBytes[3] === 0x47
    const isJpeg = magicBytes[0] === 0xff && magicBytes[1] === 0xd8
    const isWebp = buffer.slice(0, 12).toString('ascii', 8, 12) === 'WEBP'
    if (!isPng && !isJpeg && !isWebp) {
      return { error: 'Conținutul fișierului nu corespunde tipului declarat.' }
    }

    // Use only the validated extension from the actual content
    const safeExt = isPng ? 'png' : isJpeg ? 'jpg' : 'webp'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${safeExt}`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await adminAuthClient.storage
      .from('logos')
      .upload(filePath, buffer, { upsert: true, contentType: logoFile.type })

    if (!uploadError) {
      const { data: publicUrlData } = adminAuthClient.storage.from('logos').getPublicUrl(filePath)
      logoUrl = publicUrlData.publicUrl
    } else {
      console.error('Logo upload error:', uploadError)
    }
  }

  // ── Upload signature ─────────────────────────────────────────────────────────
  let signatureUrl: string | null = null
  if (signatureDataUrl && signatureDataUrl.startsWith('data:image/png;base64,')) {
    const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const fileName = `sig-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await adminAuthClient.storage
      .from('signatures')
      .upload(filePath, buffer, { upsert: true, contentType: 'image/png' })

    if (!uploadError) {
      const { data: publicUrlData } = adminAuthClient.storage
        .from('signatures')
        .getPublicUrl(filePath)
      signatureUrl = publicUrlData.publicUrl
    } else {
      console.error('Signature upload error:', uploadError)
    }
  }

  // ── Create company ───────────────────────────────────────────────────────────
  const { data: company, error: companyError } = await adminAuthClient
    .from('companies')
    .insert({
      service_name: serviceName,
      cui_cif: cuiCif || null,
      reg_com: regCom || null,
      address,
      city_county: cityCounty,
      phone,
      email: email || null,
      primary_color: primaryColor,
      logo_url: logoUrl,
      signature_url: signatureUrl,
      pdf_header_title: pdfHeaderTitle,
      pdf_filename: 'deviz',
      is_onboarding_complete: true,
      current_series_counter: 0,
    })
    .select('id')
    .single()

  if (companyError || !company) {
    console.error('Company creation error:', companyError)
    return { error: 'Crearea firmei a eșuat. Încearcă din nou.' }
  }

  // ── Create user profile ──────────────────────────────────────────────────────
  const { error: profileError } = await adminAuthClient
    .from('user_profiles')
    .upsert({ id: user.id, company_id: company.id, role: 'owner' })

  if (profileError) {
    console.error('Profile creation error:', profileError)
    return { error: 'Actualizarea profilului a eșuat. Încearcă din nou.' }
  }

  // ── Save billing info ────────────────────────────────────────────────────────
  if (billingType) {
    const billingPayload: Record<string, string | null> = {
      user_id: user.id,
      type: billingType,
      address: billingAddress,
      city: billingCity,
      county: billingCounty,
      email: billingEmail,
      phone: billingPhone,
      company_name: null,
      cui: null,
      reg_com: null,
      first_name: null,
      last_name: null,
    }

    if (billingType === 'juridica') {
      billingPayload.company_name = billingCompanyName
      billingPayload.cui = billingCui
      billingPayload.reg_com = billingRegCom || null
    } else {
      billingPayload.first_name = billingFirstName
      billingPayload.last_name = billingLastName
    }

    await adminAuthClient
      .from('billing_info')
      .upsert(billingPayload, { onConflict: 'user_id' })
  }

  // ── Create Stripe customer + 14-day trial subscription ───────────────────────
  try {
    const customerName =
      billingType === 'juridica'
        ? (billingCompanyName ?? user.email!)
        : `${billingFirstName ?? ''} ${billingLastName ?? ''}`.trim() || user.email!
    const customerEmail = billingEmail || user.email!

    const customerId = await getOrCreateStripeCustomer(user.id, customerEmail, customerName)
    const stripe = getStripe()
    const priceId = getPriceId('monthly')

    const stripeSub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 14,
      payment_settings: { save_default_payment_method: 'on_subscription' },
      trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
    })

    // Resolve trial_end (Stripe returns Unix timestamp or null while trialing)
    const trialEndTs = stripeSub.trial_end
    const trialEnd = trialEndTs ? new Date(trialEndTs * 1000).toISOString() : null

    // Resolve active plan
    const { data: plan } = await adminAuthClient
      .from('plans')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    await adminAuthClient.from('billing_subscriptions').insert({
      user_id: user.id,
      company_id: company.id,
      plan_id: plan?.id ?? null,
      status: 'trialing',
      billing_cycle: 'monthly',
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSub.id,
      stripe_price_id: priceId,
      trial_end: trialEnd,
      cancel_at_period_end: false,
    })
  } catch (stripeErr) {
    console.error('Stripe trial subscription error:', stripeErr)
    // Don't block onboarding — user can add subscription later from Abonament page
  }

  redirect('/')
}
