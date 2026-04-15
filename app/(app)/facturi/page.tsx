import { createClient } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/billing';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { ReceiptText } from 'lucide-react';
import { InvoicesClient } from '@/components/billing/InvoicesClient';
import type { Invoice } from '@/types/billing';

export default async function FacturiPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const statusFilter = params.status ?? '';

  const db = getAdminSupabase();

  let query = db
    .from('invoices')
    .select(`
      id, amount, currency, status, invoice_number,
      issued_at, due_date, pdf_url, notes, created_at,
      payment_id, subscription_id,
      billing_subscriptions (
        billing_cycle,
        plans ( name )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (statusFilter && ['pending', 'issued', 'canceled'].includes(statusFilter)) {
    query = query.eq('status', statusFilter);
  }

  const { data: invoices } = await query;

  return (
    <div className="w-full space-y-8">
      <PageHeader
        title="Facturile Mele"
        description="Istoricul facturilor tale emise și în așteptare."
        action={
          <a
            href="/abonament"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shadow-sm"
          >
            Abonament
          </a>
        }
      />

      {invoices && invoices.length > 0 ? (
        <InvoicesClient
          invoices={invoices as Invoice[]}
          activeStatus={statusFilter}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <ReceiptText className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Nicio factură găsită
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {statusFilter
              ? `Nu există facturi cu statusul "${statusFilter}".`
              : 'Nu ai nicio factură înregistrată încă. Facturile apar după achizitionarea unui plan.'}
          </p>
        </div>
      )}
    </div>
  );
}
