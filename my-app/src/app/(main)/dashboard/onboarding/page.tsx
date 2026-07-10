"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { updateProfile } from '@/lib/actions/profile';
import {Sparkles, CheckCircle2, ArrowRight} from 'lucide-react';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    github: '',
    linkedin: '',
    website: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUser();
  const userId = user?.sub;

  useEffect(() => {
    if (!userId) return;
    const loadInitialData = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth0_user_id', userId)
        .single();
      
      if (profile) {
        setFormData({
          full_name: profile.full_name || '',
          bio: profile.bio || '',
          github: profile.socials?.github || '',
          linkedin: profile.socials?.linkedin || '',
          website: profile.socials?.website || '',
        });
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleNext = () => {
    if (step === 1 && !formData.full_name) {
      toast.error("Please enter your full name");
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!userId) throw new Error("User not authenticated");
    setIsSubmitting(true);
    try {
      await updateProfile(userId, {
        full_name: formData.full_name,
        bio: formData.bio,
        socials: {
          github: formData.github,
          linkedin: formData.linkedin,
          website: formData.website,
        }
      });

      toast.success("Profile completed successfully!");
      router.push('/dashboard/hacker');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Onboarding failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary flex items-center justify-center p-6">
      <div className="max-w-xl w-full lg-surface p-12 rounded-3xl border border-glass space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-bh-red-500/20 rounded-2xl flex items-center justify-center text-bh-red-500 mb-6">
            <Sparkles size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-primary">Complete Your Profile</h1>
          <p className="text-secondary opacity-60">Set up your identity in the Butwal Hacks Trust Network.</p>
        </div>

        {/* Step Progress */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${s <= step ? 'bg-bh-red-500' : 'bg-surface/10'}`} />
          ))}
        </div>

        {/* Forms */}
        <div className="space-y-8 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-40 text-primary">Full Name</label>
                <input 
                  type="text" 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 ring-red-500/50 transition-all"
                  placeholder="Your full name..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-40 text-primary">Bio</label>
                <textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 ring-red-500/50 transition-all"
                  placeholder="Tell us about your skills and passions..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 text-primary">GitHub Profile</label>
                  <input 
                    type="text" 
                    value={formData.github} 
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 ring-red-500/50 transition-all"
                    placeholder="github.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 text-primary">LinkedIn Profile</label>
                  <input 
                    type="text" 
                    value={formData.linkedin} 
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 ring-red-500/50 transition-all"
                    placeholder="linkedin.com/in/username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 text-primary">Portfolio/Website</label>
                  <input 
                    type="text" 
                    value={formData.website} 
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 ring-red-500/50 transition-all"
                    placeholder="yourportfolio.com"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mx-auto w-20 h-20 bg-status-green/20 rounded-full flex items-center justify-center text-status-green mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-bold text-primary">Ready to Launch!</h3>
              <p className="text-secondary opacity-60">
                Your profile is set up. You can now discover teammates, submit projects, and earn XP.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 text-sm font-bold text-primary/40 hover:text-primary transition-colors"
            >
              Back
            </button>
          )}
          <div className="ml-auto">
            {step < 3 ? (
              <Button 
                variant="default"
                size="lg"
                onClick={handleNext}
              >
                Next <ArrowRight size={18} />
              </Button>
            ) : (
              <Button 
                variant="default"
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? <RoseSpinner size="sm" /> : 'Finish Setup'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
