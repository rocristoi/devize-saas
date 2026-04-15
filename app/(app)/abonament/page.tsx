import { createClient } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/billing';
import { getStripe } from '@/lib/stripe';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { AbonamentClient } from '@/components/billing/AbonamentClient';
import type { Plan, BillingSubscription } from '@/types/billing';
import type { BillingInfo } from '@/app/actions/billingInfo';

export const dynamic = 'force-dynamic';

export default async function AbonamentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = getAdminSupabase();

  // Fetch all active plans
  const { data: plans } = await db
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true });

  // Fetch user's current billing subscription (most recent active/trialing/overdue/canceled)
  const { data: activeSub } = await db
    .from('billing_subscriptions')
    .select('*, plan:plans(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch billing info (persoana juridica / fizica)
  const { data: billingInfo, error: billingInfoError } = await db
    .from('billing_info')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (billingInfoError) {
    console.error('[AbonamentPage] billing_info query error:', billingInfoError);
  }

  // Check whether the Stripe customer already has a default payment method
  let hasPaymentMethod = false;
  const stripeCustomerId = activeSub?.stripe_customer_id;
  if (stripeCustomerId) {
    try {
      const stripe = getStripe();
      const customer = await stripe.customers.retrieve(stripeCustomerId, {
        expand: ['invoice_settings.default_payment_method'],
      });
      if (!('deleted' in customer)) {
        const defaultPm = customer.invoice_settings?.default_payment_method;
        hasPaymentMethod = !!defaultPm;

        // Fallback: check payment methods list if no default set yet
        if (!hasPaymentMethod) {
          const pms = await stripe.paymentMethods.list({ customer: stripeCustomerId, limit: 1 });
          hasPaymentMethod = pms.data.length > 0;
        }
      }
    } catch {
      // Non-fatal — just show the CTA
    }
  }

  return (
    <div className="w-full space-y-8">
      <PageHeader
        title="Abonamentul Tău"
        description="Gestionează licența și accesează sistemul complet fără întreruperi."
      />
      <AbonamentClient
        plans={(plans ?? []) as Plan[]}
        activeSub={activeSub as BillingSubscription | null}
        billingInfo={(billingInfo as BillingInfo | null) ?? null}
        hasPaymentMethod={hasPaymentMethod}
      />
    </div>
  );
}
