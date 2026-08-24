import React, { Suspense, useEffect, useRef, useState } from 'react';
import { DeferredCanvas } from './DeferredCanvas';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { DynamicMaterial3D } from './DynamicMaterial3D';
import { LazyCanvas } from './LazyCanvas';
import { ErrorBoundary } from '../shared/ErrorBoundary';

interface Material3DProps {
  materialName?: string;
  categoria?: string;
  color: string;
  secondaryColor?: string;
  shape: string;
  metalness: number;
  roughness: number;
  transparent: boolean;
  transmission?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
}

function Scene({ materialProps }: { materialProps: Material3DProps }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={2}
      />
      
      {/* Luces mejoradas */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow
      />
      
      <Suspense fallback={null}>
        <DynamicMaterial3D
          materialName={materialProps.materialName || 'Desconocido'}
          categoria={materialProps.categoria || 'Otro'}
          color={materialProps.color}
          secondaryColor={materialProps.secondaryColor}
          metalness={materialProps.metalness}
          roughness={materialProps.roughness}
          transparent={materialProps.transparent}
          transmission={materialProps.transmission}
          emissiveColor={materialProps.emissiveColor}
          emissiveIntensity={materialProps.emissiveIntensity}
        />
      </Suspense>
    </>
  );
}

interface Safe3DViewerProps {
  materialName?: string;
  categoria?: string;
  color: string;
  secondaryColor?: string;
  shape: string;
  metalness: number;
  roughness: number;
  transparent: boolean;
  transmission?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  className?: string;
}

export function Safe3DViewer({
  materialName,
  categoria,
  color,
  secondaryColor,
  shape,
  metalness,
  roughness,
  transparent,
  transmission,
  emissiveColor,
  emissiveIntensity,
  className = "w-full h-full min-h-[200px]"
}: Safe3DViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (hasError) {
    return (
      <div 
        className={className}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'hsl(var(--muted))',
          borderRadius: '0.5rem'
        }}
      >
        <div style={{ color: 'hsl(var(--muted-foreground))' }}>
          Error al cargar modelo 3D
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div 
        className={className}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'hsl(var(--muted))',
          borderRadius: '0.5rem'
        }}
      >
        <div className="animate-pulse" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Cargando...
        </div>
      </div>
    );
  }

  console.log('🎨 Safe3DViewer rendering with:', {
    materialName,
    categoria,
    color,
    shape,
    metalness,
    roughness
  });

  return (
    <ErrorBoundary
      fallback={
        <div 
          className={className}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'hsl(var(--muted))',
            borderRadius: '0.5rem'
          }}
        >
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>
            Error al renderizar 3D
          </div>
        </div>
      }
    >
      <LazyCanvas className={className}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <OrbitControls 
            enableZoom={true}
            enablePan={false}
            minDistance={2}
            maxDistance={10}
            autoRotate={true}
            autoRotateSpeed={2}
          />
          
          {/* Iluminación mejorada */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />
          <pointLight position={[0, 10, 0]} intensity={0.5} />
          
          {/* Modelo 3D dinámico con colores exactos del catálogo */}
          <DynamicMaterial3D
            forma={shape as any}
            color={color}
            colorSecundario={secondaryColor}
            metalness={metalness}
            roughness={roughness}
            transparente={transparent}
            transmission={transmission}
            colorEmisivo={emissiveColor}
            intensidadEmisiva={emissiveIntensity}
            autoRotate={true}
          />
          
          {/* Entorno para reflejos */}
          <Environment preset="studio" />
        </Suspense>
      </LazyCanvas>
    </ErrorBoundary>
  );
}
















