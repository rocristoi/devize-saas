"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
  className?: string;
}

export function SubmitButton({ label, loadingLabel, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={className}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingLabel ?? label}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
