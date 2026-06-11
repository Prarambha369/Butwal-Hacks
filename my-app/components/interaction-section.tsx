"use client";

import React, { useState } from 'react';
import { Plus, Share, Trash, Info, Settings, Music } from 'lucide-react';

export default function InteractionSection() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modality, setModality] = useState<'none' | 'parallel' | 'modal'>('none');

  return (
    <section id="interactions" className="py-32 px-6 md:px-20 bg-color-bg-primary dark:bg-black overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20">
          <span className="text-blue-600 font-bold text-xs tracking-widest uppercase block mb-4">
            Spatial Logic
          </span>
          <h2 className="text-4xl md:text-6xl text-apple-bold leading-tight">
            Interactions that <br />
            Feel Grounded.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          
          {/* Demo 1: The Action Sheet (Springing) */}
          <div className="flex flex-col gap-8">
            <div className="p-8 liquid-glass rounded-[32px] border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold mb-4">Spatial Action Sheet</h3>
              <p className="text-text-secondary text-sm mb-8">
                Actions no longer just appear at the bottom. They spring from the source, 
                creating a direct spatial relationship between the trigger and the result.
              </p>
              
              <div className="relative h-64 w-full bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center overflow-hidden">
                <button 
                  onClick={() => setSheetOpen(true)}
                  className="capsule bg-blue-600 text-white px-6 py-3 font-bold shadow-lg hover:scale-105 transition-transform active:scale-95 flex items-center gap-2"
                >
                  <Share className="w-4 h-4" /> Share Document
                </button>

                {/* The Action Sheet - "Springing" effect */}
                <div 
                  className={`absolute inset-x-4 bottom-4 transition-all duration-500 ease-[cubic-bezier(0.32,0,0.67,0)] ${
                    sheetOpen 
                    ? 'translate-y-0 opacity-100 scale-100' 
                    : 'translate-y-full opacity-0 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="liquid-glass rounded-[28px] p-2 shadow-2xl border-gray-300 dark:border-gray-700">
                    <div className="flex flex-col gap-1">
                      <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl text-left transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><Info className="w-4 h-4" /></div>
                        <span className="text-sm font-medium">Get Info</span>
                      </button>
                      <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl text-left transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600"><Settings className="w-4 h-4" /></div>
                        <span className="text-sm font-medium">Rename</span>
                      </button>
                      <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
                      <button className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl text-left transition-colors text-red-600">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><Trash className="w-4 h-4" /></div>
                        <span className="text-sm font-medium">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSheetOpen(false)} 
                className="mt-4 text-xs text-text-secondary hover:text-text-primary transition-colors underline block text-center w-full"
              >
                Close Sheet
              </button>
            </div>
          </div>

          {/* Demo 2: Material Variation (Modality) */}
          <div className="flex flex-col gap-8">
            <div className="p-8 liquid-glass rounded-[32px] border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold mb-4">Material & Focus</h3>
              <p className="text-text-secondary text-sm mb-8">
                Liquid Glass adapts to the task. Parallel tasks use layering for separation, 
                while modal tasks use a dimming layer to center attention.
              </p>

              <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setModality('none')}
                  className={`px-4 py-2 text-xs font-bold capsule transition-all ${modality === 'none' ? 'bg-text-primary text-white' : 'liquid-glass'}`}
                >
                  Standard
                </button>
                <button 
                  onClick={() => setModality('parallel')}
                  className={`px-4 py-2 text-xs font-bold capsule transition-all ${modality === 'parallel' ? 'bg-text-primary text-white' : 'liquid-glass'}`}
                >
                  Parallel
                </button>
                <button 
                  onClick={() => setModality('modal')}
                  className={`px-4 py-2 text-xs font-bold capsule transition-all ${modality === 'modal' ? 'bg-text-primary text-white' : 'liquid-glass'}`}
                >
                  Modal
                </button>
              </div>

              <div className="relative h-64 w-full bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden p-6">
                {/* Background Content */}
                <div className={`transition-all duration-500 ${modality === 'modal' ? 'blur-sm grayscale opacity-50 scale-95' : 'opacity-100'}`}>
                  <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                  </div>
                </div>

                {/* Dimming Layer (Modal only) */}
                {modality === 'modal' && (
                  <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-10 transition-opacity duration-500" />
                )}

                {/* Floating Interface Element */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 p-4 liquid-glass rounded-2xl shadow-2xl z-20 transition-all duration-500 ${
                  modality === 'none' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white"><Music className="w-4 h-4" /></div>
                    <span className="font-bold text-sm">Now Playing</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
