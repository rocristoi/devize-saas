/**
 * Utility functions for license plate validation and formatting
 */

/**
 * Cleans and normalizes a license plate number
 * Removes dashes, spaces, and converts to uppercase
 */
export const cleanLicensePlate = (licensePlate: string): string => {
  if (!licensePlate) return '';
  
  return licensePlate
    .replace(/[-\s]/g, '') // Remove dashes and spaces
    .toUpperCase() // Convert to uppercase
    .trim();
};

/**
 * Validates if a license plate has a valid Romanian format
 * Romanian format: 1-2 letters, 2-3 digits, 3 letters
 * Examples: B123ABC, CJ12ABC, B1234ABC
 */
export const isValidRomanianLicensePlate = (licensePlate: string): boolean => {
  const cleaned = cleanLicensePlate(licensePlate);
  
  // Romanian license plate regex: 1-2 letters, 2-3 digits, 3 letters
  const romanianPattern = /^[A-Z]{1,2}\d{2,3}[A-Z]{3}$/;
  
  return romanianPattern.test(cleaned);
};

/**
 * Validates different international license plate formats
 */
export const isValidInternationalLicensePlate = (licensePlate: string): boolean => {
  const cleaned = cleanLicensePlate(licensePlate);
  
  // Various international formats
  const patterns = [
    // Romanian: B123ABC, CJ12ABC
    /^[A-Z]{1,2}\d{2,3}[A-Z]{3}$/,
    
    // European formats (general):
    // Germany: B-AB 123, AB-CD 123
    /^[A-Z]{1,3}\d{1,4}[A-Z]{0,3}$/,
    
    // UK format: AB12CDE, A123BCD
    /^[A-Z]{1,2}\d{1,4}[A-Z]{1,3}$/,
    
    // US format: ABC1234, AB123CD
    /^[A-Z]{2,3}\d{3,4}[A-Z]{0,2}$/,
    
    // Numeric only: 123456, 1234567
    /^\d{4,8}$/,
    
    // Mixed alphanumeric: ABC123, 123ABC, A1B2C3
    /^[A-Z0-9]{4,10}$/,
    
    // Special characters allowed (cleaned will remove spaces/dashes)
    /^[A-Z0-9]{3,12}$/
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};

/**
 * Detects the format type of a license plate
 */
export const detectLicensePlateFormat = (licensePlate: string): string => {
  const cleaned = cleanLicensePlate(licensePlate);
  
  if (!cleaned) return 'empty';
  
  if (isValidRomanianLicensePlate(cleaned)) return 'romanian';
  
  // Check other specific formats
  if (/^[A-Z]{1,3}\d{1,4}[A-Z]{0,3}$/.test(cleaned)) return 'european';
  if (/^\d{4,8}$/.test(cleaned)) return 'numeric';
  if (/^[A-Z0-9]{3,12}$/.test(cleaned)) return 'alphanumeric';
  
  return 'unknown';
};

/**
 * Formats a license plate for display based on detected format
 * Converts from B123ABC to B 123 ABC for Romanian format
 */
export const formatLicensePlateForDisplay = (licensePlate: string): string => {
  if (!licensePlate) return '';
  
  const cleaned = cleanLicensePlate(licensePlate);
  const format = detectLicensePlateFormat(cleaned);
  
  switch (format) {
    case 'romanian':
      // Romanian format: B123ABC -> B 123 ABC
      const romanianMatch = cleaned.match(/^([A-Z]{1,2})(\d{2,3})([A-Z]{3})$/);
      if (romanianMatch) {
        const [, letters, digits, suffix] = romanianMatch;
        return `${letters} ${digits} ${suffix}`;
      }
      break;
      
    case 'european':
      // European format: try to add spaces for readability
      const europeanMatch = cleaned.match(/^([A-Z]{1,3})(\d{1,4})([A-Z]{0,3})$/);
      if (europeanMatch) {
        const [, letters, digits, suffix] = europeanMatch;
        return suffix ? `${letters} ${digits} ${suffix}` : `${letters} ${digits}`;
      }
      break;
      
    case 'numeric':
      // Numeric format: add space in the middle if 6+ digits
      if (cleaned.length >= 6) {
        const mid = Math.floor(cleaned.length / 2);
        return `${cleaned.slice(0, mid)} ${cleaned.slice(mid)}`;
      }
      break;
      
    case 'alphanumeric':
      // For general alphanumeric, try to separate letters and numbers
      const alphaMatch = cleaned.match(/^([A-Z]+)(\d+)([A-Z]*)$/);
      if (alphaMatch) {
        const [, prefix, digits, suffix] = alphaMatch;
        return suffix ? `${prefix} ${digits} ${suffix}` : `${prefix} ${digits}`;
      }
      break;
  }
  
  // If no specific formatting applies, return cleaned version
  return cleaned;
};

/**
 * Formats a license plate for storage (removes spaces)
 * Converts from B 123 ABC to B123ABC
 */
export const formatLicensePlateForStorage = (licensePlate: string): string => {
  return cleanLicensePlate(licensePlate);
};

/**
 * Gets a display-friendly version of license plate with fallback
 * If the plate is valid, formats it nicely, otherwise returns original
 */
export const getDisplayLicensePlate = (licensePlate: string): string => {
  if (!licensePlate) return '';
  
  const cleaned = cleanLicensePlate(licensePlate);
  
  // If it's a valid format (Romanian or international), format it nicely
  if (isValidInternationalLicensePlate(cleaned)) {
    return formatLicensePlateForDisplay(cleaned);
  }
  
  // For unrecognized formats, return cleaned version
  return cleaned;
};

/**
 * Validates and cleans a license plate input
 * Returns the cleaned version and validation status
 */
export const validateAndCleanLicensePlate = (input: string): {
  cleaned: string;
  isValid: boolean;
  error?: string;
  format?: string;
} => {
  const cleaned = cleanLicensePlate(input);
  
  if (!cleaned) {
    return {
      cleaned: '',
      isValid: false,
      error: 'Numărul de înmatriculare este obligatoriu'
    };
  }
  
  // Check if it's too short or too long
  if (cleaned.length < 3) {
    return {
      cleaned,
      isValid: false,
      error: 'Numărul de înmatriculare este prea scurt (minim 3 caractere)'
    };
  }
  
  if (cleaned.length > 12) {
    return {
      cleaned,
      isValid: false,
      error: 'Numărul de înmatriculare este prea lung (maxim 12 caractere)'
    };
  }
  
  const format = detectLicensePlateFormat(cleaned);
  
  if (!isValidInternationalLicensePlate(cleaned)) {
    return {
      cleaned,
      isValid: false,
      error: 'Format invalid. Acceptate: B 123 ABC, ABC123, 123456, etc.',
      format
    };
  }
  
  return {
    cleaned,
    isValid: true,
    format
  };
};
