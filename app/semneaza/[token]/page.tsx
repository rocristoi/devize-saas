import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import ClientSignatureForm from "./ClientSignatureForm";
import { PdfIframeViewer } from "@/components/ui/PdfIframeViewer";

export default async function SemneazaDevizPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  // Use service role to bypass RLS for public link
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  
  const { data: deviz, error } = await supabase
    .from('devize')
    .select(`
      *,
      companies (
        service_name,
        logo_url
      ),
      clients (*),
      vehicles (*)
    `)
    .eq('public_token', token)
    .single();

  if (error || !deviz) {
    notFound();
  }

  if (deviz.client_signature_url || deviz.status === 'Finalizat') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 py-8 md:py-12 text-gray-900 font-sans">
          <div className="max-w-[1200px] mx-auto">
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                      {deviz.companies?.logo_url && (
                          <img src={deviz.companies.logo_url} alt="Logo Service" className="h-8 mb-4 object-contain" />
                      )}
                      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                          Deviz #{deviz.series}
                      </h1>
                      <p className="text-gray-500 mt-1">{deviz.companies?.service_name}</p>
                  </div>
                  <a 
                      href={`/api/deviz/public-pdf?token=${token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl transition-all shadow-sm text-sm font-medium"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Descarcă PDF
                  </a>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4 flex flex-col gap-6">
                      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                          </div>
                          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Document Semnat</h2>
                          <p className="text-gray-500 leading-relaxed text-sm">
                              Acest deviz a fost semnat și finalizat cu succes. Găsiți previzualizarea PDF completă alăturat.
                          </p>
                      </div>
                      
                      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Sumar Deviz</h2>
                          <div className="space-y-6">
                              <div>
                                  <p className="text-sm text-gray-500 mb-1">Client</p>
                                  <p className="font-medium text-gray-900">{deviz.clients?.nume}</p>
                              </div>
                              <div>
                                  <p className="text-sm text-gray-500 mb-1">Vehicul</p>
                                  <p className="font-medium text-gray-900">{deviz.vehicles?.marca} {deviz.vehicles?.model}</p>
                              </div>
                              <div className="pt-6 border-t border-gray-100">
                                  <p className="text-sm text-gray-500 mb-1">Total de plată</p>
                                  <p className="text-3xl font-semibold text-gray-900">{deviz.total_deviz} <span className="text-lg text-gray-500 font-normal">RON</span></p>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[70vh] lg:h-auto min-h-[600px] flex flex-col">
                      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center">
                          <div className="ml-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Document Finalizat</div>
                      </div>
                      <div className="flex-1 bg-gray-100/50 p-4 lg:p-8">
                          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white">
                              <PdfIframeViewer
                                  src={`/api/deviz/public-pdf?token=${token}#toolbar=0&view=FitH`}
                                  title="Previzualizare PDF"
                                  className="w-full h-full border-0"
                                  loaderLabel="Se încarcă documentul semnat..."
                              />
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 py-8 md:py-12 text-gray-900 font-sans">
        <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {deviz.companies?.logo_url && (
                        <img src={deviz.companies.logo_url} alt="Logo Service" className="h-8 mb-4 object-contain" />
                    )}
                    <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                        Deviz #{deviz.series}
                    </h1>
                    <p className="text-gray-500 mt-1">{deviz.companies?.service_name}</p>
                </div>
                <a 
                    href={`/api/deviz/public-pdf?token=${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl transition-all shadow-sm text-sm font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descarcă PDF
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left side: Information and Signature Form */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Sumar Deviz</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Client</p>
                                <p className="font-medium text-gray-900">{deviz.clients?.nume}</p>
                            </div>
                            
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Vehicul</p>
                                <p className="font-medium text-gray-900">{deviz.vehicles?.marca} {deviz.vehicles?.model}</p>
                                <p className="text-sm text-gray-500 mt-0.5">{deviz.vehicles?.numar_inmatriculare}</p>
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Total de plată</p>
                                <p className="text-3xl font-semibold text-gray-900">{deviz.total_deviz} <span className="text-lg text-gray-500 font-normal">RON</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Semnătură</h2>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Prin semnătura de mai jos confirmați acceptarea costurilor și a datelor din documentul alăturat.
                        </p>
                        <ClientSignatureForm devizId={deviz.id} token={token} />
                    </div>
                </div>

                {/* Right side: PDF Preview */}
                <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[70vh] lg:h-auto min-h-[600px] flex flex-col">
                    <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center">
                        <div className="ml-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Previzualizare Document</div>
                    </div>
                    <div className="flex-1 bg-gray-100/50 p-4 lg:p-8">
                        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white">
                            <PdfIframeViewer
                                src={`/api/deviz/public-pdf?token=${token}#toolbar=0&view=FitH`}
                                title="Previzualizare PDF"
                                className="w-full h-full border-0"
                                loaderLabel="Se încarcă previzualizarea..."
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}