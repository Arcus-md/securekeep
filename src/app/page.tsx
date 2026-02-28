'use client';

import { useSyncExternalStore } from 'react';
import { AuthForm } from '@/components/auth-form';
import { NotesGrid } from '@/components/notes-grid';
import { useAuthStore } from '@/lib/auth-store';
import { Shield, Loader2 } from 'lucide-react';

// No-op subscribe for useSyncExternalStore
const subscribe = () => () => {};

// Returns true only on client after hydration
function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export default function Home() {
  const isClient = useIsClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isEncryptionReady = useAuthStore((state) => state.isEncryptionReady);

  // Show loading state during SSR
  // This prevents hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">SecureKeep</h2>
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated or encryption not ready
  // (Encryption key must be re-derived each session - we never store passwords)
  if (!isAuthenticated || !isEncryptionReady) {
    return <AuthForm onSuccess={() => {}} />;
  }

  // Show notes grid when authenticated and encryption is ready
  return <NotesGrid />;
}
