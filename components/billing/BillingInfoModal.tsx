'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Building2, User, X, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { saveBillingInfo } from '@/app/actions/billingInfo';
import type { BillingInfo } from '@/app/actions/billingInfo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful save so the parent can continue the purchase */
  onSaved: (info: BillingInfo) => void;
  /** Pre-fill form if the user already has billing info */
  existing?: BillingInfo | null;
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

const inputCls =
  'w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

// ─── Component ────────────────────────────────────────────────────────────────

export function BillingInfoModal({ isOpen, onClose, onSaved, existing }: Props) {
  const [type, setType] = useState<'juridica' | 'fizica'>(existing?.type ?? 'juridica');

  // Juridica fields
  const [companyName, setCompanyName] = useState(existing?.company_name ?? '');
  const [cui, setCui] = useState(existing?.cui ?? '');
  const [regCom, setRegCom] = useState(existing?.reg_com ?? '');

  // Fizica fields
  const [firstName, setFirstName] = useState(existing?.first_name ?? '');
  const [lastName, setLastName] = useState(existing?.last_name ?? '');

  // Shared
  const [address, setAddress] = useState(existing?.address ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [county, setCounty] = useState(existing?.county ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');

  const [isPending, startTransition] = useTransition();

  // Animate in/out
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Tiny delay so the enter animation runs after mount
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      closeTimerRef.current = setTimeout(() => setMounted(false), 350);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isOpen]);

  if (!mounted) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      let result;

      if (type === 'juridica') {
        if (!companyName.trim() || !cui.trim()) {
          toast.error('Completează Denumirea firmei și CUI-ul.');
          return;
        }
        result = await saveBillingInfo({
          type: 'juridica',
          company_name: companyName.trim(),
          cui: cui.trim(),
          reg_com: regCom.trim() || undefined,
          address: address.trim(),
          city: city.trim(),
          county: county.trim(),
          email: email.trim(),
          phone: phone.trim(),
        });
      } else {
        if (!firstName.trim() || !lastName.trim()) {
          toast.error('Completează Numele și Prenumele.');
          return;
        }
        result = await saveBillingInfo({
          type: 'fizica',
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          address: address.trim(),
          city: city.trim(),
          county: county.trim(),
          email: email.trim(),
          phone: phone.trim(),
        });
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Date de facturare salvate!');

      const saved: BillingInfo = {
        id: '',
        user_id: '',
        type,
        company_name: type === 'juridica' ? companyName.trim() : null,
        cui:          type === 'juridica' ? cui.trim() : null,
        reg_com:      type === 'juridica' ? (regCom.trim() || null) : null,
        first_name:   type === 'fizica'   ? firstName.trim() : null,
        last_name:    type === 'fizica'   ? lastName.trim()  : null,
        address: address.trim(),
        city:    city.trim(),
        county:  county.trim(),
        email:   email.trim(),
        phone:   phone.trim(),
      };

      onSaved(saved);
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col items-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel — bottom sheet on mobile, centered modal on sm+ */}
      <div
        className={`
          relative z-10 w-full bg-white dark:bg-gray-950 shadow-2xl
          flex flex-col max-h-[92vh]
          rounded-t-3xl sm:rounded-2xl
          sm:max-w-lg sm:mx-4
          border border-gray-200 dark:border-gray-800
          transition-all duration-350 ease-out
          ${visible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-full opacity-0 sm:translate-y-4 sm:scale-95'
          }
        `}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Date de facturare
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Necesare pentru emiterea facturilor fiscale
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 flex flex-col">
          <div className="px-6 py-5 space-y-5 flex-1">
            {/* Type tabs */}
            <div className="flex gap-2">
              {(['juridica', 'fizica'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                    type === t
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
                  }`}
                >
                  {t === 'juridica' ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  {t === 'juridica' ? 'Persoană Juridică' : 'Persoană Fizică'}
                </button>
              ))}
            </div>

            {/* ── Juridică fields ── */}
            {type === 'juridica' && (
              <>
                <Field label="Denumire firmă" required>
                  <input
                    className={inputCls}
                    placeholder="Ex: SC Koders Tech SRL"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CUI / CIF" required>
                    <input
                      className={inputCls}
                      placeholder="RO12345678"
                      value={cui}
                      onChange={(e) => setCui(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Nr. Reg. Com." hint="Opțional">
                    <input
                      className={inputCls}
                      placeholder="J40/1234/2020"
                      value={regCom}
                      onChange={(e) => setRegCom(e.target.value)}
                    />
                  </Field>
                </div>
              </>
            )}

            {/* ── Fizică fields ── */}
            {type === 'fizica' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prenume" required>
                  <input
                    className={inputCls}
                    placeholder="Ion"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Nume" required>
                  <input
                    className={inputCls}
                    placeholder="Popescu"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </Field>
              </div>
            )}

            {/* ── Shared address fields ── */}
            <Field label="Adresă" required>
              <input
                className={inputCls}
                placeholder="Str. Exemplu nr. 1, bl. A, ap. 2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Localitate" required>
                <input
                  className={inputCls}
                  placeholder="București"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </Field>
              <Field label="Județ" required>
                <input
                  className={inputCls}
                  placeholder="Ilfov"
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  required
                />
              </Field>
            </div>

            {/* ── Contact ── */}
            <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                Date de contact
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email factură" required>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="facturi@firma.ro"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Telefon" required>
                  <input
                    type="tel"
                    className={inputCls}
                    placeholder="07xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvează și continuă
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

