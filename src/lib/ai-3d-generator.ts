/**
 * Sistema de Generación de Modelos 3D con IA
 * 
 * Este módulo analiza el nombre de un material y genera automáticamente
 * las propiedades 3D apropiadas basándose en el catálogo de materiales.
 */

import type { JwlCatalogoMaterial } from './types/jewelry.types';

export interface Material3DProperties {
  // Geometría
  shape: 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'capsule';
  
  // Colores
  color: string;
  secondaryColor?: string;
  
  // Propiedades físicas
  metalness: number;
  roughness: number;
  
  // Transparencia
  transparent: boolean;
  transmission?: number;
  
  // Efectos de luz
  emissive?: string;
  emissiveIntensity?: number;
  
  // Metadatos
  detectedKeywords: string[];
  confidence: number;
}

/**
 * Genera propiedades 3D basándose en el catálogo de materiales
 */
export function generate3DPropertiesFromCatalog(
  materialName: string,
  catalog: JwlCatalogoMaterial[]
): Material3DProperties {
  console.log('🔧 generate3DPropertiesFromCatalog called');
  console.log('  materialName:', materialName);
  console.log('  catalog.length:', catalog.length);

  if (!materialName || catalog.length === 0) {
    console.log('⚠️ No material name or empty catalog, using defaults');
    return getDefaultProperties();
  }

  const searchTerm = materialName.toLowerCase().trim();
  console.log('  searchTerm:', searchTerm);
  
  // Buscar coincidencia en el catálogo
  const match = findBestMatch(searchTerm, catalog);
  
  if (match) {
    console.log('✅ Match found!');
    console.log('  material:', match.material.nombre);
    console.log('  confidence:', match.confidence);
    console.log('  keywords:', match.keywords);
    return catalogToProperties(match.material, match.keywords, match.confidence);
  }

  // Si no hay coincidencia, usar propiedades por defecto
  console.log('❌ No match found, using defaults');
  return getDefaultProperties();
}

/**
 * Buscar la mejor coincidencia en el catálogo
 */
function findBestMatch(
  searchTerm: string,
  catalog: JwlCatalogoMaterial[]
): { material: JwlCatalogoMaterial; keywords: string[]; confidence: number } | null {
  console.log('🔍 findBestMatch called');
  console.log('  searchTerm:', searchTerm);
  console.log('  catalog size:', catalog.length);

  let bestMatch: { material: JwlCatalogoMaterial; keywords: string[]; confidence: number } | null = null;
  let highestScore = 0;

  for (const material of catalog) {
    const result = calculateMatchScore(searchTerm, material);
    
    console.log(`  📊 Score for "${material.nombre}":`, result.score, 'keywords:', result.matchedKeywords);
    
    if (result.score > highestScore) {
      highestScore = result.score;
      bestMatch = {
        material,
        keywords: result.matchedKeywords,
        confidence: result.score
      };
    }
  }

  console.log('🏆 Best match:', bestMatch?.material.nombre, 'score:', highestScore);
  console.log('🎯 Threshold: 0.3');

  // Solo retornar si la confianza es mayor a 0.3
  return bestMatch && bestMatch.confidence > 0.3 ? bestMatch : null;
}

/**
 * Calcular score de coincidencia entre el término de búsqueda y un material
 */
