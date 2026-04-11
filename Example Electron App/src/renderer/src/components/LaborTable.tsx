import React from 'react';
import { Labor } from '../types';
import { Trash2, Plus } from 'lucide-react';

interface LaborTableProps {
  labor: Labor[];
  onAddLabor: () => void;
  onUpdateLabor: (index: number, field: keyof Labor, value: string | number) => void;
  onRemoveLabor: (index: number) => void;
}

const LaborTable: React.FC<LaborTableProps> = ({ labor, onAddLabor, onUpdateLabor, onRemoveLabor }) => {
  const calculateTotal = (lab: Labor) => {
    const total = lab.pret - lab.discount;
    return Math.max(0, total);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-none p-8 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-gray-900 dark:text-gray-100 text-xl font-semibold pb-2 transition-all duration-200" style={{borderBottom: '2px solid var(--color-primary)'}}>Tabel Manoperă</h3>
        <button 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-none text-sm font-medium cursor-pointer transition-all duration-200 text-white hover:-translate-y-0.5 hover:shadow-md active:translate-y-0" 
          onClick={onAddLabor}
          style={{
            backgroundColor: 'var(--color-primary)',
            borderColor: 'var(--color-primary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
            e.currentTarget.style.borderColor = 'var(--color-primary-600)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            e.currentTarget.style.borderColor = 'var(--color-primary)';
          }}
        >
          <Plus size={16} />
          Adaugă Manoperă
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200">Manoperă</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-24">Durată</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-24">Preț RON</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-24">Discount</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-32">Preț Total</th>
              <th className="bg-gray-100 dark:bg-gray-800 px-3 py-4 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 w-20">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {labor.map((lab, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <input
                    type="text"
                    value={lab.manopera}
                    onChange={(e) => onUpdateLabor(index, 'manopera', e.target.value)}
                    placeholder="Descriere manoperă"
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 hover:border-gray-400 dark:hover:border-gray-500"
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  />
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <input
                    type="text"
                    value={lab.durata}
                    onChange={(e) => onUpdateLabor(index, 'durata', e.target.value)}
                    placeholder="ex: 2 ore"
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 hover:border-gray-400 dark:hover:border-gray-500"
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  />
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={lab.pret === 0 ? '' : lab.pret.toString()}
                    onChange={(e) => onUpdateLabor(index, 'pret', e.target.value)}
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
                    value={lab.discount === 0 ? '' : lab.discount.toString()}
                    onChange={(e) => onUpdateLabor(index, 'discount', e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 hover:border-gray-400 dark:hover:border-gray-500 text-right font-mono"
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  />
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono text-right block">
                    {calculateTotal(lab).toFixed(2)} RON
                  </span>
                </td>
                <td className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 align-middle transition-all duration-200">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-2 border border-red-600 rounded-none text-xs font-medium cursor-pointer transition-all duration-200 bg-red-600 text-white hover:bg-red-700 hover:border-red-700 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                    onClick={() => onRemoveLabor(index)}
                    title="Șterge manoperă"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LaborTable; 