import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_PAYLOAD_BYTES = 500_000; // 500 KB raw request body
const MAX_DECODED_BYTES = 300_000; // 300 KB decoded PNG
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

export async function POST(req: NextRequest) {
  try {
    // Enforce payload size before reading body into memory
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload prea mare" }, { status: 413 });
    }

    const { token, signature_data } = await req.json();

    if (!token || !signature_data) {
      return NextResponse.json({ error: "Lipsă token sau date semnătură" }, { status: 400 });
    }

    const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!dbKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY missing");
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

    // Decode base64 and validate it is actually a PNG by magic bytes
    const base64Data = signature_data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_DECODED_BYTES) {
      return NextResponse.json({ error: "Imaginea semnăturii este prea mare" }, { status: 413 });
    }
    if (!buffer.slice(0, 4).equals(PNG_MAGIC)) {
      return NextResponse.json({ error: "Format imagine invalid" }, { status: 400 });
    }

    const fileName = `client_${deviz.id}_${Date.now()}.png`;

    const { error: uploadErr } = await adminSupabase.storage
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

  } catch {
    return NextResponse.json({ error: "Eroare internă server" }, { status: 500 });
  }
}