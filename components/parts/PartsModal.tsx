"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function PartsModal({ 
  part, 
  onClose, 
  onSave 
}: { 
  part: any, 
  onClose: () => void, 
  onSave: (data: any) => Promise<void> 
}) {
  const [formData, setFormData] = useState<{
    cod_piesa: string;
    nume_piesa: string;
    brand: string;
    categorie: string;
    stoc: number | string;
    pret_unitar: number | string;
    furnizor: string;
  }>({
    cod_piesa: "",
    nume_piesa: "",
    brand: "",
    categorie: "",
    stoc: "",
    pret_unitar: "",
    furnizor: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (part) {
      setFormData({
        ...formData,
        ...part,
      });
    }
  }, [part]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {part ? "Editare Piesă" : "Adăugare Piesă Nouă"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Cod Piesă *</label>
              <input 
                type="text" 
                required 
                value={formData.cod_piesa}
                onChange={e => setFormData({...formData, cod_piesa: e.target.value})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="form-label">Nume Piesă *</label>
              <input 
                type="text" 
                required 
                value={formData.nume_piesa}
                onChange={e => setFormData({...formData, nume_piesa: e.target.value})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="form-label">Brand</label>
              <input 
                type="text" 
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="form-label">Categorie</label>
              <input 
                type="text" 
                value={formData.categorie}
                onChange={e => setFormData({...formData, categorie: e.target.value})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="form-label">Furnizor</label>
              <input 
                type="text" 
                value={formData.furnizor}
                onChange={e => setFormData({...formData, furnizor: e.target.value})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Stoc *</label>
                <input 
                  type="number" 
                  min="0"
                  required 
                  value={formData.stoc}
                  onChange={e => setFormData({...formData, stoc: e.target.value === "" ? "" : parseInt(e.target.value) || 0})}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="form-label">Preț Unitar *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  required 
                  value={formData.pret_unitar}
                  onChange={e => setFormData({...formData, pret_unitar: e.target.value === "" ? "" : parseFloat(e.target.value) || 0})}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Anulează
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100/20 disabled:opacity-50"
            >
              {loading ? "Se salvează..." : "Salvează"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
