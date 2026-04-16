"use server";

import { createClient } from "@/lib/supabase/server";
import { ClientInfo, VehicleInfo, DevizPart, DevizLabor } from "@/types/deviz";

export async function saveDeviz(data: {
  client: ClientInfo;
  vehicle: VehicleInfo;
  parts: DevizPart[];
  labor: DevizLabor[];
  totals: { parts: number; labor: number; total: number };
  status?: string;
  auto_shop_signature_url?: string;
  client_signature_url?: string;
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

  let finalShopSignatureUrl = data.auto_shop_signature_url;
  
  if (!finalShopSignatureUrl && (data.status === 'Semnat Service' || data.status === 'Asteapta Semnatura Client')) {
    const { data: company } = await supabase
      .from('companies')
      .select('signature_url')
      .eq('id', companyId)
      .single();
    if (company && company.signature_url) {
      finalShopSignatureUrl = company.signature_url;
    }
  }

  try {
    // 3. Upsert Client (simplified: match by nume & numarTelefon)
    // First, let's see if client exists
    let clientId;
    const { data: existingClient } = await supabase
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
    const { data: existingVehicle } = await supabase
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
    // Atomic counter increment to prevent race conditions under concurrent load
    const { data: counterData, error: counterErr } = await supabase
      .rpc('increment_series_counter', { company_id_arg: companyId });

    if (counterErr) throw counterErr;

    const nextCounter = counterData as number;

    const generatedSeries = String(nextCounter).padStart(6, '0');

    const { data: devizRecord, error: devizErr } = await supabase
      .from('devize')
      .insert({
        company_id: companyId,
        client_id: clientId,
        vehicle_id: vehicleId,
        series: generatedSeries,
        is_finalizat: data.status ? data.status !== 'Draft' : true,
        data_intrare: data.client.dataIntrare || new Date().toISOString(),
        data_iesire: data.client.dataIesire || null,
        motiv_intrare: data.client.motivIntrare,
        observatii: data.client.observatii,
        km_intrare: (data.vehicle.km || '').toString(),
        nivel_carburant: data.vehicle.nivelCarburant || '',
        total_piese: data.totals?.parts || 0,
        total_manopera: data.totals?.labor || 0,
        total_deviz: data.totals?.total || 0,
        ...(data.status && { status: data.status }),
        ...(finalShopSignatureUrl && { auto_shop_signature_url: finalShopSignatureUrl }),
        sms_sent_count: 0
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
        cantitate: p.cantitate === '' ? 0 : Number(p.cantitate),
        pret_unitar: p.pret_unitar === '' ? 0 : Number(p.pret_unitar),
        discount_percentage: p.discount_percentage === '' ? 0 : Number(p.discount_percentage),
        total: p.total || 0
      }));
      const { error: partsErr } = await supabase.from('deviz_parts').insert(partsPayload);
      if (partsErr) throw partsErr;
    }

    // 7. Save Labor
    if (data.labor.length > 0) {
      const laborPayload = data.labor.map(l => ({
        deviz_id: devizId,
        operatiune: l.operatiune,
        durata: l.durata ? l.durata.toString() : '',
        pret_orar: l.pret_orar === '' ? 0 : Number(l.pret_orar),
        discount_percentage: l.discount_percentage === '' ? 0 : Number(l.discount_percentage),
        total: l.total || 0
      }));
      const { error: laborErr } = await supabase.from('deviz_labor').insert(laborPayload);
      if (laborErr) throw laborErr;
    }

    return { success: true, devizId };

  } catch (error: unknown) {
    console.error("Save Deviz Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteDeviz(devizId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('devize').delete().eq('id', devizId);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Delete Deviz Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
export async function updateDeviz(devizId: string, data: {
  client: ClientInfo;
  vehicle: VehicleInfo;
  parts: DevizPart[];
  labor: DevizLabor[];
  totals: { parts: number; labor: number; total: number };
  status?: string;
  auto_shop_signature_url?: string;
  client_signature_url?: string;
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

  let finalShopSignatureUrl = data.auto_shop_signature_url;
  
  if (!finalShopSignatureUrl && (data.status === 'Semnat Service' || data.status === 'Asteapta Semnatura Client')) {
    const { data: company } = await supabase
      .from('companies')
      .select('signature_url')
      .eq('id', companyId)
      .single();
    if (company && company.signature_url) {
      finalShopSignatureUrl = company.signature_url;
    }
  }

  try {
    let clientId;
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('company_id', companyId)
      .eq('nume', data.client.nume)
      .eq('telefon', data.client.numarTelefon)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
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

    let vehicleId;
    const { data: existingVehicle } = await supabase
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

    const { error: devizErr } = await supabase
      .from('devize')
      .update({
        client_id: clientId,
        vehicle_id: vehicleId,
        data_intrare: data.client.dataIntrare || new Date().toISOString(),
        data_iesire: data.client.dataIesire || null,
        motiv_intrare: data.client.motivIntrare,
        observatii: data.client.observatii,
        km_intrare: (data.vehicle.km || '').toString(),
        nivel_carburant: data.vehicle.nivelCarburant || '',
        total_piese: data.totals?.parts || 0,
        total_manopera: data.totals?.labor || 0,
        total_deviz: data.totals?.total || 0,
        ...(data.status && { status: data.status }),
        ...(finalShopSignatureUrl && { auto_shop_signature_url: finalShopSignatureUrl }),
        client_signature_url: null,
        sms_sent_count: 0, // Reset SMS count when edited
        ...(data.status && { is_finalizat: data.status !== 'Draft' })
      })
      .eq('id', devizId)
      .eq('company_id', companyId);

    if (devizErr) throw devizErr;

    // Delete existing parts and labor
    await supabase.from('deviz_parts').delete().eq('deviz_id', devizId);
    await supabase.from('deviz_labor').delete().eq('deviz_id', devizId);

    // Save Parts
    if (data.parts.length > 0) {
      const partsPayload = data.parts.map(p => ({
        deviz_id: devizId,
        cod_piesa: p.cod_piesa,
        nume_piesa: p.nume_piesa,
        cantitate: p.cantitate === '' ? 0 : Number(p.cantitate),
        pret_unitar: p.pret_unitar === '' ? 0 : Number(p.pret_unitar),
        discount_percentage: p.discount_percentage === '' ? 0 : Number(p.discount_percentage),
        total: p.total || 0
      }));
      const { error: partsErr } = await supabase.from('deviz_parts').insert(partsPayload);
      if (partsErr) throw partsErr;
    }

    // Save Labor
    if (data.labor.length > 0) {
      const laborPayload = data.labor.map(l => ({
        deviz_id: devizId,
        operatiune: l.operatiune,
        durata: l.durata ? l.durata.toString() : '',
        pret_orar: l.pret_orar === '' ? 0 : Number(l.pret_orar),
        discount_percentage: l.discount_percentage === '' ? 0 : Number(l.discount_percentage),
        total: l.total || 0
      }));
      const { error: laborErr } = await supabase.from('deviz_labor').insert(laborPayload);
      if (laborErr) throw laborErr;
    }

    return { success: true, devizId };

  } catch (error: unknown) {
    console.error("Update Deviz Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
