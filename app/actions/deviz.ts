"use server";

import { createClient } from "@/lib/supabase/server";
import { ClientInfo, VehicleInfo, DevizPart, DevizLabor } from "@/types/deviz";

export async function saveDeviz(data: {
  client: ClientInfo;
  vehicle: VehicleInfo;
  parts: DevizPart[];
  labor: DevizLabor[];
  totals: { parts: number; labor: number; total: number };
}) {
  const supabase = await createClient();
  
  // 1. Get authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { success: false, error: "Not authenticated" };
  
  // 2. Get user profile and company
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .single();

  if (!profile || !profile.company_id) {
    return { success: false, error: "Company profile not found" };
  }

  const companyId = profile.company_id;

  try {
    // 3. Upsert Client (simplified: match by nume & numarTelefon)
    // First, let's see if client exists
    let clientId;
    let { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('company_id', companyId)
      .eq('nume', data.client.nume)
      .eq('telefon', data.client.numarTelefon)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
      // Update logic could be here, but we'll stick to simple use for now
    } else {
      const { data: newClient, error: clientErr } = await supabase
        .from('clients')
        .insert({
          company_id: companyId,
          nume: data.client.nume,
          cui_cnp: data.client.cuiCnp,
          telefon: data.client.numarTelefon,
          locatie: data.client.locatie,
          strada: data.client.strada
        })
        .select('id')
        .single();

      if (clientErr) throw clientErr;
      clientId = newClient.id;
    }

    // 4. Upsert Vehicle 
    let vehicleId;
    let { data: existingVehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('company_id', companyId)
      .eq('numar_inmatriculare', data.vehicle.numarInmatriculare)
      .maybeSingle();

    if (existingVehicle) {
      vehicleId = existingVehicle.id;
    } else {
      const { data: newVehicle, error: vehicleErr } = await supabase
        .from('vehicles')
        .insert({
          company_id: companyId,
          client_id: clientId,
          numar_inmatriculare: data.vehicle.numarInmatriculare,
          marca: data.vehicle.marca,
          model: data.vehicle.model,
          seria_sasiu: data.vehicle.seriaSasiu,
          an_fabricatie: data.vehicle.anFabricatie || null,
          capacitate_cilindrica: data.vehicle.capacitateCilindrica || null
        })
        .select('id')
        .single();
        
      if (vehicleErr) throw vehicleErr;
      vehicleId = newVehicle.id;
    }

    // 5. Create Deviz record
    // Logic to increment series should technically be atomic, using a random serie for simplcity if not implemented
    const curDate = new Date();
    const fallbackSeries = `DVZ-${curDate.getFullYear()}-${Math.floor(Math.random() * 10000)}`;

    const { data: devizRecord, error: devizErr } = await supabase
      .from('devize')
      .insert({
        company_id: companyId,
        client_id: clientId,
        vehicle_id: vehicleId,
        series: fallbackSeries,
        is_finalizat: false,
        data_intrare: data.client.dataIntrare || new Date().toISOString(),
        motiv_intrare: data.client.motivIntrare,
        observatii: data.client.observatii,
        km_intrare: (data.vehicle.km || '').toString(),
        nivel_carburant: data.vehicle.nivelCarburant || '',
        total_piese: data.totals.parts,
        total_manopera: data.totals.labor,
        total_deviz: data.totals.total
      })
      .select('id')
      .single();

    if (devizErr) throw devizErr;
    const devizId = devizRecord.id;

    // 6. Save Parts
    if (data.parts.length > 0) {
      const partsPayload = data.parts.map(p => ({
        deviz_id: devizId,
        cod_piesa: p.cod_piesa,
        nume_piesa: p.nume_piesa,
        cantitate: p.cantitate,
        pret_unitar: p.pret_unitar,
        discount_percentage: p.discount_percentage,
        total: p.total
      }));
      const { error: partsErr } = await supabase.from('deviz_parts').insert(partsPayload);
      if (partsErr) throw partsErr;
    }

    // 7. Save Labor
    if (data.labor.length > 0) {
      const laborPayload = data.labor.map(l => ({
        deviz_id: devizId,
        operatiune: l.operatiune,
        durata: l.durata,
        pret_orar: l.pret_orar,
        discount_percentage: l.discount_percentage,
        total: l.total
      }));
      const { error: laborErr } = await supabase.from('deviz_labor').insert(laborPayload);
      if (laborErr) throw laborErr;
    }

    return { success: true, devizId };

  } catch (error: any) {
    console.error("Save Deviz Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteDeviz(devizId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('devize').delete().eq('id', devizId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error("Delete Deviz Error:", error);
    return { success: false, error: error.message };
  }
}
