import React, { useEffect, useRef } from 'react';

type WaterSplashAnimationProps = {
  onComplete?: () => void;
};

export function WaterSplashAnimation({ onComplete }: WaterSplashAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div ref={containerRef} className="fixed inset-0 w-screen h-screen overflow-hidden z-50 pointer-events-none">
      {/* SVG Filters for water effects */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="turbulence">
            <feTurbulence type="turbulence" baseFrequency="0.01 0.01" numOctaves="3" seed="1" />
            <feDisplacementMap in="SourceGraphic" scale="10" />
          </filter>
          <filter id="liquid">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
          </filter>
        </defs>
      </svg>

      {/* Initial Splash */}
      <div className="absolute inset-0 flex items-center justify-center scale-150">
        <div className="water-burst" />
      </div>

      {/* Text Formation */}
      <div className="absolute inset-0 flex items-center justify-center scale-150">
        <div className="water-text">Not Eligible</div>
      </div>

      {/* Dripping Effect */}
      <div className="absolute inset-0">
        <div className="water-drips">
          {Array.from({ length: 200 }).map((_, i) => (
            <div 
              key={i} 
              className="drip"
              style={{
                left: `${(i * 0.5) + Math.random() * 0.5}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
                height: `${150 + Math.random() * 100}px`,
                opacity: 0.8 + Math.random() * 0.2
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}