import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import Link from "next/link";
import { Search, Eye, FileText, Plus, Car } from "lucide-react";
import { DeleteDevizButton } from "@/components/deviz/DeleteDevizButton";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function DevizeHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const search = params?.search || "";

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
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (search) {
    // Basic search functionality - can be expanded
    // PostgreSQL ILIKE search on series
    query = query.ilike("series", `%${search}%`);
  }

  const { data: devize, error } = await query;

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    finalizat:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader 
        title="Istoric Devize" 
        description="Vizualizează, editează și gestionează devizele emise."
        action={
          <Link
            href="/devize/nou"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Caută după nr. deviz..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
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
                      {deviz.series}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {deviz.clients?.nume}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
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
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/devize/${deviz.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors"
                          title="Vezi deviz"
                        >
                          <FileText size={18} />
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
      </div>
    </div>
  );
}
