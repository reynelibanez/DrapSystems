import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Package } from 'lucide-react';
import * as THREE from 'three';

// Componente de mesh rotatorio
const RotatingMesh: React.FC<{
  shape: string;
  color: string;
  metalness: number;
  roughness: number;
  transparent?: boolean;
  transmission?: number;
}> = ({ shape, color, metalness, roughness, transparent, transmission }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x += 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      {shape === 'box' && <boxGeometry args={[2, 2, 2]} />}
      {shape === 'sphere' && <sphereGeometry args={[1.2, 32, 32]} />}
      {shape === 'cylinder' && <cylinderGeometry args={[0.8, 0.8, 2.5, 32]} />}
      {shape === 'cone' && <coneGeometry args={[1, 2.5, 32]} />}
      {shape === 'torus' && <torusGeometry args={[1, 0.4, 16, 32]} />}
      {shape === 'capsule' && <capsuleGeometry args={[0.6, 1.5, 16, 32]} />}
      
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        transparent={transparent}
        transmission={transmission}
        emissive={color}
        emissiveIntensity={0.1}
        envMapIntensity={1.5}
      />
    </mesh>
  );
};

// Definición de tipos de objetos 3D predefinidos
export interface Predefined3DObject {
  id: string;
  name: string;
  category: string;
  shape: 'sphere' | 'cube' | 'cylinder' | 'torus' | 'cone' | 'octahedron' | 'dodecahedron' | 'ring' | 'gem';
  color: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
}

