import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWebDeviz } from "@/lib/pdfGenerator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: deviz, error } = await supabase
      .from("devize")
      .select(
        `
        *,
        clients (*),
        vehicles (*),
        deviz_parts (*),
        deviz_labor (*),
        companies(service_name, primary_color, logo_url, address, cui_cif, reg_com, email, phone, pdf_header_title, pdf_filename)
      `
      )
      .eq("id", id)
      .single();

    if (error || !deviz) {
      return new NextResponse("Deviz not found", { status: 404 });
    }

    const html = generateWebDeviz(deviz);
    const rawFilename = `${deviz.companies?.pdf_filename || "Deviz"}_${
      deviz.series || deviz.id || "Nou"
    }.pdf`;
    const filename = rawFilename.replace(/[^\w\-. ]/g, "_").substring(0, 100);

    const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || "http://localhost:3001";
    const PDF_SERVICE_SECRET = process.env.PDF_SERVICE_SECRET;
    if (!PDF_SERVICE_SECRET) {
      console.error("PDF_SERVICE_SECRET is not set");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    const response = await fetch(`${PDF_SERVICE_URL}/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pdf-service-secret": PDF_SERVICE_SECRET,
      },
      body: JSON.stringify({ html, filename }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PDF service error:", errorText);
      return new NextResponse("Failed to generate PDF", { status: response.status });
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // inline disposition so it previews in browser
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF via GET route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
