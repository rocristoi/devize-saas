import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Moon, Sun, Menu, X, ArrowRight, ArrowLeft, RotateCcw, FileText, History, Package, Search, HelpCircle, ClipboardList } from 'lucide-react';
import { generatePDFFromWeb, generateWebDeviz } from './utils/webDevizGenerator';
import { ClientInfo, VehicleInfo, Part, Labor, QuoteData, StoredClient, StoredVehicle, StoredDeviz } from './types';
import ClientInfoForm from './components/ClientInfoForm';
import VehicleInfoForm from './components/VehicleInfoForm';
import PartsTable from './components/PartsTable';
import LaborTable from './components/LaborTable';
import TotalsSection from './components/TotalsSection';
import ServiceHistoryViewer from './components/ServiceHistoryViewer';
import PartsManager from './components/PartsManager';
import SearchTab from './components/SearchTab';
import HelpTab from './components/HelpTab';
import DevizHistoryTab from './components/DevizHistoryTab';
import { NotificationProvider, useNotifications } from './components/NotificationSystem';
import { brandingConfig } from './config/branding';
import ThemeManager from './utils/themeManager';
import { getCurrentSeries, setSeries, temporarilySetSeries, restoreStoredSeries } from './utils/seriesManager';
import { saveClient, saveVehicle, addServiceRecord, isDuplicateServiceRecord, getVehicle, searchClients } from './utils/clientVehicleStorage';
import { usePartInQuote, updateStockAfterService } from './utils/partsStorage';
import { validateAndCleanLicensePlate } from './utils/licensePlateUtils';
import { saveDeviz, updateDeviz } from './utils/devizStorage';
import LicenseWrapper from './components/LicenseWrapper';

// Dark mode context
interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = React.createContext<DarkModeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

export const useDarkMode = () => React.useContext(DarkModeContext);

const AppContent = () => {
  const { showAlert, showConfirm } = useNotifications();
  const [showPreview, setShowPreview] = useState(false);
  
  // Initialize dark mode from localStorage to prevent flash
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        return JSON.parse(savedDarkMode);
      }
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminSeriesInput, setAdminSeriesInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'deviz' | 'history' | 'parts' | 'help' | 'devizHistory'>('deviz');
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState<string | null>(null);
  
  // Editing deviz state
  const [isEditingDeviz, setIsEditingDeviz] = useState(false);
  const [editingDevizSeries, setEditingDevizSeries] = useState<string | null>(null);
  
  // Preserve search tab state
  const [searchTabState, setSearchTabState] = useState<{
    searchQuery: string;
    searchType: 'clients' | 'vehicles';
    expandedClient: string | null;
  }>({
    searchQuery: '',
    searchType: 'clients',
    expandedClient: null
  });
  
