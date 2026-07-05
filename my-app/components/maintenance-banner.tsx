'use client';

import { useState, useEffect } from 'react';

export default function MaintenanceBanner() {
  const [isVisible, setIsVisible] = useState(false);
  
  // Show banner on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  // Calculate 9-day countdown
  const [timeLeft, setTimeLeft] = useState({
    days: 9,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newSeconds = prev.seconds - 1;
        const newMinutes = prev.minutes + (newSeconds < 0 ? -1 : 0);
        const newHours = prev.hours + (newMinutes < 0 ? -1 : 0);
        const newDays = prev.days + (newHours < 0 ? -1 : 0);
        
        return {
          days: newDays,
          hours: newHours < 0 ? 23 : newHours,
          minutes: newMinutes < 0 ? 59 : newMinutes,
          seconds: newSeconds < 0 ? 59 : newSeconds,
        };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format time values with leading zero
  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative max-w-md w-full mx-4 p-6 bg-card rounded-xl shadow-lg border border-border">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-heading text-foreground mb-4">Website Under Redesign</h2>
          <p className="text-muted-foreground mb-6">
            Our website is currently undergoing a redesign to bring you a better experience. We'll be back online with new features and improvements in:
          </p>
          
          <div className="flex justify-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-primary">{formatTime(timeLeft.days)}</div>
              <div className="text-sm text-muted-foreground">Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-primary">{formatTime(timeLeft.hours)}</div>
              <div className="text-sm text-muted-foreground">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-primary">{formatTime(timeLeft.minutes)}</div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-primary">{formatTime(timeLeft.seconds)}</div>
              <div className="text-sm text-muted-foreground">Seconds</div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}