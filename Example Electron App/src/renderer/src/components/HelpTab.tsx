import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  ExternalLink, 
  Download, 
  Upload, 
  Info,
  Phone,
  Mail,
  Globe,
  Key,
  Database,
  Trash2,
  Settings,
  AlertCircle
} from 'lucide-react';
import { brandingConfig } from '../config/branding';
import { useNotifications } from './NotificationSystem';

interface HelpTabProps {
  onOpenAdminModal?: () => void;
}

const HelpTab: React.FC<HelpTabProps> = ({ onOpenAdminModal }) => {
  const { showAlert, showConfirm } = useNotifications();
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Generate localStorage dump
  const generateLocalStorageDump = () => {
    const dump: { [key: string]: string } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        dump[key] = localStorage.getItem(key) || '';
      }
    }
    return JSON.stringify(dump, null, 2);
  };

  const handleDownloadDump = () => {
    const dump = generateLocalStorageDump();
    const blob = new Blob([dump], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devize-auto-dump-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadDump = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Clear existing localStorage
        localStorage.clear();
        
        // Restore data
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });
        
        showAlert('LocalStorage a fost restaurat cu succes! Aplicația va fi reîncărcată.', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        showAlert('Eroare la încărcarea fișierului: ' + error, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Ajutor & Informații
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Informații despre software și instrumente de depanare
        </p>
      </div>

      {/* Software Information */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-none p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <Info className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Informații Software
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nume Software
              </label>
              <p className="text-gray-900 dark:text-gray-100">
                {brandingConfig.company.name} - Devize Auto
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Versiune/Pachet
              </label>
              <p className="text-gray-900 dark:text-gray-100">PRO + MODIF. CDA</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Dezvoltat de
            </label>
            <p className="text-gray-900 dark:text-gray-100">
              KODERS S.R.L.
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Website
            </label>
            <div className="flex items-center gap-2">
              <a 
                href="https://koders.ro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                https://koders.ro
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        
        </div>
      </motion.div>

      {/* License Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white dark:bg-gray-900 rounded-none p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Status Licență 
          </h3>
          <div className='flex items-center justify-center gap-2'>
          <span className='h-1 w-1 bg-green-500'></span>
          <span>Activă</span>
          </div>

        </div>
        
        <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                 Cheia dvs. de licență
              </label>
              <p className="text-gray-900 dark:text-gray-100 font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                Versiunea aceasta nu necesită cheie de licență.
              </p>
            </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white dark:bg-gray-900 rounded-none p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <Phone className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Contact KODERS
          </h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  contact@koders.ro
                </p>
              </div>
             
            </div>
            
            <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefon
                </p>
                <p className="text-gray-900 dark:text-gray-100">
                  +40 750 292 884
                </p>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-5'>

          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Website
              </p>
              <a 
                href="https://koders.ro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                https://koders.ro
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 ">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Contact (Urgențe)
              </p>
              <p className="text-gray-900 dark:text-gray-100">
                  +40 771 071 979
                </p>
            </div>
          </div>
          </div>
          

        </div>
      </motion.div>

      {/* Administration Tools */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-none p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className='w-full justify-between flex'>
        <div className="flex items-center gap-3 ">
          <Settings className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Administrare Serie Devize
          </h3>
        </div>
        
          {onOpenAdminModal && (
            <button
              onClick={onOpenAdminModal}
              className="flex items-center justify-center gap-2 h-8 w-10 border border-blue-300 dark:border-blue-700 bg-transparent text-blue-700 dark:text-blue-300 rounded-none hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="sr-only">Deschide Administrare Serie</span>
            </button>
          )}
        </div>
        
      </motion.div>

      {/* Debugging Tools */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white dark:bg-gray-900 rounded-none p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Instrumente Depanare
            </h3>
          </div>
          <button
            onClick={() => setIsDebugMode(!isDebugMode)}
            className="px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-none hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
          >
            {isDebugMode ? 'Ascunde' : 'Afișează'}
          </button>
        </div>
        
        {isDebugMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Download Database
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Descarcă un dump complet al bazei de date pentru depanare.
                </p>
                <button
                  onClick={handleDownloadDump}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descarcă Dump
                </button>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Upload Dump Database
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Încarcă un dump pentru a restaura baza de date.
                </p>
                <div className="relative w-[30%] flex">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleUploadDump}
                    className="absolute inset-0 h-full opacity-0 cursor-pointer"
                    id="upload-dump"
                  />
                  <label
                    htmlFor="upload-dump"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-none hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Încarcă Dump
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                Clear Database
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Șterge complet baza de date și reîncarcă aplicația.
              </p>
              <button
                onClick={async () => {
                  const confirmed = await showConfirm('Sigur doriți să ștergeți toate datele din LocalStorage? Această acțiune nu poate fi anulată!');
                  if (confirmed) {
                    localStorage.clear();
                    showAlert('LocalStorage a fost șters. Aplicația va fi reîncărcată.', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Șterge LocalStorage
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Additional Information */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-none p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Informații Adiționale
          </h3>
        </div>
        
        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <p>
            Dacă întâmpinați probleme în utilizarea software-ului, echipa KODERS va sta la dispoziție.
          </p>
          <p>
            Conform contractului încheiat la data achiziției*, dreptul de proprietate intelectuală asupra codului sursă, 
            documentației și componentelor software rămâne exclusiv al KODERS S.R.L.
          </p>
          <p>
            Dvs. aveți un drept limitat, neexclusiv și netransferabil de utilizare a software-ului. 
            Este interzisă revânzarea, distribuirea sau utilizarea software-ului în afara destinației contractate, 
            fără acordul scris al societății.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            * = după caz; se poate încheia și la data livrării
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default HelpTab;
