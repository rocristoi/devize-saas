import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit, Trash2, Search, AlertTriangle, Save, X, Import, Download } from 'lucide-react';
import { StoredPart } from '../types';
import { useNotifications } from './NotificationSystem';
import {
  getActiveParts,
  savePart,
  deletePart,
  searchParts,
  getLowStockParts,
  exportPartsData,
  importPartsData
} from '../utils/partsStorage';

const PartsManager = () => {
  const { showAlert, showConfirm } = useNotifications();
  const [parts, setParts] = useState<StoredPart[]>([]);
  const [filteredParts, setFilteredParts] = useState<StoredPart[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPart, setEditingPart] = useState<StoredPart | null>(null);
  const [lowStockParts, setLowStockParts] = useState<StoredPart[]>([]);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);

  // Form state for adding/editing parts
  const [formData, setFormData] = useState({
    codPiesa: '',
    numePiesa: '',
    brand: '',
    category: '',
    description: '',
    pret: '',
    stocCurent: '',
    stocMinim: '',
    furnizor: '',
    locatie: '',
    isActive: true
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Load parts on component mount
  useEffect(() => {
    loadParts();
    checkLowStock();
  }, []);

  // Filter parts when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredParts(searchParts(searchQuery));
    } else {
      setFilteredParts(parts);
    }
  }, [searchQuery, parts]);

  const loadParts = () => {
    const allParts = getActiveParts();
    setParts(allParts);
    setFilteredParts(allParts);
  };

  const checkLowStock = () => {
    const lowStock = getLowStockParts();
    setLowStockParts(lowStock);
    setShowLowStockAlert(lowStock.length > 0);
  };

  const resetForm = () => {
    setFormData({
      codPiesa: '',
      numePiesa: '',
      brand: '',
      category: '',
      description: '',
      pret: '',
      stocCurent: '',
      stocMinim: '',
      furnizor: '',
      locatie: '',
      isActive: true
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.codPiesa.trim()) {
      errors.codPiesa = 'Codul piesei este obligatoriu';
    }

    if (!formData.numePiesa.trim()) {
      errors.numePiesa = 'Numele piesei este obligatoriu';
    }

    const pret = parseFloat(formData.pret);
    if (isNaN(pret) || pret < 0) {
      errors.pret = 'Prețul trebuie să fie un număr pozitiv';
    }

    const stocCurent = parseInt(formData.stocCurent);
    if (isNaN(stocCurent) || stocCurent < 0) {
      errors.stocCurent = 'Stocul curent trebuie să fie un număr pozitiv';
    }

    const stocMinim = formData.stocMinim.trim() === '' ? 0 : parseInt(formData.stocMinim);
    if (isNaN(stocMinim) || stocMinim < 0) {
      errors.stocMinim = 'Stocul minim trebuie să fie un număr pozitiv';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePart = () => {
    if (!validateForm()) return;

    try {
      // Convert form data to proper types
      const partData = {
        codPiesa: formData.codPiesa.trim(),
        numePiesa: formData.numePiesa.trim(),
        brand: formData.brand.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        pret: parseFloat(formData.pret),
        stocCurent: parseInt(formData.stocCurent),
        stocMinim: formData.stocMinim.trim() === '' ? 0 : parseInt(formData.stocMinim),
        furnizor: formData.furnizor.trim(),
        locatie: formData.locatie.trim(),
        isActive: formData.isActive
      };

      savePart(partData);
      loadParts();
      checkLowStock();
      setShowAddModal(false);
      setEditingPart(null);
      resetForm();
    } catch (error) {
      console.error('Error saving part:', error);
      const errorMsg = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);
      showAlert(`Eroare la salvarea piesei: ${errorMsg}`, 'error');
    }
  };

  const handleEditPart = (part: StoredPart) => {
    setEditingPart(part);
    setFormData({
      codPiesa: part.codPiesa,
      numePiesa: part.numePiesa,
      brand: part.brand || '',
      category: part.category || '',
      description: part.description || '',
      pret: part.pret.toString(),
      stocCurent: part.stocCurent.toString(),
      stocMinim: (part.stocMinim || 0).toString(),
      furnizor: part.furnizor || '',
      locatie: part.locatie || '',
      isActive: part.isActive
    });
    setShowAddModal(true);
  };

  const handleDeletePart = async (partId: string) => {
    const confirmed = await showConfirm('Sunteți sigur că doriți să ștergeți această piesă?');
    if (confirmed) {
      try {
        const result = deletePart(partId);
        if (result) {
          loadParts();
          checkLowStock();
          showAlert('Piesa a fost ștearsă cu succes!', 'success');
        } else {
          showAlert('Nu s-a putut șterge piesa.', 'error');
        }
      } catch (error) {
        console.error('Error deleting part:', error);
        const errorMsg = typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : String(error);
        showAlert(`Eroare la ștergerea piesei: ${errorMsg}`, 'error');
      }
    }
  };


  const handleExportParts = () => {
    try {
      const data = exportPartsData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parts-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting parts:', error);
      const errorMsg = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : String(error);
      showAlert(`Eroare la exportul pieselor: ${errorMsg}`, 'error');
    }
  };

  const handleImportParts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        importPartsData(content);
        loadParts();
        checkLowStock();
        showAlert('Piesele au fost importate cu succes!', 'success');
      } catch (error) {
        console.error('Error importing parts:', error);
        const errorMsg = typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : String(error);
        showAlert(`Eroare la importul pieselor: ${errorMsg}`, 'error');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Gestiune Piese
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Administrați stocul de piese auto
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportParts}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-none hover:bg-gray-700 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-none hover:bg-gray-700 transition-colors cursor-pointer">
            <Import size={16} />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportParts}
              className="hidden"
            />
          </label>
          
          <button
            onClick={() => {
              resetForm();
              setEditingPart(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Adaugă Piesă
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {showLowStockAlert && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-none p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                Atenție: {lowStockParts.length} piese cu stoc redus
              </span>
            </div>
            <button
              onClick={() => setShowLowStockAlert(false)}
              className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            {lowStockParts.map(part => `${part.numePiesa} (${part.stocCurent})`).join(', ')}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Căutați piese după nume, cod, brand sau categorie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Parts Table */}
      <div className="bg-white dark:bg-gray-900 rounded-none shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Cod</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Nume Piesă</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Brand</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Categorie</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Preț</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Stoc</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Stoc Min.</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredParts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 font-mono text-sm">{part.codPiesa}</td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{part.numePiesa}</div>
                      {part.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {part.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{part.brand || '-'}</td>
                  <td className="px-4 py-3">{part.category || '-'}</td>
                  <td className="px-4 py-3 font-medium">{part.pret.toFixed(2)} RON</td>
                  <td className="px-4 py-3">{part.stocCurent}</td>
                  <td className="px-4 py-3">{part.stocMinim || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditPart(part)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        title="Editează"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePart(part.id)}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                        title="Șterge"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredParts.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Nu au fost găsite piese care să corespundă căutării.' : 'Nu există piese în baza de date.'}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-none shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {editingPart ? 'Editează Piesa' : 'Adaugă Piesă Nouă'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPart(null);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cod Piesa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cod Piesă *
                  </label>
                  <input
                    type="text"
                    value={formData.codPiesa}
                    onChange={(e) => setFormData({ ...formData, codPiesa: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                      formErrors.codPiesa ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ex: BRK001"
                  />
                  {formErrors.codPiesa && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.codPiesa}</p>
                  )}
                </div>

                {/* Nume Piesa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nume Piesă *
                  </label>
                  <input
                    type="text"
                    value={formData.numePiesa}
                    onChange={(e) => setFormData({ ...formData, numePiesa: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                      formErrors.numePiesa ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Ex: Plăcuțe frână față"
                  />
                  {formErrors.numePiesa && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.numePiesa}</p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Ex: Bosch"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categorie
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Ex: Sistem de frânare"
                  />
                </div>

                {/* Pret */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preț (RON) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pret}
                    onChange={(e) => setFormData({ ...formData, pret: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                      formErrors.pret ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="0.00"
                  />
                  {formErrors.pret && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.pret}</p>
                  )}
                </div>

                {/* Stoc Curent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stoc Curent *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stocCurent}
                    onChange={(e) => setFormData({ ...formData, stocCurent: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                      formErrors.stocCurent ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="0"
                  />
                  {formErrors.stocCurent && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.stocCurent}</p>
                  )}
                </div>

                {/* Stoc Minim */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stoc Minim
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stocMinim}
                    onChange={(e) => setFormData({ ...formData, stocMinim: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="0"
                  />
                </div>

                {/* Furnizor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Furnizor
                  </label>
                  <input
                    type="text"
                    value={formData.furnizor}
                    onChange={(e) => setFormData({ ...formData, furnizor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Ex: Auto Parts SRL"
                  />
                </div>

                {/* Locatie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Locație Depozit
                  </label>
                  <input
                    type="text"
                    value={formData.locatie}
                    onChange={(e) => setFormData({ ...formData, locatie: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Ex: Raft A1, Pozitia 3"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descriere
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Descriere detaliată a piesei..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPart(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-none text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Anulează
                </button>
                <button
                  onClick={handleSavePart}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-none hover:bg-blue-700"
                >
                  <Save size={16} />
                  {editingPart ? 'Actualizează' : 'Salvează'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PartsManager;