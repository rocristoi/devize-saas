import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateWebDeviz } from "@/lib/pdfGenerator";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new NextResponse("Token is missing", { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseKey) {
      return new NextResponse("Server configuration error", { status: 500 });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    const { data: deviz, error } = await adminSupabase
      .from("devize")
      .select(`
        *,
        clients (*),
        vehicles (*),
        deviz_parts (*),
        deviz_labor (*),
        companies(service_name, primary_color, logo_url, address, cui_cif, reg_com, email, phone, pdf_header_title, pdf_filename)
      `)
      .eq("public_token", token)
      .single();

    if (error || !deviz) {
      return new NextResponse("Deviz not found or invalid token", { status: 404 });
    }

    const html = generateWebDeviz(deviz);
    const rawFilename = `${deviz.companies?.pdf_filename || "Deviz"}_${deviz.series || deviz.id}_Preview.pdf`;
    const filename = rawFilename.replace(/[^\w\-. ]/g, "_").substring(0, 100);

    const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || "http://localhost:3001";

    const response = await fetch(`${PDF_SERVICE_URL}/generate-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, filename }),
    });

    if (!response.ok) {
      return new NextResponse("Failed to generate PDF", { status: response.status });
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
