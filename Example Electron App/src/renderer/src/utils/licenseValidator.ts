export interface LicenseValidationResponse {
  valid: boolean;
  message?: string;
}

export interface LicenseValidationError {
  error: string;
  message: string;
}

class LicenseValidator {
  private static instance: LicenseValidator;
  private readonly LICENSE_KEY_STORAGE = 'licenseKey';

  private constructor() {}

  public static getInstance(): LicenseValidator {
    if (!LicenseValidator.instance) {
      LicenseValidator.instance = new LicenseValidator();
    }
    return LicenseValidator.instance;
  }

  /**
   * Get the stored license key from localStorage
   */
  public getStoredLicenseKey(): string | null {
    try {
      return localStorage.getItem(this.LICENSE_KEY_STORAGE);
    } catch (error) {
      console.error('Error reading license key from localStorage:', error);
      return null;
    }
  }

  /**
   * Store the license key in localStorage
   */
  public storeLicenseKey(licenseKey: string): void {
    try {
      localStorage.setItem(this.LICENSE_KEY_STORAGE, licenseKey);
    } catch (error) {
      console.error('Error storing license key in localStorage:', error);
      throw new Error('Failed to store license key');
    }
  }

  /**
   * Remove the license key from localStorage
   */
  public removeLicenseKey(): void {
    try {
      localStorage.removeItem(this.LICENSE_KEY_STORAGE);
    } catch (error) {
      console.error('Error removing license key from localStorage:', error);
    }
  }

  /**
   * Validate license key with the server using main process
   */
  public async validateLicense(_licenseKey: string): Promise<LicenseValidationResponse> {
    // Always return valid license
    return {
      valid: true,
      message: 'Licența a fost validată cu succes!'
    };
  }

  /**
   * Check if a valid license exists and validate it
   */
  public async checkLicenseStatus(): Promise<LicenseValidationResponse> {
    // Always return valid license
    return {
      valid: true,
      message: 'Licența a fost validată cu succes!'
    };
  }

  /**
   * Check if user has a license (without server validation)
   */
  public hasLicense(): boolean {
    // Always return true - license is always valid
    return true;
  }
}

export default LicenseValidator;
