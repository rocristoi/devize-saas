/**
 * lib/stripe.ts
 * Stripe SDK singleton + billing helpers.
 * Server-only — never import in client components.
 */

import 'server-only';
import Stripe from 'stripe';
import { getAdminSupabase } from '@/lib/billing';
import type { BillingCycle } from '@/types/billing';
import { addDays } from 'date-fns';

// ─── SDK Singleton ─────────────────────────────────────────────────────────────

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('[stripe] Missing STRIPE_SECRET_KEY');
  _stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
  return _stripe;
}

// ─── Price IDs ────────────────────────────────────────────────────────────────

export function getPriceId(cycle: BillingCycle): string {
  const id =
    cycle === 'yearly'
      ? process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID;
  if (!id) throw new Error(`[stripe] Missing STRIPE_${cycle.toUpperCase()}_PRICE_ID`);
  return id;
}

// ─── Customer helpers ─────────────────────────────────────────────────────────

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string,
): Promise<string> {
  const db = getAdminSupabase();

  const { data: existing } = await db
    .from('billing_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (existing?.stripe_customer_id) return existing.stripe_customer_id as string;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name ?? email,
    metadata: { supabase_user_id: userId },
  });

  return customer.id;
}

// ─── Status mapping ───────────────────────────────────────────────────────────

function mapStripeStatus(
  stripeStatus: Stripe.Subscription['status'],
): string {
  switch (stripeStatus) {
    case 'trialing':           return 'trialing';
    case 'active':             return 'active';
    case 'past_due':           return 'overdue';
    case 'canceled':           return 'canceled';
    case 'unpaid':             return 'overdue';
    case 'incomplete':         return 'trialing'; // treat as still-starting, not blocked
    case 'incomplete_expired': return 'expired';
    case 'paused':             return 'overdue';
    default:                   return 'overdue';
  }
}

// ─── Subscription sync ────────────────────────────────────────────────────────

/**
 * Syncs a Stripe Subscription object into billing_subscriptions.
 *
 * Lookup priority (most → least reliable):
 *   1. stripe_subscription_id  — exact match, always correct
 *   2. user via stripe_customer_id metadata — customer always has supabase_user_id
 *
 * The function NEVER creates a new row. The row must already exist (created by
 * the checkout route before the Stripe session is opened). If no row is found
 * it logs a warning and returns — Stripe will retry the webhook.
 *
 * In Stripe API v2026-03-25 "dahlia" current_period_start/end live on the
 * SubscriptionItem, not on the Subscription root.
 */
export async function syncStripeSubscription(
  sub: Stripe.Subscription,
): Promise<void> {
  const db = getAdminSupabase();
  const stripe = getStripe();

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const item = sub.items.data[0];
  const priceId = item?.price.id ?? null;
  const cycle: BillingCycle =
    item?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly';

  const status = mapStripeStatus(sub.status);

  // current_period lives on the item in dahlia
  const periodStart = item?.current_period_start
    ? new Date(item.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;
  const trialEnd = sub.trial_end
    ? new Date(sub.trial_end * 1000).toISOString()
    : null;

  const update = {
    status,
    billing_cycle: cycle,
    stripe_price_id: priceId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    trial_end: trialEnd,
    cancel_at_period_end: sub.cancel_at_period_end,
  };

  // ── 1. Try exact match by stripe_subscription_id ──────────────────────────
  const { data: bySubId } = await db
    .from('billing_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();

  if (bySubId?.id) {
    await db
      .from('billing_subscriptions')
      .update(update)
      .eq('id', bySubId.id);
    return;
  }

  // ── 2. Resolve user_id from Stripe customer metadata ─────────────────────
  // The customer always has supabase_user_id in metadata (set at creation).
  let supabaseUserId: string | null = null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!('deleted' in customer)) {
      supabaseUserId = customer.metadata?.supabase_user_id ?? null;
    }
  } catch (err) {
    console.error('[stripe] syncStripeSubscription: failed to retrieve customer', customerId, err);
  }

  if (!supabaseUserId) {
    // Last resort: look up by stripe_customer_id in DB
    const { data: byCustomerId } = await db
      .from('billing_subscriptions')
      .select('id, user_id')
      .eq('stripe_customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (byCustomerId?.id) {
      await db
        .from('billing_subscriptions')
        .update(update)
        .eq('id', byCustomerId.id);
      return;
    }

    console.warn('[stripe] syncStripeSubscription: cannot resolve user for customer', customerId, '— will retry on next webhook');
    return;
  }

  // ── 3. Match the most-recent row for this user ────────────────────────────
  // Prefer a row that has no stripe_subscription_id yet (pending checkout),
  // or if all rows already have one, use the most recent row.
  const { data: rows } = await db
    .from('billing_subscriptions')
    .select('id, stripe_subscription_id')
    .eq('user_id', supabaseUserId)
    .order('created_at', { ascending: false })
    .limit(5); // fetch a few to find the best candidate

  if (!rows || rows.length === 0) {
    console.warn('[stripe] syncStripeSubscription: no rows found for user', supabaseUserId);
    return;
  }

  // Prefer a row without a stripe_subscription_id (freshly-created by checkout)
  const unlinked = rows.find((r: { id: string; stripe_subscription_id: string | null }) => !r.stripe_subscription_id);
  const targetId = (unlinked ?? rows[0]).id;

  await db
    .from('billing_subscriptions')
    .update(update)
    .eq('id', targetId);
}

