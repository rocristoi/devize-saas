"use client";

import { ClientInfo } from "@/types/deviz";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  clientInfo: ClientInfo;
  onChange: (field: keyof ClientInfo, value: string) => void;
  onSetClient: (client: Partial<ClientInfo>) => void;
}

export function ClientInfoForm({ clientInfo, onChange, onSetClient }: Props) {
  const supabase = createClient();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeField, setActiveField] = useState<"nume" | "telefon" | null>(null);

  useEffect(() => {
    const searchClient = async () => {
      if (!activeField) return;

      const searchTerm = activeField === "nume" ? clientInfo.nume : clientInfo.numarTelefon;
      if (searchTerm.length < 3) {
        setSuggestions([]);
        return;
      }

      // Simplistic search in current company's clients
      const { data } = await supabase
        .from('clients')
        .select('*')
        .ilike(activeField === "nume" ? 'nume' : 'telefon', `%${searchTerm}%`)
        .limit(5);

      if (data && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    };

    const timeout = setTimeout(searchClient, 400);
    return () => clearTimeout(timeout);
  }, [clientInfo.nume, clientInfo.numarTelefon, activeField, supabase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(e.target.name as keyof ClientInfo, e.target.value);
  };

  const handleSelectClient = (client: any) => {
    onSetClient({
      nume: client.nume || "",
      cuiCnp: client.cui_cnp || "",
      numarTelefon: client.telefon || "",
      locatie: client.locatie || "",
      strada: client.strada || "",
    });
    setShowSuggestions(false);
    setActiveField(null);
  };


  return (
    <div className="card-container">
      <h3 className="text-gray-900 dark:text-gray-100 mb-4 text-lg font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">
        Informații Client
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <label className="form-label">
            Nume client *
          </label>
          <input
            type="text"
            name="nume"
            value={clientInfo.nume}
            onChange={handleChange}
            onFocus={() => setActiveField("nume")}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            required
            autoComplete="off"
            className="form-input"
          />
          {showSuggestions && activeField === "nume" && suggestions.length > 0 && (
             <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md mt-1 max-h-60 overflow-auto">
               {suggestions.map((client) => (
                 <li 
                   key={client.id} 
                   className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                   onMouseDown={() => handleSelectClient(client)}
                 >
                   <div className="font-medium text-gray-900 dark:text-gray-100">{client.nume}</div>
                   <div className="text-xs text-gray-500">{client.telefon || 'Fără telefon'} - {client.cui_cnp || 'PF'}</div>
                 </li>
               ))}
             </ul>
          )}
        </div>
        <div>
          <label className="form-label">
            CUI / CNP
          </label>
          <input
            type="text"
            name="cuiCnp"
            value={clientInfo.cuiCnp}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="relative">
          <label className="form-label">
            Telefon
          </label>
          <input
            type="text"
            name="numarTelefon"
            value={clientInfo.numarTelefon}
            onChange={handleChange}
            onFocus={() => setActiveField("telefon")}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            autoComplete="off"
            className="form-input"
          />
          {showSuggestions && activeField === "telefon" && suggestions.length > 0 && (
             <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md mt-1 max-h-60 overflow-auto">
               {suggestions.map((client) => (
                 <li 
                   key={client.id} 
                   className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                   onMouseDown={() => handleSelectClient(client)}
                 >
                   <div className="font-medium text-gray-900 dark:text-gray-100">{client.telefon}</div>
                   <div className="text-xs text-gray-500">{client.nume}</div>
                 </li>
               ))}
             </ul>
          )}
        </div>
        <div>
          <label className="form-label">
            Localitate
          </label>
          <input
            type="text"
            name="locatie"
            value={clientInfo.locatie}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="form-label">
            Strada / Adresa
          </label>
          <input
            type="text"
            name="strada"
            value={clientInfo.strada}
            onChange={handleChange}
            className="form-input"
          />
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Detalii intrare service
          </h4>
        </div>

        <div>
          <label className="form-label">
            Data intrare
          </label>
          <input
            type="date"
            name="dataIntrare"
            value={clientInfo.dataIntrare}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">
            Data estimată ieșire
          </label>
          <input
            type="date"
            name="dataIesire"
            value={clientInfo.dataIesire}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <label className="form-label">
            Motiv principal intrare
          </label>
          <input
            type="text"
            name="motivIntrare"
            value={clientInfo.motivIntrare}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <label className="form-label">
            Observații recepție auto
          </label>
          <textarea
            name="observatii"
            value={clientInfo.observatii}
            onChange={handleChange}
            rows={2}
            className="rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
