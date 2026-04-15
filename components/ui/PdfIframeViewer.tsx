"use client";

import { useState } from "react";
import { PdfLoader } from "./PdfLoader";

interface PdfIframeViewerProps {
  src: string;
  title?: string;
  className?: string;
  loaderLabel?: string;
}

/**
 * Wraps a PDF <iframe> with a PdfLoader overlay that disappears once the
 * iframe fires its onLoad event (i.e. the PDF has been received from the
 * backend and rendered by the browser).
 */
export function PdfIframeViewer({
  src,
  title = "Previzualizare PDF",
  className = "w-full h-full border-0",
  loaderLabel = "Se încarcă PDF-ul...",
}: PdfIframeViewerProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <PdfLoader variant="overlay" label={loaderLabel} />
      )}
      <iframe
        src={src}
        title={title}
        className={className}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
