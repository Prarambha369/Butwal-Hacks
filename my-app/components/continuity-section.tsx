"use client";

import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

type Device = 'iphone' | 'ipad' | 'mac';

export default function ContinuitySection() {
  const [device, setDevice] = useState<Device>('iphone');

  const deviceConfigs = {
    iphone: {
      width: 'w-[375px]',
      height: 'h-[667px]',
      label: 'iPhone',
      icon: <Smartphone className="w-4 h-4" />,
      layout: 'column',
    },
    ipad: {
      width: 'w-[768px]',
      height: 'h-[1024px]',
      label: 'iPad',
      icon: <Tablet className="w-4 h-4" />,
      layout: 'split',
    },
    mac: {
      width: 'w-full max-w-5xl',
      height: 'h-[600px]',
      label: 'Mac',
      icon: <Monitor className="w-4 h-4" />,
      layout: 'expansive',
    },
  };

  return (
    <section id="continuity" className="py-32 px-6 md:px-20 bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20 text-center">
          <span className="text-blue-600 font-bold text-xs tracking-widest uppercase block mb-4">
            Shared Foundation
          </span>
          <h2 className="text-4xl md:text-6xl text-apple-bold leading-tight mb-6">
            One Anatomy. <br />
            Every Surface.
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg">
            Consistency isn't about making every screen look the same—it's about making 
            every interaction feel familiar, regardless of the device.
          </p>
        </div>

        {/* Device Switcher */}
        <div className="flex justify-center gap-3 mb-12">
          {(Object.keys(deviceConfigs) as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`flex items-center gap-2 px-6 py-3 capsule font-bold transition-all ${
                device === d 
                ? 'bg-text-primary text-white shadow-lg scale-105' 
                : 'liquid-glass text-text-secondary hover:text-text-primary'
              }`}
            >
              {deviceConfigs[d].icon}
              {deviceConfigs[d].label}
            </button>
          ))}
        </div>

        {/* Device Preview */}
        <div className="flex justify-center items-center py-10">
          <div className={`transition-all duration-500 ease-in-out relative shadow-2xl rounded-[40px] overflow-hidden border-[8px] border-gray-900 dark:border-gray-800 bg-color-bg-secondary ${deviceConfigs[device].width} ${deviceConfigs[device].height}`}>
            
            {/* Window Header (Mac/iPad) */}
            {(device === 'mac' || device === 'ipad') && (
              <div className="h-10 bg-gray-200 dark:bg-gray-800 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            )}

            <div className="flex h-full">
              {/* Sidebar (Hidden on iPhone, collapsed on iPad, full on Mac) */}
              {(device === 'ipad' || device === 'mac') && (
                <div className={`liquid-glass border-r border-gray-200 dark:border-gray-800 transition-all duration-500 ${device === 'mac' ? 'w-64' : 'w-20'} flex flex-col p-4 gap-4`}>
                  <div className="w-full h-8 bg-blue-500/20 rounded-lg mb-4" />
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-10 rounded-lg bg-gray-300 dark:bg-gray-700 ${device === 'mac' ? 'w-full' : 'w-10'}`} />
                  ))}
                </div>
              )}

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-6 flex-1 overflow-y-auto">
                  <div className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded-lg mb-6" />
                  <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 liquid-glass rounded-2xl p-4 flex gap-4">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-xl shrink-0" />
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-700 rounded" />
                          <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tab Bar (iPhone only) */}
                {device === 'iphone' && (
                  <div className="h-20 liquid-glass border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-6 pb-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded-full" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div>
            <h4 className="font-bold text-xl mb-2">iPhone</h4>
            <p className="text-text-secondary text-sm">Focused vertical utility with a dedicated search tab for reachability.</p>
          </div>
          <div>
            <h4 className="font-bold text-xl mb-2">iPad</h4>
            <p className="text-text-secondary text-sm">The bridge. Learning to scale from focused utility to expansive depth.</p>
          </div>
          <div>
            <h4 className="font-bold text-xl mb-2">Mac</h4>
            <p className="text-text-secondary text-sm">An expansive canvas. Sidebars extend to the edge for maximum immersion.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
