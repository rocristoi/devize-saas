'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/billing';
import { getStripe } from '@/lib/stripe';
import { revalidatePath } from 'next/cache';

/**
 * Schedules a Stripe subscription to cancel at the current period end.
 * The user keeps access until then; the webhook will set status → canceled.
 */
export async function cancelSubscription(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Neautorizat' };
  }

  const db = getAdminSupabase();

  // Fetch the active/trialing/overdue subscription with Stripe IDs
  const { data: sub } = await db
    .from('billing_subscriptions')
    .select('id, status, stripe_subscription_id')
    .eq('user_id', user.id)
    .in('status', ['trialing', 'active', 'overdue'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) {
    return { error: 'Nu există un abonament activ de anulat.' };
  }

  if (!sub.stripe_subscription_id) {
    return { error: 'Abonamentul nu are un ID Stripe asociat. Contactează suportul.' };
  }

  try {
    const stripe = getStripe();
    // Schedule cancellation at period end (user keeps access until then)
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  } catch (err) {
    console.error('[cancelSubscription] Stripe error:', err);
    return { error: 'Eroare la comunicarea cu Stripe. Încearcă din nou.' };
  }

  // Optimistically update our DB — webhook will confirm
  await db
    .from('billing_subscriptions')
    .update({ cancel_at_period_end: true })
    .eq('id', sub.id)
    .eq('user_id', user.id);

  revalidatePath('/abonament');
  return { success: true };
}
