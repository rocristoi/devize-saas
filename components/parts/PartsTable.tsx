"use client";

import { useState } from "react";
// Supabase client instance (or a typed generated one)
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Plus, Minus } from "lucide-react";
import { PartsModal } from "./PartsModal";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";

export function PartsTable({ initialParts, companyId }: { initialParts: any[], companyId: string }) {
  const router = useRouter();
  const [parts, setParts] = useState(initialParts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const supabase = createClient();

  const handleOpenModal = (part?: any) => {
    setEditingPart(part || null);
    setModalOpen(true);
  };

  const handleSavePart = async (data: any) => {
    const payload = { ...data, company_id: companyId };

    if (data.id) {
      // Update
      const { error, data: updated } = await supabase
        .from('parts_inventory')
        .update(payload)
        .eq('id', data.id)
        .select()
        .single();
        
      if (error) {
        toast.error("Eroare la actualizare: " + error.message);
      } else if (updated) {
        setParts(prev => prev.map(p => p.id === updated.id ? updated : p));
        toast.success("Piesa a fost actualizată!");
        setModalOpen(false);
      }
    } else {
      // Insert
      const { error, data: inserted } = await supabase
        .from('parts_inventory')
        .insert(payload)
        .select()
        .single();
        
      if (error) {
        toast.error("Eroare la creare: " + error.message);
      } else if (inserted) {
        setParts(prev => [...prev, inserted]);
        toast.success("Piesa a fost adăugată!");
        setModalOpen(false);
      }
    }
  };

  async function handleDelete(id: string) {
    if (!window.confirm('Ești sigur că vrei să ștergi această piesă din gestiune?')) return;
    
    const { error } = await supabase
      .from('parts_inventory')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Delete error:', error);
      toast.error('A apărut o eroare la ștergerea piesei.');
    } else {
      toast.success('Piesa a fost ștearsă piesa cu succes!');
      setParts(prev => prev.filter(p => p.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Gestiune Piese"
        description="Gestionează inventarul pieselor și serviciilor"
        action={
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Adaugă Piesă Nouă</span>
          </button>
        }
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <th scope="col" className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">Cod Piesă</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 w-1/3">Denumire</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-center">Stoc</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-right">Preț Unitar</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-center">Status</th>
              <th scope="col" className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {parts.map((part) => (
              <tr 
                key={part.id} 
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {part.cod_piesa}
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {part.nume_piesa}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                    {part.brand && <span className="mr-2">Brand: {part.brand}</span>}
                    {part.categorie && <span>Categoria: {part.categorie}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                   <div className="flex items-center justify-center">
                     <span className="font-medium text-gray-900 dark:text-white">{part.stoc}</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                  {part.pret_unitar ? parseFloat(part.pret_unitar).toFixed(2) : '0.00'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    part.stoc > 5 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                    part.stoc > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                    'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                  }`}>
                    {part.stoc > 5 ? 'În Stoc' : part.stoc > 0 ? 'Sub Limita' : 'Epuizat'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(part)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-colors" 
                      title="Editează"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(part.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors" 
                      title="Șterge"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
              </td>
            </tr>
          ))}
          
          {parts.length === 0 && (
             <tr>
               <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                 Nu există piese înregistrate în gestiune. Selectați "Adaugă Piesă Nouă".
               </td>
             </tr>
          )}
        </tbody>
      </table>
      </div>
      </div>

      {modalOpen && (
        <PartsModal 
          part={editingPart} 
          onClose={() => setModalOpen(false)} 
          onSave={handleSavePart} 
        />
      )}
    </div>
  );
}
