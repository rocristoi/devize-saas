"use client";

import { MessageSquare, Check, X, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { sendSmsFormAction } from "@/app/actions/sms";
import { Modal } from "@/components/ui/Modal";

interface SendSmsButtonProps {
  devizId: string;
  path: string;
  phone: string;
  clientName: string;
  devizSeries: string;
  smsSentCount?: number;
}

export function SendSmsButton({ devizId, path, phone, clientName, devizSeries, smsSentCount = 0 }: SendSmsButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    smsSentCount > 0 ? "success" : "idle"
  );
  const [url, setUrl] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({ visible: false, message: "" });

  const showSnackbar = (message: string) => {
    setSnackbar({ visible: true, message });
    setTimeout(() => setSnackbar({ visible: false, message: "" }), 5000);
  };

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  const handleSendTrigger = () => {
    if (!url || !phone) {
      setIsAlertOpen(true);
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSend = async () => {
    setIsConfirmOpen(false);
    setStatus("loading");
    
    const message = `Salut ${clientName}, devizul #${devizSeries} poate fi semnat online aici: ${url}`;

    try {
      const result = await sendSmsFormAction(devizId, phone, message);
      if (result?.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        showSnackbar(result?.error || "Eroare la trimitere.");
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      showSnackbar("Eroare de rețea.");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  if (!phone) return null;

  return (
    <>
    <div className="relative">
      <button
        onClick={handleSendTrigger}
        disabled={status === "loading" || status === "success"}
        className={`flex items-center justify-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm text-white rounded-lg transition-all font-medium shadow-sm border whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${
          status === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border-emerald-500/30' :
          status === 'error' ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 border-red-500/30' :
          'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 border-indigo-500/30'
        }`}
        title={smsSentCount > 0 ? "SMS deja trimis. Editați devizul pentru a retrimite." : "Trimite link-ul de semnare prin SMS clientului."}
      >
        {status === "loading" ? (
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
        ) : status === "success" ? (
          <Check className="w-4 h-4 shrink-0" />
        ) : status === "error" ? (
          <X className="w-4 h-4 shrink-0" />
        ) : (
          <MessageSquare className="w-4 h-4 shrink-0" />
        )}
        <span>
          {status === "loading" ? "Se trimite..." : 
           status === "success" ? "SMS Trimis!" : 
           status === "error" ? "Eroare" : 
           "Trimite SMS"}
        </span>
      </button>

      <Modal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        title="Date incomplete"
        className="max-w-md"
      >
        <div className="space-y-4 pt-4">
          <p className="text-gray-600 dark:text-gray-300">
            Lipșeste numărul de telefon sau link-ul pentru aprobare. Vă rugăm să completați datele necesare înainte de a trimite un SMS.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setIsAlertOpen(false)}
              className="px-4 py-2 font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            >
              Am înțeles
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Confirmare trimitere"
        className="max-w-md"
      >
        <div className="space-y-4 pt-4">
          <p className="text-gray-600 dark:text-gray-300">
            Sunteți sigur că doriți să trimiteți un SMS către <strong>{phone}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setIsConfirmOpen(false)}
              className="px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition"
            >
              Anulează
            </button>
            <button
              onClick={handleSend}
              className="px-4 py-2 font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            >
              Trimite
            </button>
          </div>
        </div>
      </Modal>
    </div>

    {snackbar.visible && createPortal(
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-red-600 text-white text-sm rounded-xl shadow-lg animate-fade-in max-w-sm w-max">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{snackbar.message}</span>
        <button
          onClick={() => setSnackbar({ visible: false, message: "" })}
          className="ml-2 hover:opacity-75 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>,
      document.body
    )}
    </>
  );
}
