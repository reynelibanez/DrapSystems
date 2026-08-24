import React, { useEffect, useState, useRef, useMemo } from 'react';
import { OrbitControls, Environment } from '@react-three/drei';
import { useAuth } from '../AuthProvider';
import { useMaterialCatalog } from '../../lib/hooks/useMaterialCatalog';
import { generate3DPropertiesFromCatalog } from '../../lib/ai-3d-generator';
import { DynamicMaterial3D } from './DynamicMaterial3D';
import { LazyCanvas } from './LazyCanvas';
import { useFrame } from '@react-three/fiber';

interface Material3DViewerProps {
  materialName?: string;
  className?: string;
}

interface Material3DProps {
  materialName: string;
  categoria: string;
  color: string;
  secondaryColor?: string;
  shape: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'capsule';
  metalness: number;
  roughness: number;
  transparent: boolean;
  transmission?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
}

function Material3DModel({ properties }: { properties: Material3DProps }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Rotación automática continua
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Geometría según la forma (con menos segmentos para mejor rendimiento)
  const geometry = useMemo(() => {
    const scale = 0.8;
    switch (properties.shape) {
      case 'sphere':
        return <sphereGeometry args={[scale, 16, 16]} />; // Reducido de 32,32 a 16,16
      case 'box':
        return <boxGeometry args={[scale * 1.2, scale * 1.2, scale * 1.2]} />;
      case 'cylinder':
        return <cylinderGeometry args={[scale * 0.6, scale * 0.6, scale * 1.5, 16]} />; // Reducido de 32 a 16
      case 'cone':
        return <coneGeometry args={[scale * 0.8, scale * 1.5, 16]} />; // Reducido de 32 a 16
      case 'torus':
        return <torusGeometry args={[scale * 0.7, scale * 0.3, 8, 16]} />; // Reducido de 16,32 a 8,16
      case 'capsule':
        return <capsuleGeometry args={[scale * 0.5, scale * 1.2, 4, 12]} />; // Reducido de 8,16 a 4,12
      default:
        return <boxGeometry args={[scale, scale, scale]} />;
    }
  }, [properties.shape]);

  return (
    <mesh ref={meshRef} castShadow={false} receiveShadow={false}>
      {geometry}
      <meshStandardMaterial
        color={properties.color}
        metalness={properties.metalness}
        roughness={properties.roughness}
        transparent={properties.transparent}
        opacity={properties.transparent ? 0.85 : 1}
        transmission={properties.transmission}
        emissive={properties.emissiveColor || '#000000'}
        emissiveIntensity={properties.emissiveIntensity || 0}
      />
    </mesh>
  );
}

export function Material3DViewer({ 
  materialName, 
  className = "w-full h-32"
}: Material3DViewerProps) {
  const { user } = useAuth();
  const businessId = user?.user_metadata?.business_id;
  const { catalog, loading: catalogLoading } = useMaterialCatalog(businessId);
  const [properties, setProperties] = useState<Material3DProps | null>(null);

  useEffect(() => {
    console.log('🎨 Material3DViewer useEffect triggered');
    console.log('  materialName:', materialName);
    console.log('  catalog.length:', catalog.length);
    console.log('  catalogLoading:', catalogLoading);
    
    if (!materialName) {
      console.log('  ⚠️ No material name provided');
      setProperties(null);
      return;
    }

    if (catalogLoading) {
      console.log('  ⏳ Catalog still loading...');
      return;
    }

    if (catalog.length === 0) {
      console.log('  ⚠️ Catalog is empty');
      return;
    }

    console.log('  ✅ Generating 3D properties...');
    const props = generate3DPropertiesFromCatalog(materialName, catalog);
    console.log('  📦 Generated properties:', props);
    
    // Convertir las propiedades al formato esperado
    const material3DProps: Material3DProps = {
      materialName: materialName,
      categoria: 'Material', // Categoría por defecto
      color: props.color,
      secondaryColor: props.secondaryColor,
      shape: props.shape,
      metalness: props.metalness,
      roughness: props.roughness,
      transparent: props.transparent,
      transmission: props.transmission,
      emissiveColor: props.emissive,
      emissiveIntensity: props.emissiveIntensity
    };
    
    console.log('  🎯 Setting properties:', material3DProps);
    setProperties(material3DProps);
  }, [materialName, catalog, catalogLoading]);

  if (catalogLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted/20 rounded-lg`}>
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  if (!materialName) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted/20 rounded-lg`}>
        <p className="text-xs text-muted-foreground">Sin nombre de material</p>
      </div>
    );
  }

  if (!properties) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted/20 rounded-lg`}>
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Generando modelo...</p>
        </div>
      </div>
    );
  }

  return (
    <LazyCanvas className={className}>
      {/* Luces simplificadas */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow={false} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} castShadow={false} />
      
      {/* Modelo 3D */}
      <Material3DModel properties={properties} />
      
      {/* Controles de órbita deshabilitados para mejor rendimiento */}
    </LazyCanvas>
  );
}





