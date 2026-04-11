"use client";

import { DevizLabor } from "@/types/deviz";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  labor: DevizLabor[];
  onChange: (labor: DevizLabor[]) => void;
}

export function DevizLaborTable({ labor, onChange }: Props) {
  const addLabor = () => {
    const newLabor: DevizLabor = {
      id: crypto.randomUUID(),
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
    <div className="card-container mt-6">
      <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Manoperă (Operațiuni)
        </h3>
        <button
          type="button"
          onClick={addLabor}
          className="flex items-center gap-1 text-sm bg-blue-50/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
        >
          <Plus size={16} /> Adaugă Manoperă
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-3 py-3 w-auto whitespace-nowrap">Denumire Operațiune</th>
              <th className="px-3 py-3 w-28 whitespace-nowrap">Durată (ore)</th>
              <th className="px-3 py-3 w-36 whitespace-nowrap">Tarif Orar / Preț</th>
              <th className="px-3 py-3 w-28 whitespace-nowrap">Discount (Lei)</th>
              <th className="px-3 py-3 w-32 text-right whitespace-nowrap">Total</th>
              <th className="px-3 py-3 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {labor.map((item) => (
              <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200 animate-fade-in group">
                <td className="px-2 py-3">
                  <input
                    type="text"
                    value={item.operatiune}
                    onChange={(e) =>
                      updateLabor(item.id, "operatiune", e.target.value)
                    }
                    className="w-full p-2 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200"
                    placeholder="ex: Înlocuire ulei"
                  />
                </td>
                <td className="px-2 py-3">
                  <input
                    type="text"
                    value={item.durata}
                    onChange={(e) =>
                      updateLabor(item.id, "durata", e.target.value)
                    }
                    className="w-full p-2 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200 text-center"
                    placeholder="1.5"
                  />
                </td>
                <td className="px-2 py-3">
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
                      className="w-full p-2 pl-6 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200 text-right pr-2 placeholder-gray-300 dark:placeholder-gray-600"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-medium">RON</span>
                  </div>
                </td>
                <td className="px-2 py-3">
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
                      className="w-full p-2 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 rounded-md dark:hover:border-gray-600 outline-none transition-all duration-200 text-right pr-6 placeholder-gray-300 dark:placeholder-gray-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">Lei</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                  {item.total.toFixed(2)} RON
                </td>
                <td className="px-2 py-3 text-center">
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
