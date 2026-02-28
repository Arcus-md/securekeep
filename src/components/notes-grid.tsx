'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NoteCard } from './note-card';
import { NoteEditor } from './note-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Shield, 
  LogOut, 
  Loader2,
  FileText,
  Moon,
  Sun
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { encryptionService } from '@/lib/encryption';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { DecryptedNote, DecryptedImage } from '@/lib/types';

// Masonry grid breakpoints
const BREAKPOINTS = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 1,
};

export function NotesGrid() {
  const { user, logout, isEncryptionReady } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<DecryptedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<DecryptedNote | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [columns, setColumns] = useState(4);

  // Handle responsive columns
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);
      else if (width < 768) setColumns(2);
      else if (width < 1024) setColumns(3);
      else if (width < 1280) setColumns(3);
      else setColumns(4);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    if (!user?.id || !isEncryptionReady) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notes?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success && data.notes) {
        // Decrypt notes
        const decryptedNotes = await Promise.all(
          data.notes.map(async (note: any) => {
            try {
              const { title, content } = await encryptionService.decryptNote(
                note.title,
                note.content || ''
              );
              
              // Decrypt all images
              const decryptedImages: DecryptedImage[] = [];
              if (note.images && note.images.length > 0) {
                for (const image of note.images) {
                  try {
                    const decryptedBuffer = await encryptionService.decryptImage(image.data);
                    const base64 = btoa(
                      new Uint8Array(decryptedBuffer).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ''
                      )
                    );
                    decryptedImages.push({
                      id: image.id,
                      data: base64,
                      mimeType: image.mimeType,
                      order: image.order,
                    });
                  } catch (imgError) {
                    console.error('Failed to decrypt image:', image.id, imgError);
                  }
                }
              }
              
              return {
                id: note.id,
                title,
                content,
                color: note.color,
                isPinned: note.isPinned,
                images: decryptedImages,
                labels: note.labels?.map((l: any) => l.label?.name || '') || [],
                createdAt: new Date(note.createdAt),
                updatedAt: new Date(note.updatedAt),
              };
            } catch (error) {
              console.error('Failed to decrypt note:', note.id, error);
              return null;
            }
          })
        );
        
        setNotes(decryptedNotes.filter((n): n is DecryptedNote => n !== null));
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load notes',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isEncryptionReady, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Create/Update note
  const handleSaveNote = async (note: DecryptedNote) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      // Encrypt note data
      const { title, content } = await encryptionService.encryptNote(
        note.title,
        note.content
      );
      
      // Encrypt all images
      const encryptedImages = [];
      for (const image of note.images) {
        const imageBuffer = new Uint8Array(
          atob(image.data).split('').map(c => c.charCodeAt(0))
        ).buffer;
        const encryptedData = await encryptionService.encryptImage(imageBuffer);
        encryptedImages.push({
          data: encryptedData,
          mimeType: image.mimeType,
          order: image.order,
        });
      }
      
      const noteData = {
        userId: user.id,
        title,
        content,
        color: note.color,
        isPinned: note.isPinned,
        images: encryptedImages,
      };
      
      if (note.id) {
        // Update existing note
        await fetch(`/api/notes/${note.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData),
        });
      } else {
        // Create new note
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData),
        });
      }
      
      setIsEditorOpen(false);
      setEditingNote(null);
      fetchNotes();
      
      toast({
        title: note.id ? 'Note updated' : 'Note created',
        description: `Your encrypted note with ${note.images.length} image${note.images.length !== 1 ? 's' : ''} has been saved.`,
      });
    } catch (error) {
      console.error('Failed to save note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save note',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (id: string) => {
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      setNotes(notes.filter(n => n.id !== id));
      toast({
        title: 'Note deleted',
        description: 'Your note has been removed.',
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete note',
      });
    }
  };

  // Toggle pin
  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
      });
      setNotes(notes.map(n => n.id === id ? { ...n, isPinned } : n));
    } catch (error) {
      console.error('Failed to update pin:', error);
    }
  };

  // Change color
  const handleChangeColor = async (id: string, color: string | null) => {
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color }),
      });
      setNotes(notes.map(n => n.id === id ? { ...n, color } : n));
    } catch (error) {
      console.error('Failed to update color:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    encryptionService.clear();
    logout();
    toast({
      title: 'Logged out',
      description: 'Your encryption key has been cleared.',
    });
  };

  // Filter notes by search
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split notes into columns for masonry layout
  const masonryColumns = Array.from({ length: columns }, () => [] as DecryptedNote[]);
  filteredNotes.forEach((note, index) => {
    masonryColumns[index % columns].push(note);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg">SecureKeep</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  E2E Encrypted
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No notes yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first encrypted note. Add as many images as you want - all encrypted end-to-end.
            </p>
            <Button onClick={() => {
              setEditingNote({
                title: '',
                content: '',
                color: null,
                isPinned: false,
                images: [],
                labels: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              setIsEditorOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Note
            </Button>
          </div>
        ) : (
          <div className="masonry-grid">
            {masonryColumns.map((column, columnIndex) => (
              <div 
                key={columnIndex} 
                className="masonry-grid-column"
              >
                {column.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={(n) => {
                      setEditingNote(n);
                      setIsEditorOpen(true);
                    }}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                    onChangeColor={handleChangeColor}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating action button */}
      {!isLoading && notes.length > 0 && (
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          onClick={() => {
            setEditingNote({
              title: '',
              content: '',
              color: null,
              isPinned: false,
              images: [],
              labels: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            setIsEditorOpen(true);
          }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* Note editor dialog */}
      <NoteEditor
        note={editingNote}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        isLoading={isSaving}
      />
    </div>
  );
}
