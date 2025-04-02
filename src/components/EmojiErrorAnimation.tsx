import React, { useEffect, useState } from 'react';

type Emoji = {
  id: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  speed: number;
};

type EmojiErrorAnimationProps = {
  onComplete: () => void;
};

const EMOJI_COUNT = 150; // Tripled number of emojis for maximum coverage

export function EmojiErrorAnimation({ onComplete }: EmojiErrorAnimationProps) {
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  
  useEffect(() => {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // Create initial emojis with random positions and properties
    const initialEmojis = Array.from({ length: EMOJI_COUNT }, (_, index) => {
      return {
        id: index,
        x: Math.random() * containerWidth, // Distribute randomly across full screen width
        y: containerHeight * 0.5 + (Math.random() * 100), // Start in middle of screen
        scale: 0.5 + Math.random() * 1.5, // Larger scale range
        opacity: 0.8,
        speed: 0.8 + Math.random() * 1.2, // Slower speed for gentler movement
      };
    });
    
    setEmojis(initialEmojis);
    
    // Animate emojis
    let frame = 0;
    const animate = () => {
      frame++;
      
      setEmojis(prev => prev.map(emoji => {
        const progress = (frame * emoji.speed) % 100;
        const fadeInProgress = Math.min(progress * 2, 100);
        const fadeOutProgress = Math.max(0, (progress - 50) * 2);
        
        return {
          ...emoji,
          scale: progress < 50 ? Math.min(1, emoji.scale + 0.1) : Math.max(0.1, emoji.scale - 0.1),
          opacity: Math.min(1, progress < 25 ? fadeInProgress / 50 : 1 - (fadeOutProgress / 50)),
          x: emoji.x + Math.sin(frame * 0.05 * emoji.speed) * 5, // Increased horizontal movement
          y: emoji.y - (emoji.speed * 2), // Reduced vertical movement speed
        };
      }));
      
      if (frame < 120) { // Run for 2 seconds (60fps * 2)
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    
    const animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {emojis.map(emoji => (
        <div
          key={emoji.id}
          className="absolute transition-all duration-100"
          style={{
            transform: `translate(${emoji.x}px, ${emoji.y}px) scale(${emoji.scale})`,
            opacity: emoji.opacity,
            fontSize: '2.5rem',
          }}
          className="funky-text"
        >
          <div className="flex flex-col items-center leading-none">
            <span>NOT</span>
            <span>ELIGIBLE</span>
          </div>
        </div>
      ))}
    </div>
  );
}