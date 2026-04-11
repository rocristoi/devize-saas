// Re-export shared branding configuration for renderer
export { brandingConfig, generateColorVariables, type BrandingConfig } from '../../../shared/branding';

// Make it available as default export for backward compatibility
export { brandingConfig as default } from '../../../shared/branding';