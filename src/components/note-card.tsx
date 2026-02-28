'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Pin, 
  Trash2, 
  Palette, 
  MoreVertical, 
  Check,
  Images
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageViewer, ClickableImage } from '@/components/image-viewer';
import { NOTE_COLORS, DecryptedImage } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DecryptedNote {
  id: string;
  title: string;
  content: string;
  color: string | null;
  isPinned: boolean;
  images: DecryptedImage[];
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface NoteCardProps {
  note: DecryptedNote;
  onEdit: (note: DecryptedNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onChangeColor: (id: string, color: string | null) => void;
}

export function NoteCard({ 
  note, 
  onEdit, 
  onDelete, 
  onTogglePin, 
  onChangeColor 
}: NoteCardProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const colorClass = note.color 
    ? `note-color-${note.color}` 
    : 'bg-card';

  // Get display images (max 4 for preview)
  const displayImages = note.images.slice(0, 4);
  const hasMoreImages = note.images.length > 4;
  const remainingCount = note.images.length - 4;

  // Determine grid layout based on image count
  const getImageGridClass = () => {
    if (displayImages.length === 1) return 'grid-cols-1';
    if (displayImages.length === 2) return 'grid-cols-2';
    return 'grid-cols-2'; // 3 or 4 images in 2x2 grid
  };

  const handleImageClick = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open editor if clicking on an image
    if ((e.target as HTMLElement).closest('.image-container')) {
      return;
    }
    onEdit(note);
  };

  return (
    <>
      <Card 
        className={cn(
          "note-card cursor-pointer group relative overflow-hidden transition-all duration-200",
          "hover:shadow-lg border border-border/50",
          colorClass,
          note.isPinned && "ring-2 ring-primary/30"
        )}
        onClick={handleCardClick}
      >
        {/* Images Grid */}
        {note.images.length > 0 && (
          <div className={cn(
            "grid gap-0.5 rounded-t-lg overflow-hidden",
            getImageGridClass()
          )}>
            {displayImages.map((image, index) => (
              <div 
                key={image.id}
                className={cn(
                  "image-container relative overflow-hidden",
                  displayImages.length === 3 && index === 0 && "col-span-2 row-span-2"
                )}
              >
                <ClickableImage
                  image={image}
                  index={index}
                  totalImages={note.images.length}
                  onClick={handleImageClick}
                  className={cn(
                    displayImages.length === 1 ? "aspect-video" :
                    displayImages.length === 2 ? "aspect-square" :
                    displayImages.length === 3 && index === 0 ? "aspect-video h-full" :
                    "aspect-square"
                  )}
                />
                {/* Show remaining count on last image */}
                {hasMoreImages && index === displayImages.length - 1 && (
                  <div 
                    className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
                    onClick={() => handleImageClick(index)}
                  >
                    <div className="text-center text-white">
                      <Images className="w-6 h-6 mx-auto mb-1" />
                      <span className="font-semibold">+{remainingCount} more</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Title */}
          {note.title && (
            <h3 className="font-semibold text-base line-clamp-2 break-words">
              {note.title}
            </h3>
          )}
          
          {/* Content preview */}
          {note.content && (
            <p className="text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap break-words">
              {note.content}
            </p>
          )}
          
          {/* Labels */}
          {note.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {note.labels.map((label, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          
          {/* Image count indicator if no preview shown */}
          {note.images.length > 0 && note.images.length <= 4 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <Images className="w-3 h-3" />
              <span>{note.images.length} image{note.images.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        
        {/* Pin indicator */}
        {note.isPinned && (
          <div className="absolute top-2 right-2">
            <Pin className="w-4 h-4 text-primary fill-primary" />
          </div>
        )}
        
        {/* Actions overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id, !note.isPinned);
              }}
            >
              <Pin className={cn("w-4 h-4", note.isPinned && "fill-current")} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowColorPicker(!showColorPicker)}>
                  <Palette className="w-4 h-4 mr-2" />
                  Change color
                </DropdownMenuItem>
                
                {showColorPicker && (
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {NOTE_COLORS.map((color) => (
                      <button
                        key={color.name}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                          note.color === color.name 
                            ? "border-foreground" 
                            : "border-transparent"
                        )}
                        style={{ 
                          backgroundColor: color.value || 'hsl(var(--card))' 
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeColor(note.id, color.value ? color.name : null);
                          setShowColorPicker(false);
                        }}
                      >
                        {note.color === color.name && (
                          <Check className="w-3 h-3 mx-auto text-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(note.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Image Viewer */}
      <ImageViewer
        images={note.images}
        initialIndex={viewerIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
