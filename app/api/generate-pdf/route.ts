import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { html, filename } = await req.json();

    if (!html) {
      return NextResponse.json({ error: "Missing HTML content" }, { status: 400 });
    }

    // Call the external Node.js PDF service
    const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || "http://localhost:3001";
    
    const response = await fetch(`${PDF_SERVICE_URL}/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html, filename }),
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
        "Content-Disposition": `attachment; filename="${filename || "document.pdf"}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF in Next.js:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
