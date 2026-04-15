"use client";

import { Printer } from "lucide-react";
import { useState } from "react";
import { generateWebDeviz } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import { PdfLoader } from "@/components/ui/PdfLoader";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deviz: any;
}

export function PdfButton({ deviz }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePdf = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const html = generateWebDeviz(deviz);
      const filename = `${deviz.companies?.pdf_filename || 'Deviz'}_${deviz.series || deviz.id || 'Nou'}.pdf`;

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html, filename }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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
      className="relative flex items-center justify-center gap-1.5 md:gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm rounded-lg font-medium shadow-sm border border-blue-500/30 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden transition-all"
    >
      {isGenerating ? (
        <PdfLoader variant="button" label="Se generează..." />
      ) : (
        <>
          <Printer className="w-4 h-4 shrink-0" />
          <span>Descarcă PDF</span>
        </>
      )}
    </button>
  );
}
