/**
 * lib/billing.ts
 * Core billing helpers: coupon validation, price calculation,
 * subscription period management, and admin Supabase client.
 *
 * All functions that write to the database use the service-role
 * client so they bypass RLS safely from server-side API routes.
 *
 * NOTE: The Supabase generated types don't yet include the billing
 * tables (added via billing.sql). We type the admin client as `any`
 * for billing queries until `supabase gen types` is re-run.
 */

import 'server-only';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import type {
  Coupon,
  BillingCycle,
  BillingSubscription,
  Plan,
} from '@/types/billing';
import { addDays, addMonths, addYears } from 'date-fns';

// ─── Admin Supabase Client ────────────────────────────────────────────────────
// Uses service-role key — never expose to the browser.
// Bypasses RLS; use only in server-side API routes.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adminClient: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminSupabase(): any {
  if (_adminClient) return _adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('[billing] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _adminClient = createSupabaseAdmin(url, key, {
    auth: { persistSession: false },
  });
  return _adminClient;
}

// ─── Price Calculation ────────────────────────────────────────────────────────

export function calculateBasePrice(plan: Plan, cycle: BillingCycle): number {
  return cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
}

export function applyDiscount(
  basePrice: number,
  coupon: Coupon,
): number {
  if (coupon.type === 'percentage') {
    const discount = (basePrice * coupon.value) / 100;
    return Math.max(0, Math.round((basePrice - discount) * 100) / 100);
  }
  // fixed amount
  return Math.max(0, Math.round((basePrice - coupon.value) * 100) / 100);
}

export function discountAmount(basePrice: number, coupon: Coupon): number {
  return Math.round((basePrice - applyDiscount(basePrice, coupon)) * 100) / 100;
}

// ─── Period Helpers ───────────────────────────────────────────────────────────

export function nextPeriodEnd(start: Date, cycle: BillingCycle): Date {
  return cycle === 'yearly' ? addYears(start, 1) : addMonths(start, 1);
}

export function trialEndDate(plan: Plan): Date {
  return addDays(new Date(), plan.trial_days);
}

// ─── Coupon Validation ────────────────────────────────────────────────────────

export interface CouponValidationResult {
  valid: boolean;
  coupon: Coupon | null;
  error?: string;
}

export async function validateCoupon(
  code: string,
  userId: string,
): Promise<CouponValidationResult> {
  const db = getAdminSupabase();

  // Fetch coupon
  const { data: coupon, error } = await db
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (error || !coupon) {
    return { valid: false, coupon: null, error: 'Coupon not found or inactive.' };
  }

  // Check expiry
  if (new Date(coupon.expires_at) < new Date()) {
    return { valid: false, coupon: null, error: 'Coupon has expired.' };
  }

  // Check global usage limit
  if (coupon.used_count >= coupon.max_uses) {
    return { valid: false, coupon: null, error: 'Coupon usage limit reached.' };
  }

  // Check per-user redemption (prevent reuse)
  const { data: existing } = await db
    .from('coupon_redemptions')
    .select('id')
    .eq('user_id', userId)
    .eq('coupon_id', coupon.id)
    .maybeSingle();

  if (existing) {
    return { valid: false, coupon: null, error: 'You have already used this coupon.' };
  }

  return { valid: true, coupon: coupon as Coupon };
}

// ─── Coupon Redemption ────────────────────────────────────────────────────────

export async function redeemCoupon(
  couponId: string,
  userId: string,
  paymentId: string,
): Promise<void> {
  const db = getAdminSupabase();

  // Atomic increment + record redemption using a transaction-safe RPC call
  // We use two operations; Supabase doesn't expose multi-statement transactions
  // via the client, so we increment first (with a unique constraint guard).
  const { error: insertErr } = await db
    .from('coupon_redemptions')
    .insert({ coupon_id: couponId, user_id: userId, payment_id: paymentId });

  if (insertErr) {
    throw new Error(`[billing] Failed to record coupon redemption: ${insertErr.message}`);
  }

  // Atomic increment via DB function defined in billing.sql
  await (db.rpc as Function)('increment_coupon_used_count', { coupon_id_arg: couponId });
}

// ─── Subscription Helpers ─────────────────────────────────────────────────────

/**
 * Returns the active/trialing/overdue subscription for a user, if any.
 */
export async function getActiveSubscription(
  userId: string,
): Promise<BillingSubscription | null> {
  const db = getAdminSupabase();
  const { data } = await db
    .from('billing_subscriptions')
    .select('*, plan:plans(*)')
    .eq('user_id', userId)
    .in('status', ['trialing', 'active', 'overdue'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as BillingSubscription) ?? null;
}

/**
 * Activates a subscription after successful payment.
 * Sets period start/end based on billing cycle.
 */
export async function activateSubscription(
  subscriptionId: string,
  cycle: BillingCycle,
): Promise<void> {
  const db = getAdminSupabase();
  const now = new Date();
  const periodEnd = nextPeriodEnd(now, cycle);

  const { error } = await db
    .from('billing_subscriptions')
    .update({
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_end: null,
    })
    .eq('id', subscriptionId);

  if (error) {
    throw new Error(`[billing] Failed to activate subscription ${subscriptionId}: ${error.message}`);
  }
}

/**
 * Returns true when a user's subscription blocks access to the app.
 *
 * Access is BLOCKED when either:
 *  1. Status is 'canceled' AND current_period_end is in the past (sub fully ended).
 *  2. Status is 'overdue' AND current_period_end is in the past (payment failed, grace period ended).
 *  3. Status is 'expired' (trial ended, never paid).
 *
 * Access is ALLOWED when:
 *  - 'trialing' (within free trial)
 *  - 'active'
 *  - 'overdue' but current_period_end is still in the future (grace period)
 *  - 'canceled' but current_period_end is still in the future (paid through end of period)
 *  - No subscription row exists at all (let onboarding / layout handle that)
 */
export async function isSubscriptionBlocked(userId: string): Promise<boolean> {
  const db = getAdminSupabase();

  const { data: sub } = await db
    .from('billing_subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) return false; // no subscription yet — let other guards handle it

  const { status, current_period_end } = sub as {
    status: string;
    current_period_end: string | null;
  };

  const now = new Date();
  const periodEndDate = current_period_end ? new Date(current_period_end) : null;

  // Fully expired trial
  if (status === 'expired') return true;

  // Canceled or payment-failed: block only after period has ended
  if (status === 'canceled' || status === 'overdue') {
    if (!periodEndDate) return true; // no period end recorded → assume blocked
    return periodEndDate < now;
  }

  return false;
}
