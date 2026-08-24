import { useState, useEffect } from 'react';
import type { JwlCatalogoMaterial } from '../types/jewelry.types';

/**
 * Hook para obtener y buscar materiales en el catálogo
 * NOTA: El catálogo IA fue eliminado. Este hook ahora retorna un catálogo vacío
 * para mantener compatibilidad con componentes existentes.
 * Las materias primas se gestionan directamente en jwl_materias_primas.
 */
export function useMaterialCatalog(businessId: string | undefined) {
  const [catalog] = useState<JwlCatalogoMaterial[]>([]);
  const [loading] = useState(false);
  const [error] = useState<Error | null>(null);

  useEffect(() => {
    // No hacer nada - el catálogo IA fue eliminado
    console.log('ℹ️  useMaterialCatalog: El catálogo IA fue eliminado. Retornando catálogo vacío.');
  }, [businessId]);

  /**
   * Buscar material en el catálogo por nombre
   * Siempre retorna null ya que el catálogo está vacío
   */
  const findMaterial = (materialName: string): JwlCatalogoMaterial | null => {
    return null;
  };

  /**
   * Obtener todas las categorías únicas del catálogo
   * Siempre retorna array vacío
   */
  const getCategories = (): string[] => {
    return [];
  };

  /**
   * Obtener materiales por categoría
   * Siempre retorna array vacío
   */
  const getMaterialsByCategory = (category: string): JwlCatalogoMaterial[] => {
    return [];
  };

  const loadCatalog = async () => {
    // No hacer nada - el catálogo IA fue eliminado
    console.log('ℹ️  useMaterialCatalog: El catálogo IA fue eliminado.');
  };

  return {
    catalog,
    loading,
    error,
    findMaterial,
    getCategories,
    getMaterialsByCategory,
    reload: loadCatalog
  };
}
