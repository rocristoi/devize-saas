"use client";

import { useState, useEffect } from "react";
import { Search, Car, User, FileText, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { LineWobble } from "ldrs/react";
import 'ldrs/react/LineWobble.css'

type ClientResult = {
  id: string;
  nume: string;
  cui_cnp?: string;
  telefon?: string;
  vehicles?: { id: string; numar_inmatriculare: string; marca: string; model: string }[];
};

type VehicleResult = {
  id: string;
  numar_inmatriculare: string;
  marca: string;
  model: string;
  seria_sasiu?: string;
  an_fabricatie?: string;
  clients?: { nume: string; telefon?: string };
  devize?: { id: string; series: string; data_intrare: string; total_deviz: number }[];
};

export default function SearchPage() {
  const [searchContext, setSearchContext] = useState<"clienti" | "vehicule">("vehicule");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    clients: ClientResult[];
    vehicles: VehicleResult[];
  }>({ clients: [], vehicles: [] });
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults({ clients: [], vehicles: [] });
        return;
      }

      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("company_id")
          .eq("id", userData.user.id)
          .single();

        if (!profile?.company_id) return;

        const searchQuery = `%${debouncedQuery}%`;

        // Search vehicles
        if (searchContext === "vehicule") {
          const { data: vehicles } = await supabase
            .from("vehicles")
            .select(`
              *,
              clients (nume, telefon),
              devize (id, series, data_intrare, total_deviz)
            `)
            .eq("company_id", profile.company_id)
            .or(`numar_inmatriculare.ilike.${searchQuery},marca.ilike.${searchQuery},seria_sasiu.ilike.${searchQuery}`)
            .limit(20);

          setResults({ clients: [], vehicles: vehicles || [] });
        } else {
          // Search clients
          const { data: clients } = await supabase
            .from("clients")
            .select(`
              *,
              vehicles (*)
            `)
            .eq("company_id", profile.company_id)
            .or(`nume.ilike.${searchQuery},cui_cnp.ilike.${searchQuery},telefon.ilike.${searchQuery}`)
            .limit(20);

          setResults({ clients: clients || [], vehicles: [] });
        }
      } catch (err) {
        console.error("Eroare la căutare:", err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery, supabase, searchContext]);

  return (
    <div className="w-full space-y-6">
      <PageHeader 
        title="Căutare Globală" 
        description="Caută clienți sau vehicule în baza de date"
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-max flex-shrink-0">
            <button
              onClick={() => setSearchContext("vehicule")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                searchContext === "vehicule" 
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                Vehicule
              </div>
            </button>
            <button
              onClick={() => setSearchContext("clienti")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                searchContext === "clienti" 
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Clienți
              </div>
            </button>
          </div>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
            <input
              id="search"
              name="search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchContext === "vehicule" ? "Introduceți număr, marcă, șasiu..." : "Introduceți nume, CUI/CNP, telefon..."}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-8">
          {!loading && query.length >= 2 && results.clients.length === 0 && results.vehicles.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            Nu am găsit niciun rezultat pentru &quot;{query}&quot;
          </div>
        )}

        {loading && (
          <div className="text-center flex flex-col items-center justify-center gap-5 py-12 text-gray-500 dark:text-gray-400">
            <span>   Se caută...</span>
          <LineWobble
            size="80"
            stroke="5"
            bgOpacity="0.1"
            speed="1.75"
            color="black" 
            />
         
          </div>
        )}

        {!loading && searchContext === "clienti" && results.clients.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User size={16} className="text-blue-500" />
              Clienți găsiți ({results.clients.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.clients.map((client) => (
                <Link key={client.id} href={`/clienti/${client.id}`} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all group.block">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{client.nume}</h3>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    {client.cui_cnp && <p className="flex items-center gap-1.5"><FileText size={12}/> CI/CUI: {client.cui_cnp}</p>}
                    {client.telefon && <p className="flex items-center gap-1.5"><User size={12}/> {client.telefon}</p>}
                  </div>
                  
                  {client.vehicles && client.vehicles.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="space-y-1.5">
                        {client.vehicles.map((v) => (
                          <div key={v.id} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-medium bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">{v.numar_inmatriculare}</span>
                            <span className="truncate text-gray-500">{v.marca} {v.model}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && searchContext === "vehicule" && results.vehicles.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Car size={16} className="text-green-500" />
              Vehicule găsite ({results.vehicles.length})
            </h2>
            <div className="space-y-3">
              {results.vehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm relative group hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                  <Link href={`/vehicule/${vehicle.id}`} className="absolute inset-0 z-0" aria-label={`Vezi detalii vehicul ${vehicle.numar_inmatriculare}`}></Link>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 pointer-events-none">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm uppercase group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          {vehicle.numar_inmatriculare}
                        </span>
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                          {vehicle.marca} {vehicle.model}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        {vehicle.seria_sasiu && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">VIN:</span>
                            <span className="font-mono text-gray-700 dark:text-gray-300">{vehicle.seria_sasiu}</span>
                          </div>
                        )}
                        {vehicle.an_fabricatie && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">An:</span>
                            <span className="text-gray-700 dark:text-gray-300">{vehicle.an_fabricatie}</span>
                          </div>
                        )}
                        {vehicle.clients && (
                          <div className="flex items-center gap-1">
                            <User size={12} className="text-gray-400" />
                            <span className="text-gray-700 dark:text-gray-300">{vehicle.clients.nume}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {vehicle.devize && vehicle.devize.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 relative z-10">
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {vehicle.devize.map((deviz) => (
                          <Link 
                            key={deviz.id} 
                            href={`/devize/${deviz.id}`}
                            className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group/deviz"
                          >
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-blue-500" />
                              <div className="flex flex-col">
                                <span className="font-medium text-xs text-gray-900 dark:text-white group-hover/deviz:text-blue-600">#{deviz.series}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-right">
                              <span className="font-semibold text-xs text-gray-900 dark:text-white">{deviz.total_deviz || 0} RON</span>
                              <ChevronRight size={14} className="text-gray-400" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
