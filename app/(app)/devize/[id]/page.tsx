import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { PdfButton } from "@/components/deviz/PdfButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { CopyLinkButton } from "@/components/deviz/CopyLinkButton";
import { SendSmsButton } from "@/components/deviz/SendSmsButton";
import { PdfIframeViewer } from "@/components/ui/PdfIframeViewer";

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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Nav row */}
      <div className="flex items-center gap-2">
        <Link
          href="/devize"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Devize</span>
        </Link>
        <span className="text-slate-300 dark:text-slate-600">/</span>
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Deviz #{deviz.series}</span>
        <Link
          href={`/devize/${id}/edit`}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <Edit className="w-3 md:w-3.5 h-3 md:h-3.5" />
          <span>Editează</span>
        </Link>
      </div>

      <PageHeader 
        title={`Deviz #${deviz.series}`}
        description="Previzualizare și descărcare deviz în format PDF"
        action={
          <div className="flex items-center gap-2 mt-4 sm:mt-0 flex-wrap">
            {deviz.status === 'Asteapta Semnatura Client' && deviz.public_token && (
              <>
                <SendSmsButton
                  devizId={id}
                  path={`/semneaza/${deviz.public_token}`}
                  phone={deviz.clients?.telefon || ""}
                  clientName={deviz.clients?.nume || ""}
                  devizSeries={deviz.series || ""}
                  smsSentCount={deviz.sms_sent_count || 0}
                />
                <CopyLinkButton path={`/semneaza/${deviz.public_token}`} />
              </>
            )}
            <PdfButton deviz={deviz} />
          </div>
        }
      />

      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden h-[70vh] md:h-[1050px]">
        <PdfIframeViewer
          src={`/api/deviz/${id}/pdf`}
          title={`Deviz ${deviz.series}`}
          className="w-full h-full border-0"
          loaderLabel="Se generează PDF-ul..."
        />
      </div>
    </div>
  );
}