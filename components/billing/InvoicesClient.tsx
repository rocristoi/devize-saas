'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  ReceiptText, Download, ExternalLink, Clock,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Invoice } from '@/types/billing';

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Invoice['status'] }) {
  const variants = {
    pending: {
      cls: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
      label: 'În așteptare',
      icon: <Clock className="w-3 h-3" />,
    },
    issued: {
      cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
      label: 'Emisă',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    canceled: {
      cls: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      label: 'Anulată',
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  const v = variants[status] ?? variants.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${v.cls}`}>
      {v.icon}
      {v.label}
    </span>
  );
}

// ─── Invoice Row ──────────────────────────────────────────────────────────────

function InvoiceRow({ invoice }: { invoice: Invoice & { billing_subscriptions?: { billing_cycle: string; plans?: { name: string } } } }) {
  const [expanded, setExpanded] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = invoice.billing_subscriptions as any;
  const planName = sub?.plans?.name ?? '—';
  const cycle = sub?.billing_cycle === 'yearly' ? 'Anual' : 'Lunar';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-4 p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left"
      >
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <ReceiptText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {invoice.invoice_number ?? `Proforma #${invoice.id.slice(0, 8)}`}
            </span>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {planName} · {cycle} · {format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: ro })}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-gray-900 dark:text-white">
            {invoice.amount.toFixed(2)}
            <span className="text-xs font-normal text-gray-500 ml-1">{invoice.currency}</span>
          </p>
          {invoice.pdf_url && (
            <span className="text-[10px] text-blue-500 dark:text-blue-400">PDF disponibil</span>
          )}
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 sm:px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Număr factură</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {invoice.invoice_number ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Emisă la</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {invoice.issued_at
                  ? format(new Date(invoice.issued_at), 'dd MMM yyyy', { locale: ro })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Scadentă la</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: ro })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Sumă</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {invoice.amount.toFixed(2)} {invoice.currency}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Plan</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {planName} ({cycle})
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Status</p>
              <StatusBadge status={invoice.status} />
            </div>
          </div>

          {invoice.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              {invoice.notes}
            </p>
          )}

          {/* PDF actions */}
          {invoice.pdf_url ? (
            <div className="flex gap-3 pt-1">
              <a
                href={invoice.pdf_url}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Descarcă PDF
              </a>
              <a
                href={invoice.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold rounded-xl transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Deschide
              </a>
            </div>
          ) : invoice.status === 'pending' ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              Factura PDF va fi disponibilă după emitere.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

function FilterTabs({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) params.set('status', status);
    else params.delete('status');
    router.push(`${pathname}?${params.toString()}`);
  }

  const tabs = [
    { label: 'Toate', value: '' },
    { label: 'În așteptare', value: 'pending' },
    { label: 'Emise', value: 'issued' },
    { label: 'Anulate', value: 'canceled' },
  ];

  return (
    <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => navigate(t.value)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            active === t.value
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InvoicesClient({
  invoices,
  activeStatus,
}: {
  invoices: Invoice[];
  activeStatus: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <FilterTabs active={activeStatus} />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {invoices.length} {invoices.length === 1 ? 'factură' : 'facturi'}
        </p>
      </div>

      <div className="space-y-3">
        {invoices.map((inv) => (
          <InvoiceRow key={inv.id} invoice={inv as Invoice & { billing_subscriptions?: { billing_cycle: string; plans?: { name: string } } }} />
        ))}
      </div>
    </div>
  );
}
