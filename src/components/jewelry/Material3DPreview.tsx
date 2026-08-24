import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthProvider';
import { useMaterialCatalog } from '../../lib/hooks/useMaterialCatalog';
import { generate3DPropertiesFromCatalog } from '../../lib/ai-3d-generator';

/**
 * Vista previa simple de material sin WebGL
 * Evita el error CONTEXT_LOST mostrando solo un círculo de color
 */

interface Material3DPreviewProps {
  materialName?: string;
  className?: string;
}

export function Material3DPreview({ 
  materialName, 
  className = "w-full h-full min-h-[200px]" 
}: Material3DPreviewProps) {
  const { profile } = useAuth();
  const { catalog, loading: catalogLoading } = useMaterialCatalog(profile?.business_id);
  const [materialData, setMaterialData] = useState<{
    name: string;
    categoria: string;
    color: string;
  } | null>(null);

  useEffect(() => {
    if (catalogLoading || !materialName) {
      return;
    }

    // Buscar en el catálogo
    const foundMaterial = catalog.find(m => 
      m.nombre.toLowerCase() === materialName.toLowerCase() ||
      m.palabras_clave.some(k => k.toLowerCase() === materialName.toLowerCase())
    );

    if (foundMaterial) {
      setMaterialData({
        name: foundMaterial.nombre,
        categoria: foundMaterial.categoria,
        color: foundMaterial.color
      });
    } else {
      // Generar con IA
      const aiProps = generate3DPropertiesFromCatalog(materialName, catalog);
      setMaterialData({
        name: materialName,
        categoria: 'Otro',
        color: aiProps.color
      });
    }
  }, [materialName, catalog, catalogLoading]);

  if (catalogLoading || !materialData) {
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

  return (
    <div 
      className={className}
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'hsl(var(--muted))',
        borderRadius: '0.5rem',
        padding: '1rem',
        gap: '0.5rem'
      }}
    >
      {/* Círculo de color */}
      <div 
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: materialData.color,
          boxShadow: `0 4px 12px ${materialData.color}40`,
          border: '3px solid hsl(var(--border))'
        }}
      />
      
      {/* Nombre del material */}
      <div style={{ 
        fontSize: '0.875rem', 
        color: 'hsl(var(--foreground))',
        fontWeight: 500,
        textAlign: 'center'
      }}>
        {materialData.name}
      </div>
      
      {/* Categoría */}
      <div style={{ 
        fontSize: '0.75rem', 
        color: 'hsl(var(--muted-foreground))',
        opacity: 0.7
      }}>
        {materialData.categoria}
      </div>
    </div>
  );
}
