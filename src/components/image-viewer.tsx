'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { DecryptedImage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface ImageViewerProps {
  images: DecryptedImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageViewer({ 
  images, 
  initialIndex = 0, 
  isOpen, 
  onClose 
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  // Reset index when opened
  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl w-full h-[90vh] p-0 bg-black/95 border-none"
        onKeyDown={handleKeyDown}
      >
        <VisuallyHidden>
          <DialogTitle>Image Viewer</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Main image */}
          <img
            src={`data:${currentImage.mimeType};base64,${currentImage.data}`}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                onClick={handleNext}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-2 bg-black/60 rounded-lg max-w-[90%] overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all",
                    index === currentIndex 
                      ? "border-white ring-2 ring-white/50" 
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={`data:${image.mimeType};base64,${image.data}`}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Clickable image wrapper
interface ClickableImageProps {
  image: DecryptedImage;
  index: number;
  totalImages: number;
  onClick: (index: number) => void;
  className?: string;
}

export function ClickableImage({ 
  image, 
  index, 
  totalImages, 
  onClick,
  className 
}: ClickableImageProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={cn("relative group cursor-pointer", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(index)}
    >
      <img
        src={`data:${image.mimeType};base64,${image.data}`}
        alt={`Attachment ${index + 1}`}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
      {/* Hover overlay */}
      <div className={cn(
        "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <ZoomIn className="w-8 h-8 text-white" />
      </div>
    </div>
  );
}
