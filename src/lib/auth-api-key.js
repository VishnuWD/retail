import { db } from './db';

/**
 * Validates an incoming API request by checking its API key and required permission scope.
 * @param {Request} request 
 * @param {string} requiredScope e.g. "read:products"
 * @returns {Promise<{ success: boolean, businessId?: string, error?: string, status?: number }>}
 */
export async function validateApiKey(request, requiredScope) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('x-api-key');
    
    if (!authHeader) {
      return { success: false, error: 'API key is missing. Use Authorization header or x-api-key.', status: 401 };
    }

    // Support both "Bearer <key>" format and raw key format
    const key = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    const apiKeyRecord = await db.apiKey.findUnique({
      where: { key: key.trim() },
      include: { business: true }
    });

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return { success: false, error: 'Invalid or inactive API key.', status: 401 };
    }

    // Verify permission scope
    const hasScope = apiKeyRecord.scopes.includes(requiredScope);
    if (!hasScope) {
      return { 
        success: false, 
        error: `Insufficient permissions. This key requires the '${requiredScope}' scope.`, 
        status: 403 
      };
    }

    return { success: true, businessId: apiKeyRecord.businessId };
  } catch (error) {
    console.error('API key validation error:', error);
    return { success: false, error: 'Internal validation error.', status: 500 };
  }
}
