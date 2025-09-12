/**
 * Backend API Endpoint Validator
 * 
 * This module provides validation functions to ensure only valid backend API endpoints are used.
 * Prevents usage of non-existent endpoints and enforces proper API usage patterns.
 */

// Valid external backend API endpoints (confirmed working)
const VALID_BACKEND_ENDPOINTS = {
  // Account Management (Manager Auth - API-KEY)
  'POST:/api/account': 'Create account',
  'GET:/api/account/{id}': 'Get account by ID',
  'PATCH:/api/account/{id}/plan': 'Update account plan',
  'POST:/api/account/{id}/api_keys': 'Create API key',
  'GET:/api/account/{id}/api_keys': 'Get account API keys',
  'PATCH:/api/account/{id}/api_keys/{keyId}/revoke': 'Revoke API key',
  'GET:/api/account/{id}/wallet': 'Get wallet info',
  'POST:/api/account/{id}/wallet/credit_pack': 'Create credit pack',
  'GET:/api/account/{id}/wallet/credit_packs': 'Get credit packs',
  'GET:/api/account/{id}/task_histories': 'Get task histories',
  'GET:/api/account/{id}/notifications': 'Get notifications',
  'PATCH:/api/account/{id}/notification/{notificationId}/confirm': 'Confirm notification',
  
  // User Operations (User Auth - X-API-KEY)
  'GET:/api/account/info': 'Get current account info',
  'POST:/api/account/code/retrieve': 'Redeem code',
  
  // Business API (User Auth - X-API-KEY)
  'POST:/api/v1/diffusion': 'Create diffusion task',
  'POST:/api/v1/upscale': 'Create upscale task',
  'GET:/api/v1/job/{jobId}': 'Get job status'
} as const;

// Known invalid/non-existent endpoints
const INVALID_BACKEND_ENDPOINTS = {
  'GET:/api/account?name=': 'Find account by email - DOES NOT EXIST'
} as const;

/**
 * Validates if a backend API endpoint exists
 * @param method HTTP method (GET, POST, PATCH, etc.)
 * @param path API path (e.g., '/api/account/123')
 * @returns true if endpoint is valid, false otherwise
 */
export function validateBackendEndpoint(method: string, path: string): boolean {
  // Remove query parameters first
  const cleanPath = path.split('?')[0];
  
  // Replace numeric IDs with {id} and UUIDs with {jobId}
  let normalizedPath = cleanPath.replace(/\/\d+/g, '/{id}');
  normalizedPath = normalizedPath.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/{jobId}');
  
  const endpointKey = `${method.toUpperCase()}:${normalizedPath}` as keyof typeof VALID_BACKEND_ENDPOINTS;
  
  return endpointKey in VALID_BACKEND_ENDPOINTS;
}

/**
 * Checks if an endpoint is known to be invalid
 * @param method HTTP method
 * @param path API path
 * @returns true if endpoint is known to be invalid
 */
export function isKnownInvalidEndpoint(_method: string, path: string): boolean {
  for (const invalidEndpoint of Object.keys(INVALID_BACKEND_ENDPOINTS)) {
    if (path.includes(invalidEndpoint.split(':')[1])) {
      return true;
    }
  }
  
  return false;
}

/**
 * Gets description for a valid endpoint
 * @param method HTTP method
 * @param path API path
 * @returns description string or null if not found
 */
export function getEndpointDescription(method: string, path: string): string | null {
  // Remove query parameters first
  const cleanPath = path.split('?')[0];
  
  // Only replace numeric IDs with {id}, not all path segments
  const normalizedPath = cleanPath.replace(/\/\d+/g, '/{id}');
  
  const endpointKey = `${method.toUpperCase()}:${normalizedPath}` as keyof typeof VALID_BACKEND_ENDPOINTS;
  
  return VALID_BACKEND_ENDPOINTS[endpointKey] || null;
}

/**
 * Development helper: logs a warning for potentially invalid endpoint usage
 * @param method HTTP method
 * @param path API path
 */
export function validateAndWarnBackendEndpoint(method: string, path: string): void {
  if (process.env.NODE_ENV === 'development') {
    if (isKnownInvalidEndpoint(method, path)) {
      console.error(`🚨 [Backend API Validator] INVALID ENDPOINT: ${method} ${path}`);
      console.error(`This endpoint is known to not exist in the backend system.`);
      return;
    }
    
    if (!validateBackendEndpoint(method, path)) {
      console.warn(`⚠️ [Backend API Validator] UNVERIFIED ENDPOINT: ${method} ${path}`);
      console.warn(`This endpoint has not been validated. Please confirm it exists in the backend system.`);
    } else {
      const description = getEndpointDescription(method, path);
      console.log(`✅ [Backend API Validator] VALID ENDPOINT: ${method} ${path} - ${description}`);
    }
  }
}

/**
 * List all valid backend endpoints
 */
export function listValidEndpoints(): typeof VALID_BACKEND_ENDPOINTS {
  return VALID_BACKEND_ENDPOINTS;
}

/**
 * List all known invalid endpoints
 */
export function listInvalidEndpoints(): typeof INVALID_BACKEND_ENDPOINTS {
  return INVALID_BACKEND_ENDPOINTS;
}