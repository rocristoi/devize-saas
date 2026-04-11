"use client";

import { DevizPart } from "@/types/deviz";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  parts: DevizPart[];
  onChange: (parts: DevizPart[]) => void;
}

export function DevizPartsTable({ parts, onChange }: Props) {
  const addPart = () => {
    const newPart: DevizPart = {
      id: crypto.randomUUID(),
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

  return (
    <div className="card-container">
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Piese și materiale
        </h3>
        <button
          type="button"
          onClick={addPart}
          className="flex items-center gap-1 text-sm bg-blue-50/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
        >
          <Plus size={16} /> Adaugă Piesă
        </button>
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-3 py-3 w-36 whitespace-nowrap">Cod</th>
              <th className="px-3 py-3 whitespace-nowrap">Denumire Piesă</th>
              <th className="px-3 py-3 w-28 whitespace-nowrap">Stare</th>
              <th className="px-3 py-3 w-24 whitespace-nowrap">Cant.</th>
              <th className="px-3 py-3 w-36 whitespace-nowrap">Preț Unitar</th>
              <th className="px-3 py-3 w-28 whitespace-nowrap">Discount (Lei)</th>
              <th className="px-3 py-3 w-32 text-right whitespace-nowrap">Total</th>
              <th className="px-3 py-3 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => (
              <tr key={part.id} className="border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-fade-in group">
                <td className="px-2 py-3">
                  <input
                    type="text"
                    value={part.cod_piesa}
                    onChange={(e) =>
                      updatePart(part.id, "cod_piesa", e.target.value)
                    }
                    className="w-full p-2 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200"
                    placeholder="Cod"
                  />
                </td>
                <td className="px-2 py-3">
                  <input
                    type="text"
                    value={part.nume_piesa}
                    onChange={(e) =>
                      updatePart(part.id, "nume_piesa", e.target.value)
                    }
                    className="w-full p-2 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200"
                    placeholder="ex: Filtru ulei"
                  />
                </td>
                <td className="px-2 py-3">
                  <select
                    value={part.stare}
                    onChange={(e) =>
                      updatePart(part.id, "stare", e.target.value)
                    }
                    className="w-full p-2 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200 cursor-pointer"
                  >
                    <option value="Nou">Nou</option>
                    <option value="SH">SH</option>
                    <option value="Recondiționat">Recond.</option>
                  </select>
                </td>
                <td className="px-2 py-3">
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
                    className="w-full p-2 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200 text-center"
                  />
                </td>
                <td className="px-2 py-3">
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
                      className="w-full p-2 pl-6 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200 text-right pr-2 placeholder-gray-300 dark:placeholder-gray-600"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-xs">RON</span>
                  </div>
                </td>
                <td className="px-2 py-3">
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
                      className="w-full p-2 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200 text-right pr-6 placeholder-gray-300 dark:placeholder-gray-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">Lei</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                  {part.total.toFixed(2)} RON
                </td>
                <td className="px-2 py-3 text-center">
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
                    <button
                      type="button"
                      onClick={addPart}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                    >
                      Adaugă o piesă nouă
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
