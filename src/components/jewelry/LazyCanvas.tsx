import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';

interface LazyCanvasProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Canvas con lazy loading simple
 * Renderiza cuando el elemento es visible en el viewport
 */
export function LazyCanvas({ children, className }: LazyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Intersection Observer para detectar visibilidad
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Renderizar inmediatamente cuando sea visible
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        rootMargin: '50px', // Cargar cuando esté cerca del viewport
        threshold: 0.1
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        <Canvas
          camera={{ position: [0, 0, 3], fov: 50 }}
          gl={{ 
            antialias: false,
            alpha: true,
            powerPreference: 'low-power'
          }}
          dpr={1}
        >
          {children}
        </Canvas>
      ) : (
        <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Cargando...</p>
          </div>
        </div>
      )}
    </div>
  );
}


