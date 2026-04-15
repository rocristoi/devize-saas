import { format } from "date-fns";
import { ro } from "date-fns/locale";

// Make sure to define the interfaces based on what Supabase returns
export const generateWebDeviz = (deviz: any): string => {
  // Safe parsing dates
  const formatDateSafe = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: ro });
    } catch {
      return dateString;
    }
  };

  const client = deviz.clients || {};
  const vehicle = deviz.vehicles || {};
  const parts = deviz.deviz_parts || [];
  const labor = deviz.deviz_labor || [];
  const company = deviz.companies || {
    service_name: 'Deviz Auto',
    address: 'Adresă generică',
    cui_cif: '-',
    reg_com: '-',
    email: '-',
    phone: '-',
    primary_color: '#EF4444',
    logo_url: null,
    pdf_header_title: 'Deviz Reparație'
  };

        const getPrimaryColor = () => {
            if (!company?.primary_color) return '#3b82f6';
            if (company.primary_color.startsWith('rgb') || company.primary_color.startsWith('hsl')) return company.primary_color;
            return company.primary_color.startsWith('#') ? company.primary_color : `#${company.primary_color}`;
        };
        const primaryColor = getPrimaryColor();
  
  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            content: ["./**/*.{html,js}"],
            theme: {
                extend: {
                    fontFamily: {
                        'roboto': ['Roboto', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
    <style>
        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
            .table-header { page-break-inside: avoid; }
            .table-row { page-break-inside: avoid; }
            .section-break { page-break-before: auto; page-break-after: auto; }
            .totals-section { page-break-inside: avoid; }
            .signatures-section { page-break-inside: avoid; }
            .certificate-section { page-break-inside: avoid; }
            
            /* Ensure tables break properly */
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tbody { display: table-row-group; }
            
            /* Balanced compact spacing for print */
            .compact-section { margin-bottom: 6px; }
            .compact-table { margin-bottom: 8px; }
            .compact-spacing { margin-bottom: 4px; }
        }
        
        /* Elements specifically for PDF styling */
        body { font-family: 'Roboto', sans-serif; background: white; color: #1f2937; }
        
        /* Balanced minimum height for sections */
        .min-height-section { min-height: 20px; }
        
        /* Balanced table styling for PDF compatibility */
        table { border-collapse: collapse; width: 100%; border-spacing: 0 !important; }
        th, td { padding: 3px 4px !important; text-align: left; font-size: 0.65rem !important; line-height: 1.1 !important; height: 25px !important; border-width: 0.5px !important; }
        th { background-color: #f9fafb; font-weight: 600; }
        
        tr { height: auto !important; max-height: none !important; }
        
        /* Balanced compact text sizes */
        .text-xs-compact { font-size: 0.65rem; line-height: 1.15; }
        .text-sm-compact { font-size: 0.75rem; line-height: 1.25; }
        .text-base-compact { font-size: 0.85rem; line-height: 1.3; }

        /* Moderate compact table styles */
        .compact-table { margin-bottom: 0.5rem; }
        .table-header { margin-bottom: 0.25rem !important; font-size: 0.7rem !important; padding-bottom: 0.25rem !important; border-bottom-width: 1px !important; line-height: 1.1 !important; }

        /* Balanced totals section */
        .totals-section { padding: 0.5rem !important; margin-bottom: 0.75rem !important; }
        .totals-section .space-y-2 > * + * { margin-top: 0.25rem !important; }
        .totals-section .text-lg { font-size: 0.85rem !important; line-height: 1.2 !important; }
    </style>
</head>
<body class="font-roboto text-gray-800 !text-gray-800 bg-white">
    <div class="max-w-[180mm] mx-auto bg-white p-3">
        <!-- Header Section with Logo -->
        <div class="flex flex-row items-center justify-between text-black mb-2 avoid-break">
            <div class="flex items-start flex-col">
                <h1 class="text-sm font-bold text-gray-800 !text-gray-800">Deviz Auto</h1>
                <h2 class="text-xs font-medium text-gray-500 !text-gray-500">Referință: #${deviz.series || '------'}</h2>
            </div>
            ${company.logo_url ? `<img src="${company.logo_url}" alt="${company.service_name}" style="height: 25px; max-width: 120px; object-fit: contain;"/>` : `<div style="font-weight:bold; font-size:18px;">${company.service_name}</div>`}
        </div>
        
        <!-- Company and Client Info Section -->
        <div class="flex justify-between items-start mb-3 gap-4 avoid-break">
            <div class="flex-1 max-w-[45%]">
                <div class="mb-2">
                    <h1 class="text-base font-bold text-gray-800 !text-gray-800 border-b-2 pb-1 mb-1 w-full" style="border-color: ${primaryColor}">${company.pdf_header_title || 'DEVIZ REPARAȚIE'}</h1>
                    <div class="text-xs-compact text-gray-600 !text-gray-600 space-y-0.5">
                        <div class="font-semibold">${company.service_name}</div>
                        <div>${company.address}</div>
                        <div>CUI/CIF: ${company.cui_cif} | Reg. Com.: ${company.reg_com || '-'}</div>
                        <div>Tel: ${company.phone || '-'} | Email: ${company.email || '-'}</div>
                    </div>
                </div>
            </div>
            
            <div class="flex-1 max-w-[45%]">
                <h2 class="text-base font-bold text-gray-800 !text-gray-800 mb-1 border-b-2 pb-1 w-full" style="border-color: ${primaryColor}">INFORMAȚII CLIENT</h2>
                <div class="text-xs-compact space-y-0.5">
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Nume/Ales:</span>
                        <span class="text-gray-800 !text-gray-800">${client.nume || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">CUI/CNP:</span>
                        <span class="text-gray-800 !text-gray-800">${client.cui_cnp || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Adresă:</span>
                        <span class="text-gray-800 !text-gray-800">${client.strada || ''} ${client.locatie || ''}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Telefon:</span>
                        <span class="text-gray-800 !text-gray-800">${client.telefon || '-'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Constatare and Vehicle Info Section -->
        <div class="grid grid-cols-2 gap-14 mb-3 avoid-break">
            <div class="space-y-1">
                <h3 class="text-base font-bold text-gray-800 !text-gray-800 border-b-2 pb-1 w-full" style="border-color: ${primaryColor}">CONSTATARE</h3>
                <div class="text-xs-compact space-y-0.5">
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Motiv intrare:</span>
                        <span class="text-gray-800 !text-gray-800 flex-1">${deviz.motiv_intrare || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Observații:</span>
                        <span class="text-gray-800 !text-gray-800 flex-1">${deviz.observatii || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Dată intrare:</span>
                        <span class="text-gray-800 !text-gray-800">${formatDateSafe(deviz.data_intrare)}</span>
                    </div>
                    ${deviz.data_iesire ? `
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Dată ieșire:</span>
                        <span class="text-gray-800 !text-gray-800">${formatDateSafe(deviz.data_iesire)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="space-y-1">
                <h3 class="text-base font-bold text-gray-800 !text-gray-800 border-b-2 pb-1 w-full" style="border-color: ${primaryColor}">INFORMAȚII AUTOVEHICUL</h3>
                <div class="text-xs-compact space-y-0.5">
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Marcă/Model:</span>
                        <span class="text-gray-800 !text-gray-800">${vehicle.marca || '-'} ${vehicle.model || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Nr. înmat.:</span>
                        <span class="text-gray-800 !text-gray-800">${vehicle.numar_inmatriculare || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Serie șasiu:</span>
                        <span class="text-gray-800 !text-gray-800">${vehicle.seria_sasiu || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Nivel carburant:</span>
                        <span class="text-gray-800 !text-gray-800">${deviz.nivel_carburant ? `${deviz.nivel_carburant}` : '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Cap. cil./An:</span>
                        <span class="text-gray-800 !text-gray-800">${vehicle.capacitate_cilindrica || '-'} cm³ / ${vehicle.an_fabricatie || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Km:</span>
                        <span class="text-gray-800 !text-gray-800">${deviz.km_intrare || '-'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Parts Table -->
        ${parts.length > 0 ? `
        <div class="compact-table">
            <h3 class="text-base font-bold text-gray-800 !text-gray-800 mb-1 table-header">PIESE ȘI MATERIALE</h3>
            <div class="w-full h-0.5 mb-1" style="background-color: ${primaryColor}"></div>
            <div class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-300 text-xs-compact">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="border border-gray-300 px-2 py-1">Cod Piesă</th>
                            <th class="border border-gray-300 px-2 py-1">Nume Piesă</th>
                            <th class="border border-gray-300 px-2 py-1 text-center">Cant.</th>
                            <th class="border border-gray-300 px-2 py-1 text-right">Preț Unitar</th>
                            <th class="border border-gray-300 px-2 py-1 text-right">Discount</th>
                            <th class="border border-gray-300 px-2 py-1 text-right">Preț Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parts.map((part: any, index: number) => `
                            <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} table-row">
                                <td class="border border-gray-300 px-2 py-1 !text-gray-900">${part.cod_piesa || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 !text-gray-900">${part.nume_piesa || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-center !text-gray-900">${part.cantitate || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right !text-gray-900">${(part.pret_unitar || 0).toFixed(2)}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right !text-gray-900">${part.discount_percentage ? part.discount_percentage.toFixed(2) : '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right font-semibold !text-gray-900">${(part.total || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}
        
        <!-- Labor Table -->
        ${labor.length > 0 ? `
        <div class="compact-table">
            <h3 class="text-base font-bold text-gray-800 !text-gray-800 mb-1 table-header">MANOPERĂ</h3>
            <div class="w-full h-0.5 mb-1" style="background-color: ${primaryColor}"></div>
            <div class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-300 text-xs-compact">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="border border-gray-300 px-2 py-1">Operațiune</th>
                            <th class="border border-gray-300 px-2 py-1 text-center">Durată (ore)</th>
                            <th class="border border-gray-300 px-2 py-1 text-right">Tarif Orar</th>
                            <th class="border border-gray-300 px-2 py-1 text-right">Discount</th>
                            <th class="border border-gray-300 px-2 py-1 text-right">Preț Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${labor.map((lab: any, index: number) => `
                            <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} table-row">
                                <td class="border border-gray-300 px-2 py-1 !text-gray-900">${lab.operatiune || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-center !text-gray-900">${lab.durata || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right !text-gray-900">${(lab.pret_orar || 0).toFixed(2)}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right !text-gray-900">${lab.discount_percentage ? lab.discount_percentage.toFixed(2) : '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right font-semibold !text-gray-900">${(lab.total || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}
        
        <!-- Totals Section -->
        <div class="mb-3 bg-gray-50 p-3 rounded-lg border border-gray-200 totals-section">
            <div class="space-y-2 text-sm-compact">
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-700 !text-gray-700">Total Piese:</span>
                    <span class="font-bold text-gray-800 !text-gray-800">${(deviz.total_piese || 0).toFixed(2)} RON</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-700 !text-gray-700 mb-2">Total Manoperă:</span>
                    <span class="font-bold text-gray-800 !text-gray-800">${(deviz.total_manopera || 0).toFixed(2)} RON</span>
                </div>
                <div class="flex justify-between items-center border-t-2 pt-2" style="border-color: ${primaryColor}">
                 <span class="font-bold text-lg text-gray-800 !text-gray-800">TOTAL GENERAL:</span>
                 <span class="font-bold text-lg" style="color: ${primaryColor}">${(deviz.total_deviz || 0).toFixed(2)} RON</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Signatures -->
    <div class="flex justify-between items-end mt-4 pt-4 border-t-2 border-gray-300 signatures-section space-x-12">
        <div class="flex-1 flex flex-col items-center">
            <div class="font-semibold text-sm-compact text-gray-700 !text-gray-700 mb-2">Semnătura Client</div>
            ${deviz.client_signature_url 
              ? `<div class="h-16 flex items-center justify-center mb-1"><img src="${deviz.client_signature_url}" class="max-h-full max-w-[150px] object-contain" alt="Client Signature" /></div><div class="border-b border-gray-300 w-full mb-1"></div>` 
              : `<div class="border-b-2 border-gray-400 w-32 h-12 mb-2"></div>`
            }
            <div class="text-xs-compact text-gray-600 !text-gray-600">${client.nume || '_________________'}</div>
        </div>
        <div class="flex-1 flex flex-col items-center">
            <div class="font-semibold text-sm-compact text-gray-700 !text-gray-700 mb-2">Semnătura Service</div>
            ${deviz.auto_shop_signature_url 
              ? `<div class="h-16 flex items-center justify-center mb-1"><img src="${deviz.auto_shop_signature_url}" class="max-h-full max-w-[150px] object-contain" alt="Shop Signature" /></div><div class="border-b border-gray-300 w-full mb-1"></div>` 
              : `<div class="border-b-2 border-gray-400 w-32 h-12 mb-2"></div>`
            }
            <div class="text-xs-compact text-gray-600 !text-gray-600">${company.service_name}</div>
        </div>
    </div>
    
    <!-- Certificate Section -->
    <div class="mt-4 pt-4 border-t-2 border-gray-300 certificate-section text-justify">
        <h3 class="text-base font-bold text-center text-gray-800 !text-gray-800 mb-3">CERTIFICAT DE CALITATE ȘI GARANȚIE</h3>
        <div class="text-xs-compact text-gray-700 !text-gray-700 leading-relaxed space-y-2">
            <p>În conformitate cu prevederile OUG 140/2021 și Legii 296/2004, unitatea noastră garantează lucrările executate și/sau piesele montate, după cum urmează:</p>
            <div class="space-y-1">
                <p>• 3 luni pentru manoperă, de la data recepției vehiculului.</p>
                <p>• Pentru piesele furnizate de client unitatea noastră nu acordă garanție.</p>
                <p>• Garanția se acordă respectând limitele și specificațiile de exploatare corectă a autovehiculului.</p>
            </div>
            <p class="mt-3">Drepturile consumatorului detaliate în O.G.21/1992 nu sunt afectate de garanția oferită de unitatea noastră.</p>
        </div>
    </div>
</body>
</html>
  `;

  return html;
};
