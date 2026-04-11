import { QuoteData } from '../types';
import { brandingConfig } from '../config/branding';
import { incrementSeries, getCurrentSeries } from './seriesManager';

// Import html2pdf.js
declare const html2pdf: any;

export const generateWebDeviz = (data: QuoteData): string => {
  // Calculate totals
  const totalPiese = data.parts.reduce((total, part) =>
    total + Math.max(0, (part.pret || 0) * (part.bucati || 1) - (part.discount || 0)), 0);
  const totalManopera = data.labor.reduce((total, lab) =>
    total + Math.max(0, (lab.pret || 0) - (lab.discount || 0)), 0);
  const totalGeneral = totalPiese + totalManopera;

  // Helper function to format dates from yyyy-mm-dd to dd-mm-yyyy
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-';
    
    try {
      // Parse the date string (assuming it's in yyyy-mm-dd format from HTML date input)
      const [year, month, day] = dateString.split('-');
      
      // If it's in yyyy-mm-dd format, convert to dd-mm-yyyy
      if (day && month && year && year.length === 4 && month.length === 2 && day.length === 2) {
        const formattedDate = `${day}-${month}-${year}`;
        console.log(`Converting date: ${dateString} -> ${formattedDate}`);
        return formattedDate;
      }
      
      // If it's in yy-mm-dd format, convert to dd-mm-yyyy
      if (day && month && year && year.length === 2) {
        const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
        const formattedDate = `${day}-${month}-${fullYear}`;
        console.log(`Converting date: ${dateString} -> ${formattedDate}`);
        return formattedDate;
      }
      
      console.log(`Date not formatted: ${dateString}`);
      return dateString;
    } catch (error) {
      console.log(`Error formatting date: ${dateString}`, error);
      return dateString || '-';
    }
  };
  const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
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
        
        /* Ensure table headers repeat on new pages */
        thead { display: table-header-group; }
        tbody { display: table-row-group; }
        
        /* Balanced compact spacing for better page usage */
        .compact-section { margin-bottom: 6px; }
        .compact-table { margin-bottom: 8px; }
        .compact-spacing { margin-bottom: 4px; }
        
        /* Reasonable minimum height for sections */
        .min-height-section { min-height: 20px; }
        
        /* Balanced table styling for PDF compatibility */
        table { border-collapse: collapse; width: 100%; }
        th, td { padding: 3px 4px; text-align: left; }
        th { background-color: #f9fafb; font-weight: 600; }
        
        /* Reasonable spacing between sections */
        .section-break { margin-top: 4px; }
        
        /* Balanced compact text sizes */
        .text-xs-compact { font-size: 0.65rem; line-height: 1.15; }
        .text-sm-compact { font-size: 0.75rem; line-height: 1.25; }
        .text-base-compact { font-size: 0.85rem; line-height: 1.3; }

        /* Moderate compact table styles */
        .compact-table {
            margin-bottom: 0.5rem;
        }
        
        td, th { 
            padding: 2px 4px !important;
            font-size: 0.65rem !important;
            line-height: 1.1 !important;
            height: 25px !important;
        }

        /* Standard table borders */
        td, th {
            border-width: 0.5px !important;
        }

        /* Balanced table header */
        .table-header {
            margin-bottom: 0.25rem !important;
            font-size: 0.7rem !important;
            padding-bottom: 0.25rem !important;
            border-bottom-width: 1px !important;
            line-height: 1.1 !important;
            height: auto !important;
        }

        /* Balanced table rows */
        .table-row {
            line-height: 1.1 !important;
            height: auto !important;
        }

        /* Balanced tables */
        table {
            border-spacing: 0 !important;
            border-collapse: collapse !important;
        }

        tr {
            height: auto !important;
            max-height: none !important;
        }

        /* Balanced totals section */
        .totals-section {
            padding: 0.5rem !important;
            margin-bottom: 0.75rem !important;
        }

        .totals-section .space-y-2 > * + * {
            margin-top: 0.25rem !important;
        }

        .totals-section .text-lg {
            font-size: 0.85rem !important;
            line-height: 1.2 !important;
        }

        /* Moderate spacing adjustments */
        .mb-1 { margin-bottom: 0.15rem !important; }
        .mb-2 { margin-bottom: 0.4rem !important; }
        .mb-3 { margin-bottom: 0.6rem !important; }
        .mb-4 { margin-bottom: 0.8rem !important; }
        .mt-2 { margin-top: 0.4rem !important; }
        .mt-4 { margin-top: 0.8rem !important; }
        .pt-2 { padding-top: 0.4rem !important; }
        .pt-4 { padding-top: 0.8rem !important; }
        .p-2 { padding: 0.4rem !important; }
        .p-3 { padding: 0.6rem !important; }
        .p-4 { padding: 0.8rem !important; }
        .pb-0\.5 { padding-bottom: 0.1rem !important; }
        .space-y-0\.5 > * + * { margin-top: 0.1rem !important; }
        .space-y-1 > * + * { margin-top: 0.15rem !important; }
        .space-y-2 > * + * { margin-top: 0.25rem !important; }
        .gap-4 { gap: 0.75rem !important; }
    </style>

    
</head>
        <body class="font-roboto text-gray-800 !text-gray-800 bg-white">
    <div class="max-w-[180mm] mx-auto bg-white p-3">
        <!-- Header Section with Logo -->
        <div class="flex flex-row items-center justify-between text-black mb-2 avoid-break">
            <div className="flex items-start">
                <h1 class="text-sm font-bold text-gray-800 !text-gray-800">Deviz Auto</h1>
            <h2 class="text-xs font-medium text-gray-500 !text-gray-500">Seria: #${data.series || '------'}</h2>
            </div>
            <img src="${brandingConfig.visual.logo.uri}" alt="${brandingConfig.visual.logo.alt}" style="height: 35px"/>
        </div>
        
        <!-- Company and Client Info Section -->
        <div class="flex justify-between items-start mb-3 gap-4 avoid-break">
            <div class="flex-1 max-w-[45%]">
                                 <div class="mb-2">
                                 
                                 <h1 class="text-base font-bold text-gray-800 !text-gray-800 border-b-2 pb-1 mb-1 w-full" style="border-color: ${brandingConfig.visual.colors.primary}">${brandingConfig.pdf.headerTitle}</h1>
            <div class="text-xs-compact text-gray-600 !text-gray-600 space-y-0.5">
                         <div class="font-semibold">${brandingConfig.company.name}</div>
                         <div>Comuna Gottlob, Jud. Timiș</div>
                         <div>${brandingConfig.company.email}</div>
                         <div>${brandingConfig.company.phone}</div>
                     </div>
                 </div>
            </div>
            
                         <div class="flex-1 max-w-[45%]">
                 <h2 class="text-base font-bold text-gray-800 !text-gray-800 mb-1 border-b-2 pb-1 w-full" style="border-color: ${brandingConfig.visual.colors.primary}">INFORMAȚII CLIENT</h2>
                <div class="text-xs-compact space-y-0.5">
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Nume:</span>
                        <span class="text-gray-800 !text-gray-800">${data.clientInfo.nume || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">CUI/CNP:</span>
                        <span class="text-gray-800 !text-gray-800">${data.clientInfo.cuiCnp || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Locație:</span>
                        <span class="text-gray-800 !text-gray-800">${data.clientInfo.locatie || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Strada:</span>
                        <span class="text-gray-800 !text-gray-800">${data.clientInfo.strada || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Telefon:</span>
                        <span class="text-gray-800 !text-gray-800">${data.clientInfo.numarTelefon || '-'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Constatare and Vehicle Info Section -->
        <div class="grid grid-cols-2 gap-14 mb-3 avoid-break">
                         <div class="space-y-1">
                 <h3 class="text-base font-bold text-gray-800 !text-gray-800 border-b-2 pb-1 w-full" style="border-color: ${brandingConfig.visual.colors.primary}">CONSTATARE</h3>
                <div class="text-xs-compact space-y-0.5">
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Motivul intrării:</span>
                        <span class="text-gray-800 !text-gray-800 flex-1">${data.clientInfo.motivIntrare || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Observații:</span>
                        <span class="text-gray-800 !text-gray-800 flex-1">${data.clientInfo.observatii || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Data intrării:</span>
                        <span class="text-gray-800 !text-gray-800">${formatDate(data.clientInfo.dataIntrare)}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Data ieșirii:</span>
                        <span class="text-gray-800 !text-gray-800">${formatDate(data.clientInfo.dataIesire)}</span>
                    </div>
                </div>
            </div>
            
                         <div class="space-y-1">
                 <h3 class="text-base font-bold text-gray-800 !text-gray-800 border-b-2 pb-1 w-full" style="border-color: ${brandingConfig.visual.colors.primary}">INFORMAȚII AUTOVEHICUL</h3>
                <div class="text-xs-compact space-y-0.5">
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Marcă:</span>
                        <span class="text-gray-800 !text-gray-800">${data.vehicleInfo.marca || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Model:</span>
                        <span class="text-gray-800 !text-gray-800">${data.vehicleInfo.model || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Nr. înmat.:</span>
                        <span class="text-gray-800 !text-gray-800">${data.vehicleInfo.numarInmatriculare || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Serie șasiu:</span>
                        <span class="text-gray-800 !text-gray-800">${data.vehicleInfo.seriaSasiu || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Nivel carburant:</span>
                        <span class="text-gray-800 !text-gray-800">${data.vehicleInfo.nivelCarburant ? `${data.vehicleInfo.nivelCarburant}%` : '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Cap. cilindrică:</span>
                        <span class="text-gray-800 !text-gray-800">${data.vehicleInfo.capacitateCilindrica || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">An fabricație:</span>
                        <span class="text-gray-800 !text-gray-800">${data.vehicleInfo.anFabricatie || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Km:</span>
                        <span class="text-gray-800 !text-gray-800">${data.vehicleInfo.km || '-'}</span>
                    </div>
                    <div class="flex">
                        <span class="font-semibold text-gray-600 !text-gray-600 w-20">Culoare:</span>
                        <span class="text-gray-800 !text-gray-800">${data.vehicleInfo.culoare || '-'}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Parts Table -->
        <div class="compact-table">
            <h3 class="text-base font-bold text-gray-800 !text-gray-800 mb-1 table-header">PIESE</h3>
            <div class="w-full h-0.5 mb-1" style="background-color: ${brandingConfig.visual.colors.primary}"></div>
            <div class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-300 text-xs-compact">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Cod Piesă</th>
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Nume Piesă</th>
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Bucăți</th>
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Stare</th>
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Preț</th>
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Discount</th>
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Preț Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.parts.map((part, index) => `
                            <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} table-row">
                                <td class="border border-gray-300 px-2 py-1 !text-gray-900">${part.codPiesa || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 !text-gray-900">${part.numePiesa || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-center !text-gray-900">${part.bucati || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 !text-gray-900">${part.stare || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right !text-gray-900">${part.pret ? part.pret.toFixed(2) : '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right !text-gray-900">${part.discount ? part.discount.toFixed(2) : '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right font-semibold !text-gray-900">${((part.pret || 0) * (part.bucati || 1) - (part.discount || 0)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Labor Table -->
        <div class="compact-table">
            <h3 class="text-base font-bold text-gray-800 !text-gray-800 mb-1 table-header">MANOPERĂ</h3>
            <div class="w-full h-0.5 mb-1" style="background-color: ${brandingConfig.visual.colors.primary}"></div>
            <div class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-300 text-xs-compact">
                    <thead>
                        <tr class="bg-gray-50">
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Manoperă</th>
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Durată</th>
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Preț</th>
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Discount</th>
                            <th class="border border-gray-300 px-2 py-1 text-left font-semibold text-gray-700 !text-gray-700">Preț Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.labor.map((lab, index) => `
                            <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} table-row">
                                <td class="border border-gray-300 px-2 py-1 !text-gray-900">${lab.manopera || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-center !text-gray-900">${lab.durata || '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right !text-gray-900">${lab.pret ? lab.pret.toFixed(2) : '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right !text-gray-900">${lab.discount ? lab.discount.toFixed(2) : '-'}</td>
                                <td class="border border-gray-300 px-2 py-1 text-right font-semibold !text-gray-900">${((lab.pret || 0) - (lab.discount || 0)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Totals Section -->
        <div class="mb-3 bg-gray-50 p-3 rounded-none border border-gray-200 totals-section">
            <div class="space-y-2 text-sm-compact">
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-700 !text-gray-700">Total Piese:</span>
                    <span class="font-bold text-gray-800 !text-gray-800">${totalPiese.toFixed(2)} RON</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-700 !text-gray-700 mb-2">Total Manoperă:</span>
                    <span class="font-bold text-gray-800 !text-gray-800">${totalManopera.toFixed(2)} RON</span>
                </div>
                                 <div class="flex justify-between items-center border-t-2 pt-2" style="border-color: ${brandingConfig.visual.colors.primary}">
                     <span class="font-bold text-lg text-gray-800 !text-gray-800">TOTAL GENERAL:</span>
                     <span class="font-bold text-lg" style="color: ${brandingConfig.visual.colors.primary}">${totalGeneral.toFixed(2)} RON</span>
                </div>
            </div>
        </div>
        
        <!-- Signatures -->
        <div class="flex justify-between items-start mt-4 pt-4 border-t-2 border-gray-300 signatures-section">
            <div class="flex-1 text-center">
                <div class="font-semibold text-sm-compact text-gray-700 !text-gray-700 mb-2">Semnătura Client</div>
                <div class="border-b-2 border-gray-400 h-8 mb-2"></div>
                <div class="text-xs-compact text-gray-600 !text-gray-600">${data.clientInfo.nume || '_________________'}</div>
            </div>
            <div class="flex-1 text-center">
                <div class="font-semibold text-sm-compact text-gray-700 !text-gray-700 mb-2">Semnătura Service</div>
                <div class="border-b-2 border-gray-400 h-8 mb-2"></div>
                <div class="text-xs-compact text-gray-600 !text-gray-600">CDA AUTO</div>
            </div>
        </div>
        
        <!-- Certificate Section -->
        <div class="mt-4 pt-4 border-t-2 border-gray-300 certificate-section">
            <h3 class="text-base font-bold text-center text-gray-800 !text-gray-800 mb-3">CERTIFICAT DE CALITATE ȘI GARANȚIE</h3>
            <div class="text-xs-compact text-gray-700 !text-gray-700 leading-relaxed text-justify space-y-2">
                <p>În conformitate cu prevederile OUG 140/2021 și Legii 296/2004, unitatea noastră garantează lucrările executate și/sau piesele montate, după cum urmează:</p>
                
                <div class="space-y-1">
                    <p>• 3 luni pentru manoperă, de la data recepției vehiculului, dacă lucrarea efectuată nu a necesitat înlocuiri de piese sau s-a efectuat cu piesele clientului, conform pct. 5.5.5 din RNTR-9 (anexa 4 din O.M.T.C.T.2131/2005);</p>
                    
                    <p>• Pentru piesele furnizate de client unitatea noastră nu acordă garanție;</p>
                    
                    <p>• 0 luni de la data recepției vehiculului, pentru piesele aprovizionate de societatea noastră și manopera aferentă, numai dacă garanția oferită de producătorii pieselor, conform certificatelor de garanție furnizate, nu specifică alte condiții (în aceste situații perioada de garanție este egală cu cea indicată de către aceștia);</p>
                    
                    <p>• Garanția este condiționată de respectarea cerințelor privind exploatarea corectă (utilizarea corespunzătoare, parcurgerea unui număr limitat de kilometri, etc).</p>
                </div>
                
                <p class="mt-3">Drepturile consumatorului detaliate în O.G.21/1992 nu sunt afectate de garanția oferită de unitatea noastră.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  return html;
};

export const generatePDFFromWeb = async (data: QuoteData, skipIncrement: boolean = false): Promise<void> => {
  try {
    // Get the current series number without incrementing
    const series = getCurrentSeries();
    
    // Update the data with the current series
    const dataWithSeries = {
      ...data,
      series
    };
    
    // Dynamically import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    const html = generateWebDeviz(dataWithSeries);
    
    // Create a temporary div to hold the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    
    // Configure html2pdf options with better page break handling
    const opt = {
      filename: `${brandingConfig.pdf.filename}_${series}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break',
        avoid: '.avoid-break',
        after: '.section-break'
      }
    };
    
    // Generate PDF
    await html2pdf().set(opt).from(tempDiv).save();
    
    // Clean up
    document.body.removeChild(tempDiv);
    
    // Only increment the series after successful PDF generation if not editing
    if (!skipIncrement) {
      incrementSeries();
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to print method
    const html = generateWebDeviz(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
}; 