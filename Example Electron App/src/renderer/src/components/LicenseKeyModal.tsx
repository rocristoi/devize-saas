import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import LicenseValidator from '../utils/licenseValidator';

interface LicenseKeyModalProps {
  isOpen: boolean;
  onLicenseValid: () => void;
}

const LicenseKeyModal: React.FC<LicenseKeyModalProps> = ({ 
  isOpen, 
  onLicenseValid
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!licenseKey.trim()) {
      setError('Vă rugăm să introduceți cheia de licență.');
      return;
    }

    setIsValidating(true);
    setError('');
    setSuccess('');

    try {
      const validator = LicenseValidator.getInstance();
      const result = await validator.validateLicense(licenseKey.trim());

      if (result.valid) {
        setSuccess(result.message || 'Licența a fost validată cu succes!');
        setTimeout(() => {
          onLicenseValid();
        }, 1500);
      } else {
        // Check if the license was revoked specifically
        if (result.message && result.message.includes('revocată')) {
          setError('Licența a fost revocată. Vă rugăm să contactați echipa de suport.');
        } else {
          setError(result.message || 'Cheia de licență nu este validă.');
        }
      }
    } catch (error) {
      console.error('License validation error:', error);
      setError('A apărut o eroare la validarea licenței. Vă rugăm să încercați din nou.');
    } finally {
      setIsValidating(false);
    }
  };


  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-none shadow-2xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-none">
              <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Verificare Licență
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Introduceți cheia de licență pentru a accesa aplicația
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cheia de Licență:
            </label>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-center tracking-wider"
              placeholder="Introduceți codul..."
              disabled={isValidating}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-none">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-none">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isValidating || !licenseKey.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-none font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Se validează...</span>
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  <span>Validează</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Pentru suport tehnic, contactați echipa la{' '}
              <a 
                href="tel:0750292884" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                0750292884
              </a>
              {' '}sau{' '}
              <a 
                href="mailto:contact@koders.ro" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                contact@koders.ro
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LicenseKeyModal;
