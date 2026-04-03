import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const MAX_PULL = 100;
  const THRESHOLD = 60;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling.current) return;
      const y = e.touches[0].clientY;
      const dy = y - startY.current;
      
      if (dy > 0 && window.scrollY === 0) {
        // Prevent default only when pulling down at the top
        if (e.cancelable) e.preventDefault();
        setPullDistance(Math.min(dy * 0.5, MAX_PULL));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      if (pullDistance > THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);
        if (onRefresh) await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, onRefresh]);

  return (
    <div ref={containerRef} className="relative min-h-full">
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden transition-all duration-200 z-50 pointer-events-none"
        style={{ height: `${pullDistance}px`, opacity: pullDistance / THRESHOLD }}
      >
        {isRefreshing ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <div className="bg-background rounded-full shadow-md p-2 flex items-center justify-center">
            <ArrowDown 
              className="w-5 h-5 text-muted-foreground transition-transform" 
              style={{ transform: `rotate(${pullDistance > THRESHOLD ? 180 : 0}deg)` }} 
            />
          </div>
        )}
      </div>
      <div 
        className="transition-transform duration-200 min-h-full"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}