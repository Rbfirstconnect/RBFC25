import React, { useEffect, useState } from 'react';
import { Tag, Info, AlertCircle } from 'lucide-react';

type IneligibleAnimationProps = {
  onComplete?: () => void;
};

export function IneligibleAnimation({ onComplete }: IneligibleAnimationProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Sequence timing
    const timings = [0, 500, 1000, 1500, 2000];
    
    // Progress through animation stages
    timings.forEach((time, index) => {
      setTimeout(() => {
        setStage(index + 1);
      }, time);
    });

    // Notify parent when animation completes
    setTimeout(() => {
      onComplete?.();
    }, 2500);
  }, [onComplete]);

  return (
    <div className="relative h-32 flex items-center justify-center">
      <div className={`transition-all duration-500 absolute transform
        ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        <Tag 
          className={`w-12 h-12 transition-all duration-500
            ${stage >= 2 ? 'text-gray-400' : 'text-[#FF6900]'}
            ${stage >= 3 ? 'rotate-[-10deg]' : 'rotate-0'}`}
        />
      </div>
      
      <div className={`absolute transform transition-all duration-500
        ${stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 font-medium">Not Eligible</span>
        </div>
      </div>
      
      <div className={`absolute bottom-0 transform transition-all duration-300
        ${stage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Info className="w-4 h-4 animate-pulse" />
          <span>Click for eligibility requirements</span>
        </div>
      </div>
    </div>
  );
}