// Objetos 3D predefinidos con colores realistas de joyería
export const PREDEFINED_3D_OBJECTS: Predefined3DObject[] = [
  // ===== METALES =====
  {
    id: 'metal-oro-amarillo-box',
    name: 'Oro Amarillo',
    category: 'Metal',
    shape: 'box',
    color: '#FFD700', // Oro brillante
    metalness: 0.95,
    roughness: 0.15,
  },
  {
    id: 'metal-oro-rosa-sphere',
    name: 'Oro Rosa',
    category: 'Metal',
    shape: 'sphere',
    color: '#F4C2C2', // Oro rosa brillante
    metalness: 0.95,
    roughness: 0.15,
  },
  {
    id: 'metal-oro-blanco-cylinder',
    name: 'Oro Blanco',
    category: 'Metal',
    shape: 'cylinder',
    color: '#F5F5F5', // Oro blanco brillante
    metalness: 0.95,
    roughness: 0.12,
  },
  {
    id: 'metal-plata-box',
    name: 'Plata 925',
    category: 'Metal',
    shape: 'box',
    color: '#E8E8E8', // Plata brillante
    metalness: 0.98,
    roughness: 0.1,
  },
  {
    id: 'metal-platino-sphere',
    name: 'Platino',
    category: 'Metal',
    shape: 'sphere',
    color: '#E5E4E2', // Platino brillante
    metalness: 0.98,
    roughness: 0.08,
  },
  {
    id: 'metal-bronce-cylinder',
    name: 'Bronce',
    category: 'Metal',
    shape: 'cylinder',
    color: '#CD7F32', // Bronce brillante
    metalness: 0.9,
    roughness: 0.2,
  },
  {
    id: 'metal-cobre-torus',
    name: 'Cobre',
    category: 'Metal',
    shape: 'torus',
    color: '#B87333', // Cobre brillante
    metalness: 0.92,
    roughness: 0.18,
  },
  {
    id: 'metal-titanio-capsule',
    name: 'Titanio',
    category: 'Metal',
    shape: 'capsule',
    color: '#C0C0C0', // Titanio brillante
    metalness: 0.85,
    roughness: 0.25,
  },

  // ===== PIEDRAS PRECIOSAS =====
  {
    id: 'piedra-diamante-sphere',
    name: 'Diamante',
    category: 'Piedra',
    shape: 'sphere',
    color: '#FFFFFF',
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    transmission: 0.95,
  },
  {
    id: 'piedra-rubi-sphere',
    name: 'Rubí',
    category: 'Piedra',
    shape: 'sphere',
    color: '#E0115F', // Rojo rubí brillante
    metalness: 0.2,
    roughness: 0.1,
    transparent: true,
    transmission: 0.6,
  },
  {
    id: 'piedra-esmeralda-box',
    name: 'Esmeralda',
    category: 'Piedra',
    shape: 'box',
    color: '#50C878', // Verde esmeralda brillante
    metalness: 0.2,
    roughness: 0.1,
    transparent: true,
    transmission: 0.6,
  },
  {
    id: 'piedra-zafiro-sphere',
    name: 'Zafiro',
    category: 'Piedra',
    shape: 'sphere',
    color: '#0F52BA', // Azul zafiro brillante
    metalness: 0.2,
    roughness: 0.1,
    transparent: true,
    transmission: 0.6,
  },
  {
    id: 'piedra-amatista-cone',
    name: 'Amatista',
    category: 'Piedra',
    shape: 'cone',
    color: '#9966CC', // Púrpura amatista brillante
    metalness: 0.2,
    roughness: 0.15,
    transparent: true,
    transmission: 0.5,
  },
  {
    id: 'piedra-topacio-box',
    name: 'Topacio',
    category: 'Piedra',
    shape: 'box',
    color: '#FFC87C', // Naranja topacio brillante
    metalness: 0.2,
    roughness: 0.12,
    transparent: true,
    transmission: 0.55,
  },
  {
    id: 'piedra-turquesa-sphere',
    name: 'Turquesa',
    category: 'Piedra',
    shape: 'sphere',
    color: '#40E0D0', // Turquesa brillante
    metalness: 0.3,
    roughness: 0.2,
  },
  {
    id: 'piedra-perla-sphere',
    name: 'Perla',
    category: 'Piedra',
    shape: 'sphere',
    color: '#FFF5EE', // Blanco perla brillante
    metalness: 0.4,
    roughness: 0.3,
  },

  // ===== HILOS =====
  {
    id: 'hilo-nylon-cylinder',
    name: 'Hilo de Nylon',
    category: 'Hilo',
    shape: 'cylinder',
    color: '#F0F0F0', // Blanco nylon
    metalness: 0.1,
    roughness: 0.6,
  },
  {
    id: 'hilo-seda-cylinder',
    name: 'Hilo de Seda',
    category: 'Hilo',
    shape: 'cylinder',
    color: '#FFFACD', // Amarillo seda suave
    metalness: 0.15,
    roughness: 0.5,
  },
  {
    id: 'hilo-acero-cylinder',
    name: 'Cable de Acero',
    category: 'Hilo',
    shape: 'cylinder',
    color: '#B0B0B0', // Gris acero brillante
    metalness: 0.85,
    roughness: 0.2,
  },

  // ===== INSUMOS =====
  {
    id: 'insumo-pegamento-cylinder',
    name: 'Pegamento',
    category: 'Insumo',
    shape: 'cylinder',
    color: '#FFFFE0', // Amarillo claro transparente
    metalness: 0.1,
    roughness: 0.3,
    transparent: true,
    transmission: 0.4,
  },
  {
    id: 'insumo-soldadura-box',
    name: 'Soldadura',
    category: 'Insumo',
    shape: 'box',
    color: '#C0C0C0', // Plateado
    metalness: 0.8,
    roughness: 0.3,
  },
  {
    id: 'insumo-pulidor-sphere',
    name: 'Pulidor',
    category: 'Insumo',
    shape: 'sphere',
    color: '#FFE4B5', // Beige claro
    metalness: 0.2,
    roughness: 0.7,
  },
  {
    id: 'insumo-cera-cylinder',
    name: 'Cera para Moldes',
    category: 'Insumo',
    shape: 'cylinder',
    color: '#F5DEB3', // Trigo/beige
    metalness: 0.1,
    roughness: 0.8,
  },
  {
    id: 'insumo-acido-box',
    name: 'Ácido de Limpieza',
    category: 'Insumo',
    shape: 'box',
    color: '#87CEEB', // Azul cielo transparente
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    transmission: 0.6,
  },
  {
    id: 'insumo-barniz-cylinder',
    name: 'Barniz Protector',
    category: 'Insumo',
    shape: 'cylinder',
    color: '#FFD700', // Dorado transparente
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    transmission: 0.5,
  },

  // ===== BROCHES =====
  {
    id: 'broche-mosqueton-box',
    name: 'Broche Mosquetón',
    category: 'Broche',
    shape: 'box',
    color: '#C0C0C0', // Plata broche
    metalness: 0.9,
    roughness: 0.15,
  },
  {
    id: 'broche-langosta-capsule',
    name: 'Broche Langosta',
    category: 'Broche',
    shape: 'capsule',
    color: '#FFD700', // Oro broche
    metalness: 0.92,
    roughness: 0.12,
  },

  // ===== EMPAQUE =====
  {
    id: 'empaque-caja-box',
    name: 'Caja de Regalo',
    category: 'Empaque',
    shape: 'box',
    color: '#8B4513', // Marrón cartón
    metalness: 0.05,
    roughness: 0.8,
  },
  {
    id: 'empaque-bolsa-cylinder',
    name: 'Bolsa de Terciopelo',
    category: 'Empaque',
    shape: 'cylinder',
    color: '#8B0000', // Rojo terciopelo oscuro
    metalness: 0.1,
    roughness: 0.9,
  },

  // ===== HERRAMIENTAS =====
  {
    id: 'herramienta-pinza-box',
    name: 'Pinza de Joyero',
    category: 'Herramienta',
    shape: 'box',
    color: '#708090', // Gris acero herramienta
    metalness: 0.7,
    roughness: 0.3,
  },
];

// Componente principal del visor 3D
interface Predefined3DViewerProps {
  objectId: string;
  className?: string;
  autoRotate?: boolean;
}

export const Predefined3DViewer: React.FC<Predefined3DViewerProps> = ({ 
  objectId, 
  className = '' 
}) => {
  const object = PREDEFINED_3D_OBJECTS.find(obj => obj.id === objectId);

  if (!object) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true
        }}
      >
        {/* Iluminación mejorada para colores brillantes */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={0.8} />
        <spotLight position={[5, 5, 5]} angle={0.3} intensity={1} />
        
        {/* Objeto 3D con rotación */}
        <RotatingMesh
          shape={object.shape}
          color={object.color}
          metalness={object.metalness}
          roughness={object.roughness}
          transparent={object.transparent}
          transmission={object.transmission}
        />

        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
};

// Función helper para obtener objeto por ID
export function getPredefined3DObject(objectId: string): Predefined3DObject | undefined {
  return PREDEFINED_3D_OBJECTS.find(obj => obj.id === objectId);
}

// Función helper para obtener objetos por categoría
export function getPredefined3DObjectsByCategory(category: string): Predefined3DObject[] {
  return PREDEFINED_3D_OBJECTS.filter(obj => obj.category === category);
}






