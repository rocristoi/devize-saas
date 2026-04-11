import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Package, SortAsc, SortDesc } from 'lucide-react';
import { StoredPart } from '../types';
import { getActiveParts } from '../utils/partsStorage';

interface PartsInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPart: (part: StoredPart) => void;
}

type SortField = 'numePiesa' | 'codPiesa' | 'pret' | 'stocCurent' | 'brand';
type SortDirection = 'asc' | 'desc';

const PartsInventoryModal = ({ isOpen, onClose, onSelectPart }: PartsInventoryModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allParts, setAllParts] = useState<StoredPart[]>([]);
  const [filteredParts, setFilteredParts] = useState<StoredPart[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('numePiesa');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Load parts when modal opens
  useEffect(() => {
    if (isOpen) {
      const parts = getActiveParts();
      setAllParts(parts);
      setFilteredParts(parts);
    }
  }, [isOpen]);

  // Get unique categories and brands for filters
  const categories = Array.from(new Set(allParts.map(part => part.category).filter(Boolean)));
  const brands = Array.from(new Set(allParts.map(part => part.brand).filter(Boolean)));

  // Filter and sort parts
  useEffect(() => {
    let filtered = allParts;

    // Search filter
    if (searchQuery.trim()) {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(part => 
        part.numePiesa.toLowerCase().includes(normalizedQuery) ||
        part.codPiesa.toLowerCase().includes(normalizedQuery) ||
        (part.brand && part.brand.toLowerCase().includes(normalizedQuery)) ||
        (part.category && part.category.toLowerCase().includes(normalizedQuery)) ||
        (part.description && part.description.toLowerCase().includes(normalizedQuery))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(part => part.category === selectedCategory);
    }

    // Brand filter
    if (selectedBrand) {
      filtered = filtered.filter(part => part.brand === selectedBrand);
    }

    // Low stock filter
    if (showLowStockOnly) {
      filtered = filtered.filter(part => 
        part.stocMinim && part.stocCurent <= part.stocMinim
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredParts(filtered);
  }, [allParts, searchQuery, selectedCategory, selectedBrand, showLowStockOnly, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrand('');
    setShowLowStockOnly(false);
    setSortField('numePiesa');
    setSortDirection('asc');
  };

  const handleSelectPart = (part: StoredPart) => {
    onSelectPart(part);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-none shadow-xl max-w-6xl w-full mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="text-blue-600 dark:text-blue-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Inventar Piese Auto
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selectați o piesă pentru a o adăuga la deviz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Căutați după nume, cod, brand sau descriere..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toate categoriile</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toate brand-urile</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Doar piese cu stoc redus
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredParts.length} {filteredParts.length ==  1 ? 'piesă găsită' : 'piese găsite'}
              </span>
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-none hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Resetează filtrele
              </button>
            </div>
          </div>
        </div>

        {/* Parts List */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('codPiesa')}
                      className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Cod
                      {sortField === 'codPiesa' && (
                        sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('numePiesa')}
                      className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Nume Piesă
                      {sortField === 'numePiesa' && (
                        sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('brand')}
                      className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Brand
                      {sortField === 'brand' && (
                        sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Categorie</th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('pret')}
                      className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Preț
                      {sortField === 'pret' && (
                        sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('stocCurent')}
                      className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Stoc
                      {sortField === 'stocCurent' && (
                        sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredParts.map((part) => (
                  <tr 
                    key={part.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleSelectPart(part)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                        {part.codPiesa}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {part.numePiesa}
                        </div>
                        {part.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {part.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {part.brand || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {part.category || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {part.pret.toFixed(2)} RON
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-none text-xs font-medium ${
                        part.stocMinim && part.stocCurent <= part.stocMinim
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : part.stocCurent > 10
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {part.stocCurent}
                        {part.stocMinim && part.stocCurent <= part.stocMinim && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPart(part);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-none hover:bg-blue-700 transition-colors"
                      >
                        Selectează
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredParts.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nu au fost găsite piese
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || selectedCategory || selectedBrand || showLowStockOnly
                    ? 'Încercați să modificați filtrele pentru a vedea mai multe rezultate.'
                    : 'Nu există piese în inventar. Adăugați piese în secțiunea "Gestiune Piese".'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Faceți click pe o piesă pentru a o selecta
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Închide
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PartsInventoryModal;