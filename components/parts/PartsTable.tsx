"use client";

import { useState, useEffect } from "react";
// Supabase client instance (or a typed generated one)
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Plus, Minus, Search } from "lucide-react";
import { PartsModal } from "./PartsModal";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmModal } from "../ui/ConfirmModal";

export function PartsTable({ initialParts, companyId }: { initialParts: any[], companyId: string }) {
  const router = useRouter();
  const [parts, setParts] = useState(initialParts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(null);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const [search, setSearch] = useState("");

  const filteredParts = parts.filter(
    (part) =>
      part.nume_piesa?.toLowerCase().includes(search.toLowerCase()) ||
      part.cod_piesa?.toLowerCase().includes(search.toLowerCase()) ||
      part.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredParts.length / ITEMS_PER_PAGE);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const paginatedParts = filteredParts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

  const confirmDelete = async () => {
    if (!partToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('parts_inventory')
      .delete()
      .eq('id', partToDelete);
      
    setIsDeleting(false);
    
    if (error) {
      console.error('Delete error:', error);
      toast.error('A apărut o eroare la ștergerea piesei.');
    } else {
      toast.success('Piesa a fost ștearsă piesa cu succes!');
      setParts(prev => prev.filter(p => p.id !== partToDelete));
      setPartToDelete(null);
      router.refresh();
    }
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Gestiune Piese"
        description="Gestionează inventarul pieselor și serviciilor"
        action={
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Adaugă Piesă Nouă</span>
            <span className="sm:hidden">Piesă Nouă</span>
          </button>
        }
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută piesa (nume, cod, brand)..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Mobile Cards Layout */}
        <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {paginatedParts.map((part) => (
            <div key={`mob-inv-${part.id}`} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{part.cod_piesa}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                     part.stoc > 10 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                     part.stoc > 0 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                     'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                   }`}>
                     {part.stoc > 10 ? 'În Stoc' : part.stoc > 0 ? 'Stoc Redus' : 'Epuizat'}
                   </span>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                    {part.nume_piesa}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 dark:text-gray-400 flex flex-wrap gap-x-2">
                    {part.brand && <span>Brand: {part.brand}</span>}
                    {part.categorie && <span>Cat: {part.categorie}</span>}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-medium">Stoc</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{part.stoc} buc</span>
                </div>
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-medium">Preț Unitar</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{part.pret_unitar ? parseFloat(part.pret_unitar).toFixed(2) : '0.00'} <span className="text-[10px] text-blue-500/70 dark:text-blue-400/70">RON</span></span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-1">
                <button 
                  onClick={() => handleOpenModal(part)}
                  className="flex items-center justify-center flex-1 gap-1.5 p-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 dark:bg-gray-800 dark:hover:bg-blue-900/20 dark:text-gray-300 dark:hover:text-blue-400 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 text-sm font-medium"
                >
                  <Edit2 size={16} className="w-4 h-4" /> Editează
                </button>
                <button 
                  onClick={() => setPartToDelete(part.id)}
                  className="flex items-center justify-center p-2 bg-red-50 hover:bg-red-100 flex-shrink-0 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition-colors border border-red-100 dark:border-red-900/30"
                >
                  <Trash2 size={16} className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredParts.length === 0 && (
             <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
               Nu există piese înregistrate în gestiune. Selectați "Adaugă Piesă Nouă".
             </div>
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-xs md:text-sm text-left whitespace-nowrap min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 text-[10px] md:text-xs uppercase tracking-wider">
                <th scope="col" className="px-2 md:px-6 py-2 md:py-4 font-medium text-gray-500 dark:text-gray-400">Cod Piesă</th>
              <th scope="col" className="px-2 md:px-6 py-2 md:py-4 font-medium text-gray-500 dark:text-gray-400 w-1/3">Denumire</th>
              <th scope="col" className="px-2 md:px-6 py-2 md:py-4 font-medium text-gray-500 dark:text-gray-400 text-center">Stoc</th>
              <th scope="col" className="px-2 md:px-6 py-2 md:py-4 font-medium text-gray-500 dark:text-gray-400 text-right">Preț Unitar</th>
              <th scope="col" className="px-2 md:px-6 py-2 md:py-4 font-medium text-gray-500 dark:text-gray-400 text-center">Status</th>
              <th scope="col" className="px-2 md:px-6 py-2 md:py-4 font-medium text-gray-500 dark:text-gray-400 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-xs md:text-sm">
            {paginatedParts.map((part) => (
              <tr 
                key={part.id} 
                className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <td className="px-2 md:px-6 py-2 md:py-4 font-medium text-gray-900 dark:text-white">
                  {part.cod_piesa}
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 text-gray-600 dark:text-gray-300 whitespace-normal min-w-[150px]">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {part.nume_piesa}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 dark:text-gray-400">
                    {part.brand && <span className="mr-2">Brand: {part.brand}</span>}
                    {part.categorie && <span>Categoria: {part.categorie}</span>}
                  </div>
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                   <div className="flex items-center justify-center">
                     <span className="font-medium text-gray-900 dark:text-white">{part.stoc}</span>
                   </div>
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 text-right font-medium text-gray-900 dark:text-white">
                  {part.pret_unitar ? parseFloat(part.pret_unitar).toFixed(2) : '0.00'}
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 text-center">
                   <span className={`inline-flex items-center px-1.5 md:px-2 py-0.5 md:py-1 rounded md:rounded-md text-[10px] md:text-xs font-medium ${
                     part.stoc > 10 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                     part.stoc > 0 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                     'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                   }`}>
                     {part.stoc > 10 ? 'În Stoc' : part.stoc > 0 ? 'Stoc Redus' : 'Epuizat'}
                   </span>
                </td>
                <td className="px-2 md:px-6 py-2 md:py-4 text-right">
                  <div className="flex items-center justify-end gap-1 md:gap-2">
                    <button 
                      onClick={() => handleOpenModal(part)}
                      className="p-1 md:p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      title="Editează piesa"
                    >
                      <Edit2 size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    <button 
                      onClick={() => setPartToDelete(part.id)}
                      className="p-1 md:p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Șterge piesa"
                    >
                      <Trash2 size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            Pagina {currentPage} din {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Următor
            </button>
          </div>
        </div>
      )}
      </div>

      <PartsModal 
        isOpen={modalOpen}
        part={editingPart} 
        onClose={() => setModalOpen(false)} 
        onSave={handleSavePart} 
      />

      <ConfirmModal
        isOpen={!!partToDelete}
        onClose={() => setPartToDelete(null)}
        onConfirm={confirmDelete}
        title="Ștergere piesă"
        description="Ești sigur că vrei să ștergi această piesă din gestiune? Această acțiune nu poate fi anulată."
        confirmText="Șterge piesa"
        isLoading={isDeleting}
      />
    </div>
  );
}
