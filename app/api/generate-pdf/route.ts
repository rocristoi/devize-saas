import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { html, filename } = await req.json();

    if (!html) {
      return NextResponse.json({ error: "Missing HTML content" }, { status: 400 });
    }

    // Sanitize filename to prevent Content-Disposition header injection
    const safeFilename = (filename ?? "document.pdf")
      .replace(/[^\w\-. ]/g, "_")
      .substring(0, 100);

    // Call the external Node.js PDF service
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
      body: JSON.stringify({ html, filename: safeFilename }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PDF service error:", errorText);
      return NextResponse.json({ error: "PDF Generation failed" }, { status: response.status });
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF in Next.js:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
