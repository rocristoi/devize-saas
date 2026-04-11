export function formatLicensePlate(value: string): string {
  // Remove non-alphanumeric characters and make uppercase
  let cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  if (cleanValue.length === 0) return '';
  
  // Regex to match Romanian plates
  // Patterns:
  // B 12 XYZ -> "B" + "12" or "123" + "XYZ"
  // CJ 12 XYZ -> "CJ" + "12" or "123" + "XYZ"
  
  const roPlateMatch = cleanValue.match(/^([A-Z]{1,2})(\d{2,3})([A-Z]{3})?$/);
  
  if (roPlateMatch) {
    const [, county, digits, letters] = roPlateMatch;
    // Format B-12-ABC or B 12 ABC. Let's use spaces.
    let formatted = `${county} ${digits}`;
    if (letters) {
      formatted += ` ${letters}`;
    }
    return formatted;
  }
  
  // Partial typing formatter approach
  // E.g. User types "B1", we want "B 1". "B12" -> "B 12". "B123" -> "B 123". "CJ1" -> "CJ 1"
  let formattedPartial = '';
  
  // Try to extract 1 or 2 letters from start
  const countyMatch = cleanValue.match(/^([A-Z]{1,2})/);
  if (countyMatch) {
    const county = countyMatch[1];
    formattedPartial += county;
    cleanValue = cleanValue.slice(county.length);
    
    if (cleanValue.length > 0) {
      formattedPartial += ' ';
      
      // Extract digits
      const digitsMatch = cleanValue.match(/^(\d{1,3})/);
      if (digitsMatch) {
         const digits = digitsMatch[1];
         formattedPartial += digits;
         cleanValue = cleanValue.slice(digits.length);
         
         if (cleanValue.length > 0) {
           formattedPartial += ' ';
           // Everything else is letters
           formattedPartial += cleanValue.slice(0, 3); // Max 3 letters
         }
      } else {
        // Was letter after county format e.g., "CJX", fallback to just string
        return value.toUpperCase(); 
      }
    }
    return formattedPartial;
  }
  
  // If it doesn't match RO plate heuristics at all from start, just return uppercase
  return value.toUpperCase();
}
