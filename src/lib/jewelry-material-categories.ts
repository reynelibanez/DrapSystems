/**
 * SISTEMA DE CATEGORÍAS DINÁMICAS PARA MATERIALES
 * 
 * Este archivo gestiona las categorías de materiales que se sincronizan
 * automáticamente con el Catálogo de IA.
 */

import { MATERIAL_KEYWORDS } from './jewelry-material-images';

/**
 * Obtiene todas las categorías disponibles desde el catálogo de IA
 */
export function getAvailableCategories(): string[] {
  const categories = Object.keys(MATERIAL_KEYWORDS);
  return categories;
}

/**
 * Obtiene las categorías base (las 7 originales)
 */
export function getBaseCategories(): string[] {
  return [
    'Metal',
    'Piedra',
    'Hilo',
    'Broche',
    'Empaque',
    'Herramienta',
    'Otro'
  ];
}

/**
 * Verifica si una categoría existe en el catálogo
 */
export function categoryExists(category: string): boolean {
  return category in MATERIAL_KEYWORDS;
}

/**
 * Obtiene las palabras clave de una categoría
 */
export function getCategoryKeywords(category: string): string[] {
  return MATERIAL_KEYWORDS[category] || [];
}

/**
 * Obtiene todas las categorías ordenadas alfabéticamente
 */
export function getSortedCategories(): string[] {
  const categories = getAvailableCategories();
  return categories.sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Obtiene estadísticas del catálogo
 */
export function getCatalogStats() {
  const categories = getAvailableCategories();
  const totalKeywords = categories.reduce((sum, cat) => {
    return sum + (MATERIAL_KEYWORDS[cat]?.length || 0);
  }, 0);

  return {
    totalCategories: categories.length,
    totalKeywords,
    categories: categories.map(cat => ({
      name: cat,
      keywordCount: MATERIAL_KEYWORDS[cat]?.length || 0
    }))
  };
}
