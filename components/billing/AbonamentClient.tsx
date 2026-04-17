'use client';

import { useState, useTransition, useRef } from 'react';
import {
  CreditCard, CheckCircle2, AlertCircle, Zap, Calendar,
  Tag, X, Loader2, XCircle, ReceiptText,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { toast } from 'sonner';
import { BillingInfoModal } from '@/components/billing/BillingInfoModal';
import type { BillingSubscription, Plan } from '@/types/billing';
import type { BillingInfo } from '@/app/actions/billingInfo';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  plans: Plan[];
  activeSub: BillingSubscription | null;
  billingInfo: BillingInfo | null;
  hasPaymentMethod: boolean;
}

// ─── Status Banner ─────────────────────────────────────────────────────────────

function StatusBanner({ sub, hasPaymentMethod }: { sub: BillingSubscription; hasPaymentMethod: boolean }) {
  const now = new Date();
  const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;

  const isTrial = sub.status === 'trialing';
  const isActive = sub.status === 'active';
  const isOverdue = sub.status === 'overdue';
  const isExpired = sub.status === 'expired';
  const isCanceled = sub.status === 'canceled';

  const daysRemaining = trialEnd ? Math.max(0, differenceInDays(trialEnd, now)) : null;

  const variants = {
    trialing: {
      bg: 'bg-blue-50/60 border-blue-100 dark:bg-blue-500/5 dark:border-blue-500/20',
      icon: <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />,
      title: 'text-blue-900 dark:text-blue-300',
      body: 'text-blue-700/80 dark:text-blue-400/80',
    },
    active: {
      bg: 'bg-green-50/60 border-green-100 dark:bg-green-500/5 dark:border-green-500/20',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />,
      title: 'text-green-900 dark:text-green-300',
      body: 'text-green-700/80 dark:text-green-400/80',
    },
    overdue: {
      bg: 'bg-orange-50/60 border-orange-100 dark:bg-orange-500/5 dark:border-orange-500/20',
      icon: <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />,
      title: 'text-orange-900 dark:text-orange-300',
      body: 'text-orange-700/80 dark:text-orange-400/80',
    },
    expired: {
      bg: 'bg-red-50/60 border-red-100 dark:bg-red-500/5 dark:border-red-500/20',
      icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
      title: 'text-red-900 dark:text-red-300',
      body: 'text-red-700/80 dark:text-red-400/80',
    },
    canceled: {
      bg: 'bg-gray-50/60 border-gray-200 dark:bg-gray-800/40 dark:border-gray-700',
      icon: <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />,
      title: 'text-gray-700 dark:text-gray-300',
      body: 'text-gray-500 dark:text-gray-400',
    },
  };

  const v = variants[sub.status as keyof typeof variants] ?? variants.canceled;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3 shadow-sm ${v.bg}`}>
      {v.icon}
      <div>
        <p className={`font-semibold text-sm ${v.title}`}>
          {isTrial && 'Perioadă de probă activă'}
          {isActive && 'Abonament Activ'}
          {isOverdue && 'Abonament Restant'}
          {isExpired && 'Abonament Expirat'}
          {isCanceled && 'Abonament Anulat'}
        </p>
        <p className={`mt-0.5 text-xs leading-relaxed ${v.body}`}>
          {isTrial && trialEnd && (
            <>
              Mai ai <strong>{daysRemaining}</strong> zile din perioada gratuită (până pe {format(trialEnd, 'dd MMM yyyy', { locale: ro })}).
              {!hasPaymentMethod && <> Alege un plan pentru a evita blocarea.</>}
              {hasPaymentMethod && !sub.cancel_at_period_end && <> Cardul tău va fi debitat automat la finalul trial-ului.</>}
              {hasPaymentMethod && sub.cancel_at_period_end && <> Abonamentul va fi anulat la finalul trial-ului. Poți reactiva din portalul Stripe.</>}
            </>
          )}
          {isActive && periodEnd && (
            <>
              Abonamentul tău <strong>{sub.billing_cycle === 'yearly' ? 'anual' : 'lunar'}</strong> este activ.
              {sub.cancel_at_period_end
                ? <> Se va anula la <strong>{format(periodEnd, 'dd MMM yyyy', { locale: ro })}</strong>. Poți reactiva din portalul Stripe.</>
                : <> Următoarea reînnoire: <strong>{format(periodEnd, 'dd MMM yyyy', { locale: ro })}</strong>.</>
              }
            </>
          )}
          {isOverdue && periodEnd && (
            <>Perioada a expirat pe {format(periodEnd, 'dd MMM yyyy', { locale: ro })}. Reînnoiește abonamentul pentru a nu pierde accesul.</>
          )}
          {isExpired && 'Abonamentul a expirat. Achiziționează un plan pentru a debloca accesul.'}
          {isCanceled && 'Abonamentul a fost anulat. Poți achiziționa un plan nou oricând.'}
        </p>
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  cycle,
  onCycleChange,
  isCurrentPlan,
  isCurrentCycle,
  isCurrentActive,
  onSelect,
  isPending,
}: {
  plan: Plan;
  cycle: 'monthly' | 'yearly';
  onCycleChange: (c: 'monthly' | 'yearly') => void;
  isCurrentPlan: boolean;
  isCurrentCycle: boolean;
  isCurrentActive: boolean;
  onSelect: () => void;
  isPending: boolean;
}) {
  const price = cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
  const period = cycle === 'yearly' ? 'an' : 'lună';

  const features = [
    'Devize Nelimitate pe desktop si telefon',
    'Istoric Devize permanent salvat în Cloud',
    'Database cu piese administrat automat',
    'Semnare deviz online (cu notificare SMS)',
    'Bază de date Clienți și Vehicule',
  ];

  const isActiveOnThisCycle = isCurrentPlan && isCurrentActive && isCurrentCycle;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      {/* Background image — pinned right, natural aspect, fades out to the left */}
      <div className="hidden sm:block absolute inset-y-0 right-0 w-1/2 sm:w-2/5">
        <Image
          src="https://images.pexels.com/photos/8985515/pexels-photo-8985515.jpeg"
          alt=""
          fill
          className="object-cover object-left"
          priority
        />
        {/* Horizontal fade: fully opaque white on left, transparent on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent dark:from-gray-900 dark:via-gray-900/70" />
      </div>

      {/* Active badge */}
      {isCurrentPlan && isCurrentActive && (
        <div className="absolute top-4 right-4 z-10 bg-blue-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
          Plan Curent
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center text-center sm:text-left gap-8">

        {/* LEFT: price block + CTA */}
        <div className="flex flex-col items-center sm:items-start gap-5 flex-shrink-0 sm:w-64">

          {/* Cycle toggle */}
          <div className="flex items-center mx-auto sm:mx-0 bg-gray-100 dark:bg-white/8 backdrop-blur-sm p-1 rounded-xl w-fit gap-0.5">
            <button
              type="button"
              onClick={() => onCycleChange('monthly')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                cycle === 'monthly'
                  ? 'bg-white dark:bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 dark:text-white/50 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              Lunar
            </button>
            <button
              type="button"
              onClick={() => onCycleChange('yearly')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                cycle === 'yearly'
                  ? 'bg-white dark:bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 dark:text-white/50 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3" />
              Anual
              <span className="bg-green-100 dark:bg-green-400/20 mt-[1/2px] text-green-600 dark:text-green-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                −16%
              </span>
            </button>
          </div>

          {/* Price */}
          <div>
            <div className="flex items-baseline justify-center sm:justify-start gap-1.5 leading-none">
              <span className="text-[56px] font-black text-gray-900 dark:text-white tracking-tight leading-none tabular-nums">
                {price.toFixed(0)}
              </span>
              <div className="flex flex-row">
                <span className="text-sm font-semibold text-gray-400 dark:text-white/50">RON</span>
                <span className="text-xs text-gray-400 dark:text-white/30 mt-2">/ {period}</span>
              </div>
            </div>

          </div>

          {/* CTA */}
          {isActiveOnThisCycle ? (
            <button
              disabled
              className="w-full py-2.5 px-4 bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/60 border border-gray-200 dark:border-white/15 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-default"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Plan Activ
            </button>
          ) : isCurrentPlan && isCurrentActive && !isCurrentCycle ? (
            <button
              onClick={onSelect}
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Calendar className="w-4 h-4" />
                  Schimbă în {cycle === 'yearly' ? 'Anual' : 'Lunar'}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onSelect}
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Alege planul
                </>
              )}
            </button>
          )}

          <p className="text-[11px] text-gray-500 dark:text-white/25 -mt-2">Fără contract · Anulezi oricând</p>
        </div>

        {/* Vertical divider */}
        <div className="hidden sm:block w-px self-stretch bg-gray-200 dark:bg-white/10 flex-shrink-0" />

        {/* RIGHT: features */}
        <ul className="flex-1 grid grid-cols-1 gap-y-3 w-full">
          {features.map((f, i) => (
            <li key={i} className="flex items-center justify-center sm:justify-start gap-2.5 text-sm text-gray-600 dark:text-white/75">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
              <span className="text-left">{f}</span>
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function AbonamentClient({ plans, activeSub, billingInfo: initialBillingInfo, hasPaymentMethod }: Props) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>(
    activeSub?.billing_cycle === 'yearly' ? 'yearly' : 'monthly',
  );
  const [couponCode, setCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Billing info modal state
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(initialBillingInfo);
  const [showBillingModal, setShowBillingModal] = useState(false);
  // Store the planId the user wanted to buy when we interrupted them for billing info
  const pendingPlanRef = useRef<string | null>(null);

  const isActive = activeSub?.status === 'active';
  const isTrialing = activeSub?.status === 'trialing';

  function handleApplyCoupon() {
    setCouponError('');
    if (!couponInput.trim()) return;
    setCouponCode(couponInput.toUpperCase().trim());
    toast.success(`Cupon "${couponInput.toUpperCase().trim()}" aplicat!`);
  }

  function handleRemoveCoupon() {
    setCouponCode('');
    setCouponInput('');
    setCouponError('');
  }

  /** Open Stripe Customer Portal for managing subscription */
  async function handleManageSubscription() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/portal', { method: 'POST' });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error ?? 'A apărut o eroare. Încearcă din nou.');
          return;
        }
        window.location.href = json.url;
      } catch {
        toast.error('Eroare de rețea. Verifică conexiunea și încearcă din nou.');
      }
    });
  }

  /** Actually call the API and redirect to Stripe Checkout */
  async function doPurchase(planId: string) {
    setSelectedPlanId(planId);
    startTransition(async () => {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            billing_cycle: cycle,
            coupon_code: couponCode || undefined,
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          if (res.status === 422 && json.error?.toLowerCase().includes('cupon')) {
            setCouponError(json.error);
          } else {
            toast.error(json.error ?? 'A apărut o eroare. Încearcă din nou.');
          }
          setSelectedPlanId(null);
          return;
        }

        window.location.href = json.url;
      } catch {
        toast.error('Eroare de rețea. Verifică conexiunea și încearcă din nou.');
        setSelectedPlanId(null);
      }
    });
  }

  /** Entry point — go straight to purchase */
  function handleBuy(planId: string) {
    doPurchase(planId);
  }

  /** Called by BillingInfoModal after a successful save */
  function handleBillingInfoSaved(saved: BillingInfo) {
    setBillingInfo(saved);
    setShowBillingModal(false);
    const planId = pendingPlanRef.current;
    pendingPlanRef.current = null;
    if (planId) doPurchase(planId);
  }

  const currentPlanId = activeSub?.plan_id ?? null;

  return (
    <div className="space-y-8">
      {/* Billing Info Modal */}
      <BillingInfoModal
        isOpen={showBillingModal}
        onClose={() => { setShowBillingModal(false); pendingPlanRef.current = null; }}
        onSaved={handleBillingInfoSaved}
        existing={billingInfo}
      />
      {/* Status Banner */}
      {activeSub && <StatusBanner sub={activeSub} hasPaymentMethod={hasPaymentMethod} />}

      {/* Plan Card — single card with built-in cycle toggle */}
      <div className="w-full">
        {plans.slice(0, 1).map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            cycle={cycle}
            onCycleChange={setCycle}
            isCurrentPlan={currentPlanId === plan.id}
            isCurrentCycle={activeSub?.billing_cycle === cycle}
            isCurrentActive={isActive}
            onSelect={() => handleBuy(plan.id)}
            isPending={isPending && selectedPlanId === plan.id}
          />
        ))}
      </div>



      {/* Actions Row */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">

        {/* Payment logos */}
        <div className="flex flex-col items-center sm:items-start gap-1.5 text-center sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Plăți securizate prin Stripe
          </p>
          <div className="flex items-center gap-3">
            {[
              { src: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg', alt: 'Stripe', w: 40 },
              { src: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg', alt: 'Visa', w: 38 },
              { src: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg', alt: 'Mastercard', w: 26 },
              { src: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg', alt: 'Apple Pay', w: 40 },
              { src: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg', alt: 'Google Pay', w: 40 },
            ].map(({ src, alt, w }) => (
              <Image
                key={alt}
                src={src}
                alt={alt}
                width={w}
                height={18}
                className="opacity-50 dark:invert grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-200"
              />
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          {/* Manage subscription via Stripe Portal */}
          {(isActive || isTrialing || activeSub?.status === 'overdue') && activeSub?.stripe_customer_id && (
            <button
              onClick={handleManageSubscription}
              disabled={isPending}
              className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-100 dark:border-blue-500/20 transition-all disabled:opacity-50"
            >
              {isPending && !selectedPlanId ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              Gestionează abonamentul
            </button>
          )}

          {/* Edit billing info */}
          <button
            onClick={() => setShowBillingModal(true)}
            className="inline-flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
          >
            <ReceiptText className="w-3.5 h-3.5" />
            {billingInfo ? (
              <>
                Facturat către:{' '}
                <strong className="text-gray-800 dark:text-white">
                  {billingInfo.type === 'juridica'
                    ? billingInfo.company_name
                    : `${billingInfo.first_name ?? ''} ${billingInfo.last_name ?? ''}`.trim()}
                </strong>
              </>
            ) : (
              'Date de facturare'
            )}
          </button>

          {/* Invoices link */}
          <a
            href="/facturi"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
          >
            <ReceiptText className="w-3.5 h-3.5" />
            Facturile mele
          </a>
        </div>
      </div>
    </div>
  );
}
