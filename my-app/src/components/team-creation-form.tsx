"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {Users, Plus} from 'lucide-react';
import { toast } from 'sonner';

import { RoseSpinner } from '@/components/ui/rose-loader';

import { Button } from '@/components/ui/button';

interface TeamCreationFormProps {
  eventId: string;
}

export default function TeamCreationForm({ eventId }: TeamCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, event_id: eventId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create team');
      }

      toast.success('Team created successfully!');
      setFormData({ name: '' });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create team';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg-surface p-6 rounded-3xl border border-glass space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent-teal/10 text-accent-teal">
          <Users className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold">Create Your Team</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-secondary uppercase tracking-wider">Team Name</label>
          <input 
            required
            className="w-full px-4 py-3 rounded-xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. The Binary Wizards"
          />
        </div>

        <Button 
          type="submit"
          disabled={loading}
          variant="default"
          className="w-full"
        >
          {loading ? <RoseSpinner size="sm" /> : <Plus className="w-4 h-4" />}
          {loading ? 'Creating...' : 'Create Team'}
        </Button>
      </form>
    </div>
  );
}
