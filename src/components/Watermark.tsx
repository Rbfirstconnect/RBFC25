import React from 'react';

export function Watermark() {
  // Create a grid of watermarks
  const watermarks = [];
  const spacing = 120; // Space between each watermark
  const rows = Math.ceil(window.innerHeight / spacing) + 1;
  const cols = Math.ceil(window.innerWidth / spacing) + 1;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      watermarks.push(
        <div
          key={`${i}-${j}`}
          className="absolute select-none transform -rotate-45"
          style={{
            top: `${i * spacing}px`,
            left: `${j * spacing}px`,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            opacity: 0.15,
            background: `linear-gradient(45deg, #FF6900, ${hexToRGBA('#FF6900', 0.3)})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 2px rgba(255, 105, 0, 0.1)',
            userSelect: 'none'
          }}
        >
          RBFC
        </div>
      );
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {watermarks}
    </div>
  );
}

function hexToRGBA(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}