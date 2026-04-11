import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PdfButton } from "@/components/deviz/PdfButton";
import { generateWebDeviz } from "@/lib/pdfGenerator";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function DevizPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: deviz, error } = await supabase
    .from('devize')
    .select(`
      *,
      clients (*),
      vehicles (*),
      deviz_parts (*),
      deviz_labor (*),
      companies(service_name, primary_color, logo_url, address, cui_cif, reg_com, email, phone, pdf_header_title, pdf_filename)
    `)
    .eq('id', id)
    .single();

  if (error || !deviz) {
    notFound();
  }

  const htmlPreview = generateWebDeviz(deviz);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title={`Deviz #${deviz.series}`}
        description="Previzualizare și descărcare deviz în format PDF"
        action={
          <div className="flex items-center gap-3">
            <Link href="/devize" className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>Înapoi la Listă</span>
            </Link>
            <PdfButton deviz={deviz} />
          </div>
        }
      />

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <iframe 
          className="w-full min-h-[1050px] border-0 bg-white"
          srcDoc={htmlPreview}
          title={`Deviz ${deviz.series}`}
        />
      </div>
    </div>
  );
}
