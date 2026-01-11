/**
 * Centralized Configuration Loader
 * 
 * This module handles all environment configuration for the application.
 * It provides clear error messages when required configuration is missing.
 * 
 * IMPORTANT: This file is server-side only. Never import this in client components.
 */

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * The error message shown when Replicate API token is missing.
 * This is exported so API routes can return consistent error messages.
 */
export const REPLICATE_TOKEN_ERROR = 
  'Missing Replicate API token. Set REPLICATE_API_TOKEN in environment variables. ' +
  'See README.md for setup instructions.';

/**
 * Short error code for API responses
 */
export const ERROR_CODE_MISSING_TOKEN = 'MISSING_API_TOKEN';

// ============================================================================
// CONFIGURATION ERROR CLASS
// ============================================================================

/**
 * Custom error class for configuration-related errors.
 * This helps distinguish configuration issues from runtime errors.
 */
export class ConfigurationError extends Error {
  public readonly code: string;
  
  constructor(message: string, code: string = 'CONFIG_ERROR') {
    super(message);
    this.name = 'ConfigurationError';
    this.code = code;
  }
}

// ============================================================================
// REPLICATE API CONFIGURATION
// ============================================================================

/**
 * Checks if the Replicate API is properly configured.
 * This is a safe check that won't throw - use it for health checks.
 * 
 * @returns true if a Replicate API token is configured, false otherwise
 */
export function isReplicateConfigured(): boolean {
  // Check primary environment variable
  if (process.env.REPLICATE_API_TOKEN) {
    return true;
  }
  
  // Check fallback environment variable (common alternative name)
  if (process.env.REPLICATE_API_KEY) {
    return true;
  }
  
  return false;
}

/**
 * Gets the Replicate API token from environment variables.
 * 
 * Resolution order:
 * 1. REPLICATE_API_TOKEN (primary)
 * 2. REPLICATE_API_KEY (fallback for compatibility)
 * 
 * @throws {ConfigurationError} If no token is configured
 * @returns The Replicate API token
 */
export function getReplicateToken(): string {
  // Primary environment variable
  const primaryToken = process.env.REPLICATE_API_TOKEN;
  if (primaryToken) {
    return primaryToken;
  }
  
  // Fallback environment variable (some users might use this name)
  const fallbackToken = process.env.REPLICATE_API_KEY;
  if (fallbackToken) {
    // Log a hint to use the primary name
    console.info(
      '[Config] Using REPLICATE_API_KEY. Consider renaming to REPLICATE_API_TOKEN for consistency.'
    );
    return fallbackToken;
  }
  
  // No token found - throw a descriptive error
  console.error('[Config] ' + REPLICATE_TOKEN_ERROR);
  console.error('[Config] Checked: REPLICATE_API_TOKEN, REPLICATE_API_KEY');
  console.error('[Config] Tip: Create a .env.local file with your token. This file may be hidden by your editor.');
  
  throw new ConfigurationError(REPLICATE_TOKEN_ERROR, ERROR_CODE_MISSING_TOKEN);
}

// ============================================================================
// APP CONFIGURATION
// ============================================================================

/**
 * Gets the base URL for the application.
 * Uses NEXT_PUBLIC_BASE_URL if set, otherwise defaults to localhost.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Default to localhost in development
  return 'http://localhost:3000';
}

/**
 * Checks if the application is running in development mode.
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Logs configuration status on startup (call this in development only)
 */
export function logConfigStatus(): void {
  console.log('='.repeat(60));
  console.log('[Config] Application Configuration Status');
  console.log('='.repeat(60));
  console.log(`[Config] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Config] Replicate API configured: ${isReplicateConfigured() ? '✓ Yes' : '✗ No'}`);
  console.log(`[Config] Base URL: ${getBaseUrl()}`);
  console.log('='.repeat(60));
}
