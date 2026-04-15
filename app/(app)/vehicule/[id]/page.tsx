"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<{
    id: string;
    numar_inmatriculare: string;
    marca: string;
    model: string;
    seria_sasiu?: string;
    an_fabricatie?: string;
    culoare?: string;
    capacitate_cilindrica?: string;
    clients?: {
      id: string;
      nume: string;
      cui_cnp?: string;
      telefon?: string;
      locatie?: string;
    };
    devize?: {
      id: string;
      series: string;
      data_intrare: string;
      total_deviz: number;
      total_piese: number;
      total_manopera: number;
      km_intrare: string;
      motiv_intrare: string;
      is_finalizat: boolean;
      created_at: string;
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVehicleDetails() {
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
          .from("vehicles")
          .select(`
            *,
            clients (id, nume, cui_cnp, telefon, locatie),
            devize (*)
          `)
          .eq("id", params.id)
          .eq("company_id", profile.company_id)
          .single();

        if (error) throw error;
        setVehicle(data);
      } catch (err) {
        console.error("Error fetching vehicle details:", err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchVehicleDetails();
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex justify-center mt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center shadow-sm border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500">Vehiculul nu a fost găsit sau nu aveți acces la el.</p>
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

  // Derived data
  const devize = vehicle.devize || [];
  const sortedDevize = [...devize].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const ascSortedDevize = [...devize].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const totalSpent = devize.reduce((acc, d) => acc + (d.total_deviz || 0), 0);
  const totalParts = devize.reduce((acc, d) => acc + (d.total_piese || 0), 0);
  const totalLabor = devize.reduce((acc, d) => acc + (d.total_manopera || 0), 0);
  
  const visits = devize.length;
  const avgSpend = visits > 0 ? (totalSpent / visits).toFixed(2) : 0;

  // Formatting km
  const getKmValue = (kmStr: string | undefined): number => {
    if (!kmStr) return 0;
    const val = parseInt(kmStr.replace(/\D/g, ""));
    return isNaN(val) ? 0 : val;
  };

  // Preparation for mileage chart
  let lastKm = 0;
  let hasKmAnomaly = false;
  const chartData = ascSortedDevize.map((d, index) => {
    const km = getKmValue(d.km_intrare);
    let isAnomaly = false;
    if (km > 0) {
      if (lastKm > 0 && km < lastKm) {
        hasKmAnomaly = true;
        isAnomaly = true;
      }
      lastKm = km;
    }
    return {
      id: d.id,
      label: format(parseISO(d.data_intrare || d.created_at), "MMM yyyy", { locale: ro }),
      fullDate: format(parseISO(d.data_intrare || d.created_at), "dd MMM yyyy", { locale: ro }),
      km: km > 0 ? km : null,
      series: d.series,
      isAnomaly
    };
  }).filter(d => d.km !== null);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white mb-1">{data.fullDate}</p>
          <p className="text-gray-900 dark:text-white font-semibold">
            {data.km.toLocaleString()} km
          </p>
          <p className="text-xs text-gray-500 mt-1">Deviz #{data.series}</p>
          {data.isAnomaly && (
            <p className="text-xs text-rose-500 mt-1 font-medium">Scădere suspectă de kilometraj!</p>
          )}
        </div>
      );
    }
    return null;
  };

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
            {vehicle.numar_inmatriculare}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">
            {vehicle.marca} {vehicle.model}
          </p>
        </div>
        <Link
          href={`/devize/nou?vehicle=${vehicle.id}&client=${vehicle.clients?.id || ""}`}
          className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-blue-500 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 h-10 px-6 shadow-sm"
        >
          <Plus size={16} className="mr-2" />
          Deviz Nou
        </Link>
      </div>

      {/* Top Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date Tehnice */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Date Tehnice</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <dt className="text-gray-500 dark:text-gray-400">VIN:</dt>
              <dd className="font-mono text-gray-900 dark:text-white font-medium">{vehicle.seria_sasiu || "-"}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500 dark:text-gray-400">An Fab.:</dt>
              <dd className="text-gray-900 dark:text-white font-medium">{vehicle.an_fabricatie || "-"}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500 dark:text-gray-400">Motor:</dt>
              <dd className="text-gray-900 dark:text-white font-medium">{vehicle.capacitate_cilindrica || "-"}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-gray-500 dark:text-gray-400">Culoare:</dt>
              <dd className="text-gray-900 dark:text-white font-medium capitalize">{vehicle.culoare || "-"}</dd>
            </div>
          </dl>
        </div>

        {/* Client Info */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col justify-between group relative transition-colors hover:border-gray-300 dark:hover:border-gray-600">
          {vehicle.clients ? (
            <>
              <Link href={`/clienti/${vehicle.clients.id}`} className="absolute inset-0 z-0"></Link>
              <div>
                <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Proprietar</h2>
                <dl className="space-y-3 text-sm relative z-10 pointer-events-none">
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500 dark:text-gray-400">Nume:</dt>
                    <dd className="text-gray-900 dark:text-white font-medium transition-colors">{vehicle.clients.nume}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500 dark:text-gray-400">Telefon:</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">{vehicle.clients.telefon || "-"}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500 dark:text-gray-400">CUI/CNP:</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">{vehicle.clients.cui_cnp || "-"}</dd>
                  </div>
                </dl>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full items-start justify-center text-center">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-full text-left mb-4">Proprietar</h2>
              <span className="text-sm text-gray-400 dark:text-gray-500 w-full text-left block">Niciun proprietar asociat</span>
            </div>
          )}
        </div>

        {/* Sumar Financiar */}
        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Sumar Financiar</h2>
          <div className="space-y-4 mt-auto">
            <div className="flex justify-between items-baseline">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Cheltuit</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white leading-none">{totalSpent.toLocaleString()} <span className="text-sm font-normal text-gray-500">RON</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800/50">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Manoperă</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{totalLabor.toLocaleString()} RON</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Piese</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{totalParts.toLocaleString()} RON</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mileage Graph */}
      {chartData.length > 1 && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
              Evoluție Kilometraj
            </h3>
            {hasKmAnomaly && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-900/50">
                <AlertCircle size={14} />
                Atenție la istoric
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="id" 
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#6b7280', fontSize: 12}}
                  dy={10}
                  tickFormatter={(val, index) => chartData[index]?.label || ''}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#6b7280', fontSize: 12}}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="km" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorKm)" 
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    return payload.isAnomaly ? (
                      <circle key={`dot-${payload.id}`} cx={cx} cy={cy} r={4} stroke="#f43f5e" strokeWidth={2} fill="#fff" className="transition-all duration-300" />
                    ) : (
                      <circle key={`dot-${payload.id}`} cx={cx} cy={cy} r={3} stroke="#4f46e5" strokeWidth={2} fill="#fff" className="transition-all duration-300" />
                    );
                  }}
                  activeDot={(props: any) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle 
                        cx={cx} cy={cy} r={6} 
                        fill={payload.isAnomaly ? "#f43f5e" : "#4f46e5"} 
                        stroke="#fff" strokeWidth={2} 
                        className="transition-all duration-300 shadow-sm"
                      />
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Istoric Service - Full width list */}
      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Istoric Service
        </h2>
        
        {sortedDevize.length === 0 ? (
          <div className="py-12 px-6 text-center text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/30">
            Niciun deviz înregistrat în sistem pentru acest vehicul.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedDevize.map((deviz) => (
              <Link 
                key={deviz.id} 
                href={`/devize/${deviz.id}`}
                className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
              >
                <div className="flex-1 space-y-1 mb-4 md:mb-0">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">
                      #{deviz.series}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {deviz.data_intrare ? format(parseISO(deviz.data_intrare), 'dd MMM yyyy', { locale: ro }) : format(parseISO(deviz.created_at), 'dd MMM yyyy', { locale: ro })}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${deviz.is_finalizat ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {deviz.is_finalizat ? 'Finalizat' : 'În lucru'}
                    </span>
                  </div>
                  {deviz.motiv_intrare && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl truncate">
                      {deviz.motiv_intrare}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-8 md:text-right shrink-0">
                  {deviz.km_intrare && (
                    <div className="hidden sm:block">
                      <span className="block text-xs text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider">Kilometraj</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{deviz.km_intrare}</span>
                    </div>
                  )}
                  <div>
                    <span className="block text-xs text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider">Total Deviz</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {deviz.total_deviz || 0} <span className="text-sm font-normal text-gray-500">RON</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}