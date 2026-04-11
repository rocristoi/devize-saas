"use client";

import { useTheme } from "next-themes";
import { Settings, Moon, Sun, Monitor, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    fetchCompany();
  }, []);

  async function fetchCompany() {
    const { data: profile } = await supabase.from('user_profiles').select('company_id').single();
    if (profile?.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();
      if (company) setCompanyData(company);
    }
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyData) return;
    setSaving(true);
    const { error } = await supabase
      .from('companies')
      .update({
        service_name: companyData.service_name,
        cui_cif: companyData.cui_cif,
        reg_com: companyData.reg_com,
        address: companyData.address,
        city_county: companyData.city_county,
        phone: companyData.phone,
        email: companyData.email,
        pdf_header_title: companyData.pdf_header_title,
      })
      .eq('id', companyData.id);
      
    setSaving(false);
    if (error) {
      toast.error("Eroare la salvare: " + error.message);
    } else {
      toast.success("Datele companiei au fost actualizate!");
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Setări Aplicație"
        description="Configurați preferințele vizuale și datele despre service-ul auto."
      />

      <div className="grid gap-6 w-full">
        {/* Aspect Section */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Aspect și Temă
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Alegeți aspectul vizual preferat. Temele se aplică instantaneu.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setTheme("light")}
              className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${
                theme === "light" 
                  ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 shadow-sm" 
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <Sun className="w-8 h-8" />
              <span className="font-medium">Mod Luminos</span>
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${
                theme === "dark" 
                  ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 shadow-sm" 
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <Moon className="w-8 h-8" />
              <span className="font-medium">Mod Întunecat</span>
            </button>

            <button
              onClick={() => setTheme("system")}
              className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${
                theme === "system" 
                  ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 shadow-sm" 
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <Monitor className="w-8 h-8" />
              <span className="font-medium">Automat (Sistem)</span>
            </button>
          </div>
        </section>

        {/* Company Settings */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Date Service Auto
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aceste date vor apărea pe devizele și documentele generate.
              </p>
            </div>
          </div>
          
          {companyData ? (
            <form onSubmit={handleSaveCompany} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nume Service</label>
                  <input type="text" value={companyData.service_name || ''} onChange={e => setCompanyData({...companyData, service_name: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CUI / CIF</label>
                  <input type="text" value={companyData.cui_cif || ''} onChange={e => setCompanyData({...companyData, cui_cif: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reg. Com.</label>
                  <input type="text" value={companyData.reg_com || ''} onChange={e => setCompanyData({...companyData, reg_com: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titlu Personalizat Deviz PDF</label>
                  <input type="text" value={companyData.pdf_header_title || ''} onChange={e => setCompanyData({...companyData, pdf_header_title: e.target.value})} placeholder="Ex: DEVIZ ESTIMATIV" className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Adresă</label>
                  <input type="text" value={companyData.address || ''} onChange={e => setCompanyData({...companyData, address: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Județ / Oraș</label>
                  <input type="text" value={companyData.city_county || ''} onChange={e => setCompanyData({...companyData, city_county: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefon</label>
                  <input type="tel" value={companyData.phone || ''} onChange={e => setCompanyData({...companyData, phone: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <input type="email" value={companyData.email || ''} onChange={e => setCompanyData({...companyData, email: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
              </div>
              
              <div className="md:col-span-2 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800 mt-2">
                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none w-full sm:w-auto">
                  <Save size={20} />
                  {saving ? 'Se salvează...' : 'Salvează Setările'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse w-full"></div>
              <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse w-2/3"></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}