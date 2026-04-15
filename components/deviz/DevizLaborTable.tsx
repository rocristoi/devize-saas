"use client";

import { DevizLabor } from "@/types/deviz";
import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";

interface Props {
  labor: DevizLabor[];
  onChange: (labor: DevizLabor[]) => void;
}

export function DevizLaborTable({ labor, onChange }: Props) {
  const addLabor = () => {
    const newLabor: DevizLabor = {
      id: generateId(),
      operatiune: "",
      durata: "1",
      pret_orar: "",
      discount_percentage: "",
      total: 0,
    };
    onChange([...labor, newLabor]);
  };

  const updateLabor = (id: string, field: keyof DevizLabor, value: any) => {
    onChange(
      labor.map((l) => {
        if (l.id === id) {
          const updated = { ...l, [field]: value };

          // Try to parse duration as logic (simplistic: parse float)
          const durationFloat =
            parseFloat((updated.durata as string).replace(",", ".")) || 0;
          const pret = parseFloat(updated.pret_orar as string) || 0;
          const discount = parseFloat(updated.discount_percentage as string) || 0;
          const subtotal = durationFloat * pret;
          const discountAmount = discount;

          updated.total = Math.max(0, subtotal - discountAmount);

          return updated;
        }
        return l;
      }),
    );
  };

  const removeLabor = (id: string) => {
    onChange(labor.filter((l) => l.id !== id));
  };

  return (
    <div className="card-container">
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 flex-wrap gap-2">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100">
          Manoperă
        </h3>
        <button
          type="button"
          onClick={addLabor}
          className="flex items-center flex gap-1 text-xs md:text-sm bg-blue-50/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1.5 md:px-3 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
        >
          <Plus size={16} /> <span className="hidden sm:flex">Adaugă Manoperă</span>
        </button>
      </div>

      {/* Mobile Cards Layout */}
      <div className="md:hidden space-y-4 pb-4">
        {labor.map((item, index) => (
          <div key={`mob-${item.id}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm relative group animate-fade-in text-sm">
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                 <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px]">{index + 1}</span>
                 
              </div>
              <button type="button" onClick={() => removeLabor(item.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-md bg-red-50 dark:bg-red-900/20 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                 <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Denumire Operațiune</label>
                 <input
                    type="text"
                    value={item.operatiune}
                    onChange={(e) => updateLabor(item.id, "operatiune", e.target.value)}
                    className={`w-full p-2 text-sm bg-gray-50 dark:bg-gray-900/50 border ${!item.operatiune ? 'border-red-500' : 'border-gray-200 dark:border-gray-700/80'} focus:border-blue-500 rounded-md outline-none`}
                    placeholder="ex: Înlocuire ulei"
                  />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Durată (ore)</label>
                   <input
                      type="text"
                      value={item.durata}
                      onChange={(e) => updateLabor(item.id, "durata", e.target.value)}
                      className={`w-full p-2 text-sm bg-gray-50 dark:bg-gray-900/50 border ${!item.durata || item.durata === 0 ? 'border-red-500' : 'border-gray-200 dark:border-gray-700/80'} focus:border-blue-500 rounded-md outline-none text-center`}
                      placeholder="1.5"
                    />
                 </div>
                 <div>
                   <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Tarif Orar</label>
                   <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.pret_orar}
                        onChange={(e) => updateLabor(item.id, "pret_orar", e.target.value === "" ? "" : e.target.value)}
                        className={`w-full p-2 pl-8 text-sm bg-gray-50 dark:bg-gray-900/50 border ${!item.pret_orar || item.pret_orar === 0 ? 'border-red-500' : 'border-gray-200 dark:border-gray-700/80'} focus:border-blue-500 rounded-md outline-none text-right pr-2`}
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-[10px] uppercase">RON/h</span>
                   </div>
                 </div>
              </div>
              
              <div className="relative">
                 <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Discount (Lei)</label>
                 <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={item.discount_percentage}
                      onChange={(e) => updateLabor(item.id, "discount_percentage", e.target.value === "" ? "" : e.target.value)}
                      className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 focus:border-blue-500 rounded-md outline-none text-right pr-7"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Lei</span>
                 </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 flex justify-between items-center border-t border-gray-100 dark:border-gray-700 font-medium">
               <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">SUBTOTAL</span>
               <span className="text-base font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">{item.total.toFixed(2)} RON</span>
            </div>
          </div>
        ))}
        {labor.length === 0 && (
          <div className="p-6 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
              <span className="text-sm block mb-3 font-medium">Nicio manoperă adăugată</span>
              <button type="button" onClick={addLabor} className="mx-auto text-blue-600 dark:text-blue-400 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors">Adaugă Manoperă</button>
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-xs md:text-sm text-left text-gray-500 dark:text-gray-400 min-w-[500px]">
          <thead className="text-[10px] md:text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 tracking-tighter">
            <tr>
              <th className="px-1 md:px-3 py-2 md:py-3 w-auto whitespace-nowrap">Denumire Operațiune</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-16 md:w-28 whitespace-nowrap text-center">Durată</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-28 md:w-36 whitespace-nowrap text-right">Tarif Orar</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-20 md:w-28 whitespace-nowrap text-right">Discount</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-24 md:w-32 text-right whitespace-nowrap">Total</th>
              <th className="px-1 md:px-3 py-2 md:py-3 w-8 md:w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="text-xs md:text-sm">
            {labor.map((item) => (
              <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-fade-in group">
                <td className="px-1 md:px-2 py-1.5 md:py-3">
                  <input
                    type="text"
                    value={item.operatiune}
                    onChange={(e) =>
                      updateLabor(item.id, "operatiune", e.target.value)
                    }
                    className={`w-full p-1.5 md:p-2 text-xs md:text-sm bg-transparent border ${!item.operatiune ? 'border-red-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'} focus:border-blue-500 rounded-md outline-none transition-all duration-200`}
                    placeholder="ex: Înlocuire ulei"
                  />
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3">
                  <input
                    type="text"
                    value={item.durata}
                    onChange={(e) =>
                      updateLabor(item.id, "durata", e.target.value)
                    }
                    className={`w-full p-1.5 md:p-2 text-xs md:text-sm bg-transparent border ${!item.durata || item.durata === 0 ? 'border-red-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'} focus:border-blue-500 rounded-md outline-none transition-all duration-200 text-center`}
                    placeholder="1.5"
                  />
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={item.pret_orar}
                      onChange={(e) =>
                        updateLabor(
                          item.id,
                          "pret_orar",
                          e.target.value === "" ? "" : e.target.value,
                        )
                      }
                      className={`w-full p-1.5 md:p-2 pl-6 text-xs md:text-sm bg-transparent border ${!item.pret_orar || item.pret_orar === 0 ? 'border-red-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'} focus:border-blue-500 rounded-md outline-none transition-all duration-200 text-right pr-2 placeholder-gray-300 dark:placeholder-gray-600`}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-medium">RON</span>
                  </div>
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={item.discount_percentage}
                      onChange={(e) =>
                        updateLabor(
                          item.id,
                          "discount_percentage",
                          e.target.value === "" ? "" : e.target.value,
                        )
                      }
                      className="w-full p-1.5 md:p-2 text-xs md:text-sm bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200 text-right pr-6 placeholder-gray-300 dark:placeholder-gray-600"
                    />
                  </div>
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                  {item.total.toFixed(2)} RON
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center">
                  <button
                    type="button"
                    onClick={() => removeLabor(item.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {labor.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg border-b border-gray-200 dark:border-gray-700 border-dashed">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-sm">Nu există operațiuni adăugate</span>
                    <button
                      type="button"
                      onClick={addLabor}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                    >
                      Adaugă o operațiune nouă
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
