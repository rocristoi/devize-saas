import { EditDevizForm } from "@/components/deviz/EditDevizForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditDevizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: deviz, error } = await supabase
    .from('devize')
    .select(`
      *,
      clients (*),
      vehicles (*),
      deviz_parts (*),
      deviz_labor (*)
    `)
    .eq('id', id)
    .single();

  if (error || !deviz) {
    notFound();
  }

  const initialData = {
    client: {
      nume: deviz.clients?.nume || "",
      cuiCnp: deviz.clients?.cui_cnp || "",
      locatie: deviz.clients?.locatie || "",
      strada: deviz.clients?.strada || "",
      numarTelefon: deviz.clients?.telefon || "",
      dataIntrare: deviz.data_intrare ? new Date(deviz.data_intrare).toISOString().split('T')[0] : "",
      dataIesire: deviz.data_iesire ? new Date(deviz.data_iesire).toISOString().split('T')[0] : "",
      motivIntrare: deviz.motiv_intrare || "",
      observatii: deviz.observatii || "",
    },
    vehicle: {
      marca: deviz.vehicles?.marca || "",
      model: deviz.vehicles?.model || "",
      numarInmatriculare: deviz.vehicles?.numar_inmatriculare || "",
      seriaSasiu: deviz.vehicles?.seria_sasiu || "",
      anFabricatie: deviz.vehicles?.an_fabricatie || "",
      culoare: "",
      capacitateCilindrica: deviz.vehicles?.capacitate_cilindrica || "",
      km: deviz.km_intrare || "",
      nivelCarburant: deviz.nivel_carburant || "",
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parts: (deviz.deviz_parts || []).map((p: any) => ({
      ...p,
      stare: p.stare || "Nou",
      cantitate: p.cantitate || 1,
      pret_unitar: p.pret_unitar || 0,
      discount_percentage: p.discount_percentage || "",
      total: p.total || 0,
      cod_piesa: p.cod_piesa || "",
      nume_piesa: p.nume_piesa || "",
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labor: (deviz.deviz_labor || []).map((l: any) => ({
      ...l,
      operatiune: l.operatiune || "",
      durata: l.durata || 1,
      pret_orar: l.pret_orar || 0,
      discount_percentage: l.discount_percentage || "",
      total: l.total || 0,
    })),
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader 
        title={`Editează Deviz #${deviz.series}`}
        description="Modifică detaliile și actualizează devizul."
      />
      
      <EditDevizForm devizId={id} initialData={initialData} />
    </div>
  );
}
