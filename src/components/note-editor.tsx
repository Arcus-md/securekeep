'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Image as ImageIcon, 
  X, 
  Loader2,
  Pin,
  Save,
  Plus,
  ZoomIn
} from 'lucide-react';
import { ImageViewer } from '@/components/image-viewer';
import { NOTE_COLORS, DecryptedImage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { resizeImage } from '@/lib/encryption';

interface DecryptedNote {
  id?: string;
  title: string;
  content: string;
  color: string | null;
  isPinned: boolean;
  images: DecryptedImage[];
  labels: string[];
}

interface NoteEditorProps {
  note: DecryptedNote | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: DecryptedNote) => void;
  isLoading?: boolean;
}

export function NoteEditor({ 
  note, 
  isOpen, 
  onClose, 
  onSave,
  isLoading = false 
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [images, setImages] = useState<DecryptedImage[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color);
      setIsPinned(note.isPinned);
      setImages(note.images || []);
    } else {
      setTitle('');
      setContent('');
      setColor(null);
      setIsPinned(false);
      setImages([]);
    }
  }, [note]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImage(true);
    try {
      const newImages: DecryptedImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Resize image before storing
        const resizedBuffer = await resizeImage(file);
        
        // Convert to base64 for display and storage
        const base64 = btoa(
          new Uint8Array(resizedBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );
        
        newImages.push({
          id: `temp-${Date.now()}-${i}`,
          data: base64,
          mimeType: 'image/jpeg',
          order: images.length + i,
        });
      }
      
      setImages([...images, ...newImages]);
    } catch (error) {
      console.error('Failed to process image:', error);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setImages(images.filter(img => img.id !== imageId).map((img, idx) => ({
      ...img,
      order: idx,
    })));
  };

  const handleReorderImage = (imageId: string, direction: 'left' | 'right') => {
    const index = images.findIndex(img => img.id === imageId);
    if (
      (direction === 'left' && index === 0) ||
      (direction === 'right' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const swapIndex = direction === 'left' ? index - 1 : index + 1;
    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];
    
    // Update order
    setImages(newImages.map((img, idx) => ({ ...img, order: idx })));
  };

  const handleViewImage = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleSave = () => {
    onSave({
      id: note?.id,
      title: title.trim() || 'Untitled',
      content,
      color,
      isPinned,
      images,
      labels: note?.labels || [],
    });
  };

  const colorClass = color ? `note-color-${color}` : 'bg-card';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn(
          "max-w-2xl max-h-[90vh] overflow-hidden flex flex-col",
          colorClass
        )}>
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="sr-only">
                {note?.id ? 'Edit Note' : 'New Note'}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {/* Color picker */}
                <div className="flex items-center gap-1 flex-wrap">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.name}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                        color === c.name 
                          ? "border-foreground ring-2 ring-foreground/20" 
                          : "border-transparent"
                      )}
                      style={{ 
                        backgroundColor: c.value || 'hsl(var(--card))' 
                      }}
                      onClick={() => setColor(c.value ? c.name : null)}
                    />
                  ))}
                </div>
                
                {/* Pin button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(isPinned && "text-primary")}
                  onClick={() => setIsPinned(!isPinned)}
                >
                  <Pin className={cn("w-4 h-4", isPinned && "fill-current")} />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Images */}
            {images.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div 
                      key={image.id} 
                      className="relative group aspect-video rounded-lg overflow-hidden bg-muted"
                    >
                      <img 
                        src={`data:${image.mimeType};base64,${image.data}`}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay controls */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {/* View button */}
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewImage(index)}
                          title="View full size"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        {/* Reorder left */}
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleReorderImage(image.id, 'left')}
                          disabled={index === 0}
                          title="Move left"
                        >
                          ←
                        </Button>
                        {/* Delete */}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveImage(image.id)}
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        {/* Reorder right */}
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleReorderImage(image.id, 'right')}
                          disabled={index === images.length - 1}
                          title="Move right"
                        >
                          →
                        </Button>
                      </div>
                      {/* Image number badge */}
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add more images button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add more images
                </Button>
              </div>
            )}

            {/* Title */}
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold border-0 px-0 focus-visible:ring-0 bg-transparent"
            />

            {/* Content */}
            <Textarea
              placeholder="Start writing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] border-0 px-0 focus-visible:ring-0 bg-transparent resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Image upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
              >
                {isProcessingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ImageIcon className="w-4 h-4 mr-2" />
                )}
                {images.length === 0 ? 'Add images' : 'Add more'}
              </Button>
              
              {images.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {images.length} image{images.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <ImageViewer
        images={images}
        initialIndex={viewerIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
