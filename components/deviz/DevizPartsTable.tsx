"use client";

import { DevizPart } from "@/types/deviz";
import { Plus, Trash2, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SelectPartsModal } from "./SelectPartsModal";
import { generateId } from "@/lib/utils";

interface Props {
  parts: DevizPart[];
  onChange: (parts: DevizPart[]) => void;
}

export function DevizPartsTable({ parts, onChange }: Props) {
  const supabase = createClient();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activePartId, setActivePartId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<"cod" | "nume" | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const searchPart = async () => {
      if (!activePartId || !activeField) return;

      const part = parts.find(p => p.id === activePartId);
      if (!part) return;

      const searchTerm = activeField === "cod" ? part.cod_piesa : part.nume_piesa;
      if (!searchTerm || (searchTerm as string).length < 2) {
        setSuggestions([]);
        return;
      }

      const column = activeField === "cod" ? "cod_piesa" : "nume_piesa";

      const { data } = await supabase
        .from('parts_inventory')
        .select('*')
        .ilike(column, `%${searchTerm}%`)
        .limit(5);

      if (data && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    };

    const timeout = setTimeout(searchPart, 200);
    return () => clearTimeout(timeout);
  }, [parts, activePartId, activeField, supabase]);

  const addPart = () => {
    const newPart: DevizPart = {
      id: generateId(),
      cod_piesa: "",
      nume_piesa: "",
      stare: "Nou",
      cantitate: 1,
      pret_unitar: "",
      discount_percentage: "",
      total: 0,
    };
    onChange([...parts, newPart]);
  };

  const updatePart = (id: string, field: keyof DevizPart, value: any) => {
    onChange(
      parts.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [field]: value };
          // Recalculate total immediately
          const cantitate = parseFloat(updated.cantitate as string) || 0;
          const pret = parseFloat(updated.pret_unitar as string) || 0;
          const discount = parseFloat(updated.discount_percentage as string) || 0;
          const subtotal = cantitate * pret;
          const discountAmount = discount; // NOW TREATING AS ABSOLUTE VALUE (RON)
          // Make sure total doesn't drop below 0 if discount is greater than subtotal (optional but good practice)
          updated.total = Math.max(0, subtotal - discount);
          return updated;
        }
        return p;
      }),
    );
  };

  const removePart = (id: string) => {
    onChange(parts.filter((p) => p.id !== id));
  };

  const handleSelectSuggestion = (partId: string, item: any) => {
    onChange(
      parts.map((p) => {
        if (p.id === partId) {
          const updated = {
            ...p,
            cod_piesa: item.cod_piesa || "",
            nume_piesa: item.nume_piesa || "",
            pret_unitar: item.pret_unitar?.toString() || "",
          };
          
          const cantitate = parseFloat(updated.cantitate as string) || 0;
          const pret = parseFloat(updated.pret_unitar as string) || 0;
          const discount = parseFloat(updated.discount_percentage as string) || 0;
          const subtotal = cantitate * pret;
          updated.total = Math.max(0, subtotal - discount);

          return updated;
        }
        return p;
      })
    );
    setShowSuggestions(false);
    setActivePartId(null);
    setActiveField(null);
  };

  const handleSelectFromModal = (item: any) => {
    const newPart: DevizPart = {
      id: generateId(),
      cod_piesa: item.cod_piesa || "",
      nume_piesa: item.nume_piesa || "",
      stare: "Nou",
      cantitate: 1,
      pret_unitar: item.pret_unitar?.toString() || "",
      discount_percentage: "",
      total: parseFloat(item.pret_unitar || 0),
    };
    onChange([...parts, newPart]);
    setIsModalOpen(false);
  };

  return (
    <div className={`card-container relative ${activePartId ? 'z-[60]' : 'z-10'}`}>
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex-wrap gap-2">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
          Piese și materiale
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex flex-row  items-center gap-1 text-xs md:text-sm bg-blue-50/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1.5 md:px-3 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
          >
            <Database size={16} /> <span className="hidden sm:block">Adaugă din Database</span>
          </button>
          <button
            type="button"
            onClick={addPart}
            className="flex items-center flex gap-1 text-xs md:text-sm bg-blue-50/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1.5 md:px-3 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
          >
            <Plus size={16} /> <span className="hidden sm:flex">Adaugă Piesă</span>
          </button>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4 pb-4">
        {parts.map((part, index) => (
          <div key={`mob-${part.id}`} className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm relative group animate-fade-in text-sm ${activePartId === part.id ? 'z-[60]' : 'z-10'}`}>
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                 <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px]">{index + 1}</span>
                 Piesă / Material
              </div>
              <button type="button" onClick={() => removePart(part.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-md bg-red-50 dark:bg-red-900/20 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                 <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Cod Piesă</label>
                 <input
                    type="text"
                    value={part.cod_piesa}
                    onChange={(e) => updatePart(part.id, "cod_piesa", e.target.value)}
                    onFocus={() => { setActivePartId(part.id); setActiveField("cod"); }}
                    onBlur={() => setTimeout(() => { if (activePartId === part.id && activeField === "cod") setShowSuggestions(false); }, 200)}
                    className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 focus:border-blue-500 rounded-md outline-none"
                    placeholder="Cod"
                  />
                  {showSuggestions && activePartId === part.id && activeField === "cod" && suggestions.length > 0 && (
                    <ul className="absolute z-[100] left-0 top-full w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md mt-1 max-h-60 overflow-auto">
                      {suggestions.map((item) => (
                        <li key={item.id} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0" onMouseDown={() => handleSelectSuggestion(part.id, item)}>
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.cod_piesa}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{item.nume_piesa} - {item.pret_unitar} RON</div>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              <div className="relative">
                 <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Denumire Piesă</label>
                  <input
                    type="text"
                    value={part.nume_piesa}
                    onChange={(e) => updatePart(part.id, "nume_piesa", e.target.value)}
                    onFocus={() => { setActivePartId(part.id); setActiveField("nume"); }}
                    onBlur={() => setTimeout(() => { if (activePartId === part.id && activeField === "nume") setShowSuggestions(false); }, 200)}
                    className={`w-full p-2 text-sm bg-gray-50 dark:bg-gray-900/50 border ${!part.nume_piesa ? 'border-red-500' : 'border-gray-200 dark:border-gray-700/80'} focus:border-blue-500 rounded-md outline-none`}
                    placeholder="ex: Filtru ulei"
                  />
                  {showSuggestions && activePartId === part.id && activeField === "nume" && suggestions.length > 0 && (
                    <ul className="absolute z-[100] left-0 top-full w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md mt-1 max-h-60 overflow-auto">
                      {suggestions.map((item) => (
                        <li key={item.id} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-0" onMouseDown={() => handleSelectSuggestion(part.id, item)}>
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.nume_piesa}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{item.cod_piesa} - {item.pret_unitar} RON</div>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Stare</label>
                   <select
                      value={part.stare}
                      onChange={(e) => updatePart(part.id, "stare", e.target.value)}
                      className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 focus:border-blue-500 rounded-md outline-none"
                    >
                      <option value="Nou">Nou</option>
                      <option value="SH">SH</option>
                      <option value="Recondiționat">Recond.</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Cantitate</label>
                   <input
                      type="number"
                      min="1"
                      value={part.cantitate === 0 ? '' : part.cantitate}
                      onChange={(e) => updatePart(part.id, "cantitate", e.target.value === "" ? "" : parseFloat(e.target.value))}
                      className={`w-full p-2 text-sm bg-gray-50 dark:bg-gray-900/50 border ${part.cantitate === "" || part.cantitate === 0 ? 'border-red-500' : 'border-gray-200 dark:border-gray-700/80'} focus:border-blue-500 rounded-md outline-none text-center`}
                    />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Preț Unitar</label>
                   <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={part.pret_unitar}
                        onChange={(e) => updatePart(part.id, "pret_unitar", e.target.value === "" ? "" : e.target.value)}
                        className={`w-full p-2 text-sm bg-gray-50 dark:bg-gray-900/50 border ${part.pret_unitar === "" ? 'border-red-500' : 'border-gray-200 dark:border-gray-700/80'} focus:border-blue-500 rounded-md outline-none pr-8 text-right`}
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">RON</span>
                   </div>
                 </div>
                 <div>
                   <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Discount</label>
                   <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={part.discount_percentage}
                        onChange={(e) => updatePart(part.id, "discount_percentage", e.target.value === "" ? "" : e.target.value)}
                        className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 focus:border-blue-500 rounded-md outline-none text-right pr-7"
                      />
                   </div>
                 </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 flex justify-between items-center border-t border-gray-100 dark:border-gray-700 font-medium">
               <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">TOTAL PIESĂ</span>
               <span className="text-base font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">{part.total.toFixed(2)} RON</span>
            </div>
          </div>
        ))}

        {parts.length === 0 && (
          <div className="p-6 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
              <span className="text-sm block mb-3 font-medium">Nicio piesă adăugată</span>
              <div className="flex flex-col gap-2.5 max-w-[200px] mx-auto">
                <button type="button" onClick={addPart} className="text-blue-600 dark:text-blue-400 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors">Adaugă Piesă Nouă</button>
                <button type="button" onClick={() => setIsModalOpen(true)} className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors"><Database size={15} /> Adaugă din Database</button>
              </div>
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className={`hidden md:block pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 ${activePartId ? 'overflow-visible' : 'overflow-x-auto'}`}>
        <table className="w-full text-xs md:text-sm text-left text-gray-500 dark:text-gray-400 min-w-[700px]">
          <thead className="text-[10px] md:text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 tracking-tighter">
            <tr>
              <th className="px-1 md:px-3 py-2 md:py-3 w-28 md:w-36 whitespace-nowrap">Cod</th>
              <th className="px-1 md:px-3 py-2 md:py-3 whitespace-nowrap">Denumire Piesă</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-20 md:w-28 whitespace-nowrap">Stare</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-16 md:w-24 whitespace-nowrap text-center">Cant.</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-24 md:w-36 whitespace-nowrap text-right">Preț Unitar</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-20 md:w-28 whitespace-nowrap text-right">Discount</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-24 md:w-32 text-right whitespace-nowrap">Total</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-8 md:w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="text-xs md:text-sm">
            {parts.map((part) => (
              <tr key={part.id} className={`border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-fade-in group relative ${activePartId === part.id ? 'z-[60]' : 'z-10'}`}>
                <td className="px-1 md:px-2 py-1.5 md:py-3 relative">
                  <input
                    type="text"
                    value={part.cod_piesa}
                    onChange={(e) =>
                      updatePart(part.id, "cod_piesa", e.target.value)
                    }
                    onFocus={() => { setActivePartId(part.id); setActiveField("cod"); }}
                    onBlur={() => setTimeout(() => { if (activePartId === part.id && activeField === "cod") setShowSuggestions(false); }, 200)}
                    className="w-full p-1.5 md:p-2 text-xs md:text-sm bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200"
                    placeholder="Cod"
                  />
                  {showSuggestions && activePartId === part.id && activeField === "cod" && suggestions.length > 0 && (
                    <ul className="absolute z-[50] left-0 top-full w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md mt-1 max-h-60 overflow-auto">
                      {suggestions.map((item) => (
                        <li 
                          key={item.id} 
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                          onMouseDown={() => handleSelectSuggestion(part.id, item)}
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">{item.cod_piesa}</div>
                          <div className="text-xs text-gray-500">{item.nume_piesa} - {item.pret_unitar} RON</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 relative">
                  <input
                    type="text"
                    value={part.nume_piesa}
                    onChange={(e) =>
                      updatePart(part.id, "nume_piesa", e.target.value)
                    }
                    onFocus={() => { setActivePartId(part.id); setActiveField("nume"); }}
                    onBlur={() => setTimeout(() => { if (activePartId === part.id && activeField === "nume") setShowSuggestions(false); }, 200)}
                    className={`w-full p-1.5 md:p-2 text-xs md:text-sm bg-transparent border ${!part.nume_piesa ? 'border-red-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'} focus:border-blue-500 rounded-md outline-none transition-all duration-200`}
                    placeholder="ex: Filtru ulei"
                  />
                  {showSuggestions && activePartId === part.id && activeField === "nume" && suggestions.length > 0 && (
                    <ul className="absolute z-[50] left-0 top-full w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md mt-1 max-h-60 overflow-auto">
                      {suggestions.map((item) => (
                        <li 
                          key={item.id} 
                          className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                          onMouseDown={() => handleSelectSuggestion(part.id, item)}
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">{item.nume_piesa}</div>
                          <div className="text-xs text-gray-500">{item.cod_piesa} - {item.pret_unitar} RON</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3">
                  <select
                    value={part.stare}
                    onChange={(e) =>
                      updatePart(part.id, "stare", e.target.value)
                    }
                    className="w-full p-1.5 md:p-2 text-xs md:text-sm bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200 cursor-pointer"
                  >
                    <option value="Nou">Nou</option>
                    <option value="SH">SH</option>
                    <option value="Recondiționat">Recond.</option>
                  </select>
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3">
                  <input
                    type="number"
                    min="1"
                    value={part.cantitate === 0 ? '' : part.cantitate}
                    onChange={(e) =>
                      updatePart(
                        part.id,
                        "cantitate",
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                      )
                    }
                    className={`w-full p-1.5 md:p-2 text-xs md:text-sm bg-transparent border ${part.cantitate === "" || part.cantitate === 0 ? 'border-red-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'} focus:border-blue-500 rounded-md outline-none transition-all duration-200 text-center`}
                  />
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={part.pret_unitar}
                      onChange={(e) =>
                        updatePart(
                          part.id,
                          "pret_unitar",
                          e.target.value === "" ? "" : e.target.value,
                        )
                      }
                      className={`w-full p-1.5 md:p-2 text-xs md:text-sm bg-transparent border ${part.pret_unitar === "" ? 'border-red-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'} focus:border-blue-500 rounded-md outline-none pr-6 md:pr-8 text-right transition-all duration-200`}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">RON</span>
                  </div>
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={part.discount_percentage}
                      onChange={(e) =>
                        updatePart(
                          part.id,
                          "discount_percentage",
                          e.target.value === "" ? "" : e.target.value,
                        )
                      }
                      className="w-full p-1.5 md:p-2 text-xs md:text-sm bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200 text-right pr-6 placeholder-gray-300 dark:placeholder-gray-600"
                    />
                  </div>
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                  {part.total.toFixed(2)} RON
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center">
                  <button
                    type="button"
                    onClick={() => removePart(part.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {parts.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-b border-gray-200 dark:border-gray-700 border-dashed">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-sm">Nu există piese adăugate</span>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={addPart}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                      >
                        Adaugă o piesă nouă
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center gap-1"
                      >
                       <Database size={14} /> Adaugă din Database
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <SelectPartsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectFromModal}
      />
    </div>
  );
}
