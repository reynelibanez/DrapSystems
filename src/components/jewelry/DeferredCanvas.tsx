import React, { useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';

interface DeferredCanvasProps {
  children: React.ReactNode;
  camera?: any;
  gl?: any;
  onCreated?: (state: any) => void;
  className?: string;
}

/**
 * Canvas que se renderiza solo después de que el contenedor esté
 * completamente montado y visible en el DOM
 */
export function DeferredCanvas({ children, camera, gl, onCreated, className }: DeferredCanvasProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    if (typeof window === 'undefined') {
      return;
    }

    // Verificar WebGL
    const hasWebGL = (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return false;
        
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
        
        return true;
      } catch {
        return false;
      }
    })();

    if (!hasWebGL) {
      setHasError(true);
      return;
    }

    // Esperar a que el contenedor sea visible
    const waitForContainer = () => {
      const container = containerRef.current;
      
      if (!container || !mountedRef.current) {
        return;
      }

      // Verificar que el contenedor tiene dimensiones
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        // Usar IntersectionObserver para detectar cuando es visible
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && mountedRef.current) {
                // El contenedor es visible, renderizar Canvas
                setTimeout(() => {
                  if (mountedRef.current) {
                    setIsReady(true);
                  }
                }, 150); // Delay adicional para asegurar que el DOM está estable
                
                // Dejar de observar
                if (observerRef.current) {
                  observerRef.current.disconnect();
                }
              }
            });
          },
          { threshold: 0.1 }
        );

        observerRef.current.observe(container);
      } else {
        // Reintentar si no tiene dimensiones
        requestAnimationFrame(waitForContainer);
      }
    };

    // Iniciar observación después de un pequeño delay
    const timeoutId = setTimeout(waitForContainer, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      setIsReady(false);
    };
  }, []);

  const handleCreated = (state: any) => {
    if (!state?.gl?.domElement) {
      console.warn('domElement no disponible en state.gl');
      return;
    }

    const domElement = state.gl.domElement;
    
    // Verificar que domElement no es null y tiene addEventListener
    if (!domElement || typeof domElement.addEventListener !== 'function') {
      console.warn('domElement es null o addEventListener no disponible');
      return;
    }

    try {
      // Event listeners para WebGL context
      const handleContextLost = (e: Event) => {
        e.preventDefault();
        console.warn('WebGL context lost');
        if (mountedRef.current) {
          setHasError(true);
        }
      };

      const handleContextRestored = () => {
        console.log('WebGL context restored');
        if (mountedRef.current) {
          setHasError(false);
        }
      };

      domElement.addEventListener('webglcontextlost', handleContextLost, false);
      domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

      // Cleanup en el state para que se ejecute cuando se desmonte
      if (state.gl) {
        const originalDispose = state.gl.dispose?.bind(state.gl);
        state.gl.dispose = () => {
          try {
            if (domElement && typeof domElement.removeEventListener === 'function') {
              domElement.removeEventListener('webglcontextlost', handleContextLost);
              domElement.removeEventListener('webglcontextrestored', handleContextRestored);
            }
          } catch (e) {
            console.warn('Error removing listeners:', e);
          }
          
          if (originalDispose) {
            originalDispose();
          }
        };
      }
    } catch (error) {
      console.error('Error setting up Canvas:', error);
    }

    // Llamar callback del usuario
    if (onCreated) {
      try {
        onCreated(state);
      } catch (e) {
        console.error('Error in onCreated:', e);
      }
    }
  };

  const placeholderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'hsl(var(--muted))',
    borderRadius: '0.5rem',
    minHeight: '200px',
    width: '100%',
    height: '100%'
  };

  if (hasError) {
    return (
      <div ref={containerRef} className={className} style={placeholderStyle}>
        <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
          Vista 3D no disponible
        </p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div ref={containerRef} className={className} style={placeholderStyle}>
        <div className="animate-pulse" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Cargando vista 3D...
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={camera}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
          ...gl
        }}
        onCreated={handleCreated}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </Canvas>
    </div>
  );
}

