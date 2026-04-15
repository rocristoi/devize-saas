/**
 * /abonament/blocat
 *
 * Shown when the user's subscription has expired or their payment method has
 * failed and the grace period is over.  The user cannot access any other page
 * until they renew.
 */

import { createClient } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/billing';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, CreditCard, RefreshCcw } from 'lucide-react';
import type { BillingSubscription } from '@/types/billing';

export const dynamic = 'force-dynamic';

export default async function SubscriptionBlockedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const db = getAdminSupabase();

  // Fetch the most recent subscription to show contextual info
  const { data: sub } = await db
    .from('billing_subscriptions')
    .select('status, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const typedSub = sub as Pick<
    BillingSubscription,
    'status' | 'current_period_end' | 'cancel_at_period_end'
  > | null;

  const isPaymentFailed = typedSub?.status === 'overdue';
  const isCanceled = typedSub?.status === 'canceled';
  const isExpired = typedSub?.status === 'expired';

  const heading = isPaymentFailed
    ? 'Plata a eșuat'
    : isCanceled
    ? 'Abonament anulat'
    : 'Abonament expirat';

  const description = isPaymentFailed
    ? 'Ultima ta plată nu a putut fi procesată și perioada de grație a expirat. Actualizează metoda de plată sau contactează-ne pentru ajutor.'
    : isCanceled
    ? 'Abonamentul tău a fost anulat și perioada plătită a luat sfârșit. Reactivează-l pentru a continua să folosești platforma.'
    : 'Perioada de trial sau abonamentul tău a expirat. Alege un plan pentru a continua.';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-10 rounded-fullflex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {heading}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Status badge */}
          <div className="flex justify-center">
            {isPaymentFailed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Plată eșuată
              </span>
            )}
            {isCanceled && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Abonament anulat
              </span>
            )}
            {isExpired && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Expirat
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/abonament"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-3 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {isPaymentFailed ? 'Actualizează metoda de plată' : 'Reactivează abonamentul'}
            </Link>

            <Link
              href="/suport"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium px-4 py-3 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Contactează suportul
            </Link>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Ai întrebări? Scrie-ne la{' '}
            <a
              href="mailto:contact@koders.ro"
              className="text-blue-500 hover:underline"
            >
              contact@koders.ro
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
