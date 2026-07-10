"use client";

import React from 'react';
import { Share2, Download, Award, BarChart3, MessageSquare, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImpactReportProps {
  report: {
    projectId: string;
    projectName: string;
    metrics: {
      likes: number;
      comments: number;
      impactScore: number;
    };
    generatedAt: string;
    summary: string;
  };
}

export default function ImpactReportClient({ report }: ImpactReportProps) {
  const shareReport = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Report link copied to clipboard!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bh-red-500/10 text-bh-red-500 text-xs font-bold uppercase tracking-widest border border-bh-red-500/20">
          <Award size={14} />
          Official Impact Analysis
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary">
          {report.projectName}
        </h1>
        <p className="text-secondary max-w-2xl mx-auto text-lg">
          {report.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="lg-surface rounded-3xl p-8 border border-glass text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
              <Heart size={24} />
            </div>
          </div>
          <p className="text-4xl font-bold">{report.metrics.likes}</p>
          <p className="text-xs font-mono uppercase opacity-40 tracking-widest">Community Likes</p>
        </div>
        
        <div className="lg-surface rounded-3xl p-8 border border-glass text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
              <MessageSquare size={24} />
            </div>
          </div>
          <p className="text-4xl font-bold">{report.metrics.comments}</p>
          <p className="text-xs font-mono uppercase opacity-40 tracking-widest">Discussions</p>
        </div>

        <div className="lg-surface rounded-3xl p-8 border border-glass text-center space-y-2 bg-bh-red-500/5">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-bh-red-500/10 text-bh-red-500">
              <BarChart3 size={24} />
            </div>
          </div>
          <p className="text-5xl font-black text-bh-red-500">{report.metrics.impactScore}</p>
          <p className="text-xs font-mono uppercase opacity-40 tracking-widest">Impact Score</p>
        </div>
      </div>

      <div className="lg-surface rounded-3xl p-10 border border-glass space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Report Metadata</h3>
            <p className="text-sm text-secondary font-mono">Generated on: {new Date(report.generatedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="secondary"
              size="sm"
              onClick={shareReport}
            >
              <Share2 size={16} />
              Share Report
            </Button>
            <Button variant="default" size="sm">
              <Download size={16} />
              Export PDF
            </Button>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl bg-surface/10 border border-glass">
          <p className="text-sm leading-relaxed italic text-secondary">
            &quot;This impact score is calculated based on weighted engagement metrics, 
            including community likes, meaningful discussions, and technical verification. 
            It serves as a verifiable marker of the project&apos;s contribution to the youth tech ecosystem in Nepal.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
