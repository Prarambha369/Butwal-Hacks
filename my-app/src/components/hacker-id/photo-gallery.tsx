"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Image as ImageIcon } from 'lucide-react';
import { DisplayPhoto as Photo } from '@/lib/supabase-types';
import { getDiceBearPlaceholder } from '@/lib/utils';

interface PhotoGalleryProps {
  photos: Photo[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className="bh-card p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto">
          <ImageIcon className="w-8 h-8 text-muted-foreground opacity-20" />
        </div>
        <p className="text-muted-foreground font-mono text-sm opacity-60">
          No memories captured yet. The lens awaits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2 mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary opacity-40">
          Hackathon Memories
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground opacity-60">
          {photos.length} Captures
        </span>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] gap-4">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className={`relative group cursor-pointer overflow-hidden rounded-lg transition-all duration-500 ${
              photo.span === 2 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'
            }`}
            onClick={() => setSelectedPhoto(photo)}
          >
            <Image 
              src={photo.url} 
              alt={photo.event} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getDiceBearPlaceholder(photo.id);
              }}
            />
            
            {/* Glass Overlay Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
              <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-primary font-bold text-sm">{photo.event}</p>
                <p className="text-primary/60 text-[10px] font-mono">{photo.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-background/90" 
            onClick={() => setSelectedPhoto(null)}
          />
          
          <div className="relative max-w-5xl w-full h-full max-h-[80vh] flex flex-col justify-center items-center animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 p-2 text-primary hover:text-primary-red transition-colors"
            >
              <X size={32} />
            </button>

            <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-border bg-background">
              <Image 
                src={selectedPhoto.url} 
                alt={selectedPhoto.event} 
                fill 
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getDiceBearPlaceholder(selectedPhoto.id);
                }}
              />
              
              {/* Modal Caption */}
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-primary">
                <div className="flex justify-between items-end">
                  <div>
                    <h4 className="text-xl font-bold">{selectedPhoto.event}</h4>
                    <p className="text-primary/60 font-mono text-sm">{selectedPhoto.date}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-surface-hover border border-border text-[10px] font-black uppercase tracking-widest">
                    Hacker ID Memory
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
