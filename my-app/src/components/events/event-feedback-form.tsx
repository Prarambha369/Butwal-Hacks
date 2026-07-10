"use client";

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { submitEventFeedback } from '@/lib/actions/events';
import { cn } from '@/lib/utils';
import { RoseSpinner } from '@/components/ui/rose-loader';
import { Button } from '@/components/ui/button';

interface EventFeedbackFormProps {
  eventId: string;
}

export default function EventFeedbackForm({ eventId }: EventFeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      const result = await submitEventFeedback(eventId, rating, comment);
      if (result.success) {
        toast.success('Thank you for your feedback!');
        setSubmitted(true);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 rounded-3xl bg-surface/10 border border-glass text-center space-y-2 animate-in fade-in zoom-in duration-300">
        <div className="w-12 h-12 rounded-full bg-accent-teal/20 text-accent-teal flex items-center justify-center mx-auto mb-4">
          <Star className="w-6 h-6 fill-current" />
        </div>
        <h3 className="text-lg font-bold">Feedback Submitted!</h3>
        <p className="text-sm text-secondary">Thank you for helping us improve the community.</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-surface/10 border border-glass space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">Share Your Experience</h3>
        <p className="text-sm text-secondary">How was the event? Your feedback matters.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="transition-all duration-200 transform hover:scale-110"
            >
              <Star 
                className={cn(
                  "w-8 h-8 transition-colors",
                  (hoverRating || rating) >= star ? "text-accent-yellow fill-current" : "text-primary/20"
                )} 
              />
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-secondary uppercase tracking-wider">Detailed Review (Optional)</label>
          <textarea 
            className="w-full px-4 py-3 rounded-xl bg-surface/10 border border-glass focus:border-bh-red-500 outline-none transition-all resize-none"
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What did you love? What can we improve?"
          />
        </div>

        <Button 
          type="submit"
          disabled={loading || rating === 0}
          variant="default"
          className="w-full"
        >
          {loading ? <RoseSpinner size="sm" /> : 'Submit Feedback'}
        </Button>
      </form>
    </div>
  );
}
