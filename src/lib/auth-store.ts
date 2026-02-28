/**
 * Authentication Store using Zustand
 * Manages user session and encryption key state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string | null;
  keySalt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isEncryptionReady: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setEncryptionReady: (ready: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isEncryptionReady: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isEncryptionReady: false,
      }),
      
      setEncryptionReady: (ready) => set({ isEncryptionReady: ready }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        isEncryptionReady: false,
      }),
    }),
    {
      name: 'securekeep-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
