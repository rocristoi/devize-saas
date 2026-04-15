"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";

export function PartsModal({ 
  isOpen,
  part, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean,
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
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={part ? "Editare Piesă" : "Adăugare Piesă Nouă"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cod Piesă *</label>
            <input 
              type="text" 
              required 
              value={formData.cod_piesa}
              onChange={e => setFormData({...formData, cod_piesa: e.target.value})}
              className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm" 
              placeholder="Ex: OIL-5W30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nume Piesă *</label>
            <input 
              type="text" 
              required 
              value={formData.nume_piesa}
              onChange={e => setFormData({...formData, nume_piesa: e.target.value})}
              className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
              placeholder="Ex: Ulei Motor Castrol" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Brand</label>
            <input 
              type="text" 
              value={formData.brand}
              onChange={e => setFormData({...formData, brand: e.target.value})}
              className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categorie</label>
            <input 
              type="text" 
              value={formData.categorie}
              onChange={e => setFormData({...formData, categorie: e.target.value})}
              className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Furnizor</label>
            <input 
              type="text" 
              value={formData.furnizor}
              onChange={e => setFormData({...formData, furnizor: e.target.value})}
              className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stoc *</label>
              <input 
                type="number" 
                min="0"
                required 
                value={formData.stoc}
                onChange={e => setFormData({...formData, stoc: e.target.value === "" ? "" : parseInt(e.target.value) || 0})}
                className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Preț Unitar (RON) *</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                required 
                value={formData.pret_unitar}
                onChange={e => setFormData({...formData, pret_unitar: e.target.value === "" ? "" : parseFloat(e.target.value) || 0})}
                className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm" 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800 mt-6">
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-800"
          >
            Anulează
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm disabled:opacity-50 focus:ring-4 focus:ring-blue-500/20"
          >
            {loading ? "Se salvează..." : "Salvează Piesa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
