import React from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { auth0 } from "@/lib/auth0";
import { User, Save, Camera, Globe, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';


export default async function HackerProfileSettingsPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect('/sign-in');

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth0_user_id', userId)
    .single();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-secondary opacity-60">Manage your public identity and trust markers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="lg-surface p-8 rounded-3xl border border-glass space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative group">
                <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-red-500/20">
                  <Image 
                    src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} 
                    alt="Avatar" 
                    fill
                    className="object-cover"
                  />
                </div>
                <button className="absolute inset-0 bg-background/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                  <Camera size={20} />
                </button>
              </div>
              <div>
                <h3 className="font-bold">Profile Photo</h3>
                <p className="text-xs text-secondary opacity-60">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={profile?.full_name} 
                    className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-2 focus:ring-2 ring-red-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40">BH-ID (Read Only)</label>
                  <input 
                    type="text" 
                    value={profile?.bh_id || ''} 
                    readOnly 
                    className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-2 opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-40">Bio</label>
                <textarea 
                  defaultValue={profile?.bio} 
                  rows={4} 
                  className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-2 focus:ring-2 ring-red-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                    <Github size={14} /> GitHub URL
                  </label>
                  <input 
                    type="text" 
                    defaultValue={profile?.socials?.github || ''} 
                    className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-2 focus:ring-2 ring-red-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                    <Globe size={14} /> Portfolio Website
                  </label>
                  <input 
                    type="text" 
                    defaultValue={profile?.socials?.website || ''} 
                    className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-2 focus:ring-2 ring-red-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="default">
                  <Save size={16} /> Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="lg-surface p-6 rounded-3xl border border-glass space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <User size={18} className="text-bh-red-500" />
              Public Visibility
            </h3>
            <p className="text-xs text-secondary opacity-60">
              Your profile is visible to the community. Your trust markers and project history are verified on-chain.
            </p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface/10 border border-glass">
              <span className="text-xs font-medium">Public Profile</span>
              <div className="w-10 h-5 bg-bh-red-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-background rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
