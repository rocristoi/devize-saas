'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, AlertCircle, CreditCard, ReceiptText } from 'lucide-react';

/**
 * Shown after Stripe Checkout redirects the user back via success_url.
 * Stripe appends ?status=success&session_id=... to the URL.
 * The actual subscription activation happens via webhook (server-to-server),
 * so this page is purely informational — the sub may take a moment to activate.
 */
function PaymentResultContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status'); // success | error | pending

  const isSuccess = status === 'success';
  const isError = status === 'error' || status === 'failed';

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center text-center space-y-6 py-8">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Plată efectuată!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Tranzacția a fost procesată cu succes prin Stripe. Abonamentul tău va fi activat în câteva momente după confirmarea automată.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Vei primi un email de confirmare în curând.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/abonament"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-md"
          >
            <CreditCard className="w-4 h-4" />
            Vezi abonamentul
          </Link>
          <Link
            href="/facturi"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold rounded-xl transition"
          >
            <ReceiptText className="w-4 h-4" />
            Facturile mele
          </Link>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center text-center space-y-6 py-8">
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Plata a eșuat
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Tranzacția nu a putut fi procesată. Nicio sumă nu a fost reținută din contul tău. Poți încerca din nou oricând.
          </p>
        </div>
        <Link
          href="/abonament"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-sm font-semibold rounded-xl transition shadow-md"
        >
          <CreditCard className="w-4 h-4" />
          Încearcă din nou
        </Link>
      </div>
    );
  }

  // Fallback / pending
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-500/15 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Plata se procesează
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Tranzacția ta este în curs de procesare. Vei fi notificat prin email când este confirmată.
        </p>
      </div>
      <Link
        href="/abonament"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-md"
      >
        <CreditCard className="w-4 h-4" />
        Înapoi la abonament
      </Link>
    </div>
  );
}

export function PaymentResultClient() {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <PaymentResultContent />
        </Suspense>
      </div>
    </div>
  );
}
