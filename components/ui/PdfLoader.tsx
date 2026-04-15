"use client";

/**
 * PdfLoader – reusable animated overlay shown while a PDF is being
 * generated or an iframe is still loading.
 *
 * Usage variants:
 *  1. <PdfLoader variant="overlay" /> – absolute-positioned overlay that
 *     covers the parent container (use parent with `relative`).
 *  2. <PdfLoader variant="inline" /> – centred block in its own box,
 *     suitable for empty-state placeholders inside an iframe wrapper.
 *  3. <PdfLoader variant="button" /> – small inline spinner for buttons.
 */

interface PdfLoaderProps {
  variant?: "overlay" | "inline" | "button";
  label?: string;
}
import { LineWobble } from 'ldrs/react'
import 'ldrs/react/LineWobble.css'



export function PdfLoader({
  variant = "overlay",
  label = "Se generează PDF...",
}: PdfLoaderProps) {
  if (variant === "button") {
    return (
      <span className="flex items-center gap-2">
        {label}
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-400 dark:text-gray-500">
        <LineWobble
          size="80"
          stroke="5"
          bgOpacity="0.1"
          speed="1.75"
          color="black"
        />
        <p className="text-sm font-medium tracking-wide">{label}</p>
      </div>
    );
  }

  // overlay (default)
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Animated document icon */}
            <LineWobble
            size="80"
            stroke="5"
            bgOpacity="0.1"
            speed="1.75"
            color="black" 
            />
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {label}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Acest proces poate dura câteva secunde...
          </p>
        </div>


      </div>
);
}

// ---------------------------------------------------------------------------
// Small internal spinner used across variants
// ---------------------------------------------------------------------------
function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-[3px]",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full border-blue-200 border-t-blue-500 animate-spin flex-shrink-0`}
      role="status"
      aria-label="Se încarcă..."
    />
  );
}
