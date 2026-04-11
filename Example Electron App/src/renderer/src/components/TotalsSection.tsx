import React from 'react';
import { Part, Labor } from '../types';

interface TotalsSectionProps {
  parts: Part[];
  labor: Labor[];
}

const TotalsSection: React.FC<TotalsSectionProps> = ({ parts, labor }) => {
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
  const calculateLaborItemTotal = (lab: Labor): number => {
    const pret = typeof lab.pret === 'number' && !isNaN(lab.pret) ? lab.pret : 0;
    const discount = typeof lab.discount === 'number' && !isNaN(lab.discount) ? lab.discount : 0;
    
    // Ensure values are non-negative
    const safePret = Math.max(0, pret);
    const safeDiscount = Math.max(0, discount);
    
    return Math.max(0, safePret - safeDiscount);
  };

  const calculatePartsTotal = () => {
    return parts.reduce((total, part) => {
      return total + calculatePartTotal(part);
    }, 0);
  };

  const calculateLaborTotal = () => {
    return labor.reduce((total, lab) => {
      return total + calculateLaborItemTotal(lab);
    }, 0);
  };

  const totalPiese = calculatePartsTotal();
  const totalManopera = calculateLaborTotal();
  const totalDevis = totalPiese + totalManopera;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-none p-8 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md">
      <h3 className="text-gray-900 dark:text-gray-100 mb-6 text-xl font-semibold pb-2 transition-all duration-200" style={{borderBottom: '2px solid var(--color-primary)'}}>Total</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
          <span className="font-medium text-gray-700 dark:text-gray-300 transition-all duration-200">Total Piese:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100 transition-all duration-200 font-mono">{totalPiese.toFixed(2)} RON</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700">
          <span className="font-medium text-gray-700 dark:text-gray-300 transition-all duration-200">Total Manoperă:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100 transition-all duration-200 font-mono">{totalManopera.toFixed(2)} RON</span>
        </div>
        <div 
          className="flex justify-between items-center p-4 text-white rounded-none font-semibold text-lg transition-all duration-200"
          style={{
            background: `linear-gradient(to right, var(--color-primary), var(--color-primary-600))`,
            borderColor: 'var(--color-primary)',
          }}
        >
          <span className="font-medium text-white">Total Deviz:</span>
          <span className="font-semibold text-white font-mono">{totalDevis.toFixed(2)} RON</span>
        </div>
      </div>
    </div>
  );
};

export default TotalsSection; 