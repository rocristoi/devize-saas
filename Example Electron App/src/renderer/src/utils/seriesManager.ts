const SERIES_KEY = 'deviz_series';

/**
 * Gets the current series number from localStorage
 * If no series exists, starts with 000001
 */
export const getCurrentSeries = (): string => {
  const stored = localStorage.getItem(SERIES_KEY);
  if (!stored) {
    // Start with 000001 if no series exists
    const initialSeries = '000001';
    localStorage.setItem(SERIES_KEY, initialSeries);
    return initialSeries;
  }
  return stored;
};

/**
 * Increments the series number and saves it to localStorage
 * Returns the new series number
 */
export const incrementSeries = (): string => {
  const currentSeries = getCurrentSeries();
  const currentNumber = parseInt(currentSeries, 10);
  const newNumber = currentNumber + 1;
  const newSeries = newNumber.toString().padStart(6, '0');
  localStorage.setItem(SERIES_KEY, newSeries);
  return newSeries;
};

/**
 * Resets the series number to 000001
 */
export const resetSeries = (): void => {
  localStorage.setItem(SERIES_KEY, '000001');
};

/**
 * Sets a specific series number
 */
export const setSeries = (series: string): void => {
  if (series.length !== 6 || !/^\d+$/.test(series)) {
    throw new Error('Series must be a 6-digit number');
  }
  localStorage.setItem(SERIES_KEY, series);
};

/**
 * Temporarily stores the current series for later restoration
 * Used when editing old devizes to preserve series number
 */
const TEMP_SERIES_KEY = 'deviz_temp_series';

export const temporarilySetSeries = (series: string): void => {
  if (series.length !== 6 || !/^\d+$/.test(series)) {
    throw new Error('Series must be a 6-digit number');
  }
  // Store current series temporarily
  const currentSeries = getCurrentSeries();
  localStorage.setItem(TEMP_SERIES_KEY, currentSeries);
  // Set the new series
  localStorage.setItem(SERIES_KEY, series);
};

/**
 * Gets the stored series that was saved temporarily
 */
export const getStoredSeries = (): string | null => {
  return localStorage.getItem(TEMP_SERIES_KEY);
};

/**
 * Restores the series from temporary storage and clears the temporary storage
 */
export const restoreStoredSeries = (): void => {
  const storedSeries = localStorage.getItem(TEMP_SERIES_KEY);
  if (storedSeries) {
    localStorage.setItem(SERIES_KEY, storedSeries);
    localStorage.removeItem(TEMP_SERIES_KEY);
  }
}; 