function calculateMatchScore(
  searchTerm: string,
  material: JwlCatalogoMaterial
): { score: number; matchedKeywords: string[] } {
  let score = 0;
  const matchedKeywords: string[] = [];

  // Coincidencia exacta con el nombre (peso: 1.0)
  if (material.nombre.toLowerCase() === searchTerm) {
    score = 1.0;
    matchedKeywords.push(material.nombre);
    console.log(`    ✅ Exact name match: "${material.nombre}" === "${searchTerm}"`);
    return { score, matchedKeywords };
  }

  // Coincidencia parcial con el nombre (peso: 0.8)
  if (material.nombre.toLowerCase().includes(searchTerm)) {
    score = Math.max(score, 0.8);
    matchedKeywords.push(material.nombre);
    console.log(`    ✅ Partial name match: "${material.nombre}" includes "${searchTerm}"`);
  }

  if (searchTerm.includes(material.nombre.toLowerCase())) {
    score = Math.max(score, 0.7);
    matchedKeywords.push(material.nombre);
    console.log(`    ✅ Reverse name match: "${searchTerm}" includes "${material.nombre}"`);
  }

  // Coincidencias con palabras clave
  for (const keyword of material.palabras_clave) {
    // Coincidencia exacta con keyword (peso: 0.9)
    if (keyword === searchTerm) {
      score = Math.max(score, 0.9);
      matchedKeywords.push(keyword);
      console.log(`    ✅ Exact keyword match: "${keyword}" === "${searchTerm}"`);
      continue;
    }

    // Coincidencia parcial con keyword (peso: 0.6)
    if (searchTerm.includes(keyword)) {
      score = Math.max(score, 0.6);
      matchedKeywords.push(keyword);
      console.log(`    ✅ Partial keyword match: "${searchTerm}" includes "${keyword}"`);
      continue;
    }

    if (keyword.includes(searchTerm)) {
      score = Math.max(score, 0.5);
      matchedKeywords.push(keyword);
      console.log(`    ✅ Reverse keyword match: "${keyword}" includes "${searchTerm}"`);
    }
  }

  return { score, matchedKeywords };
}

/**
 * Convertir material del catálogo a propiedades 3D
 */
function catalogToProperties(
  material: JwlCatalogoMaterial,
  keywords: string[],
  confidence: number
): Material3DProperties {
  return {
    shape: material.forma,
    color: material.color,
    secondaryColor: material.color_secundario,
    metalness: material.metalness,
    roughness: material.roughness,
    transparent: material.transparente,
    transmission: material.transmission,
    emissive: material.color_emisivo,
    emissiveIntensity: material.intensidad_emisiva,
    detectedKeywords: keywords,
    confidence
  };
}

/**
 * Propiedades por defecto cuando no hay coincidencia
 */
function getDefaultProperties(): Material3DProperties {
  return {
    shape: 'box',
    color: '#C0C0C0',
    metalness: 0.5,
    roughness: 0.5,
    transparent: false,
    detectedKeywords: [],
    confidence: 0
  };
}

/**
 * Analizar múltiples palabras en el nombre del material
 * Útil para nombres compuestos como "Oro Rosa 18K"
 */
export function analyzeCompositeMaterial(
  materialName: string,
  catalog: JwlCatalogoMaterial[]
): Material3DProperties {
  const words = materialName.toLowerCase().split(/\s+/);
  const matches: Array<{ material: JwlCatalogoMaterial; confidence: number }> = [];

  // Buscar coincidencias para cada palabra
  for (const word of words) {
    const match = findBestMatch(word, catalog);
    if (match && match.confidence > 0.5) {
      matches.push({ material: match.material, confidence: match.confidence });
    }
  }

  if (matches.length === 0) {
    return getDefaultProperties();
  }

  // Usar la coincidencia con mayor confianza
  matches.sort((a, b) => b.confidence - a.confidence);
  const bestMatch = matches[0];

  return catalogToProperties(
    bestMatch.material,
    [bestMatch.material.nombre],
    bestMatch.confidence
  );
}

/**
 * Obtener sugerencias de materiales similares
 */
export function getSimilarMaterials(
  materialName: string,
  catalog: JwlCatalogoMaterial[],
  limit: number = 5
): Array<{ material: JwlCatalogoMaterial; confidence: number }> {
  const searchTerm = materialName.toLowerCase().trim();
  const results: Array<{ material: JwlCatalogoMaterial; confidence: number }> = [];

  for (const material of catalog) {
    const { score } = calculateMatchScore(searchTerm, material);
    if (score > 0.3) {
      results.push({ material, confidence: score });
    }
  }

  // Ordenar por confianza descendente
  results.sort((a, b) => b.confidence - a.confidence);

  return results.slice(0, limit);
}

