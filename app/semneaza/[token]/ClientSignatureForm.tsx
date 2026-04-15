"use client";

import { useState } from "react";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ClientSignatureForm({ devizId, token }: { devizId: string, token: string }) {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleFinalize = async () => {
    if (!signatureData) {
      toast.error("Vă rugăm să semnați înainte de a trimite.");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch("/api/deviz/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signature_data: signatureData, devizId })
      });

      if (!res.ok) {
        toast.error("A apărut o eroare la finalizarea devizului.");
      } else {
        toast.success("Semnătura a fost salvată cu succes!");
        window.location.reload();
      }

    } catch (err) {
      toast.error("Eroare neașteptată.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 mt-2">
      <SignaturePad
        onChange={setSignatureData}
        onClear={() => setSignatureData(null)}
        hideSaveButton={true}
      />

      <button
        onClick={handleFinalize}
        disabled={saving || !signatureData}
        className="w-full flex justify-center items-center py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl text-[15px] font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Se procesează...' : 'Semnează Documentul'}
      </button>
    </div>
  );
}