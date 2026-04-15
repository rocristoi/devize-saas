"use client";
import { Link2, Check } from "lucide-react";
import { useState, useEffect } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
  }, [path]);

  const handleCopy = async () => {
    if (url) {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          console.error('Fallback copy failed', error);
        }
        textArea.remove();
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center justify-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm font-medium text-white rounded-lg transition-all shadow-sm border whitespace-nowrap ${
        copied
          ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border-emerald-500/30'
          : 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 border-violet-500/30'
      }`}
      title="Trimite acest link clientului pentru a obține semnătura sa și a finaliza devizul."
    >
      {copied ? <Check className="w-4 h-4 shrink-0" /> : <Link2 className="w-4 h-4 shrink-0" />}
      <span>{copied ? 'Copiat!' : 'Link Semnătură'}</span>
    </button>
  );
}