useEffect(() => {
  getCurrentSeries();
}, []);

  // Initialize theme system and apply dark mode
  useEffect(() => {
    // Initialize theme system
    ThemeManager.getInstance().initializeTheme();
    
    // Apply dark mode class immediately
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Apply dark mode to html element and save to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Admin keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+A pentru acces admin
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setShowAdminModal(true);
        setAdminSeriesInput(getCurrentSeries());
        setAdminError('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Admin functions
  const handleAdminSubmit = () => {
    if (!adminSeriesInput || adminSeriesInput.length !== 6 || !/^\d+$/.test(adminSeriesInput)) {
      setAdminError('Seria trebuie să fie un număr de 6 cifre!');
      return;
    }

    try {
      setSeries(adminSeriesInput);
      setAdminError('');
      setShowAdminModal(false);
      // Force re-render to show new series
      window.location.reload();
    } catch (error) {
      setAdminError('Eroare la setarea seriei!');
    }
  };

  const handleAdminCancel = () => {
    setShowAdminModal(false);
    setAdminSeriesInput('');
    setAdminError('');
  };

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    nume: '',
    cuiCnp: '',
    locatie: '',
    strada: '',
    numarTelefon: '',
    motivIntrare: '',
    observatii: '',
    dataIntrare: '',
    dataIesire: ''
  });

  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    marca: '',
    model: '',
    numarInmatriculare: '',
    seriaSasiu: '',
    nivelCarburant: '',
    capacitateCilindrica: '',
    anFabricatie: '',
    km: '',
    culoare: ''
  });

  const [parts, setParts] = useState<Part[]>([]);
  const [labor, setLabor] = useState<Labor[]>([]);
  
  // Flags to track if data was loaded from search tab (to avoid showing "existing" notifications)
  const [isClientFromSearch, setIsClientFromSearch] = useState(false);
  const [isVehicleFromSearch, setIsVehicleFromSearch] = useState(false);

  // Functions for precompleting data from search and existing client/vehicle detection
  const handleClientSelect = (client: StoredClient) => {
    // Prefill client data
    setClientInfo({
      nume: client.nume,
      cuiCnp: client.cuiCnp,
      locatie: client.locatie,
      strada: client.strada,
      numarTelefon: client.numarTelefon,
      motivIntrare: '',
      observatii: '',
      dataIntrare: '',
      dataIesire: ''
    });
    
    // Clear vehicle data
    setVehicleInfo({
      marca: '',
      model: '',
      numarInmatriculare: '',
      seriaSasiu: '',
      nivelCarburant: '',
      capacitateCilindrica: '',
      anFabricatie: '',
      km: '',
      culoare: ''
    });
    
    // Mark as loaded from search to avoid "existing" notifications
    setIsClientFromSearch(true);
    setIsVehicleFromSearch(false);
    
    // Switch to deviz tab
    setActiveTab('deviz');
  };

  const handleClientVehicleSelect = (client: StoredClient, vehicle: StoredVehicle) => {
    // Prefill client data
    setClientInfo({
      nume: client.nume,
      cuiCnp: client.cuiCnp,
      locatie: client.locatie,
      strada: client.strada,
      numarTelefon: client.numarTelefon,
      motivIntrare: '',
      observatii: '',
      dataIntrare: '',
      dataIesire: ''
    });
    
    // Prefill vehicle data
    setVehicleInfo({
      marca: vehicle.marca,
      model: vehicle.model,
      numarInmatriculare: vehicle.licensePlate,
      seriaSasiu: vehicle.vin,
      nivelCarburant: '',
      capacitateCilindrica: vehicle.capacitateCilindrica,
      anFabricatie: vehicle.anFabricatie,
      km: vehicle.lastKm,
      culoare: vehicle.culoare
    });
    
    // Mark both as loaded from search to avoid "existing" notifications
    setIsClientFromSearch(true);
    setIsVehicleFromSearch(true);
    
    // Switch to deviz tab
    setActiveTab('deviz');
  };

  const handleViewHistory = (vehicle: StoredVehicle) => {
    setSelectedVehicleForHistory(vehicle.licensePlate);
    setActiveTab('history');
  };

  // New handler for existing client selection from ClientInfoForm
  const handleExistingClientSelect = (client: StoredClient) => {
    setClientInfo({
      nume: client.nume,
      cuiCnp: client.cuiCnp,
      locatie: client.locatie,
      strada: client.strada,
      numarTelefon: client.numarTelefon,
      motivIntrare: clientInfo.motivIntrare, // Keep current values
      observatii: clientInfo.observatii,
      dataIntrare: clientInfo.dataIntrare,
      dataIesire: clientInfo.dataIesire
    });
    // Mark as loaded from search to avoid showing notification again
    setIsClientFromSearch(true);
  };

  // New handler for existing vehicle selection from VehicleInfoForm
  const handleExistingVehicleSelect = (vehicle: StoredVehicle) => {
    setVehicleInfo({
      marca: vehicle.marca,
      model: vehicle.model,
      numarInmatriculare: vehicle.licensePlate,
      seriaSasiu: vehicle.vin,
      nivelCarburant: vehicleInfo.nivelCarburant, // Keep current value
      capacitateCilindrica: vehicle.capacitateCilindrica,
      anFabricatie: vehicle.anFabricatie,
      km: vehicle.lastKm,
      culoare: vehicle.culoare
    });
    // Mark as loaded from search to avoid showing notification again
    setIsVehicleFromSearch(true);
  };

  // Handler for creating new quote from ServiceHistoryViewer
  const handleCreateQuoteFromHistory = (client: StoredClient, vehicle: StoredVehicle) => {
    // Prefill client data
    setClientInfo({
      nume: client.nume,
      cuiCnp: client.cuiCnp,
      locatie: client.locatie,
      strada: client.strada,
      numarTelefon: client.numarTelefon,
      motivIntrare: '',
      observatii: '',
      dataIntrare: '',
      dataIesire: ''
    });
    
    // Prefill vehicle data
    setVehicleInfo({
      marca: vehicle.marca,
      model: vehicle.model,
      numarInmatriculare: vehicle.licensePlate,
      seriaSasiu: vehicle.vin,
      nivelCarburant: '',
      capacitateCilindrica: vehicle.capacitateCilindrica,
      anFabricatie: vehicle.anFabricatie,
      km: vehicle.lastKm,
      culoare: vehicle.culoare
    });
    
    // Mark both as loaded from search to avoid "existing" notifications
    setIsClientFromSearch(true);
    setIsVehicleFromSearch(true);
    
    // Clear parts and labor for new quote
    setParts([]);
    setLabor([]);
    
    // Switch to deviz tab
    setActiveTab('deviz');
  };

  // Handler for editing deviz from DevizHistoryTab
  const handleEditDeviz = (deviz: StoredDeviz) => {
    // Set editing mode
    setIsEditingDeviz(true);
    setEditingDevizSeries(deviz.series);
    
    // Temporarily store current series and set to editing deviz series
    temporarilySetSeries(deviz.series);
    
    // Load deviz data into forms
    setClientInfo(deviz.clientInfo);
    setVehicleInfo(deviz.vehicleInfo);
    setParts(deviz.parts.map(part => ({ ...part })));
    setLabor(deviz.labor.map(lab => ({ ...lab })));
    
    // Mark as loaded from history to avoid notifications
    setIsClientFromSearch(true);
    setIsVehicleFromSearch(true);
    
    // Switch to deviz tab
    setActiveTab('deviz');
    
    // Show notification
    showAlert(`Editare deviz #${deviz.series}. La generare, devizul original va fi actualizat.`, 'info');
  };




  const handleClientInfoChange = (field: keyof ClientInfo, value: string) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
    // Reset flag when user manually changes client data
    if (field === 'nume' || field === 'numarTelefon') {
      setIsClientFromSearch(false);
    }
  };

  const handleVehicleInfoChange = (field: keyof VehicleInfo, value: string) => {
    setVehicleInfo(prev => ({ ...prev, [field]: value }));
    // Reset flag when user manually changes vehicle data
    if (field === 'numarInmatriculare') {
      setIsVehicleFromSearch(false);
    }
  };

  const addPart = () => {
    const newPart: Part = {
      codPiesa: '',
      numePiesa: '',
      bucati: 1,
      stare: '',
      pret: 0,
      discount: 0,
      pretTotal: 0
    };
    setParts(prev => [...prev, newPart]);
  };

  const updatePart = (index: number, field: keyof Part, value: string | number) => {
    setParts(prev => {
      const updated = [...prev];
      
      if (field === 'pret' || field === 'discount' || field === 'bucati') {
        if (typeof value === 'string') {
          if (value === '') {
            updated[index] = { ...updated[index], [field]: 0 };
          } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              updated[index] = { ...updated[index], [field]: numValue };
            }
            // Dacă este NaN, nu face nimic (păstrează valoarea veche)
          }
        } else {
          // Dacă este deja număr, folosește-l direct
          updated[index] = { ...updated[index], [field]: value };
        }
        
        // Recalculează pretTotal după actualizarea câmpurilor
        const part = updated[index];
        const pretTotal = Math.max(0, (part.pret * part.bucati) - part.discount);
        updated[index] = { ...updated[index], pretTotal };
        
      } else {
        // Pentru câmpurile non-numerice, folosește valoarea direct
        updated[index] = { ...updated[index], [field]: value };
      }
      
      return updated;
    });
  };

  const removePart = (index: number) => {
    setParts(prev => prev.filter((_, i) => i !== index));
  };

  const addLabor = () => {
    const newLabor: Labor = {
      manopera: '',
      durata: '',
      pret: 0,
      discount: 0,
      pretTotal: 0
    };
    setLabor(prev => [...prev, newLabor]);
  };

  const updateLabor = (index: number, field: keyof Labor, value: string | number) => {
    setLabor(prev => {
      const updated = [...prev];
      
      if (field === 'pret' || field === 'discount') {
        if (typeof value === 'string') {
          if (value === '') {
            updated[index] = { ...updated[index], [field]: 0 };
          } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              updated[index] = { ...updated[index], [field]: numValue };
            }
            // Dacă este NaN, nu face nimic (păstrează valoarea veche)
          }
        } else {
          // Dacă este deja număr, folosește-l direct
          updated[index] = { ...updated[index], [field]: value };
        }
        
        // Recalculează pretTotal după actualizarea câmpurilor
        const labor = updated[index];
        const pretTotal = Math.max(0, labor.pret - labor.discount);
        updated[index] = { ...updated[index], pretTotal };
        
      } else {
        // Pentru câmpurile non-numerice, folosește valoarea direct
        updated[index] = { ...updated[index], [field]: value };
      }
      
      return updated;
    });
  };  const removeLabor = (index: number) => {
    setLabor(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to safely calculate part total with validation
  const calculatePartTotal = (part: Part): number => {
    const pret = typeof part.pret === 'number' && !isNaN(part.pret) ? part.pret : 0;
    const bucati = typeof part.bucati === 'number' && !isNaN(part.bucati) ? part.bucati : 0;
    const discount = typeof part.discount === 'number' && !isNaN(part.discount) ? part.discount : 0;
    
    // Ensure values are non-negative
    const safePret = Math.max(0, pret);
    const safeBucati = Math.max(0, bucati);
    const safeDiscount = Math.max(0, discount);
    
    return Math.max(0, (safePret * safeBucati) - safeDiscount);
  };

  // Helper function to safely calculate labor total with validation
  const calculateLaborTotal = (lab: Labor): number => {
    const pret = typeof lab.pret === 'number' && !isNaN(lab.pret) ? lab.pret : 0;
    const discount = typeof lab.discount === 'number' && !isNaN(lab.discount) ? lab.discount : 0;
    
    // Ensure values are non-negative
    const safePret = Math.max(0, pret);
    const safeDiscount = Math.max(0, discount);
    
    return Math.max(0, safePret - safeDiscount);
  };

  const calculateTotals = () => {
    const totalPiese = parts.reduce((total, part) => {
      return total + calculatePartTotal(part);
    }, 0);

    const totalManopera = labor.reduce((total, lab) => {
      return total + calculateLaborTotal(lab);
    }, 0);

    return {
      totalPiese,
      totalManopera,
      totalDevis: totalPiese + totalManopera
    };
  };

  const generatePDF = async () => {
    try {
      if (!clientInfo.nume.trim()) {
        showAlert('Vă rugăm să completați numele clientului pentru a genera devizul.', 'error');
        return;
      }

      if (!vehicleInfo.marca.trim() || !vehicleInfo.model.trim()) {
        showAlert('Vă rugăm să completați marca și modelul vehiculului pentru a genera devizul.', 'error');
        return;
      }

      if (parts.length === 0 && labor.length === 0) {
        showAlert('Vă rugăm să adăugați cel puțin o piesă sau o manoperă pentru a genera devizul.', 'error');
        return;
      }

      if (typeof window !== 'undefined' && (window as any).validatePartsStock) {
        const stockValidation = (window as any).validatePartsStock();
        if (!stockValidation.isValid) {
          const errorMessage = 'Probleme de stoc detectate:\n\n' + stockValidation.errors.join('\n');
          const userChoice = await showConfirm(errorMessage + '\n\nDoriți să continuați cu generarea devizului în ciuda acestor probleme?');
          if (!userChoice) {
            return;
          }
        }
      }

      const totals = calculateTotals();
      
      if (totals.totalDevis <= 0) {
        showAlert('Totalul devizului trebuie să fie mai mare decât zero.', 'error');
        return;
      }

      const quoteData: QuoteData = {
        clientInfo,
        vehicleInfo,
        parts,
        labor,
        ...totals,
        series: ''
      };

      // Handle editing mode - series is already set by temporarilySetSeries
      const isEditing = !!(isEditingDeviz && editingDevizSeries);

      await generatePDFFromWeb(quoteData, isEditing);

      try {
        console.log('Updating inventory stock for used parts...');
        parts.forEach(part => {
          if (part.codPiesa.trim() && part.bucati > 0) {
            const success = usePartInQuote(part.codPiesa, part.bucati);
            if (success) {
              console.log(`Reduced stock for part ${part.codPiesa} by ${part.bucati} units`);
            } else {
              console.warn(`Failed to reduce stock for part ${part.codPiesa} - part not found in inventory or insufficient stock`);
            }
          }
        });
      } catch (stockError) {
        console.error('Error updating inventory stock:', stockError);
      }

      try {
        let savedClient: import('./types').StoredClient | undefined = undefined;
        let savedVehicle: import('./types').StoredVehicle | undefined = undefined;

        if (clientInfo.nume.trim()) {
          // First, try to find existing client by name and phone
          let existingClient: StoredClient | null = null;
          if (clientInfo.nume.trim() && clientInfo.numarTelefon.trim()) {
            const clients = searchClients(clientInfo.nume);
            existingClient = clients.find(client => 
              client.nume.toLowerCase() === clientInfo.nume.toLowerCase() && 
              client.numarTelefon === clientInfo.numarTelefon
            ) || null;
          }

          if (existingClient) {
            // Use existing client but update with current form data
            savedClient = saveClient({
              ...clientInfo,
              cuiCnp: existingClient.cuiCnp || clientInfo.cuiCnp // Keep existing CNP/CUI for display
            });
            console.log('Using existing client:', savedClient.nume, 'ID:', savedClient.id);
          } else {
            // Create new client (ID will be generated from name + phone)
            savedClient = saveClient(clientInfo);
            console.log('Created new client:', savedClient.nume, 'ID:', savedClient.id);
          }
        } else {
          console.log('Insufficient client data - name is required for saving');
        }

        if (savedClient && vehicleInfo.numarInmatriculare.trim() && vehicleInfo.marca.trim() && vehicleInfo.model.trim()) {
          const licensePlateValidation = validateAndCleanLicensePlate(vehicleInfo.numarInmatriculare);
          if (!licensePlateValidation.isValid) {
            console.warn('Invalid license plate format:', licensePlateValidation.error);
          }

          // Use cleaned license plate for saving
          const cleanedVehicleInfo = {
            ...vehicleInfo,
            numarInmatriculare: licensePlateValidation.cleaned
          };

          // Check if this is a vehicle reassignment (vehicle exists but belongs to different client)
          const existingVehicle = getVehicle(licensePlateValidation.cleaned);
          const isVehicleReassignment = existingVehicle && existingVehicle.clientId !== savedClient.id;

          savedVehicle = saveVehicle(cleanedVehicleInfo, savedClient.id);
          console.log('Vehicle saved/updated:', `${savedVehicle.marca} ${savedVehicle.model} (${savedVehicle.licensePlate})`);
          
          // Show notification only if vehicle was reassigned from one client to another
          if (isVehicleReassignment) {
            showAlert(`Mașina cu numărul ${savedVehicle.licensePlate} a fost atribuită către ${savedClient.nume}`, 'success');
            console.log(`Vehicle reassignment: ${savedVehicle.licensePlate} moved from client ${existingVehicle.clientId} to ${savedClient.id}`);
          }
        } else {
          console.log('Insufficient vehicle data or no client - skipping vehicle save');
        }

        if (savedVehicle) {
            let seriesNum = parseInt(getCurrentSeries(), 10);
            let series = (seriesNum > 0 ? (seriesNum - 1).toString().padStart(6, '0') : getCurrentSeries());
          
          // Save or update deviz in deviz history
          if (isEditing) {
            // Update existing deviz
            updateDeviz(editingDevizSeries!, clientInfo, vehicleInfo, parts, labor, totals);
            console.log(`Deviz ${editingDevizSeries} updated successfully`);
            showAlert(`Devizul #${editingDevizSeries} a fost actualizat cu succes!`, 'success');
          } else {
            // Save new deviz
            const isDuplicate = isDuplicateServiceRecord(savedVehicle, series, 60000);
            
            if (!isDuplicate) {
              // Save to service records
              const serviceRecord = addServiceRecord(
                savedVehicle.licensePlate,
                clientInfo,
                vehicleInfo,
                parts,
                labor,
                totals,
                series
              );
              console.log('Service record saved successfully:', serviceRecord.id);
              
              // Save to deviz history
              saveDeviz(series, clientInfo, vehicleInfo, parts, labor, totals);
              console.log('Deviz saved to history:', series);
              
              // Update stock for all parts used in service
              updateStockAfterService(parts);
            } else {
              console.warn('Duplicate service record detected - skipping save');
            }
          }
        } else {
          console.log('No vehicle to save service record to');
        }
        
        // Restore series and reset editing mode if editing
        if (isEditing) {
          restoreStoredSeries();
          setIsEditingDeviz(false);
          setEditingDevizSeries(null);
          console.log('Series restored after editing');
        }

      } catch (saveError) {
        console.error('Error saving client/vehicle data:', saveError);
        // PDF was generated successfully, so this is not a critical error
        showAlert('Devizul a fost generat cu succes, dar s-a întâmpinat o problemă la salvarea datelor: ' + saveError, 'warning');
      }

      console.log('PDF generation and data save completed');

    } catch (error) {
      console.error('Error in generatePDF:', error);
      showAlert('S-a întâmpinat o eroare la generarea devizului. Vă rugăm să încercați din nou.', 'error');
    }
  };

  const resetAllData = () => {
    setClientInfo({
      nume: '',
      cuiCnp: '',
      locatie: '',
      strada: '',
      numarTelefon: '',
      motivIntrare: '',
      observatii: '',
      dataIntrare: '',
      dataIesire: ''
    });

    setVehicleInfo({
      marca: '',
      model: '',
      numarInmatriculare: '',
      seriaSasiu: '',
      nivelCarburant: '',
      capacitateCilindrica: '',
      anFabricatie: '',
      km: '',
      culoare: ''
    });

    setParts([]);
    setLabor([]);
    setSelectedVehicleForHistory(null);
    setSearchTabState({
      searchQuery: '',
      searchType: 'clients',
      expandedClient: null
    });
    
    // Reset editing mode if active
    if (isEditingDeviz) {
      restoreStoredSeries();
      setIsEditingDeviz(false);
      setEditingDevizSeries(null);
    }
    
    // Trimite userul înapoi la editare după resetare
    setShowPreview(false);
  };

  return (
      <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
        <div className={`min-h-screen flex flex-col transition-all duration-300 ${isDarkMode ? 'dark' : ''}`}>
          <header className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 md:px-8 py-4 flex justify-between items-center shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
            <div className="flex items-center gap-6">
              <div className="flex items-center">
              <img 
                src={brandingConfig.visual.logo.uri} 
                alt={brandingConfig.visual.logo.alt} 
                style={{ height: 30 }}
                className="w-auto object-contain transition-all duration-200" 
              />
            </div>
            <div className='h-10 w-[1px] bg-gray-200 dark:bg-gray-700 '></div>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0">
                Sistem Devize Auto
              </h1>
              {/*<p className="text-sm text-gray-600 dark:text-gray-400 m-0 font-medium">{brandingConfig.app.title}</p>*/}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {showPreview && (
              <button 
                className="p-2 rounded-none bg-transparent border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 md:hidden" 
                onClick={() => setShowSidebar(!showSidebar)}
                aria-label="Toggle sidebar"
              >
                <Menu size={20} />
              </button>
            )}
            
            <button 
              className="p-2 rounded-none bg-transparent border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 md:hidden" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <div className="flex gap-3 items-center">
            <button 
              className="px-6 py-3 rounded-none bg-transparent border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-sm hover:shadow-md" 
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {!showPreview && (
              <button 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-none text-sm font-medium cursor-pointer transition-all duration-200 text-white shadow-md hover:shadow-lg" 
                onClick={() => setShowPreview(true)}
                style={{
                  background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-600))',
                  borderColor: 'var(--color-primary)',
                  border: '1px solid'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--color-primary-600), var(--color-primary-700))';
                  e.currentTarget.style.borderColor = 'var(--color-primary-600)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, var(--color-primary), var(--color-primary-600))';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
              >
                <ArrowRight size={16} />
                <span>Continua</span>
              </button>
            )}
          </div>
        </header>

        <main className={`flex-1 transition-all duration-300 ${showPreview ? 'p-0' : 'p-4 md:p-8'}`}>
          {showPreview ? (
            <div className="flex h-[calc(100vh-80px)] overflow-hidden scrollbar-hide">
              {/* Sidebar cu informații - Desktop */}
              {/* Sidebar cu informații - Desktop */}
              <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto hidden md:block flex-shrink-0">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informații Deviz</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seria Devizului</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-mono">#{getCurrentSeries()}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{clientInfo.nume || 'Necunoscut'}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicul</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{vehicleInfo.marca} {vehicleInfo.model}</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{calculateTotals().totalDevis.toFixed(2)} RON</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Acțiuni</h3>
                  <div className="space-y-3">
                    <button 
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-none text-sm font-medium hover:bg-blue-700 transition-colors"
                      onClick={generatePDF}
                    >
                      Generează PDF
                    </button>
                    <button 
                      className="w-full px-4 py-3 bg-gray-600 text-white rounded-none text-sm font-medium hover:bg-gray-700 transition-colors"
                      onClick={() => setShowPreview(false)}
                    >
                      Înapoi la Editare
                    </button>
                    <button 
                      className="w-full px-4 py-3 bg-red-600 text-white rounded-none text-sm font-medium hover:bg-red-700 transition-colors"
                      onClick={resetAllData}
                    >
                      <RotateCcw size={16} className="inline mr-2" />
                      Resetează Datele
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>Previzualizarea oferă o estimare a aspectului final al PDF-ului generat. Versiunea finală poate diferi, în special în ceea ce privește page break-urile.</p>
                </div>
              </div>

              {/* Sidebar Mobile */}
              {showSidebar && (
                <div className="fixed inset-0 z-50 md:hidden">
                  <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSidebar(false)}></div>
                  <div className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto flex-shrink-0">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informații</h3>
                      <button 
                        onClick={() => setShowSidebar(false)}
                        className="p-2 rounded-none bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informații Deviz</h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{clientInfo.nume || 'Necunoscut'}</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicul</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{vehicleInfo.marca} {vehicleInfo.model}</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{calculateTotals().totalDevis.toFixed(2)} RON</div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Acțiuni</h3>
                      <div className="space-y-3">
                        <button 
                          className="w-full px-4 py-3 bg-blue-600 text-white rounded-none text-sm font-medium hover:bg-blue-700 transition-colors"
                          onClick={generatePDF}
                        >
                          Generează PDF
                        </button>
                        <button 
                          className="w-full px-4 py-3 bg-gray-600 text-white rounded-none text-sm font-medium hover:bg-gray-700 transition-colors"
                          onClick={() => setShowPreview(false)}
                        >
                          Înapoi la Editare
                        </button>
                        <button 
                          className="w-full px-4 py-3 bg-red-600 text-white rounded-none text-sm font-medium hover:bg-red-700 transition-colors"
                          onClick={resetAllData}
                        >
                          <RotateCcw size={16} className="inline mr-2" />
                          Resetează Datele
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Previzualizare full-screen */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 overflow-y-auto flex-shrink-0">
                <div className="p-6 min-h-full">
                  {/* Butoane pentru previzualizare - doar pe mobile */}
                  <div className="flex gap-3 mb-4 md:hidden">
                    <button 
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-600 rounded-none text-sm font-medium cursor-pointer transition-all duration-200 bg-gray-600 text-white hover:bg-gray-700 hover:border-gray-700"
                      onClick={() => setShowPreview(false)}
                    >
                      <ArrowLeft size={16} />
                      <span>Înapoi</span>
                    </button>
                    <button 
                      className="inline-flex items-center gap-2 px-4 py-2 border border-red-600 rounded-none text-sm font-medium cursor-pointer transition-all duration-200 bg-red-600 text-white hover:bg-red-700 hover:border-red-700"
                      onClick={resetAllData}
                    >
                      <RotateCcw size={16} />
                      <span>Resetează</span>
                    </button>
                  </div>
                  
                  <div 
                    className="bg-white dark:bg-white shadow-lg rounded-none p-8 max-w-4xl mx-auto"
                    dangerouslySetInnerHTML={{ 
                      __html: generateWebDeviz({
                        clientInfo,
                        vehicleInfo,
                        parts,
                        labor,
                        totalPiese: calculateTotals().totalPiese,
                        totalManopera: calculateTotals().totalManopera,
                        totalDevis: calculateTotals().totalDevis,
                        series: getCurrentSeries()
                      })
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto w-full">
              {/* Tab Navigation */}
              <div className="mb-8">
                <nav className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-none p-1">
                  <button
                    onClick={() => setActiveTab('deviz')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-none font-medium text-sm transition-all duration-200 ${
                      activeTab === 'deviz'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    style={activeTab === 'deviz' ? { color: 'var(--color-primary)' } : {}}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Deviz Nou</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('search')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-none font-medium text-sm transition-all duration-200 ${
                      activeTab === 'search'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    style={activeTab === 'search' ? { color: 'var(--color-primary)' } : {}}
                  >
                    <Search className="w-4 h-4" />
                    <span>Căutare</span>
                  </button>
                     <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-none font-medium text-sm transition-all duration-200 ${
                      activeTab === 'history'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    style={activeTab === 'history' ? { color: 'var(--color-primary)' } : {}}
                  >
                    <History className="w-4 h-4" />
                    <span>Istoric Servicii</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('devizHistory')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-none font-medium text-sm transition-all duration-200 ${
                      activeTab === 'devizHistory'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    style={activeTab === 'devizHistory' ? { color: 'var(--color-primary)' } : {}}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Istoric Devize</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('parts')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-none font-medium text-sm transition-all duration-200 ${
                      activeTab === 'parts'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    style={activeTab === 'parts' ? { color: 'var(--color-primary)' } : {}}
                  >
                    <Package className="w-4 h-4" />
                    <span>Gestiune Piese</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('help')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-none font-medium text-sm transition-all duration-200 ${
                      activeTab === 'help'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                    style={activeTab === 'help' ? { color: 'var(--color-primary)' } : {}}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Ajutor</span>
                  </button>
               
                </nav>
              </div>

              {/* Tab Content */}
            {activeTab === 'search' && (
              <SearchTab
                onClientSelect={handleClientSelect}
                onClientVehicleSelect={handleClientVehicleSelect}
                onViewHistory={handleViewHistory}
                initialState={searchTabState}
                onStateChange={setSearchTabState}
              />
            )}

              {activeTab === 'deviz' && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {isEditingDeviz ? `Editare Deviz #${editingDevizSeries}` : 'Creează Deviz Auto'}
                      </h2>
                      {isEditingDeviz && (
                        <span className="inline-flex items-center px-3 py-1 rounded-none text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-2">
                          Mod Editare
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isEditingDeviz 
                        ? `Modificați datele devizului și regenerați pentru a actualiza devizul #${editingDevizSeries}` 
                        : 'Completează informațiile pentru a genera devizul'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                    <ClientInfoForm 
                      clientInfo={clientInfo} 
                      onChange={handleClientInfoChange}
                      onClientSelect={handleExistingClientSelect}
                      hideExistingNotification={isClientFromSearch}
                    />
                    
                    <VehicleInfoForm 
                      vehicleInfo={vehicleInfo} 
                      onChange={handleVehicleInfoChange}
                      onVehicleSelect={handleExistingVehicleSelect}
                      hideExistingNotification={isVehicleFromSearch}
                    />
                    
                    <PartsTable 
                      parts={parts}
                      onAddPart={addPart}
                      onUpdatePart={updatePart}
                      onRemovePart={removePart}
                    />
                    
                    <LaborTable 
                      labor={labor}
                      onAddLabor={addLabor}
                      onUpdateLabor={updateLabor}
                      onRemoveLabor={removeLabor}
                    />
                    
                    <TotalsSection parts={parts} labor={labor} />
                  </div>
                </div>
              )}

              {activeTab === 'parts' && (
                <PartsManager />
              )}

              {activeTab === 'help' && (
                <HelpTab onOpenAdminModal={() => setShowAdminModal(true)} />
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Istoric Servicii</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Vizualizează istoricul serviciilor pentru vehicule
                    </p>

                  </div>
                  
                  <div className="space-y-6">
                    <ServiceHistoryViewer 
                      selectedVehicle={selectedVehicleForHistory || undefined}
                      onCreateQuote={handleCreateQuoteFromHistory}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'devizHistory' && (
                <DevizHistoryTab onEditDeviz={handleEditDeviz} />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Admin Modal */}
      {showAdminModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-none shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">🔐 Administrare Serie</h3>
              <button
                onClick={handleAdminCancel}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numărul de Serie Nou:
                </label>
                <input
                  type="text"
                  value={adminSeriesInput}
                  onChange={(e) => setAdminSeriesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
                  placeholder="000000"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdminSubmit()}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Format: 6 cifre (ex: 000123)
                </p>
              </div>
              
              {adminError && (
                <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-none">
                  <p className="text-sm text-red-700 dark:text-red-300">{adminError}</p>
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAdminCancel}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-none hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Anulează
                </button>
                <button
                  onClick={handleAdminSubmit}
                  className="flex-1 px-4 py-2 text-white rounded-none transition-colors"
                  style={{
                    backgroundColor: 'var(--color-primary)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                  }}
                >
                  Salvează
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      </DarkModeContext.Provider>
  );
};

function App() {
  return (
    <LicenseWrapper>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </LicenseWrapper>
  );
}

export default App;
