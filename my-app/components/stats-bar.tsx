"use client";

import React from 'react';

export default function StatsBar() {
  const stats = [
    { label: 'Builders Reached', value: '500+', color: 'text-red-500' },
    { label: 'Events Hosted', value: '20+', color: 'text-blue-500' },
    { label: 'Active Programs', value: '5', color: 'text-purple-500' },
    { label: 'Districts Impacted', value: '3+', color: 'text-green-500' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-20 py-12">
      <div className="bh-glass-surface capsule px-8 py-6 flex flex-wrap items-center justify-around gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className={`text-3xl md:text-4xl font-bold font-mono ${stat.color}`}>
              {stat.value}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-text-secondary font-medium">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
