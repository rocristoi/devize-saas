import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import Link from "next/link";
import { Search, FileText, Plus, Car, Edit } from "lucide-react";
import { DeleteDevizButton } from "@/components/deviz/DeleteDevizButton";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function DevizeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const search = params?.search || "";
  const page = parseInt(params?.page || "1", 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  // 1. Get Authentication & Company Info
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  const companyId = profile?.company_id;
  if (!companyId) return null;

  // 2. Fetch Devizes
  let query = supabase
    .from("devize")
    .select(
      `
      *,
      clients(nume, telefon),
      vehicles(numar_inmatriculare, marca, model),
      companies(service_name, primary_color, logo_url, address, cui_cif, reg_com, email, phone, pdf_header_title)
    `,
      { count: "exact" }
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    // Basic search functionality - can be expanded
    // PostgreSQL ILIKE search on series
    query = query.ilike("series", `%${search}%`);
  }

  const { data: devize, count } = await query;
  
  const totalPages = count ? Math.ceil(count / limit) : 0;

  return (
    <div className="w-full space-y-6">
      <PageHeader 
        title="Istoric Devize" 
        description="Vizualizează, editează și gestionează devizele emise."
        action={
          <Link
            href="/devize/nou"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-4 md:py-2 text-sm rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Deviz Nou</span>
          </Link>
        }
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <form className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Caută după nr. deviz..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
            />
          </form>
        </div>

        {/* Desktop Table (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Nr. Referință</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Client</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Auto</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Dată Intrare</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Total (RON)</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-center">Status</th>
                <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {devize && devize.length > 0 ? (
                devize.map((deviz) => (
                  <tr
                    key={deviz.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      #{deviz.series}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {deviz.clients?.nume}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {deviz.vehicles?.numar_inmatriculare}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {deviz.vehicles?.marca} {deviz.vehicles?.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {format(new Date(deviz.data_intrare), "dd MMM yyyy", {
                        locale: ro,
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {(deviz.total_deviz || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            deviz.is_finalizat 
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' 
                              : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                          }`}
                        >
                          {deviz.is_finalizat ? 'Finalizat' : 'Draft'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <Link
                          href={`/devize/${deviz.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors"
                          title="Vezi deviz"
                        >
                          <FileText size={18} />
                        </Link>
                        <Link
                          href={`/devize/${deviz.id}/edit`}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 dark:hover:text-orange-400 rounded-lg transition-colors"
                          title="Editează deviz"
                        >
                          <Edit size={18} />
                        </Link>
                        <DeleteDevizButton devizId={deviz.id} series={deviz.series} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    Nu s-au găsit devize înregistrate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards (hidden on desktop) */}
        <div className="md:hidden flex flex-col p-4 space-y-4">
          {devize && devize.length > 0 ? (
            devize.map((deviz) => (
              <div 
                key={deviz.id} 
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    #{deviz.series} &bull; {format(new Date(deviz.data_intrare), "dd MMM yyyy", { locale: ro })}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                      deviz.is_finalizat 
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                    }`}
                  >
                    {deviz.is_finalizat ? 'Finalizat' : 'Draft'}
                  </span>
                </div>

                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm leading-tight truncate mb-1" title={deviz.clients?.nume}>
                    {deviz.clients?.nume}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                    <Car className="w-3.5 h-3.5" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{deviz.vehicles?.numar_inmatriculare}</span>
                    <span>&bull;</span>
                    <span className="truncate">{deviz.vehicles?.marca} {deviz.vehicles?.model}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/50 mt-1">
                  <span className="text-[10px] text-gray-500 uppercase font-medium">Total Deviz</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {(deviz.total_deviz || 0).toFixed(2)} <span className="text-[10px] font-normal text-gray-500">RON</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/devize/${deviz.id}`}
                    className="flex-1 flex justify-center items-center gap-1.5 p-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors"
                  >
                    <FileText size={16} /> Vezi
                  </Link>
                  <Link
                    href={`/devize/${deviz.id}/edit`}
                    className="flex-1 flex justify-center items-center gap-1.5 p-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors"
                  >
                    <Edit size={16} /> Editează
                  </Link>
                  <div className="pl-1 flex-shrink-0">
                    <DeleteDevizButton devizId={deviz.id} series={deviz.series} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
              <span className="text-sm block">Nu s-au găsit devize înregistrate.</span>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              Pagina {page} din {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/devize?page=${Math.max(1, page - 1)}${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                Anterior
              </Link>
              <Link
                href={`/devize?page=${Math.min(totalPages, page + 1)}${search ? `&search=${search}` : ''}`}
                className={`px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}
              >
                Următor
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
