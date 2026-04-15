"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from 'next-themes';
import { SignaturePad } from '@/components/ui/SignaturePad';
import { Settings, Moon, Sun, Monitor, Save, AlertCircle } from "lucide-react";
import { PageHeader } from '@/components/ui/PageHeader';
import { toast } from 'sonner';


export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [initialCompanyData, setInitialCompanyData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [companyData, setCompanyData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchCompany() {
      const { data: profile } = await supabase.from('user_profiles').select('company_id').single();
      if (profile?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();
        if (company) {
          setCompanyData(company);
          setInitialCompanyData(company);
        }
      }
    }

    fetchCompany();
  }, [supabase]);

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyData) return;
    setSaving(true);
    let newLogoUrl = companyData.logo_url;
    let newSignatureUrl = companyData.signature_url;

    if (companyData.new_logoFile) {
      try {
        const file = companyData.new_logoFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${companyData.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);
          newLogoUrl = publicUrlData.publicUrl;
        } else {
          toast.error("Eroare la încărcarea logoului: " + uploadError.message);
        }
      } catch (err) {
        toast.error("Eroare neașteptată la încărcarea logoului." + (err instanceof Error ? err.message : ''));
      }
    }

    if (companyData.new_signature_base64) {
      try {
        const response = await fetch(companyData.new_signature_base64);
        const blob = await response.blob();
        const fileName = `${companyData.id}_${Date.now()}.png`;
        const filePath = `${companyData.id}/${fileName}`;

        const { error: uploadSigError } = await supabase.storage
          .from('signatures')
          .upload(filePath, blob, { upsert: true, contentType: 'image/png' });

        if (!uploadSigError) {
          const { data: publicUrlData } = supabase.storage
            .from('signatures')
            .getPublicUrl(filePath);
          newSignatureUrl = publicUrlData.publicUrl;
        } else {
          toast.error("Eroare la încărcarea semnăturii: " + uploadSigError.message);
        }
      } catch (err) {
        toast.error("Eroare neașteptată la încărcarea semnăturii.");
      }
    }

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
        current_series_counter: parseInt(companyData.current_series_counter) || 0,
        logo_url: companyData.new_logoFile === null && companyData.logo_url === null ? null : newLogoUrl,
        signature_url: companyData.new_signature_base64 === null && companyData.signature_url === null ? null : newSignatureUrl,
      })
      .eq('id', companyData.id);
      
    setSaving(false);
    if (error) {
      toast.error("Eroare la salvare: " + error.message);
    } else {
      toast.success("Datele companiei au fost actualizate!");
      setInitialCompanyData({
        ...companyData,
        logo_url: companyData.new_logoFile === null && companyData.logo_url === null ? null : newLogoUrl,
        signature_url: companyData.new_signature_base64 === null && companyData.signature_url === null ? null : newSignatureUrl,
      });
      setCompanyData({
        ...companyData,
        new_logoFile: undefined,
        new_signature_base64: undefined,
        logo_url: companyData.new_logoFile === null && companyData.logo_url === null ? null : newLogoUrl,
        signature_url: companyData.new_signature_base64 === null && companyData.signature_url === null ? null : newSignatureUrl,
      });
    }
  }

  if (!mounted) {
    return null;
  }

  const isFieldDifferent = (a: any, b: any) => (a === null && b === '') ? false : (a === '' && b === null) ? false : a !== b;

  const hasChanges = companyData && initialCompanyData && (
    isFieldDifferent(companyData.service_name, initialCompanyData.service_name) ||
    isFieldDifferent(companyData.cui_cif, initialCompanyData.cui_cif) ||
    isFieldDifferent(companyData.reg_com, initialCompanyData.reg_com) ||
    isFieldDifferent(companyData.address, initialCompanyData.address) ||
    isFieldDifferent(companyData.city_county, initialCompanyData.city_county) ||
    isFieldDifferent(companyData.phone, initialCompanyData.phone) ||
    isFieldDifferent(companyData.email, initialCompanyData.email) ||
    isFieldDifferent(companyData.pdf_header_title, initialCompanyData.pdf_header_title) ||
    companyData.current_series_counter != initialCompanyData.current_series_counter ||
    !!companyData.new_logoFile ||
    !!companyData.new_signature_base64 ||
    companyData.logo_url !== initialCompanyData.logo_url ||
    companyData.signature_url !== initialCompanyData.signature_url
  );

  return (
    <div className="w-full space-y-6 pb-24">
      <PageHeader
        title="Setări Aplicație"
        description="Configurați preferințele vizuale și datele despre service-ul auto."
      />

      <div className="grid gap-6 w-full">
        {/* Aspect Section */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Aspect și Temă
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Alegeți aspectul vizual preferat.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-max">
            <button
              onClick={() => setTheme("light")}
              title="Mod Luminos"
              className={`p-2 rounded-md transition-all ${
                theme === "light" 
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTheme("dark")}
              title="Mod Întunecat"
              className={`p-2 rounded-md transition-all ${
                theme === "dark" 
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTheme("system")}
              title="Automat (Sistem)"
              className={`p-2 rounded-md transition-all ${
                theme === "system" 
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Company Settings */}
          <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 sm:p-8 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                Date Service Auto
              </h2>
              <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400">
                Aceste date vor apărea pe devizele și documentele generate.
              </p>
            </div>
          </div>
          
          {companyData ? (
            <form id="settings-form" onSubmit={handleSaveCompany} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nume Service</label>
                  <input type="text" value={companyData.service_name || ''} onChange={e => setCompanyData({...companyData, service_name: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">CUI / CIF</label>
                  <input type="text" value={companyData.cui_cif || ''} onChange={e => setCompanyData({...companyData, cui_cif: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reg. Com.</label>
                  <input type="text" value={companyData.reg_com || ''} onChange={e => setCompanyData({...companyData, reg_com: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Titlu Personalizat Deviz PDF</label>
                  <input type="text" value={companyData.pdf_header_title || ''} onChange={e => setCompanyData({...companyData, pdf_header_title: e.target.value})} placeholder="Ex: DEVIZ ESTIMATIV" className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Următorul Număr de Deviz</label>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1.5">Setați numărul de la care doriți să înceapă următorul deviz.</p>
                  <input 
                    type="number" 
                    min="1" 
                    value={(parseInt(companyData.current_series_counter) || 0) + 1} 
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setCompanyData({...companyData, current_series_counter: isNaN(val) ? 0 : Math.max(0, val - 1)});
                    }} 
                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all flex-1" 
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Adresă</label>
                  <input type="text" value={companyData.address || ''} onChange={e => setCompanyData({...companyData, address: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Județ / Oraș</label>
                  <input type="text" value={companyData.city_county || ''} onChange={e => setCompanyData({...companyData, city_county: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefon</label>
                  <input type="tel" value={companyData.phone || ''} onChange={e => setCompanyData({...companyData, phone: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                  <input type="email" value={companyData.email || ''} onChange={e => setCompanyData({...companyData, email: e.target.value})} className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                </div>
              </div>

              {/* Elemente Vizuale PDF */}
              <div className="md:col-span-2 mt-4 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Personalizare Aspect PDF</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Companie */}
                  <div className="flex flex-col">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Logo Companie</label>
                    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full flex flex-col">
                      {companyData.logo_url ? (
                        <div className="mb-4 flex flex-col items-center justify-center flex-1 relative group">
                          <div className="h-[9.5rem] w-full border border-gray-100 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={companyData.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setCompanyData({...companyData, logo_url: null, new_logoFile: null})} 
                            className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm"
                            title="Șterge Logo"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="mb-4 flex-1 flex items-center justify-center min-h-[9.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/20">
                          <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">Niciun logo setat</span>
                        </div>
                      )}
                      
                      <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/webp" 
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setCompanyData({
                                ...companyData, 
                                new_logoFile: e.target.files[0],
                                logo_url: URL.createObjectURL(e.target.files[0])
                              })
                            }
                          }}
                          className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400 cursor-pointer"
                        />
                        <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-2">Dacă încarci o imagine nouă, va înlocui logo-ul actual la salvare.</p>
                      </div>
                    </div>
                  </div>

                  {/* Semnătură Service */}
                  <div className="flex flex-col">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Semnătură Autorizată</label>
                    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full flex flex-col">
                      <div className="flex-1 flex flex-col items-center justify-center w-full">
                        <div className="w-full mt-2">
                          <SignaturePad 
                            key={`sig-${resetKey}`}
                            initialSignatureUrl={initialCompanyData?.signature_url || companyData?.signature_url}
                            hideSaveButton={true}
                            onChange={(dataUrl) => setCompanyData({...companyData, new_signature_base64: dataUrl})} 
                          />
                        </div>
                      </div>
                      <div className="mt-auto pt-4 text-center">
                        <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500">Această semnătură va apărea pe devizele PDF generate.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Container padding removed to allow sticky placement outside */}
            </form>
          ) : (
            <div className="space-y-6">
              <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse w-full"></div>
              <div className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse w-2/3"></div>
            </div>
          )}
        </section>
      </div>

      {/* Floating Action Bar */}
      <div className={`sticky bottom-4 z-50 transition-all duration-300 ${hasChanges ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] border border-blue-200 dark:border-blue-900/50 p-4 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3 text-blue-700 dark:text-blue-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Atenție, aveți modificări nesalvate.</span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={() => {
                setCompanyData({ ...initialCompanyData });
                setResetKey(prev => prev + 1);
              }}
              disabled={saving} 
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all"
            >
              Anulează
            </button>
            <button 
              type="submit" 
              form="settings-form"
              disabled={saving} 
              className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Save size={16} />
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}