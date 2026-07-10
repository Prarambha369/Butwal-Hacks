import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { Settings, Shield } from 'lucide-react';

export default async function SiteConfigPage() {
  await createClient();
  
  // In a real app, these would be in a 'site_config' table
  const config = {
    siteName: "Butwal Hacks",
    maintenanceMode: false,
    registrationOpen: true,
    apiStatus: "Healthy",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Site Configuration</h1>
          <p className="text-secondary opacity-60">Global toggles and operational settings for the platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="lg-surface p-8 rounded-3xl border border-glass space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="text-bh-red-500" size={24} />
            <h3 className="text-xl font-bold">General Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface/10 border border-glass">
              <div className="space-y-1">
                <p className="text-sm font-bold">Site Name</p>
                <p className="text-xs opacity-40">The public display name of the initiative.</p>
              </div>
              <input 
                type="text" 
                defaultValue={config.siteName} 
                className="bg-surface/10 border border-glass rounded-lg px-3 py-1 text-sm outline-none focus:ring-2 ring-red-500/50"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface/10 border border-glass">
              <div className="space-y-1">
                <p className="text-sm font-bold">Maintenance Mode</p>
                <p className="text-xs opacity-40">Disable all public routes for emergency updates.</p>
              </div>
              <div className="w-12 h-6 bg-surface/10 rounded-full relative cursor-pointer">
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all ${config.maintenanceMode ? 'bg-bh-red-500 translate-x-6' : 'bg-background/20'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface/10 border border-glass">
              <div className="space-y-1">
                <p className="text-sm font-bold">Registration Status</p>
                <p className="text-xs opacity-40">Control whether new hackers can join.</p>
              </div>
              <div className="w-12 h-6 bg-surface/10 rounded-full relative cursor-pointer">
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-all ${config.registrationOpen ? 'bg-status-green translate-x-6' : 'bg-background/20'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="lg-surface p-8 rounded-3xl border border-glass space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="text-status-blue" size={24} />
              <h3 className="text-xl font-bold">System Health</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface/10 border border-glass">
                <span className="text-sm opacity-60">API Gateway</span>
                <span className="text-xs font-bold text-status-green uppercase">Online</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface/10 border border-glass">
                <span className="text-sm opacity-60">Auth Server</span>
                <span className="text-xs font-bold text-status-green uppercase">Online</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface/10 border border-glass">
                <span className="text-sm opacity-60">Database Cluster</span>
                <span className="text-xs font-bold text-status-green uppercase">Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
