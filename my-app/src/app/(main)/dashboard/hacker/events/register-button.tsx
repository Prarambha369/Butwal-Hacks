"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RegisterEventButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed');
      }

      toast.success('Registered for event!');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRegister}
      disabled={loading}
      variant="default"
      size="sm"
      className="w-full"
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {loading ? 'Registering...' : 'Register for Event'}
    </Button>
  );
}
