import React, { useState, useEffect } from 'react';
import { VehicleInfo, StoredVehicle } from '../types';
import { validateAndCleanLicensePlate, formatLicensePlateForDisplay } from '../utils/licensePlateUtils';
import { getVehicle } from '../utils/clientVehicleStorage';

interface VehicleInfoFormProps {
  vehicleInfo: VehicleInfo;
  onChange: (field: keyof VehicleInfo, value: string) => void;
  onVehicleSelect?: (vehicle: StoredVehicle) => void;
  hideExistingNotification?: boolean; // Hide notification when data comes from search
}

const VehicleInfoForm: React.FC<VehicleInfoFormProps> = ({ vehicleInfo, onChange, onVehicleSelect, hideExistingNotification = false }) => {
  const [licensePlateError, setLicensePlateError] = useState<string>('');
  const [existingVehicle, setExistingVehicle] = useState<StoredVehicle | null>(null);
  const [showVehicleSuggestion, setShowVehicleSuggestion] = useState(false);

  const handleLicensePlateChange = (value: string) => {
    const validation = validateAndCleanLicensePlate(value);
    
    if (validation.isValid) {
      setLicensePlateError('');
      onChange('numarInmatriculare', validation.cleaned);
    } else {
      setLicensePlateError(validation.error || '');
      // Still update the field but with error state
      onChange('numarInmatriculare', validation.cleaned);
    }
  };

  // Check for existing vehicle when license plate is filled
  useEffect(() => {
    const checkExistingVehicle = async () => {
      if (vehicleInfo.numarInmatriculare.trim()) {
        const validation = validateAndCleanLicensePlate(vehicleInfo.numarInmatriculare);
        if (validation.isValid) {
          const vehicle = getVehicle(validation.cleaned);
          if (vehicle) {
            setExistingVehicle(vehicle);
            setShowVehicleSuggestion(true);
          } else {
            setExistingVehicle(null);
            setShowVehicleSuggestion(false);
          }
        }
      } else {
        setExistingVehicle(null);
        setShowVehicleSuggestion(false);
      }
    };

    const timeoutId = setTimeout(checkExistingVehicle, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [vehicleInfo.numarInmatriculare]);

  const handleLoadExistingVehicle = () => {
    if (existingVehicle && onVehicleSelect) {
      onVehicleSelect(existingVehicle);
      setShowVehicleSuggestion(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-none p-8 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-gray-900 dark:text-gray-100 mb-6 text-xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2">
        Informații Autovehicul
      </h3>
      
      {/* Vehicle suggestion notification */}
      {showVehicleSuggestion && existingVehicle && !hideExistingNotification && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Vehicul existent. Click pentru preluare date
                </p>
                <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                  {existingVehicle.marca} {existingVehicle.model} - {existingVehicle.licensePlate}
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadExistingVehicle}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-none text-sm font-medium transition-colors"
            >
              Preia Date
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">
            Marcă: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={vehicleInfo.marca}
            onChange={(e) => onChange('marca', e.target.value)}
            placeholder="Marcă mașină"
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">
            Model: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={vehicleInfo.model}
            onChange={(e) => onChange('model', e.target.value)}
            placeholder="Model mașină"
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">
            Număr înmatriculare: <span className="text-red-500 text-xs">*</span>
          </label>
          <input
            type="text"
            value={formatLicensePlateForDisplay(vehicleInfo.numarInmatriculare)}
            onChange={(e) => handleLicensePlateChange(e.target.value)}
            placeholder="Ex: B 123 ABC, CD 137112, B 064597"
            className={`px-4 py-3 border rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 ${
              licensePlateError 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'
            }`}
            onFocus={(e) => {
              if (!licensePlateError) {
                e.target.style.borderColor = 'var(--color-primary)';
              }
            }}
            onBlur={(e) => {
              if (!licensePlateError) {
                e.target.style.borderColor = '';
              }
            }}
            style={{ textTransform: 'uppercase' }}
          />
          {licensePlateError && (
            <p className="text-red-500 text-xs mt-1">{licensePlateError}</p>
          )}
          {!licensePlateError && vehicleInfo.numarInmatriculare && (
            <p className="text-green-600 dark:text-green-400 text-xs mt-1">
              Format detectat: {(() => {
                const validation = validateAndCleanLicensePlate(vehicleInfo.numarInmatriculare);
                switch (validation.format) {
                  case 'romanian': return 'Românesc';
                  case 'european': return 'European';
                  case 'numeric': return 'Numeric';
                  case 'alphanumeric': return 'Alfanumeric';
                  default: return 'Valid';
                }
              })()}
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">
            Seria de șasiu: <span className="text-gray-500 text-xs">(opțional)</span>
          </label>
          <input
            type="text"
            value={vehicleInfo.seriaSasiu}
            onChange={(e) => onChange('seriaSasiu', e.target.value)}
            placeholder="Seria de șasiu (opțional)"
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Nivel carburant (%):</label>
          <div className="relative">
             <input
               type="number"
               value={vehicleInfo.nivelCarburant}
               onChange={(e) => onChange('nivelCarburant', e.target.value)}
               placeholder="ex: 75"
               min="0"
               max="100"
               onWheel={(e) => e.currentTarget.blur()}
               className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
               onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
               onBlur={(e) => e.target.style.borderColor = ''}
             />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">%</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Capacitate cilindrică:</label>
          <input
            type="text"
            value={vehicleInfo.capacitateCilindrica}
            onChange={(e) => onChange('capacitateCilindrica', e.target.value)}
            placeholder="ex: 1.6L, 2.0L"
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">An fabricație:</label>
          <input
            type="number"
            value={vehicleInfo.anFabricatie}
            onChange={(e) => onChange('anFabricatie', e.target.value)}
            placeholder="Anul de fabricație"
            min="1900"
            max="2030"
            onWheel={(e) => e.currentTarget.blur()}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Km:</label>
          <input
            type="number"
            value={vehicleInfo.km}
            onChange={(e) => onChange('km', e.target.value)}
            placeholder="Kilometraj"
            min="0"
            onWheel={(e) => e.currentTarget.blur()}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-medium text-gray-700 dark:text-gray-300 text-sm">Culoare:</label>
          <input
            type="text"
            value={vehicleInfo.culoare}
            onChange={(e) => onChange('culoare', e.target.value)}
            placeholder="Culoarea mașinii"
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2"
            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
            onBlur={(e) => e.target.style.borderColor = ''}
          />
        </div>
      </div>
    </div>
  );
};

export default VehicleInfoForm; 