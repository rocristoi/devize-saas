import { useState, useEffect, useCallback } from 'react';
import { Part, StoredPart } from '../types';
import { Trash2, Plus, Search } from 'lucide-react';
import { getPartByCode } from '../utils/partsStorage';
import PartsInventoryModal from './PartsInventoryModal';
import { useNotifications } from './NotificationSystem';

interface PartsTableProps {
  parts: Part[];
  onAddPart: () => void;
  onUpdatePart: (index: number, field: keyof Part, value: string | number) => void;
  onRemovePart: (index: number) => void;
}

const PartsTable = ({ parts, onAddPart, onUpdatePart, onRemovePart }: PartsTableProps) => {
  const { showAlert, showConfirm } = useNotifications();
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(null);

  const calculateTotal = (part: Part) => {
    const pret = typeof part.pret === 'number' && !isNaN(part.pret) ? part.pret : 0;
    const bucati = typeof part.bucati === 'number' && !isNaN(part.bucati) ? part.bucati : 0;
    const discount = typeof part.discount === 'number' && !isNaN(part.discount) ? part.discount : 0;
    
    // Ensure values are non-negative
    const safePret = Math.max(0, pret);
    const safeBucati = Math.max(0, bucati);
    const safeDiscount = Math.max(0, discount);
    
    return Math.max(0, (safePret * safeBucati) - safeDiscount);
  };

  const handlePartCodeChange = (index: number, value: string) => {
    onUpdatePart(index, 'codPiesa', value);

    // Auto-fill if part exists in database
    if (value.trim()) {
      const storedPart = getPartByCode(value.trim());
      if (storedPart) {
        onUpdatePart(index, 'numePiesa', storedPart.numePiesa);
        onUpdatePart(index, 'pret', storedPart.pret);
        // Reset quantity to 1 and validate against stock
        const requestedQuantity = Math.min(1, storedPart.stocCurent);
        onUpdatePart(index, 'bucati', requestedQuantity);
      }
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    const numericValue = parseInt(value) || 0;
    const part = parts[index];
    
    // Validate against stock if part exists in database
    if (part.codPiesa) {
      const storedPart = getPartByCode(part.codPiesa);
      if (storedPart) {
        if (numericValue > storedPart.stocCurent) {
          showAlert(`Stoc insuficient! Disponibil: ${storedPart.stocCurent} bucăți pentru piesa ${part.codPiesa}`, 'error');
          onUpdatePart(index, 'bucati', storedPart.stocCurent);
          return;
        }
      }
    }
    
    onUpdatePart(index, 'bucati', value);
  };

  const getStockInfo = (part: Part) => {
    if (!part.codPiesa) return null;
    
    const storedPart = getPartByCode(part.codPiesa);
    if (!storedPart) return null;
    
    const isOverStock = part.bucati > storedPart.stocCurent;
    const isLowStock = storedPart.stocCurent <= (storedPart.stocMinim ?? 0);
    
    return {
      currentStock: storedPart.stocCurent,
      minStock: storedPart.stocMinim,
      isOverStock,
      isLowStock,
      isInStock: storedPart.stocCurent > 0
    };
  };

  // Export validation function for use in App component
  const validatePartsStock = useCallback(() => {
    const stockIssues: string[] = [];
    
    parts.forEach((part, index) => {
      if (!part.codPiesa || part.bucati === 0) return;
      
      const storedPart = getPartByCode(part.codPiesa);
      if (!storedPart) {
        stockIssues.push(`Piesa "${part.codPiesa}" nu există în inventar (rândul ${index + 1})`);
        return;
      }
      
      if (part.bucati > storedPart.stocCurent) {
        stockIssues.push(`Piesa "${part.codPiesa}": solicitați ${part.bucati} bucăți, disponibil ${storedPart.stocCurent} (rândul ${index + 1})`);
      }
      
      if (storedPart.stocCurent === 0) {
        stockIssues.push(`Piesa "${part.codPiesa}" nu are stoc disponibil (rândul ${index + 1})`);
      }
    });
    
    return {
      isValid: stockIssues.length === 0,
      errors: stockIssues
    };
  }, [parts]);

  // Expose validation function to parent component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).validatePartsStock = validatePartsStock;
    }
  }, [validatePartsStock]);

  const handleOpenInventoryModal = (index: number) => {
    setCurrentEditingIndex(index);
    setShowInventoryModal(true);
  };

  const handleSelectStoredPart = (storedPart: StoredPart) => {
    if (currentEditingIndex !== null) {
      onUpdatePart(currentEditingIndex, 'codPiesa', storedPart.codPiesa);
      onUpdatePart(currentEditingIndex, 'numePiesa', storedPart.numePiesa);
      onUpdatePart(currentEditingIndex, 'pret', storedPart.pret);
      
      // Set quantity based on available stock
      const defaultQuantity = Math.min(1, storedPart.stocCurent);
      onUpdatePart(currentEditingIndex, 'bucati', defaultQuantity);
      
      // Show warning if no stock available
      if (storedPart.stocCurent === 0) {
        showAlert(`Atenție: Piesa ${storedPart.codPiesa} nu are stoc disponibil!`, 'warning');
      } else if (storedPart.stocCurent <= (storedPart.stocMinim ?? 0)) {
        showAlert(`Atenție: Piesa ${storedPart.codPiesa} are stoc scăzut (${storedPart.stocCurent} bucăți)!`, 'warning');
      }
    }
    setShowInventoryModal(false);
    setCurrentEditingIndex(null);
  };
  

  const handleRemovePart = async (index: number) => {
    const part = parts[index];
    
    // Optionally reduce stock when removing from quote
    if (part.codPiesa && part.bucati > 0) {
      const confirmReduction =  await showConfirm(
        `Doriți să adăugați înapoi ${part.bucati == 1 ? 'o bucată' : `${part.bucati} bucăți` } la stocul piesei ${part.codPiesa}?`
      );
      
      if (confirmReduction) {
        // This would increase stock back (opposite of usePartInQuote)
        const storedPart = getPartByCode(part.codPiesa);
        if (storedPart) {
          // We could implement a returnPartToStock function here
          console.log(`Returning ${part.bucati} pieces of ${part.codPiesa} to stock`);
        }
      }
    }
    
    onRemovePart(index);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-none p-8 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-gray-900 dark:text-gray-100 text-xl font-semibold border-b-2 pb-2 transition-all duration-200" style={{ borderColor: 'var(--color-primary)' }}>Tabel Piese</h3>
        <button 
          className="inline-flex items-center gap-2 px-6 py-3 border rounded-none text-sm font-medium cursor-pointer transition-all duration-200 text-white hover:-translate-y-0.5 hover:shadow-md active:translate-y-0" 
          style={{ 
            backgroundColor: 'var(--color-primary)', 
            borderColor: 'var(--color-primary)' 
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
            e.currentTarget.style.borderColor = 'var(--color-primary-600)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            e.currentTarget.style.borderColor = 'var(--color-primary)';
          }}
          onClick={onAddPart}
        >
          <Plus size={16} />
          Adaugă Piesă
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-48">
                Cod Piesă
              </th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200">Nume Piesă</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-20">Bucăți</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-32">Stare</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-24">Preț</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-24">Discount</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-32">Preț Total</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-20">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={part.codPiesa}
                        onChange={(e) => handlePartCodeChange(index, e.target.value)}
                        placeholder="Cod piesă"
                        className={`flex-1 px-2 py-2 border rounded-none text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 hover:border-gray-400 dark:hover:border-gray-500 ${
                          (() => {
                            const stockInfo = getStockInfo(part);
                            if (!stockInfo) return 'border-gray-300 dark:border-gray-600 focus:ring-2' + ' focus:ring-[var(--color-primary)]/20';
                            if (!stockInfo.isInStock) return 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20';
                            if (stockInfo.isLowStock) return 'border-yellow-300 dark:border-yellow-600 focus:border-yellow-500 focus:ring-yellow-500/20';
                            return 'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-green-500/20';
                          })()
                        }`}
                        style={{
                          borderColor: getStockInfo(part) ? undefined : 'var(--color-primary)'
                        } as React.CSSProperties}
                      />
                      <button
                        type="button"
                        onClick={() => handleOpenInventoryModal(index)}
                        className="flex items-center justify-center px-3 py-2 rounded-none text-xs font-medium transition-all duration-200 text-white border focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: 'var(--color-primary-600)',
                          borderColor: 'var(--color-primary-600)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                          e.currentTarget.style.borderColor = 'var(--color-primary-700)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                          e.currentTarget.style.borderColor = 'var(--color-primary-600)';
                        }}
                        title="Selectează din inventar"
                      >
                        <Search size={16} />
                        <span className="ml-1 hidden sm:inline">Inventar</span>
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <input
                    type="text"
                    value={part.numePiesa}
                    onChange={(e) => onUpdatePart(index, 'numePiesa', e.target.value)}
                    placeholder="Nume piesă"
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 hover:border-gray-400 dark:hover:border-gray-500"
                    style={{ borderColor: 'var(--color-primary)' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  />
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <div className="flex flex-col gap-1">
                    <input
                      type="number"
                      value={part.bucati === 0 ? '' : part.bucati.toString()}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      min="1"
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="1"
                      className={`w-full px-2 py-2 border rounded-none text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 text-center font-mono ${
                        getStockInfo(part)?.isOverStock 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      style={!getStockInfo(part)?.isOverStock ? { borderColor: 'var(--color-primary)' } : undefined}
                      onFocus={(e) => !getStockInfo(part)?.isOverStock && (e.target.style.borderColor = 'var(--color-primary)')}
                      onBlur={(e) => !getStockInfo(part)?.isOverStock && (e.target.style.borderColor = '')}
                    />
                  </div>
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <select
                    value={part.stare}
                    onChange={(e) => onUpdatePart(index, 'stare', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 hover:border-gray-400 dark:hover:border-gray-500"
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  >
                    <option value="">Selectează</option>
                    <option value="Nouă">Nouă</option>
                    <option value="Utilizată">Utilizată</option>
                    <option value="Recondiționată">Recondiționată</option>
                  </select>
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={part.pret === 0 ? '' : part.pret.toString()}
                    onChange={(e) => onUpdatePart(index, 'pret', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 hover:border-gray-400 dark:hover:border-gray-500 text-right font-mono"
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  />
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={part.discount === 0 ? '' : part.discount.toString()}
                    onChange={(e) => onUpdatePart(index, 'discount', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 hover:border-gray-400 dark:hover:border-gray-500 text-right font-mono"
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  />
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono text-right block">
                    {calculateTotal(part).toFixed(2)} RON
                  </span>
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-2 border border-red-600 rounded-none text-xs font-medium cursor-pointer transition-all duration-200 bg-red-600 text-white hover:bg-red-700 hover:border-red-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                    onClick={() => handleRemovePart(index)}
                    title="Șterge piesă"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Parts Inventory Modal */}
      <PartsInventoryModal
        isOpen={showInventoryModal}
        onClose={() => {
          setShowInventoryModal(false);
          setCurrentEditingIndex(null);
        }}
        onSelectPart={handleSelectStoredPart}
      />
    </div>
  );
};

export default PartsTable; 