import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Car, User, Search, ChevronDown, ChevronRight, Edit, FileText, Trash2 } from 'lucide-react';
import { StoredDeviz } from '../types';
import { getAllDevizes, searchDevizes, deleteDeviz } from '../utils/devizStorage';
import { getDisplayLicensePlate } from '../utils/licensePlateUtils';
import { useNotifications } from './NotificationSystem';

interface DevizHistoryTabProps {
  onEditDeviz: (deviz: StoredDeviz) => void;
}

const DevizHistoryTab: React.FC<DevizHistoryTabProps> = ({ onEditDeviz }) => {
  const { showAlert, showConfirm } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [devizes, setDevizes] = useState<StoredDeviz[]>([]);
  const [filteredDevizes, setFilteredDevizes] = useState<StoredDeviz[]>([]);
  const [expandedDeviz, setExpandedDeviz] = useState<string | null>(null);

  // Load all devizes on mount
  useEffect(() => {
    loadDevizes();
  }, []);

  // Filter devizes when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchDevizes(searchQuery);
      setFilteredDevizes(results);
    } else {
      setFilteredDevizes(devizes);
    }
  }, [searchQuery, devizes]);

  const loadDevizes = () => {
    const allDevizes = getAllDevizes();
    setDevizes(allDevizes);
    setFilteredDevizes(allDevizes);
  };

  const handleEditDeviz = (deviz: StoredDeviz) => {
    onEditDeviz(deviz);
  };

  const handleDeleteDeviz = async (deviz: StoredDeviz) => {
    const confirmed = await showConfirm(
      `Sigur doriți să ștergeți devizul #${deviz.series}?\n\nAceastă acțiune va șterge:\n- Devizul din istoric\n- Înregistrarea de service asociată\n\nAceastă acțiune nu poate fi anulată!`
    );

    if (confirmed) {
      const success = deleteDeviz(deviz.series);
      if (success) {
        showAlert(`Devizul #${deviz.series} a fost șters complet din toate bazele de date.`, 'success');
        loadDevizes();
      } else {
        showAlert(`Eroare la ștergerea devizului #${deviz.series}.`, 'error');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Istoric Devize</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Vizualizează și editează istoricul devizelor generate
        </p>
      </div>

      {/* Search Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-none p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Căutați după serie, client, vehicul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Deviz List */}
      <AnimatePresence mode="wait">
        {filteredDevizes.length > 0 ? (
          <motion.div
            key="deviz-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {filteredDevizes.map((deviz) => (
              <motion.div
                key={deviz.series}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1}}
                className="bg-white dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Deviz Header */}
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => setExpandedDeviz(expandedDeviz === deviz.series ? null : deviz.series)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center">
                        {expandedDeviz === deviz.series ? (
                          <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Deviz #{deviz.series}
                            </h3>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Client:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {deviz.clientInfo.nume}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Vehicul:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {deviz.vehicleInfo.marca} {deviz.vehicleInfo.model}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Data:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatDate(deviz.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 ml-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(deviz.totalDevis)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedDeviz === deviz.series && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: 1, 
                        height: 'auto',
                        transition: { 
                          duration: 0.3,
                          ease: [0.4, 0.0, 0.2, 1]
                        }
                      }}
                      exit={{ 
                        opacity: 0, 
                        height: 0,
                        transition: { 
                          duration: 0.2,
                          ease: [0.4, 0.0, 1, 1]
                        }
                      }}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                        {/* Client and Vehicle Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {/* Client Info */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              Informații Client
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Nume:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {deviz.clientInfo.nume}
                                </span>
                              </div>
                              {deviz.clientInfo.cuiCnp && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">CUI/CNP:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {deviz.clientInfo.cuiCnp}
                                  </span>
                                </div>
                              )}
                              {deviz.clientInfo.numarTelefon && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Telefon:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {deviz.clientInfo.numarTelefon}
                                  </span>
                                </div>
                              )}
                              {deviz.clientInfo.locatie && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Locație:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {deviz.clientInfo.locatie}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Vehicle Info */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                              Informații Vehicul
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Vehicul:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {deviz.vehicleInfo.marca} {deviz.vehicleInfo.model}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Nr. înmatriculare:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {getDisplayLicensePlate(deviz.vehicleInfo.numarInmatriculare)}
                                </span>
                              </div>
                              {deviz.vehicleInfo.anFabricatie && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">An fabricație:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {deviz.vehicleInfo.anFabricatie}
                                  </span>
                                </div>
                              )}
                              {deviz.vehicleInfo.km && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">KM:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {deviz.vehicleInfo.km}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Parts and Labor */}
                        {((deviz.parts && deviz.parts.length > 0) || (deviz.labor && deviz.labor.length > 0)) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Parts */}
                            {deviz.parts && deviz.parts.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                  Piese utilizate ({deviz.parts.length})
                                </h4>
                                <div className="space-y-2">
                                  {deviz.parts.map((part, index) => (
                                    <div key={index} className="flex justify-between text-sm py-1">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {part.numePiesa} x{part.bucati}
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(part.pretTotal)}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                                    <div className="flex justify-between text-sm font-semibold">
                                      <span className="text-gray-700 dark:text-gray-300">Total piese:</span>
                                      <span className="text-gray-900 dark:text-white">
                                        {formatCurrency(deviz.totalPiese)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Labor */}
                            {deviz.labor && deviz.labor.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                  Manoperă ({deviz.labor.length})
                                </h4>
                                <div className="space-y-2">
                                  {deviz.labor.map((labor, index) => (
                                    <div key={index} className="flex justify-between text-sm py-1">
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {labor.manopera} ({labor.durata})
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(labor.pretTotal)}
                                      </span>
                                    </div>
                                  ))}
                                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                                    <div className="flex justify-between text-sm font-semibold">
                                      <span className="text-gray-700 dark:text-gray-300">Total manoperă:</span>
                                      <span className="text-gray-900 dark:text-white">
                                        {formatCurrency(deviz.totalManopera)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDeviz(deviz);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-none text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Șterge</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDeviz(deviz);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-none text-sm font-medium text-white transition-colors shadow-md hover:shadow-lg"
                            style={{
                              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-600))',
                            }}
                          >
                            <Edit className="w-4 h-4" />
                            <span>Editează Deviz</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-none flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'Nu s-au găsit devize' : 'Nu există devize în istoric'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchQuery
                ? 'Încercați să căutați după un alt termen.'
                : 'Devizele generate vor apărea aici și vor putea fi editate.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DevizHistoryTab;