// ─── Payment recording ────────────────────────────────────────────────────────

/**
 * Records a successful Stripe payment.
 * In "dahlia", Invoice.parent holds the subscription reference.
 */
export async function recordStripePayment(
  stripeInvoice: Stripe.Invoice,
): Promise<void> {
  const db = getAdminSupabase();

  // Extract subscription ID from the parent field (dahlia API)
  const parent = stripeInvoice.parent as
    | { type: string; subscription_details?: { subscription: string | Stripe.Subscription } }
    | null;
  const subRef = parent?.subscription_details?.subscription;
  if (!subRef || stripeInvoice.amount_paid === 0) return;

  const stripeSubId = typeof subRef === 'string' ? subRef : subRef.id;

  const { data: sub } = await db
    .from('billing_subscriptions')
    .select('id, user_id, company_id')
    .eq('stripe_subscription_id', stripeSubId)
    .maybeSingle();

  if (!sub) {
    console.warn('[stripe] recordStripePayment: no sub found for', stripeSubId);
    return;
  }

  const amount = stripeInvoice.amount_paid / 100;
  const currency = stripeInvoice.currency.toUpperCase();

  // Idempotent: check if payment already recorded
  const { data: existingPayment } = await db
    .from('billing_payments')
    .select('id')
    .eq('stripe_invoice_id', stripeInvoice.id)
    .maybeSingle();

  let paymentId: string;

  if (existingPayment?.id) {
    paymentId = existingPayment.id as string;
    await db.from('billing_payments').update({ status: 'paid' }).eq('id', paymentId);
  } else {
    const { data: inserted } = await db
      .from('billing_payments')
      .insert({
        user_id: sub.user_id,
        subscription_id: sub.id,
        amount,
        currency,
        status: 'paid',
        provider: 'stripe',
        provider_payment_id: stripeInvoice.id, // use invoice ID as provider reference
        stripe_invoice_id: stripeInvoice.id,
      })
      .select('id')
      .single();
    paymentId = inserted!.id as string;
  }

  // Create a pending invoice row for admin to upload PDF to
  const { data: existingInvoice } = await db
    .from('invoices')
    .select('id')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (!existingInvoice) {
    await db.from('invoices').insert({
      user_id: sub.user_id,
      company_id: sub.company_id,
      subscription_id: sub.id,
      payment_id: paymentId,
      amount,
      currency,
      status: 'pending',
      due_date: addDays(new Date(), 5).toISOString(),
    });
  }
}

export async function recordStripePaymentFailed(
  stripeInvoice: Stripe.Invoice,
): Promise<void> {
  const db = getAdminSupabase();
  await db
    .from('billing_payments')
    .update({ status: 'failed' })
    .eq('stripe_invoice_id', stripeInvoice.id);
}
