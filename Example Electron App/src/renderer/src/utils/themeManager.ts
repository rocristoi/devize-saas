import { brandingConfig, generateColorVariables } from '../config/branding';

// Theme utility functions for applying branding colors throughout the app
export class ThemeManager {
  private static instance: ThemeManager;
  private styleElement: HTMLStyleElement | null = null;

  private constructor() {}

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  // Initialize the theme system by injecting CSS custom properties
  public initializeTheme(): void {
    this.injectCustomProperties();
  }

  // Inject CSS custom properties for the current branding colors
  private injectCustomProperties(): void {
    // Remove existing style element if it exists
    if (this.styleElement) {
      this.styleElement.remove();
    }

    // Create new style element
    this.styleElement = document.createElement('style');
    this.styleElement.setAttribute('data-theme-manager', 'true');
    
    const cssVariables = generateColorVariables(brandingConfig.visual.colors);
    this.styleElement.textContent = cssVariables;

    // Append to head
    document.head.appendChild(this.styleElement);
  }

  // Update theme colors at runtime (useful for theme switching or customization UI)
  public updateColors(newColors: typeof brandingConfig.visual.colors): void {
    const updatedConfig = {
      ...brandingConfig,
      visual: {
        ...brandingConfig.visual,
        colors: newColors
      }
    };

    const cssVariables = generateColorVariables(updatedConfig.visual.colors);
    if (this.styleElement) {
      this.styleElement.textContent = cssVariables;
    }
  }

  // Get current primary color
  public getPrimaryColor(): string {
    return brandingConfig.visual.colors.primary;
  }

  // Get all current colors
  public getColors(): typeof brandingConfig.visual.colors {
    return brandingConfig.visual.colors;
  }
}

// CSS class generators for theme-aware components
export const themeClasses = {
  // Primary button classes
  primaryButton: "bg-primary-600 hover:bg-primary-700 text-white border-primary-600 hover:border-primary-700",
  
  // Primary text classes
  primaryText: "text-primary-600 dark:text-primary-400",
  
  // Primary border classes
  primaryBorder: "border-primary-500",
  
  // Focus ring classes
  focusRing: "focus:ring-primary-500 focus:border-primary-500",
  
  // Background classes
  primaryBg: "bg-primary-50 dark:bg-primary-900/20",
  
  // Gradient classes
  primaryGradient: "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
};

// Utility function to generate dynamic CSS classes based on current theme
export const getThemeClass = (baseClass: string): string => {
  const color = brandingConfig.visual.colors.primary;
  
  // For Tailwind CSS with arbitrary values
  return baseClass.replace(/blue-\d+/g, `[${color}]`);
};

// Initialize theme on module load
if (typeof window !== 'undefined') {
  // Initialize theme when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ThemeManager.getInstance().initializeTheme();
    });
  } else {
    ThemeManager.getInstance().initializeTheme();
  }
}

export default ThemeManager;