"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Car, Phone, Building, Plus, FileText, User } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<{
    id: string;
    nume: string;
    cui_cnp?: string;
    telefon?: string;
    strada?: string;
    locatie?: string;
    vehicles?: {
      id: string;
      numar_inmatriculare: string;
      marca: string;
      model: string;
      seria_sasiu?: string;
      devize?: {
        id: string;
        series: string;
        total_deviz: number;
        is_finalizat: boolean;
        motiv_intrare: string;
        created_at: string;
        data_intrare?: string;
        km_intrare?: string;
      }[];
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientDetails() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("company_id")
          .eq("id", userData.user.id)
          .single();

        if (!profile?.company_id) return;

        const { data, error } = await supabase
          .from("clients")
          .select(`
            *,
            vehicles (
              *,
              devize (*)
            )
          `)
          .eq("id", params.id)
          .eq("company_id", profile.company_id)
          .single();

        if (error) throw error;
        setClient(data);
      } catch (err) {
        console.error("Error fetching client details:", err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchClientDetails();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex justify-center mt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500">Clientul nu a fost găsit sau nu aveți acces la el.</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Înapoi
          </button>
        </div>
      </div>
    );
  }

  const vehicles = client.vehicles || [];
  const allDevize = vehicles.flatMap(v => 
    (v.devize || []).map(d => ({ ...d, vehicle: v }))
  );
  const sortedDevize = allDevize.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalSpent = allDevize.reduce((acc, d) => acc + (d.total_deviz || 0), 0);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Înapoi
          </button>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white uppercase tracking-tight">
            {client.nume}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-lg text-gray-500 dark:text-gray-400">
            {client.cui_cnp && (
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-md text-sm">
                <Building size={14} />
                {client.cui_cnp}
              </span>
            )}
            {client.telefon && (
              <a href={`tel:${client.telefon}`} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                <Phone size={14} />
                {client.telefon}
              </a>
            )}
          </div>
        </div>
        <Link
          href={`/devize/nou?client=${client.id}`}
          className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-blue-500 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 h-10 px-6 shadow-sm"
        >
          <Plus size={16} className="mr-2" />
          Deviz Nou
        </Link>
      </div>

      {/* Top Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date Contact */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={14} /> Contact
          </h2>
          <dl className="space-y-3 text-sm mt-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800/50">
              <dt className="text-gray-500 dark:text-gray-400">Telefon:</dt>
              <dd className="text-gray-900 dark:text-white font-medium">{client.telefon || "-"}</dd>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800/50">
              <dt className="text-gray-500 dark:text-gray-400">CUI/CNP:</dt>
              <dd className="text-gray-900 dark:text-white font-mono">{client.cui_cnp || "-"}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500 dark:text-gray-400">Adresă:</dt>
              <dd className="text-gray-900 dark:text-white font-medium text-right line-clamp-1 max-w-[200px]" title={[client.strada, client.locatie].filter(Boolean).join(", ")}>
                {[client.strada, client.locatie].filter(Boolean).join(", ") || "-"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Sumar Flota */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Car size={14} /> Vehicule
          </h2>
          <div className="space-y-4 mt-auto">
            <div className="flex justify-between items-baseline">
              <div className="text-sm text-gray-500 dark:text-gray-400">Vehicule Inregistrate</div>
              <div className="text-3xl font-semibold text-gray-900 dark:text-white leading-none">{vehicles.length}</div>
            </div>
          </div>
        </div>

        {/* Sumar Financiar */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText size={14} /> Sumar Activitate
          </h2>
          <div className="space-y-4 mt-auto">
            <div className="flex justify-between items-baseline pb-4 border-b border-gray-100 dark:border-gray-800/50">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Devize</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white leading-none">{allDevize.length} <span className="text-sm font-normal text-gray-500">lucrări</span></div>
            </div>
            <div className="flex justify-between items-baseline">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Cheltuit</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white leading-none">{totalSpent.toLocaleString()} <span className="text-sm font-normal text-gray-500">RON</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 pt-4">
        {/* Flotă Vehicule */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-between">
            <span>Vehicule Asociate</span>
          </h2>
          
          {vehicles.length === 0 ? (
             <div className="py-12 px-6 text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/30">
               Nu există vehicule înregistrate pentru acest client.
             </div>
          ) : (
            <div className="flex flex-col gap-3">
              {vehicles.map((vehicle) => {
                const devizeVehicul = vehicle.devize || [];
                const sortedVehDevize = [...devizeVehicul].sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                const isLucru = sortedVehDevize.some(d => !d.is_finalizat);

                return (
                  <Link 
                    key={vehicle.id} 
                    href={`/vehicule/${vehicle.id}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 shadow-sm"
                  >
                    <div className="flex-1 space-y-1 mb-4 sm:mb-0">
                      <div className="flex items-center gap-3">
                        <span className="font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm uppercase text-gray-900 dark:text-white group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                          {vehicle.numar_inmatriculare}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {vehicle.marca} {vehicle.model}
                        </span>
                      </div>
                      {vehicle.seria_sasiu && (
                        <div className="text-sm text-gray-500 font-mono">
                          VIN: {vehicle.seria_sasiu}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 sm:text-right shrink-0">
                      <div>
                        {isLucru && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mb-1">
                            Deviz deschis
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{devizeVehicul.length} lucrări</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Istoric Recente */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Activitate Recentă
          </h2>
          
          {sortedDevize.length === 0 ? (
            <div className="py-12 px-6 text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/30">
              Niciun deviz înregistrat.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedDevize.slice(0, 5).map((deviz) => (
                <Link 
                  key={deviz.id} 
                  href={`/devize/${deviz.id}`}
                  className="group flex flex-col p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        #{deviz.series}
                      </span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        ({deviz.vehicle.numar_inmatriculare})
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${deviz.is_finalizat ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {deviz.is_finalizat ? 'Finalizat' : 'În lucru'}
                    </span>
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        {deviz.data_intrare ? format(parseISO(deviz.data_intrare), 'dd MMM yyyy', { locale: ro }) : format(parseISO(deviz.created_at), 'dd MMM yyyy', { locale: ro })}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 max-w-[250px]">
                        {deviz.motiv_intrare || "Fără descriere"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {deviz.total_deviz || 0} <span className="text-xs font-normal text-gray-500">RON</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

