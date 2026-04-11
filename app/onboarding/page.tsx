import { completeOnboarding } from './actions'

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Configurare date Service</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Completează datele firmei tale. Aceste detalii vor apărea pe toate devizele generate de tine (header PDF, date de contact etc.). Poți opțional adăuga și o culoare de brand. Câmpurile obligatorii sunt marcate cu *.
        </p>

        <form action={completeOnboarding} className="space-y-6 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Informații Juridice</h2>
            </div>
            
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Nume service / firmă *</label>
              <input name="serviceName" type="text" required placeholder="SC AUTO REPAIR SRL" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">CUI/CIF *</label>
              <input name="cuiCif" type="text" required placeholder="RO12345678" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Reg. Com. (Nr. Inreg.) *</label>
              <input name="regCom" type="text" required placeholder="Jxx/xxxx/xxxx" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div className="md:col-span-2 border-b border-gray-200 dark:border-gray-700 pb-2 mt-4 mb-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Date de contact (Pe PDF)</h2>
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Adresă completă *</label>
              <input name="address" type="text" required placeholder="Str. Meșterilor Nr 12" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Oraș/Județ *</label>
              <input name="cityCounty" type="text" required placeholder="București" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Email de contact</label>
              <input name="email" type="email" placeholder="contact@service-ul-tau.ro" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon de contact *</label>
              <input name="phone" type="tel" required placeholder="07xx xxx xxx" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="md:col-span-2 border-b border-gray-200 dark:border-gray-700 pb-2 mt-4 mb-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Personalizare Design</h2>
            </div>
            
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Titlu preferat pentru antetul PDF-ului</label>
              <input name="pdfHeaderTitle" type="text" placeholder="DEVIZ DE REPARAȚIE" defaultValue="DEVIZ DE REPARAȚIE" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Culoare Header PDF</label>
                <input name="primaryColor" type="color" defaultValue="#2563eb" className="w-full h-10 p-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 block cursor-pointer" />
              </div>
            </div>

          </div>
          
          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              className="py-3 px-8 rounded-lg shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/20 text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold transition transform active:scale-95"
            >
              Lansează sistemul
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
