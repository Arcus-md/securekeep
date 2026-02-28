/**
 * Server-side Crypto Utilities
 * Used in API routes for password hashing and salt generation
 */

import { randomBytes, createHash } from 'crypto';

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(): string {
  const salt = randomBytes(16);
  return salt.toString('base64');
}

/**
 * Hash a password using SHA-256 (for authentication)
 * This is separate from the encryption key derivation
 */
export function hashPassword(password: string): Promise<string> {
  return Promise.resolve(
    createHash('sha256')
      .update(password)
      .digest('base64')
  );
}
