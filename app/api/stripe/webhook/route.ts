/**
 * POST /api/stripe/webhook
 *
 * Receives and processes Stripe webhook events. Uses raw body for
 * signature verification — bodyParser must be disabled.
 *
 * Events handled:
 *   checkout.session.completed        → stamp stripe_subscription_id on our row, then sync
 *   customer.subscription.updated     → syncStripeSubscription()
 *   customer.subscription.deleted     → syncStripeSubscription() (status → canceled)
 *   invoice.payment_succeeded         → recordStripePayment()
 *   invoice.payment_failed            → recordStripePaymentFailed()
 *                                        (subscription status update handled by
 *                                         customer.subscription.updated which fires
 *                                         at the same time with status=past_due)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, syncStripeSubscription, recordStripePayment, recordStripePaymentFailed } from '@/lib/stripe';
import { getAdminSupabase } from '@/lib/billing';

// Force Node.js runtime so we can read raw body via req.text()
export const runtime = 'nodejs';

// Disable Next.js automatic body parsing
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[webhook] Signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const db = getAdminSupabase();

  try {
    switch (event.type) {
      // ── Checkout completed ──────────────────────────────────────────────
      // Stripe has created the subscription. We stamp stripe_subscription_id
      // on our DB row using the metadata we embedded at checkout time, then
      // call syncStripeSubscription so all fields (status, period, etc.) are
      // written in one go.  syncStripeSubscription will find the row by the
      // newly-stamped stripe_subscription_id on the next lookup.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const stripeSubId =
          typeof session.subscription === 'string'
            ? session.subscription
            : (session.subscription as Stripe.Subscription | null)?.id;

        if (!stripeSubId) {
          console.error('[webhook] checkout.session.completed: missing subscription id');
          break;
        }

        const supabaseSubId = session.metadata?.supabase_subscription_id;

        // Stamp the stripe_subscription_id on our row before syncing so the
        // syncStripeSubscription lookup-by-id path works immediately.
        if (supabaseSubId) {
          await db
            .from('billing_subscriptions')
            .update({ stripe_subscription_id: stripeSubId })
            .eq('id', supabaseSubId)
            .is('stripe_subscription_id', null); // only stamp if not already set (idempotent)
        }

        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
        await syncStripeSubscription(stripeSub);
        break;
      }

      // ── Subscription updated (renewals, plan change, cancel scheduled) ──
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await syncStripeSubscription(sub);
        break;
      }

      // ── Subscription deleted ────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await syncStripeSubscription(sub);
        break;
      }

      // ── Invoice paid ────────────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Skip $0 invoices (trial starts, free coupons)
        if ((invoice.amount_paid ?? 0) === 0) break;
        await recordStripePayment(invoice);
        break;
      }

      // ── Invoice payment failed ──────────────────────────────────────────
      // NOTE: Stripe fires customer.subscription.updated simultaneously with
      // status=past_due, so syncStripeSubscription will set our status to
      // 'overdue' via that event. We only need to record the failed payment here.
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await recordStripePaymentFailed(invoice);
        break;
      }

      default:
        // Unhandled event type — not an error, just ignore
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error processing event ${event.type}:`, err);
    // Return 500 so Stripe retries
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
