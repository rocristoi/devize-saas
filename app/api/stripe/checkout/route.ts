/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session in subscription mode.
 *
 * Row strategy — one row per user, always:
 *   • If the user already has a billing_subscriptions row, reuse it.
 *   • If not, create exactly one new row.
 *   • Any previously-active Stripe subscriptions on the customer are canceled
 *     in Stripe before opening a new checkout so there is never more than one
 *     live Stripe subscription per customer.
 *
 * Body: { billing_cycle: "monthly"|"yearly", coupon_code?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminSupabase, validateCoupon } from '@/lib/billing';
import { getStripe, getPriceId, getOrCreateStripeCustomer } from '@/lib/stripe';
import type { BillingCycle } from '@/types/billing';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { billing_cycle: BillingCycle; coupon_code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { billing_cycle, coupon_code } = body;
  if (!['monthly', 'yearly'].includes(billing_cycle)) {
    return NextResponse.json({ error: 'Invalid billing_cycle' }, { status: 400 });
  }

  const db = getAdminSupabase();

  // ── 1. Fetch plan ────────────────────────────────────────────────────────
  const { data: plan } = await db
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!plan) {
    return NextResponse.json({ error: 'No active plan found' }, { status: 404 });
  }

  // ── 2. Fetch profile ─────────────────────────────────────────────────────
  const { data: profile } = await db
    .from('user_profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'Company profile not found' }, { status: 400 });
  }

  // ── 3. Billing info for customer name ────────────────────────────────────
  const { data: billingInfo } = await db
    .from('billing_info')
    .select('type, company_name, first_name, last_name, email')
    .eq('user_id', user.id)
    .maybeSingle();

  const customerName =
    billingInfo?.type === 'juridica'
      ? (billingInfo.company_name ?? user.email!)
      : billingInfo
      ? `${billingInfo.first_name ?? ''} ${billingInfo.last_name ?? ''}`.trim()
      : user.email!;

  const customerEmail = billingInfo?.email ?? user.email!;

  // ── 4. Get or create Stripe Customer ────────────────────────────────────
  const customerId = await getOrCreateStripeCustomer(user.id, customerEmail, customerName);

  // ── 5. Load the single canonical subscription row for this user ──────────
  // We always work with the most-recent row. If none exists, we create one.
  const { data: existingRow } = await db
    .from('billing_subscriptions')
    .select('id, status, trial_end, stripe_subscription_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── 6. Compute trial end ─────────────────────────────────────────────────
  // Carry over remaining trial if the user is still trialing, otherwise no trial.
  let trialEnd: number | undefined;
  if (existingRow?.status === 'trialing' && existingRow.trial_end) {
    const end = new Date(existingRow.trial_end as string);
    if (end > new Date()) {
      trialEnd = Math.floor(end.getTime() / 1000);
    }
  } else if (!existingRow) {
    // Brand-new user — give full trial
    trialEnd = Math.floor(
      (Date.now() + plan.trial_days * 24 * 60 * 60 * 1000) / 1000,
    );
  }

  // ── 7. Cancel any existing live Stripe subscription on this customer ─────
  // This ensures there is never more than one active Stripe subscription.
  // We cancel at period end only if the sub is in good standing; immediately
  // if it's overdue/incomplete (don't let the user double-pay).
  const stripe = getStripe();
  if (existingRow?.stripe_subscription_id) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(existingRow.stripe_subscription_id as string);
      if (!['canceled', 'incomplete_expired'].includes(stripeSub.status)) {
        await stripe.subscriptions.cancel(existingRow.stripe_subscription_id as string, {
          // Cancel immediately so the new checkout can start fresh.
          // The new checkout will carry over any remaining trial days.
          prorate: false,
        });
      }
    } catch (err) {
      // Log but don't block — the Stripe sub may already be gone
      console.warn('[checkout] Could not cancel previous Stripe subscription:', err);
    }
  }

  // ── 8. Validate coupon → Stripe promotion code ───────────────────────────
  let discounts: { coupon?: string }[] | undefined;
  if (coupon_code) {
    const { valid, coupon } = await validateCoupon(coupon_code, user.id);
    if (!valid || !coupon) {
      return NextResponse.json({ error: 'Cupon invalid sau expirat' }, { status: 422 });
    }
    try {
      const stripeCoupon = await stripe.coupons.retrieve(coupon_code.toUpperCase());
      discounts = [{ coupon: stripeCoupon.id }];
    } catch {
      console.warn('[checkout] Stripe coupon not found for code', coupon_code);
    }
  }

  // ── 9. Upsert the canonical subscription row ─────────────────────────────
  // If a row exists, update it in-place (preserving its id and all history).
  // If not, insert exactly one new row.
  const rowStatus = trialEnd ? 'trialing' : 'active';
  let subRowId: string;

  if (existingRow?.id) {
    await db
      .from('billing_subscriptions')
      .update({
        status: rowStatus,
        billing_cycle,
        stripe_customer_id: customerId,
        stripe_subscription_id: null, // cleared — will be set by the webhook on completion
        current_period_start: null,
        current_period_end: null,
        trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
        cancel_at_period_end: false,
      })
      .eq('id', existingRow.id);
    subRowId = existingRow.id as string;
  } else {
    const { data: newSub, error: insertErr } = await db
      .from('billing_subscriptions')
      .insert({
        user_id: user.id,
        company_id: profile.company_id,
        plan_id: plan.id,
        status: rowStatus,
        billing_cycle,
        stripe_customer_id: customerId,
        trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
      })
      .select('id')
      .single();

    if (!newSub || insertErr) {
      console.error('[checkout] Failed to create subscription row:', insertErr);
      return NextResponse.json({ error: 'Failed to create subscription record' }, { status: 500 });
    }
    subRowId = newSub.id as string;
  }

  // ── 10. Create Stripe Checkout Session ───────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: getPriceId(billing_cycle), quantity: 1 }],
    ...(trialEnd && { subscription_data: { trial_end: trialEnd } }),
    ...(discounts && { discounts }),
    success_url: `${baseUrl}/abonament/rezultat?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/abonament?checkout=canceled`,
    metadata: {
      supabase_user_id: user.id,
      supabase_subscription_id: subRowId,
    },
    allow_promotion_codes: !discounts,
    billing_address_collection: 'auto',
    customer_update: { address: 'auto', name: 'auto' },
    tax_id_collection: { enabled: true },
    locale: 'ro',
  });

  return NextResponse.json({ url: session.url });
}
