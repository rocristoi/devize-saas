"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (part: any) => void;
}

export function SelectPartsModal({ isOpen, onClose, onSelect }: Props) {
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen) return;
    const fetchParts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('parts_inventory')
        .select('*')
        .order('nume_piesa', { ascending: true });
      if (data) setParts(data);
      setLoading(false);
    };
    fetchParts();
  }, [isOpen, supabase]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const filteredParts = parts.filter(p => 
    p.nume_piesa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cod_piesa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adaugă piesă din inventar">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={18} />
          <input
            type="text"
            placeholder="Caută după nume sau cod..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Se încarcă...</div>
          ) : filteredParts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nu am găsit nicio piesă.</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredParts.map(part => (
                <div key={part.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{part.nume_piesa}</div>
                    <div className="text-sm text-gray-500">Cod: {part.cod_piesa} | Stoc: {part.stoc} | Preț: {part.pret_unitar} RON</div>
                  </div>
                  <button
                    onClick={() => {
                        onSelect(part);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                  >
                    <Plus size={16} /> Adaugă
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
