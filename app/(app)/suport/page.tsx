"use client";

import { motion } from "framer-motion";
import { 
  ExternalLink,
  Info,
  Phone,
  Mail,
  Database,
  Shield,
  FileText
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default function SuportPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Ajutor & Informații"
        description="Informații despre software, detalii de contact și resurse legale"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Software Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Informații Software
            </h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Nume Software
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mt-0.5">
                Devize Auto
              </p>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Dezvoltat de
              </label>
              <p className="text-sm text-gray-900 dark:text-gray-100 font-medium mt-0.5">
                KODERS S.R.L.
              </p>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Website
              </label>
              <div className="flex items-center gap-2 mt-0.5">
                <a 
                  href="https://koders.ro" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  https://koders.ro
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <Phone className="w-5 h-5 text-blue-500" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Contact KODERS
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                <Mail className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email Suport
                </p>
                <a href="mailto:contact@koders.ro" className="text-sm text-gray-900 dark:text-gray-100 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  contact@koders.ro
                </a>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                <Phone className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Telefon
                </p>
                <a href="tel:+40750292884" className="text-sm text-gray-900 dark:text-gray-100 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  +40 750 292 884
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Legal & Policies */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Aspecte Legale
            </h3>
          </div>
          
          <div className="space-y-2">
            <Link 
              href="/termeni-si-conditii"
              className="group flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-md">
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                  Termeni și Condiții
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </Link>
            
            <Link 
              href="/politica-de-confidentialitate"
              className="group flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-blue-100 dark:hover:border-blue-900/30 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-md">
                  <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                  Politică de Confidențialitate
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </Link>
          </div>
        </motion.div>

        {/* Payments Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col justify-center"
        >
          <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
            <Database className="w-5 h-5 text-blue-500" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              Informații Plăți
            </h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
            Plățile sunt procesate în siguranță prin Stripe Payments. Acceptăm următoarele metode de plată:
          </p>

          <div className="flex flex-wrap items-center gap-6 mt-auto">
            <div className="relative h-12 w-48 opacity-90 hover:opacity-100 transition-opacity">
              <div className="flex flex-row gap-5">
 {[
              { src: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Visa_Inc._logo_%282021%E2%80%93present%29.svg', alt: 'Visa', w: 38 },
              { src: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg', alt: 'Mastercard', w: 26 },
              { src: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg', alt: 'Apple Pay', w: 40 },
              { src: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg', alt: 'Google Pay', w: 40 },
            ].map(({ src, alt, w }) => (
              <Image
                key={alt}
                src={src}
                alt={alt}
                width={w}
                height={18}
                className="opacity-50 dark:invert  hover:opacity-80 hover:grayscale-0 transition-all duration-200"
              />
            ))}

              </div>
              
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Additional Info / Copyright Footer Equivalent */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className=" rounded-xl p-6  dark:border-blue-900/30"
      >
        <p className="text-sm text-gray-500 dark:text-gray-300 leading-relaxed text-center">
          Dreptul de proprietate intelectuală asupra codului sursă, documentației și componentelor software rămâne exclusiv al KODERS S.R.L.
        </p>
      </motion.div>
    </div>
  );
}
