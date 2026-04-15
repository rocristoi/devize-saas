import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // Need service role to bypass RLS!

export async function POST(req: Request) {
  try {
    const { token, signature_data, devizId } = await req.json();

    if (!token || !signature_data) {
      return NextResponse.json({ error: "Lipsă token sau date semnătură" }, { status: 400 });
    }

    // Create a Supabase admin client to bypass RLS for public token access
    const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // use service role!

    // If no service role, we can use anon, but only if we add an RLS policy for anonymous updates by token
    if (!dbKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY missing - required for anonymous deviz signing");
        return NextResponse.json({ error: "Eroare de configurare server" }, { status: 500 });
    }
    
    const adminSupabase = createClient(dbUrl, dbKey);

    const { data: deviz, error: fetchErr } = await adminSupabase
      .from('devize')
      .select('id, status')
      .eq('public_token', token)
      .single();

    if (fetchErr || !deviz) {
      return NextResponse.json({ error: "Deviz invalid sau inexistent" }, { status: 404 });
    }

    if (deviz.status === 'Finalizat') {
      return NextResponse.json({ error: "Devizul este deja finalizat" }, { status: 400 });
    }

    // Decode base64 to buffer
    const base64Data = signature_data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    const fileName = `client_${deviz.id}_${Date.now()}.png`;

    const { data: uploadData, error: uploadErr } = await adminSupabase.storage
      .from('signatures')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      return NextResponse.json({ error: "Eroare la salvarea fișierului de semnătură" }, { status: 500 });
    }

    const { data: publicUrlData } = adminSupabase.storage
      .from('signatures')
      .getPublicUrl(fileName);

    const finalSignatureUrl = publicUrlData.publicUrl;

    const { error: updateErr } = await adminSupabase
      .from('devize')
      .update({
        client_signature_url: finalSignatureUrl,
        status: 'Finalizat',
        is_finalizat: true
      })
      .eq('id', deviz.id);

    if (updateErr) {
      return NextResponse.json({ error: "Eroare la actualizarea devizului" }, { status: 500 });
    }

    // PDF generation? If it's done dynamically on route `/api/generate-pdf`, we don't need to rebuild a file here,
    // just changing state enables PDF stamping.
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}