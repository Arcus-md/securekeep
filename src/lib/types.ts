/**
 * Type definitions for SecureKeep
 */

// Note colors (inspired by Google Keep)
export const NOTE_COLORS = [
  { name: 'default', value: null, label: 'Default' },
  { name: 'red', value: '#ffcdd2', label: 'Red' },
  { name: 'orange', value: '#ffe0b2', label: 'Orange' },
  { name: 'yellow', value: '#fff9c4', label: 'Yellow' },
  { name: 'green', value: '#c8e6c9', label: 'Green' },
  { name: 'teal', value: '#b2dfdb', label: 'Teal' },
  { name: 'blue', value: '#bbdefb', label: 'Blue' },
  { name: 'purple', value: '#e1bee7', label: 'Purple' },
  { name: 'pink', value: '#f8bbd9', label: 'Pink' },
  { name: 'gray', value: '#e0e0e0', label: 'Gray' },
] as const;

export type NoteColor = typeof NOTE_COLORS[number]['name'];

// Decrypted image
export interface DecryptedImage {
  id: string;
  data: string; // Base64 decrypted image data
  mimeType: string;
  order: number;
}

// Decrypted note (client-side representation)
export interface DecryptedNote {
  id: string;
  title: string;
  content: string;
  color: string | null;
  isPinned: boolean;
  isArchived: boolean;
  images: DecryptedImage[]; // Multiple images
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Encrypted image for API
export interface EncryptedImageInput {
  data: string; // Base64 encrypted data
  mimeType: string;
  order: number;
}

// API Request/Response types
export interface CreateNoteRequest {
  title: string; // Encrypted
  content: string | null; // Encrypted
  color: string | null;
  isPinned?: boolean;
  images?: EncryptedImageInput[]; // Multiple encrypted images
  labels?: string[]; // Label IDs
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  color?: string | null;
  isPinned?: boolean;
  isArchived?: boolean;
  images?: EncryptedImageInput[];
  labels?: string[];
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    keySalt: string;
  };
  error?: string;
}
