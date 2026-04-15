'use client'

import { useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { ClientSignatureField } from './ClientSignatureField'
import { LocalizedFileInput } from './LocalizedFileInput'
import { completeOnboarding } from './actions'

// ─── Small helper ─────────────────────────────────────────────────────────────

function TooltipLabel({ label, tooltip, required = false }: { label: string; tooltip: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="group relative flex items-center justify-center cursor-help">
        <Info className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
        <div className="absolute bottom-full mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 w-48 p-2 text-xs text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg shadow-lg z-10">
          {tooltip}
          <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 outline-none transition-all duration-200'

// ─── Step indicators ──────────────────────────────────────────────────────────

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!formRef.current) return

    const formData = new FormData(formRef.current)

    startTransition(async () => {
      const result = await completeOnboarding(formData)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      // Server action redirects to '/' on success — this is just a fallback
      router.push('/')
    })
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 p-4 py-12">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 h-[40rem] w-[40rem] translate-x-1/3 -translate-y-1/4 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[40rem] w-[40rem] -translate-x-1/3 translate-y-1/4 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 md:p-12">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200/50 dark:border-gray-700/50 pb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Configurați-vă Service-ul
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Bine ați venit! Completați detaliile pentru a activa{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">trial-ul gratuit de 14 zile</span>.
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data">
          {/* ══════════════ Company info ══════════════ */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Secțiunea 1 */}
              <div className="md:col-span-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-sm">1</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Informații Juridice</h2>
              </div>
              <div>
                <TooltipLabel label="Nume service / firmă" tooltip="Numele companiei sau brandul care va apărea ca emitent pe deviz." required />
                <input name="serviceName" type="text" placeholder="Ex: SC AUTO REPAIR SRL" className={inputCls} />
              </div>
              <div>
                <TooltipLabel label="CUI / CIF" tooltip="Codul Unic de Înregistrare al firmei (opțional pentru PF)." />
                <input name="cuiCif" type="text" placeholder="Ex: RO12345678" className={inputCls} />
              </div>
              <div>
                <TooltipLabel label="Reg. Com." tooltip="Numărul de înregistrare la Registrul Comerțului (opțional)." />
                <input name="regCom" type="text" placeholder="Ex: Jxx/xxxx/xxxx" className={inputCls} />
              </div>

              {/* Secțiunea 2 */}
              <div className="md:col-span-2 flex items-center gap-2 mt-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-sm">2</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Date de Contact</h2>
              </div>
              <div>
                <TooltipLabel label="Adresă completă" tooltip="Adresa sediului social sau punctul de lucru afișat pe documente." required />
                <input name="address" type="text" placeholder="Str. Meșterilor Nr 12" className={inputCls} />
              </div>
              <div>
                <TooltipLabel label="Oraș / Județ" tooltip="Localitatea unde se află atelierul dumneavoastră." required />
                <input name="cityCounty" type="text" placeholder="București" className={inputCls} />
              </div>
              <div>
                <TooltipLabel label="Email de contact" tooltip="Adresa de email afișată pe documente." />
                <input name="email" type="email" placeholder="contact@service.ro" className={inputCls} />
              </div>
              <div>
                <TooltipLabel label="Telefon de contact" tooltip="Numărul de telefon general al atelierului." required />
                <input name="phone" type="tel" placeholder="07xx xxx xxx" className={inputCls} />
              </div>

              {/* Secțiunea 3 */}
              <div className="md:col-span-2 flex items-center gap-2 mt-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-sm">3</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Personalizare & Branding</h2>
              </div>
              <div>
                <TooltipLabel label="Titlu antet PDF" tooltip="Titlul principal pe deviz (opțional)." />
                <input name="pdfHeaderTitle" type="text" placeholder="DEVIZ DE REPARAȚIE" defaultValue="DEVIZ DE REPARAȚIE" className={inputCls} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <TooltipLabel label="Culoare Brand" tooltip="Culoarea utilizată pe PDF-uri." />
                  <div className="flex items-center gap-3">
                    <input name="primaryColor" type="color" defaultValue="#2563eb" className="w-12 h-10 rounded cursor-pointer bg-transparent border-0" title="Alegeți culoarea" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Selectați nuanța</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 mt-2">
                <TooltipLabel label="Logo Companie (Opțional)" tooltip="PNG/JPG cu fundal transparent, recomandat." />
                <LocalizedFileInput name="logoFile" accept="image/png, image/jpeg, image/webp" />
              </div>
              <div className="md:col-span-2">
                <TooltipLabel label="Semnătura Autorizată (Opțional)" tooltip="Desenați semnătura sau lăsați gol." />
                <ClientSignatureField />
              </div>

              {/* Checkbox pentru termeni si conditii */}
              <div className="md:col-span-2 flex items-start gap-3 mt-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <input 
                  type="checkbox" 
                  id="terms" 
                  name="terms" 
                  required 
                  className="mt-1 flex-shrink-0 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
                  Sunt de acord cu <a href="/termeni-si-conditii" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Termenii și Condițiile</a> și am citit <a href="/politica-de-confidentialitate" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Politica de Confidențialitate</a>. Înțeleg că perioada de probă de 14 zile gratuită se activează la trimiterea acestui formular.
                </label>
              </div>
            </div>
          </div>

          {/* ══════════════ Submit ══════════════ */}
          <div className="pt-8 border-t border-gray-200/50 dark:border-gray-700/50 mt-8 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Se activează...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Activează Trial Gratuit 14 Zile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
