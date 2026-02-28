/**
 * SecureKeep Encryption Service
 * 
 * Implements End-to-End Encryption (E2EE) using:
 * - PBKDF2 for key derivation from password
 * - AES-256-GCM for symmetric encryption
 * - Web Crypto API (native browser support)
 * 
 * IMPORTANT: The server NEVER sees the encryption key or plaintext data.
 * All encryption/decryption happens client-side.
 */

// Salt length for PBKDF2 (16 bytes = 128 bits)
const SALT_LENGTH = 16;
// IV length for AES-GCM (12 bytes = 96 bits, recommended for GCM)
const IV_LENGTH = 12;
// PBKDF2 iterations (OWASP recommends 600,000+ for PBKDF2-SHA256)
const PBKDF2_ITERATIONS = 600000;
// Key length (256 bits for AES-256)
const KEY_LENGTH = 256;

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a cryptographically secure random salt
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return arrayBufferToBase64(salt.buffer);
}

/**
 * Derive an encryption key from a password using PBKDF2
 * 
 * @param password - User's password (never stored)
 * @param salt - Salt for key derivation (stored in DB)
 * @returns CryptoKey for AES-256-GCM encryption
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: string
): Promise<CryptoKey> {
  // Convert salt from base64 to ArrayBuffer
  const saltBuffer = base64ToArrayBuffer(salt);
  
  // Import password as raw key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the encryption key using PBKDF2
  const encryptionKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false, // Not extractable for security
    ['encrypt', 'decrypt']
  );
  
  return encryptionKey;
}

/**
 * Encrypt a string using AES-256-GCM
 * 
 * @param plaintext - Data to encrypt
 * @param key - Derived encryption key
 * @returns Base64 encoded ciphertext (IV + encrypted data + auth tag)
 */
export async function encryptString(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  // Generate a random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Encrypt the data
  const encodedPlaintext = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedPlaintext
  );
  
  // Combine IV and ciphertext (IV is needed for decryption)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt a string using AES-256-GCM
 * 
 * @param ciphertext - Base64 encoded ciphertext (IV + encrypted data + auth tag)
 * @param key - Derived encryption key
 * @returns Decrypted plaintext
 */
export async function decryptString(
  ciphertext: string,
  key: CryptoKey
): Promise<string> {
  // Decode the combined IV + ciphertext
  const combined = new Uint8Array(base64ToArrayBuffer(ciphertext));
  
  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const encryptedData = combined.slice(IV_LENGTH);
  
  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedData
  );
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt binary data (like images) using AES-256-GCM
 * 
 * @param data - Binary data to encrypt
 * @param key - Derived encryption key
 * @returns Base64 encoded ciphertext
 */
export async function encryptBinary(
  data: ArrayBuffer,
  key: CryptoKey
): Promise<string> {
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Encrypt the data
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  
  // Combine IV and ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt binary data using AES-256-GCM
 * 
 * @param ciphertext - Base64 encoded ciphertext
 * @param key - Derived encryption key
 * @returns Decrypted binary data
 */
export async function decryptBinary(
  ciphertext: string,
  key: CryptoKey
): Promise<ArrayBuffer> {
  // Decode the combined IV + ciphertext
  const combined = new Uint8Array(base64ToArrayBuffer(ciphertext));
  
  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const encryptedData = combined.slice(IV_LENGTH);
  
  // Decrypt the data
  return await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedData
  );
}

/**
 * Hash a password using SHA-256 (for authentication)
 * This is separate from the encryption key derivation
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Resize an image before encryption to save space
 * 
 * @param file - Image file
 * @param maxWidth - Maximum width (default 1200px)
 * @param maxHeight - Maximum height (default 1200px)
 * @param quality - JPEG quality (0-1, default 0.8)
 * @returns Resized image as ArrayBuffer
 */
export async function resizeImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            blob.arrayBuffer().then(resolve).catch(reject);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Client-side encryption service class
 * Manages the encryption key in memory (never persisted)
 */
export class EncryptionService {
  private key: CryptoKey | null = null;
  private salt: string | null = null;
  
  /**
   * Initialize the encryption service with a password
   * Call this on login or signup
   */
  async initialize(password: string, salt: string): Promise<void> {
    this.salt = salt;
    this.key = await deriveKeyFromPassword(password, salt);
  }
  
  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.key !== null;
  }
  
  /**
   * Clear the encryption key from memory
   * Call this on logout
   */
  clear(): void {
    this.key = null;
    this.salt = null;
  }
  
  /**
   * Encrypt a note (title and content)
   */
  async encryptNote(title: string, content: string): Promise<{ title: string; content: string }> {
    if (!this.key) throw new Error('Encryption service not initialized');
    
    return {
      title: await encryptString(title, this.key),
      content: await encryptString(content, this.key),
    };
  }
  
  /**
   * Decrypt a note (title and content)
   */
  async decryptNote(title: string, content: string): Promise<{ title: string; content: string }> {
    if (!this.key) throw new Error('Encryption service not initialized');
    
    return {
      title: await decryptString(title, this.key),
      content: content ? await decryptString(content, this.key) : '',
    };
  }
  
  /**
   * Encrypt an image
   */
  async encryptImage(imageData: ArrayBuffer): Promise<string> {
    if (!this.key) throw new Error('Encryption service not initialized');
    return await encryptBinary(imageData, this.key);
  }
  
  /**
   * Decrypt an image
   */
  async decryptImage(encryptedData: string): Promise<ArrayBuffer> {
    if (!this.key) throw new Error('Encryption service not initialized');
    return await decryptBinary(encryptedData, this.key);
  }
  
  /**
   * Encrypt label name
   */
  async encryptLabel(name: string): Promise<string> {
    if (!this.key) throw new Error('Encryption service not initialized');
    return await encryptString(name, this.key);
  }
  
  /**
   * Decrypt label name
   */
  async decryptLabel(name: string): Promise<string> {
    if (!this.key) throw new Error('Encryption service not initialized');
    return await decryptString(name, this.key);
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();
