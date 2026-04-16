import { Suspense } from "react";
import { PartsTable } from "@/components/parts/PartsTable";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/queries";

export default async function PiesePage() {
  const supabase = await createClient();
  const profile = await getUserProfile();
  
  if (!profile) return null;

  // Pre-fetch some data or let the client do it. Let's do server fetch for initial load.
  const { data: parts } = await supabase
    .from('parts_inventory')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('nume_piesa', { ascending: true });

  return (
    <div className="w-full pb-12">
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Se încarcă piesele...</div>}>
        <PartsTable initialParts={parts || []} companyId={profile.company_id} />
      </Suspense>
    </div>
  );
}
