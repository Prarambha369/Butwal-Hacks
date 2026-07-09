"use client";

import React, { useEffect, useRef } from 'react';

interface InkCursorProps {
  enabled?: boolean;
}

export default function InkCursor({ enabled = true }: InkCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    let mouseX = 0;
    let mouseY = 0;
// @ts-ignore
    let lastMouseX = 0;
    let lastMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const dots: { x: number; y: number; scale: number; offsetX: number; offsetY: number }[] = [];
    const amount = 20;
    const dotSize = 4;
    
    for (let i = 0; i < amount; i++) {
      dots.push({
        x: 0,
        y: 0,
        scale: 1 - (i * 0.05),
        // Offset for the "ink drop" organic shape
        offsetX: (Math.random() - 0.5) * 10,
        offsetY: (Math.random() - 0.5) * 10,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw "Ink" drops
      ctx.fillStyle = 'rgba(230, 57, 70, 0.6)'; // Heritage Red
      
      dots.forEach((dot, index) => {
        // LERP behavior for trailing effect
        dot.x += (mouseX - dot.x) * 0.25;
        dot.y += (mouseY - dot.y) * 0.25;
        
        const finalX = dot.x + dot.offsetX;
        const finalY = dot.y + dot.offsetY;
        
        ctx.beginPath();
        ctx.arc(finalX, finalY, dot.scale * dotSize, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[9999] mix-blend-multiply dark:mix-blend-screen"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
