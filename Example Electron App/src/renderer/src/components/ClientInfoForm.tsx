import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../assets/datepicker-custom.css';
import { ClientInfo, StoredClient } from '../types';
import { searchClients } from '../utils/clientVehicleStorage';

interface ClientInfoFormProps {
  clientInfo: ClientInfo;
  onChange: (field: keyof ClientInfo, value: string) => void;
  onClientSelect?: (client: StoredClient) => void;
  hideExistingNotification?: boolean; // Hide notification when data comes from search
}

const ClientInfoForm: React.FC<ClientInfoFormProps> = ({ clientInfo, onChange, onClientSelect, hideExistingNotification = false }) => {
  const [existingClient, setExistingClient] = useState<StoredClient | null>(null);
  const [showClientSuggestion, setShowClientSuggestion] = useState(false);
  // Funcție pentru a converti string la Date - corectată
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    // Verifică dacă este în format yyyy-MM-dd (pentru storage)
    if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
      const [year, month, day] = dateString.split('-');
      if (year && month && day) {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        // Verifică dacă data este validă
        if (date.getFullYear() === parseInt(year) && 
            date.getMonth() === parseInt(month) - 1 && 
            date.getDate() === parseInt(day)) {
          return date;
        }
      }
    }
    
    // Verifică dacă este în format dd-MM-yyyy (pentru afișare)
    if (dateString.includes('-') && dateString.split('-')[2]?.length === 4) {
      const [day, month, year] = dateString.split('-');
      if (day && month && year) {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        // Verifică dacă data este validă
        if (date.getFullYear() === parseInt(year) && 
            date.getMonth() === parseInt(month) - 1 && 
            date.getDate() === parseInt(day)) {
          return date;
        }
      }
    }
    
    return null;
  };

  // Funcție pentru a converti Date la string în format yyyy-MM-dd pentru storage
  const formatDateForStorage = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (field: 'dataIntrare' | 'dataIesire', date: Date | null) => {
    if (date) {
      onChange(field, formatDateForStorage(date));
    } else {
      onChange(field, '');
    }
  };

  // Check for existing client when name and phone are filled
  useEffect(() => {
    const checkExistingClient = async () => {
      if (clientInfo.nume.trim() && clientInfo.numarTelefon.trim()) {
        const clients = searchClients(clientInfo.nume);
        const matchingClient = clients.find(client => 
          client.nume.toLowerCase() === clientInfo.nume.toLowerCase() && 
          client.numarTelefon === clientInfo.numarTelefon
        );
        
        if (matchingClient) {
          setExistingClient(matchingClient);
          setShowClientSuggestion(true);
        } else {
          setExistingClient(null);
          setShowClientSuggestion(false);
        }
      } else {
        setExistingClient(null);
        setShowClientSuggestion(false);
      }
    };

    const timeoutId = setTimeout(checkExistingClient, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [clientInfo.nume, clientInfo.numarTelefon]);

  const handleLoadExistingClient = () => {
    if (existingClient && onClientSelect) {
      onClientSelect(existingClient);
      setShowClientSuggestion(false);
    }
  };


  return (
    <div className="bg-white dark:bg-gray-900 rounded-none p-8 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-gray-900 dark:text-gray-100 mb-6 text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">
        Informații Client
      </h3>
      
      {/* Client suggestion notification */}
      {showClientSuggestion && existingClient && !hideExistingNotification && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Client deja existent. Click pentru preluare date
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  {existingClient.nume} - {existingClient.numarTelefon}
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadExistingClient}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-none text-sm font-medium transition-colors"
            >
              Preia Date
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">
            Numele clientului: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={clientInfo.nume}
            onChange={(e) => onChange('nume', e.target.value)}
            placeholder="Numele clientului"
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">
            CUI/CNP:
          </label>
          <input
            type="text"
            value={clientInfo.cuiCnp}
            onChange={(e) => onChange('cuiCnp', e.target.value)}
            placeholder="CUI sau CNP"
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />

        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Locația:</label>
          <input
            type="text"
            value={clientInfo.locatie}
            onChange={(e) => onChange('locatie', e.target.value)}
            placeholder="Oraș, județ"
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Strada:</label>
          <input
            type="text"
            value={clientInfo.strada}
            onChange={(e) => onChange('strada', e.target.value)}
            placeholder="Strada"
            className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">
            Număr telefon: <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={clientInfo.numarTelefon}
            onChange={(e) => onChange('numarTelefon', e.target.value)}
            placeholder="Numărul de telefon"
            className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Motivul intrării în service:</label>
          <textarea
            value={clientInfo.motivIntrare}
            onChange={(e) => onChange('motivIntrare', e.target.value)}
            placeholder="Motivul pentru care aduce mașina în service"
            rows={3}
            className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 resize-y min-h-20"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Observații:</label>
          <textarea
            value={clientInfo.observatii}
            onChange={(e) => onChange('observatii', e.target.value)}
            placeholder="Observații suplimentare"
            rows={3}
            className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 resize-y min-h-20"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Data intrării în service:</label>
          <div className="relative">
            <DatePicker
              selected={parseDate(clientInfo.dataIntrare)}
              onChange={(date: Date | null) => handleDateChange('dataIntrare', date)}
              dateFormat="dd-MM-yyyy"
              placeholderText="zz-ll-aaaa"
              className="w-full"
              locale="ro"
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={15}
              maxDate={new Date()}
              popperPlacement="bottom-start"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Data ieșirii din service:</label>
          <div className="relative">
            <DatePicker
              selected={parseDate(clientInfo.dataIesire)}
              onChange={(date: Date | null) => handleDateChange('dataIesire', date)}
              dateFormat="dd-MM-yyyy"
              placeholderText="zz-ll-aaaa"
              className="w-full"
              locale="ro"
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={15}
              minDate={parseDate(clientInfo.dataIntrare) || new Date()}
              popperPlacement="bottom-start"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoForm; 