"use client";

import { useRef, useState, useEffect } from "react";

/** Fires IntersectionObserver once when element enters viewport. */
export function useInViewOnce<T extends HTMLElement>(threshold = 0) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible, threshold]);

  return { ref, isVisible };
}
