
/**
 * Mapeo de categorías de materiales a imágenes 3D
 * Las imágenes se asignan automáticamente según la categoría del material
 */

import type { JwlCategoriaMaterial } from './types/jewelry.types';

// Mapeo de categorías a archivos de imagen 3D
const MATERIAL_3D_IMAGES: Record<string, string> = {
  'Metal': '/images/materials-3d/metal.svg',
  'Piedra': '/images/materials-3d/piedra.svg',
  'Hilo': '/images/materials-3d/hilo.svg',
  'Broche': '/images/materials-3d/broche.svg',
  'Empaque': '/images/materials-3d/empaque.svg',
  'Herramienta': '/images/materials-3d/herramienta.svg',
  'Otro': '/images/materials-3d/otro.svg'
};

/**
 * Palabras clave para cada categoría de material
 * Usado para generar imágenes 3D inteligentes basadas en el nombre del material
 */
export const MATERIAL_KEYWORDS: Record<string, string[]> = {
  'Metal': [
    'oro', 'plata', 'platino', 'bronce', 'cobre', 'acero', 'titanio',
    'dorado', 'plateado', 'brillante', 'mate', 'pulido', 'oxidado',
    '24k', '18k', '14k', '10k', 'sterling', '925', '950'
  ],
  'Piedra': [
    'diamante', 'rubí', 'esmeralda', 'zafiro', 'topacio', 'amatista', 'cuarzo',
    'ágata', 'jade', 'ópalo', 'turquesa', 'perla', 'coral',
    'transparente', 'facetado', 'cabujón', 'natural', 'sintético',
    'brillante', 'opaco', 'translúcido'
  ],
  'Hilo': [
    'seda', 'algodón', 'nylon', 'poliéster', 'elástico', 'metálico',
    'encerado', 'trenzado', 'fino', 'grueso', 'resistente',
    'negro', 'blanco', 'rojo', 'azul', 'verde', 'dorado', 'plateado'
  ],
  'Broche': [
    'mosquetón', 'cierre', 'gancho', 'magnético', 'presión', 'rosca',
    'dorado', 'plateado', 'pequeño', 'grande', 'seguro', 'decorativo',
    'simple', 'elaborado', 'vintage', 'moderno'
  ],
  'Empaque': [
    'caja', 'bolsa', 'sobre', 'estuche', 'papel', 'terciopelo',
    'cartón', 'plástico', 'tela', 'regalo', 'presentación',
    'pequeño', 'mediano', 'grande', 'elegante', 'simple'
  ],
  'Herramienta': [
    'alicate', 'pinza', 'martillo', 'lima', 'sierra', 'taladro', 'pulidora',
    'soplete', 'crisol', 'yunque', 'mandril', 'calibrador', 'lupa', 'microscopio',
    'balanza', 'medidor', 'cortador', 'doblador', 'prensa', 'molde'
  ],
  
  'Insumo': [
    'pegamento', 'adhesivo', 'soldadura', 'flux', 'ácido', 'limpiador', 'pulidor',
    'cera', 'resina', 'silicona', 'barniz', 'esmalte', 'pintura', 'tinta',
    'lubricante', 'desengrasante', 'decapante', 'protector', 'sellador', 'fijador',
    'abrasivo', 'lija', 'pasta', 'compuesto', 'químico', 'reactivo', 'solución'
  ],
  
  'Otro': [
    'accesorio', 'componente', 'pieza', 'elemento', 'material', 'insumo',
    'suministro', 'artículo', 'producto', 'item'
  ]
};

/**
 * Obtiene la imagen 3D correspondiente a una categoría de material
 * @param categoria - Categoría del material
 * @returns URL de la imagen 3D
 */
export function getMaterial3DImage(categoria: string): string {
  return MATERIAL_3D_IMAGES[categoria] || MATERIAL_3D_IMAGES['Otro'];
}



