import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Phone, Mail } from 'lucide-react';

interface LicenseRevokedModalProps {
  isOpen: boolean;
}

const LicenseRevokedModal: React.FC<LicenseRevokedModalProps> = ({ 
  isOpen
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-gray-950">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-none mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 tracking-wide">
              LICENȚA DUMNEAVOASTRĂ A FOST REVOCATĂ
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl mx-auto">
              Licența software-ului a fost revocată din cauza neîndeplinirii condițiilor contractuale cu KODERS S.R.L.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-none p-6">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                AVERTISMENT 
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
              Începând din acest moment, utilizarea software-ului fără o licență validă în moduri neautorizate constituie eludarea măsurilor tehnice de protecție și încălcarea legislației privind drepturile de autor, putând atrage răspunderea legală.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-none p-6">
              <h2 className="text-lg font-semibold text-white mb-4 text-center">
                Pentru mai multe informații:
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-none">
                  <div className="p-2 bg-gray-700 rounded-none">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Telefon</p>
                    <a 
                      href="tel:0750292884" 
                      className="text-white text-lg font-mono hover:text-red-400 transition-colors"
                    >
                      0750292884
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-none">
                  <div className="p-2 bg-gray-700 rounded-none">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide">Email</p>
                    <a 
                      href="mailto:contact@koders.ro" 
                      className="text-white text-sm hover:text-red-400 transition-colors break-all"
                    >
                      contact@koders.ro
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-500 text-xs leading-relaxed max-w-xl mx-auto">
                Pentru mai multe informații despre restabilirea licenței sau pentru a discuta despre condițiile contractului, 
                vă rugăm să contactați echipa noastră de suport.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LicenseRevokedModal;
