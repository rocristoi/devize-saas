"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Camera, CheckCircle, Loader2, XCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import { ThemeProvider } from "next-themes"; // Sau daca aveti alta librarie, o puneti aici; nu strica.
import Image from "next/image";

const supabase = createClient();

export default function MobileUploadPage() {
  const { sessionId } = useParams();
  const [status, setStatus] = useState<"loading" | "ready" | "uploading" | "success" | "error" | "expired">("loading");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function checkSession() {
      if (!sessionId) {
        setStatus("error");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("upload_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (error || !data) {
          console.error("[upload] session fetch error:", error);
          setStatus("error");
          return;
        }

        if (data.status === "completed") {
          setStatus("success");
        } else if (new Date(data.expires_at).getTime() < Date.now()) {
          setStatus("expired");
        } else {
          setStatus("ready");
        }
      } catch (err) {
        console.error("[upload] unexpected error:", err);
        setStatus("error");
      }
    }

    checkSession();
  }, [sessionId]);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${sessionId}_${Math.random()}.${fileExt}`;
      const filePath = `scans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("talon-pics")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("talon-pics").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("upload_sessions")
        .update({ status: "completed", image_url: publicUrl })
        .eq("id", sessionId);

      if (updateError) throw updateError;

      setStatus("success");
      toast.success("Poza a fost încărcată!");
    } catch (err) {
      console.error(err);
      setStatus("error");
      toast.error("A apărut o eroare la încărcare.");
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Toaster position="top-center" />
        
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center border border-gray-100 dark:border-gray-700">
          <div className="mb-6 flex justify-center">
            {status === "loading" && <Loader2 className="w-16 h-16 animate-spin text-blue-500" />}
            {status === "uploading" && <Loader2 className="w-16 h-16 animate-spin text-blue-500" />}
            {status === "ready" && <Image src="/talon.jpg" alt="Talon" width={250} height={100} style={{ width: "auto", height: "auto" }} priority />}
            {status === "success" && <CheckCircle className="w-16 h-16 text-green-500" />}
            {(status === "error" || status === "expired") && <XCircle className="w-16 h-16 text-red-500" />}
          </div>

          <h1 className="text-2xl font-bold mb-2">Scanare Talon</h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-sm leading-relaxed">
            {status === "loading" && "Se verifică sesiunea..."}
            {status === "ready" && "Apasă butonul de mai jos pentru a face o poză la talonul auto."}
            {status === "uploading" && "Te rugăm să aștepți. Poza este analizată și încărcată..."}
            {status === "success" && "Fotografia a fost trimisă cu succes la calculator! Poți închide această pagină."}
            {status === "expired" && "Această sesiune a expirat. Te rugăm să generezi un cod QR nou de pe calculator."}
            {status === "error" && "Link invalid, expirat sau eroare server. Revino și generează alt cod QR."}
          </p>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleCapture}
            className="hidden"
          />

          {status === "ready" && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold shadow-md transition-all text-lg"
            >
              <Camera className="w-5 h-5" />
              Deschide Camera
            </button>
          )}

          {status === "error" && (
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-xl font-semibold shadow-sm transition-all"
            >
              Reîncearcă pagina
            </button>
          )}
          
          {status === "success" && (
            <button
              disabled
              className="w-full py-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-medium opacity-80"
            >
              Gata de procesare
            </button>
          )}
        </div>
        
        <p className="mt-8 text-xs text-gray-400 font-medium">
           Devize Auto Koders
        </p>
      </div>
    </ThemeProvider>
  );
}
