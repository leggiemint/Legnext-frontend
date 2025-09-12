import { NextRequest } from 'next/server';

export function getUserApiKey(request: NextRequest): string | null {
  // Check X-API-KEY header (user's own API key)
  const userApiKey = request.headers.get('X-API-KEY') || request.headers.get('x-api-key');
  
  if (userApiKey) {
    return userApiKey;
  }

  return null;
}

export function getManagerApiKey(request: NextRequest): string | null {
  // Check API-KEY header (manager API key)
  const managerApiKey = request.headers.get('API-KEY') || request.headers.get('api-key');
  
  if (managerApiKey && managerApiKey === process.env.BACKEND_API_KEY) {
    return managerApiKey;
  }

  return null;
}