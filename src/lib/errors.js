import crypto from 'crypto';

/**
 * Normalizes, logs, and masks errors to prevent stack trace leaks in production.
 * @param {Error} error 
 * @returns {{ code: string, message: string, reference: string }}
 */
export function handleApiError(error) {
  // Generate a unique 8-character error reference code
  const reference = 'ERR-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  
  // Log the complete error with details to the server console
  console.error(`[System Error - ${reference}] Details:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Mask sensitive database or engine errors in production
  const isProd = process.env.NODE_ENV === 'production';
  
  // Detect database errors (e.g., Prisma errors)
  const isPrismaError = error.message && (
    error.message.includes('PrismaClient') ||
    error.message.includes('db.$transaction') ||
    error.message.includes('Unique constraint') ||
    error.message.includes('Foreign key constraint')
  );

  if (isProd) {
    if (isPrismaError) {
      return {
        code: 'DATABASE_ERROR',
        message: 'A database operation failed. The error details have been logged.',
        reference
      };
    }

    return {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our end. Please try again later.',
      reference
    };
  }

  // In development, return the raw details for debugging convenience
  return {
    code: isPrismaError ? 'DATABASE_ERROR' : 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred.',
    reference,
    stack: error.stack
  };
}
