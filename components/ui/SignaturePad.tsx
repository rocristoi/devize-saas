"use client";

import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  onSave?: (signatureDataUrl: string) => void;
  onChange?: (signatureDataUrl: string | null) => void;
  onClear?: () => void;
  initialSignatureUrl?: string | null;
  hideSaveButton?: boolean;
}

export function SignaturePad({ onSave, onChange, onClear, initialSignatureUrl, hideSaveButton = false }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 220 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 220
        });
      }
    };

    // Timeout-ul scurt asigura incarcarea corecta a width-ului de catre render engine
    setTimeout(updateDimensions, 10);
    
    // Recalculeaza doar daca se redimensioneaza ecranul
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const clear = () => {
    sigCanvas.current?.clear();
    setHasSaved(false);
    if (onClear) onClear();
    if (onChange) onChange(null);
  };

  const handleEnd = () => {
    if (!sigCanvas.current?.isEmpty()) {
      const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");
      if (dataUrl && onChange) {
        onChange(dataUrl);
      }
    }
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");
    if (dataUrl) {
      if (onSave) onSave(dataUrl);
      setHasSaved(true);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {initialSignatureUrl && !hasSaved ? (
        <div className="rounded-xl mb-4 bg-gray-50 flex flex-col items-center p-6 border border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Semnătura actuală</p>
          <img src={initialSignatureUrl} alt="Signature" className="max-h-24 opacity-80 mix-blend-multiply object-contain" />
        </div>
      ) : null}
      
      <div className="relative group">
        <div ref={containerRef} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all min-h-[220px]">
          {dimensions.width > 0 && (
            <SignatureCanvas 
              ref={sigCanvas} 
              onEnd={handleEnd}
              canvasProps={{
                width: dimensions.width,
                height: dimensions.height,
                className: "signature-canvas cursor-crosshair"
              }} 
            />
          )}
        </div>
        
        {/* Actions overlay / footer */}
        <div className="flex items-center justify-between mt-3 px-1">
          <button 
            type="button" 
            className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors px-2 py-1" 
            onClick={clear}
          >
            Sterge semnatura
          </button>
          
          {!hideSaveButton && (
            <button 
              type="button" 
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium shadow-sm" 
              onClick={save}
            >
              Salvează
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
