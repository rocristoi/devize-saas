/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Billing Portal Session so the user can:
 *   - Update payment method
 *   - Cancel subscription
 *   - Switch plan (monthly ↔ yearly)
 *
 * No body required. Returns { url }.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/billing';
import { getStripe } from '@/lib/stripe';

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getAdminSupabase();

  // Fetch the stripe_customer_id for this user
  const { data: sub } = await db
    .from('billing_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'overdue', 'canceled'])
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'Nu există un abonament Stripe asociat contului tău.' },
      { status: 404 },
    );
  }

  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${baseUrl}/abonament`,
  });

  return NextResponse.json({ url: portal.url });
}
