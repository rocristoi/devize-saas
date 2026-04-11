"use client";

import { Printer } from "lucide-react";
import { useState } from "react";
import { generateWebDeviz } from "@/lib/pdfGenerator";
import { toast } from "sonner";

interface Props {
  deviz: any;
}

export function PdfButton({ deviz }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePdf = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // Import html2pdf dynamically so we don't break SSR
      const html2pdf = (await import('html2pdf.js')).default;
      const html = generateWebDeviz(deviz);
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      document.body.appendChild(tempDiv);
      
      const opt = {
        filename: `${deviz.companies?.pdf_filename || 'Deviz'}_${deviz.numar_referinta}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
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
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break',
          avoid: '.avoid-break',
          after: '.section-break'
        }
      };
      
      await html2pdf().set(opt).from(tempDiv).save();
      document.body.removeChild(tempDiv);

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("A apărut o problemă la generarea PDF-ului. Vedeți consola pentru detalii.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={handleGeneratePdf}
      disabled={isGenerating}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition font-medium shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/20 disabled:opacity-50"
    >
      <Printer className="w-5 h-5" />
      {isGenerating ? "Se generează..." : "Descarcă PDF"}
    </button>
  );
}
