import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DynamicMaterial3DProps {
  forma: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'capsule';
  color: string;
  colorSecundario?: string;
  metalness: number;
  roughness: number;
  transparente: boolean;
  transmission?: number;
  colorEmisivo?: string;
  intensidadEmisiva?: number;
  autoRotate?: boolean;
}

export function DynamicMaterial3D({
  forma,
  color,
  colorSecundario,
  metalness,
  roughness,
  transparente,
  transmission = 0.8,
  colorEmisivo,
  intensidadEmisiva = 0.1,
  autoRotate = false
}: DynamicMaterial3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  // Configuración del material
  const materialProps: any = {
    color: new THREE.Color(color),
    metalness,
    roughness,
    transparent: transparente,
    opacity: transparente ? 0.8 : 1,
  };

  if (transparente && transmission !== undefined) {
    materialProps.transmission = transmission;
    materialProps.thickness = 0.5;
    materialProps.ior = 2.4; // Índice de refracción para vidrio/diamante
  }

  if (colorEmisivo) {
    materialProps.emissive = new THREE.Color(colorEmisivo);
    materialProps.emissiveIntensity = intensidadEmisiva;
  }

  // Renderizar geometría según la forma
  const renderGeometry = () => {
    switch (forma) {
      case 'box':
        // LINGOTE: Forma rectangular como un lingote de oro
        return (
          <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry args={[2, 0.8, 1]} />
            <meshPhysicalMaterial {...materialProps} />
          </mesh>
        );

      case 'cone':
        // DIAMANTE: Forma de diamante tallado
        return (
          <group ref={meshRef as any}>
            {/* Parte superior del diamante (corona) */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
              <coneGeometry args={[1, 1, 8]} />
              <meshPhysicalMaterial {...materialProps} />
            </mesh>
            {/* Parte inferior del diamante (pabellón) */}
            <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]} castShadow receiveShadow>
              <coneGeometry args={[1, 1, 8]} />
              <meshPhysicalMaterial {...materialProps} />
            </mesh>
          </group>
        );

      case 'sphere':
        // ESFERA: Por si acaso se necesita en el futuro
        return (
          <mesh ref={meshRef} castShadow receiveShadow>
            <sphereGeometry args={[1, 32, 32]} />
            <meshPhysicalMaterial {...materialProps} />
          </mesh>
        );

      case 'cylinder':
        // CILINDRO: Por si acaso se necesita en el futuro
        return (
          <mesh ref={meshRef} castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.5, 2, 32]} />
            <meshPhysicalMaterial {...materialProps} />
          </mesh>
        );

      case 'torus':
        // ANILLO: Por si acaso se necesita en el futuro
        return (
          <mesh ref={meshRef} castShadow receiveShadow>
            <torusGeometry args={[1, 0.3, 16, 32]} />
            <meshPhysicalMaterial {...materialProps} />
          </mesh>
        );

      case 'capsule':
        // CÁPSULA: Por si acaso se necesita en el futuro
        return (
          <group ref={meshRef as any}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.5, 0.5, 1.5, 32]} />
              <meshPhysicalMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshPhysicalMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, -0.75, 0]} castShadow receiveShadow>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshPhysicalMaterial {...materialProps} />
            </mesh>
          </group>
        );

      default:
        return (
          <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry args={[2, 0.8, 1]} />
            <meshPhysicalMaterial {...materialProps} />
          </mesh>
        );
    }
  };

  return <>{renderGeometry()}</>;
}
