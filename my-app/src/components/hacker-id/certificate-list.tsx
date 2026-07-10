"use client";

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { Certificate } from '@/lib/supabase-types';

interface CertificateCardProps {
  cert: Certificate;
}

function CertificateCard({ cert }: CertificateCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusConfig = {
    Verified: {
      label: 'Verified',
      color: 'text-bh-red-500 bg-bh-red-500/10 border-bh-red-500/20',
      icon: <CheckCircle2 size={12} strokeWidth={3} />,
      watermark: 'Verified',
    },
    NotVerified: {
      label: 'Pending',
      color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      icon: <AlertCircle size={12} strokeWidth={3} />,
      watermark: 'Pending',
    },
    UnknownSource: {
      label: 'Unverified',
      color: 'text-secondary bg-surface/10 border-glass',
      icon: <HelpCircle size={12} strokeWidth={3} />,
      watermark: 'Unknown',
    },
  };

  const config = statusConfig[cert.verified];

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(true)}
        className="group cursor-pointer lg-surface rounded-2xl p-4 md:p-6 border border-glass overflow-hidden transition-all duration-300 hover:border-bh-red-500/30 hover:scale-[1.01]"
      >
        {/* Watermark */}
        <div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] opacity-[0.03] select-none overflow-hidden"
          style={{ transform: 'rotate(-12deg)' }}
        >
          <span className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-primary whitespace-nowrap">
            {config.watermark}
          </span>
        </div>

        <div className="relative z-10 flex items-center gap-4 md:gap-6">
          {/* Year Icon */}
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-colors duration-300 ${
            cert.verified === 'Verified' ? 'bg-bh-red-600/80 backdrop-blur-xl saturate-150 border border-bh-red-500/50 shadow-[0_4px_20px_var(--glow-bh-red)]' : 'bg-surface/10 border border-glass'
          }`}>
            <span className={`font-mono font-bold text-lg ${
              cert.verified === 'Verified' ? 'text-primary' : 'text-secondary'
            }`}>
              {cert.year}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1">
            <h4 className="text-primary font-bold text-base md:text-lg leading-tight">
              {cert.title}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
              <span className="font-medium">{cert.issuer}</span>
              <span className="hidden md:inline opacity-30">•</span>
              <span className="font-mono text-[11px] opacity-60">{cert.date}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${config.color}`}>
              {config.icon}
              {config.label}
            </div>
          </div>
        </div>
      </div>

      {/* The Proof Lightbox */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-background/90 backdrop-blur-2xl" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col md:flex-row gap-8 items-center justify-center animate-in zoom-in-95 duration-300">
            {/* Left: The actual certificate document */}
            <div className="relative w-full md:w-1/2 h-[60vh] md:h-full rounded-3xl overflow-hidden border border-glass bg-background shadow-2xl">
              {cert.certificateUrl ? (
                <Image 
                  src={cert.certificateUrl} 
                  alt={cert.title} 
                  fill 
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface/10">
                  <span className="text-secondary text-sm font-mono">No Certificate Image</span>
                </div>
              )}
            </div>

            {/* Right: The Verification Audit Trail */}
            <div className="w-full md:w-1/2 flex flex-col gap-6 text-left">
              <div className="lg-surface p-8 rounded-3xl border border-glass space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-bh-red-500/10 rounded-lg text-bh-red-500">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-primary">Verification Audit</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface/10 border border-glass space-y-2">
                    <p className="text-xs font-mono text-secondary uppercase tracking-widest">Verification Status</p>
                    <p className={`font-bold ${cert.verified === 'Verified' ? 'text-bh-red-500' : 'text-yellow-500'}`}>
                      {cert.verified === 'Verified' ? 'OFFICIALLY VERIFIED' : 'PENDING / UNVERIFIED'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface/10 border border-glass space-y-2">
                    <p className="text-xs font-mono text-secondary uppercase tracking-widest">Audit Trail</p>
                    <p className="text-secondary leading-relaxed italic">
                      &quot;{cert.verificationTrail || 'No verification trail available for this document.'}&quot;
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-glass">
                    <span className="text-xs text-secondary font-mono">Issuer: {cert.issuer}</span>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-full bg-bh-red-500 text-primary text-xs font-bold hover:bg-bh-red-600 transition-all"
                    >
                      Close Audit
                    </button>
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

export default function CertificateList({ certificates }: { certificates: Certificate[] }) {
  if (certificates.length === 0) {
    return (
      <div className="lg-surface rounded-3xl p-12 border border-glass text-center space-y-4">
        <div className="w-16 h-16 bg-surface/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-secondary opacity-20" />
        </div>
        <p className="text-secondary font-mono text-sm opacity-60">
          No certificates issued yet. The compiler awaits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2 mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary opacity-40">
          Verified Credentials
        </h3>
        <span className="text-[10px] font-mono text-secondary opacity-60">
          {certificates.length} Issued
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {certificates.map((cert) => (
          <CertificateCard key={cert.id} cert={cert} />
        ))}
      </div>
    </div>
  );
}
