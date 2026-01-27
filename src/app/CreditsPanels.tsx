"use client";

import { useEffect, useRef, useState } from "react";

type Panel = {
  title: string;
  imageSrc: string;
  href: string;
};

const PANELS: Panel[] = Array.from({ length: 15 }, (_, i) => ({
  title: `Project ${i + 1}`,
  imageSrc: "/placeholder-16x9.jpg",
  href: "https://example.com",
}));

export default function CreditsPanels() {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
  const [velocity, setVelocity] = useState(0);
  const lastTimeRef = useRef(0);
  const lastOffsetRef = useRef(0);

  // Inertia scrolling
  useEffect(() => {
    if (isDragging || Math.abs(velocity) < 0.01) return;

    let raf = 0;
    const tick = () => {
      setScrollOffset((prev) => {
        const newOffset = prev + velocity;
        setVelocity((v) => v * 0.95); // Friction
        return newOffset;
      });
      if (Math.abs(velocity) > 0.01) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isDragging, velocity]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, offset: scrollOffset });
    setVelocity(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - dragStart.x;
    const newOffset = dragStart.offset + delta * 0.5;
    setScrollOffset(newOffset);
    
    // Calculate velocity for inertia
    const now = Date.now();
    if (now - lastTimeRef.current > 0) {
      const v = (newOffset - lastOffsetRef.current) / (now - lastTimeRef.current) * 16;
      setVelocity(v);
    }
    lastTimeRef.current = now;
    lastOffsetRef.current = newOffset;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScrollOffset((prev) => prev + e.deltaX * 0.3);
  };

  const [expandedPanel, setExpandedPanel] = useState<number | null>(null);

  if (expandedPanel !== null) {
    const panel = PANELS[expandedPanel];
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={() => setExpandedPanel(null)}
      >
        <div className="relative max-w-4xl max-h-[90vh]">
          <img
            src={panel.imageSrc}
            alt={panel.title}
            className="w-full h-auto rounded-lg"
            style={{ aspectRatio: "16/9" }}
          />
          <button
            onClick={() => setExpandedPanel(null)}
            className="absolute top-4 right-4 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-sm hover:bg-black/60"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const [dimensions, setDimensions] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1920, h: typeof window !== 'undefined' ? window.innerHeight : 1080 });

  useEffect(() => {
    const resize = () => {
      setDimensions({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const vanishX = dimensions.w * 0.5;
  const vanishY = dimensions.h * 0.08;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {PANELS.map((panel, i) => {
        // Depth mapping: t from 0 to 1
        const t = i / (PANELS.length - 1);
        const t2 = t * t; // Eased depth
        
        // Scale: 1.25 -> 0.08
        const scale = 1.25 - (1.25 - 0.08) * t2;
        
        // Y position: 70vh -> 8vh
        const y = dimensions.h * (0.70 - (0.70 - 0.08) * t2);
        
        // X position: lerp from center to vanishX with scroll offset
        const baseX = dimensions.w * 0.5 + (vanishX - dimensions.w * 0.5) * t2;
        const x = baseX + scrollOffset * (1 - t2); // Scroll affects closer panels more
        
        // Opacity: 0.06 -> 0.14 (closer = more visible)
        const opacity = 0.06 + (0.14 - 0.06) * (1 - t2);
        
        // Subtle skew/rotate for plane effect
        const skewY = -2 + t * 1; // Slight perspective
        const rotateZ = t * 0.5; // Very slight rotation

        return (
          <div
            key={i}
            className="pointer-events-auto absolute"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: `
                translate(-50%, -50%)
                scale(${scale})
                skewY(${skewY}deg)
                rotateZ(${rotateZ}deg)
              `,
              transformStyle: "preserve-3d",
              width: "400px",
              aspectRatio: "16/9",
              opacity: opacity,
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
            onClick={() => setExpandedPanel(i)}
          >
            <div
              className="w-full h-full rounded-sm overflow-hidden cursor-pointer hover:opacity-100 transition-opacity"
              style={{
                backdropFilter: "blur(2px)",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
              <img
                src={panel.imageSrc}
                alt={panel.title}
                className="w-full h-full object-cover opacity-40"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/40 to-transparent">
                <div className="text-xs text-white opacity-70">{panel.title}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
