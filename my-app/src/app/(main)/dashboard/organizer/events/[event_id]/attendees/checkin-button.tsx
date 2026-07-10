"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';

export function CheckInButton({
  registrationId,
  attended,
}: {
  registrationId: string;
  attended: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Check-in failed');
      }

      toast.success(attended ? 'Check-in removed' : 'Checked in successfully!');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckIn}
      disabled={loading}
      className={`p-2 rounded-lg transition-all ${
        attended
          ? 'text-green-500 hover:text-red-500'
          : 'text-secondary hover:text-green-500'
      } disabled:opacity-50`}
      title={attended ? 'Undo check-in' : 'Check in'}
    >
      {loading ? (
        <span className="w-4 h-4 block animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : attended ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
    </button>
  );
}
