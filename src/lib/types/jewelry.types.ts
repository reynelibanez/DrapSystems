




/**
 * TIPOS TYPESCRIPT PARA EL MÓDULO DE JOYERÍA
 * Prefijo: jwl_
 */

export interface JwlMateriaPrima {
  id: string;
  nombre: string;
  categoria: string;
  tipo?: string; // Tipo específico del material
  unidad_medida: string;
  costo_unitario_actual: number;
  stock_actual: number;
  stock_minimo: number;
  proveedor: string | null;
  imagen_url: string | null;
  object_3d_id: string | null; // ID del objeto 3D predefinido
  created_at: string;
  updated_at: string;
}

export interface JwlCompraMaterial {
  id: string;
  materia_prima_id: string;
  cantidad: number;
  costo_unitario: number;
  costo_total?: number; // Calculado automáticamente
  proveedor: string | null;
  fecha_compra: string;
  notas: string | null;
  created_at: string;
  // Relaciones
  materia_prima?: JwlMateriaPrima;
}

export interface JwlJoya {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  costo_produccion: number;
  margen_ganancia: number;
  precio_venta: number;
  precio_por_peso: number | null; // Precio por gramo/unidad de peso
  stock_actual: number;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface JwlFichaCosto {
  id: string;
  joya_id: string;
  materia_prima_id: string;
  cantidad_usada: number;
  costo_unitario_momento: number;
  subtotal?: number; // Calculado automáticamente
  // Relaciones
  materia_prima?: JwlMateriaPrima;
  joya?: JwlJoya;
}

export interface JwlProduccion {
  id: string;
  joya_id: string;
  cantidad_producida: number;
  fecha_produccion: string;
  costo_total_lote: number;
  peso_producto?: number;
  materiales_usados?: Array<{
    material_id: string;
    cantidad: number;
  }>;
  created_at: string;
  // Relaciones
  joya?: JwlJoya;
}

export interface JwlVenta {
  id: string;
  joya_id: string;
  cantidad: number;
  precio_unitario_venta: number;
  total_venta?: number; // Calculado automáticamente
  costo_unitario_al_vender: number;
  utilidad?: number; // Calculado automáticamente
  cliente: string | null;
  fecha_venta: string;
  metodo_pago: string | null;
  notas: string | null;
  // Campos para venta por peso
  venta_por_peso: boolean; // Indica si la venta fue por peso
  peso_vendido: number | null; // Peso en gramos vendido
  precio_por_peso_venta: number | null; // Precio por gramo al momento de la venta
  created_at: string;
  // Relaciones
  joya?: JwlJoya;
}

export interface JwlGastoGeneral {
  id: string;
  concepto: string;
  categoria: string;
  monto: number;
  fecha: string;
  notas: string | null;
  created_at: string;
}

// Tipos para vistas y reportes
export interface JwlValorInventarioMaterial {
  id: string;
  nombre: string;
  categoria: string;
  stock_actual: number;
  costo_unitario_actual: number;
  valor_total: number;
}

export interface JwlValorInventarioJoya {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  stock_actual: number;
  costo_produccion: number;
  precio_venta: number;
  valor_costo: number;
  valor_venta: number;
}

export interface JwlAlertaStockBajo {
  id: string;
  nombre: string;
  tipo: 'material' | 'joya';
  stock_actual: number;
  stock_minimo: number;
}

// Alias para compatibilidad
export type JwlAlertaStock = JwlAlertaStockBajo;

export interface JwlEstadisticas {
  total_materiales: number;
  total_joyas: number;
  total_producciones: number;
  total_ventas: number;
  valor_inventario_materiales: number;
  valor_inventario_joyas: number;
  ingresos_totales: number;
  gastos_totales: number;
  ganancia_neta: number;
}

export interface JwlResumenVentasPorJoya {
  joya_id: string;
  sku: string;
  nombre: string;
  categoria: string;
  total_ventas: number;
  cantidad_vendida: number;
  ingresos_totales: number;
  utilidad_total: number;
}

// Tipos para el Dashboard
export interface JwlDashboardStats {
  valor_inventario_materiales: number;
  valor_inventario_joyas_costo: number;
  valor_inventario_joyas_venta: number;
  ventas_mes: number;
  items_vendidos_mes: number;
  gastos_materiales_mes: number;
  gastos_generales_mes: number;
  utilidad_mes: number;
  alertas_stock_bajo: number;
}

// Tipos para formularios
export interface JwlMateriaPrimaFormData {
  nombre: string;
  categoria: string;
  tipo?: string; // Agregar campo tipo (opcional porque puede no estar en el catálogo)
  unidad_medida: string;
  costo_unitario_actual: number;
  stock_actual: number;
  stock_minimo: number;
  proveedor?: string;
  imagen_url?: string;
  object_3d_id?: string; // ID del objeto 3D predefinido
}

export interface JwlCompraMaterialFormData {
  materia_prima_id: string;
  cantidad: number;
  costo_unitario: number;
  proveedor?: string;
  fecha_compra: string;
  notas?: string;
}

export interface JwlJoyaFormData {
  sku: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  margen_ganancia: number;
  precio_venta?: number;
  precio_por_peso?: number; // Precio por gramo/unidad de peso
  stock_actual?: number;
  imagen_url?: string;
}

export interface JwlFichaCostoFormData {
  joya_id: string;
  materia_prima_id: string;
  cantidad_usada: number;
}

export interface JwlProduccionFormData {
  joya_id: string;
  cantidad_producida: number;
  fecha_produccion: string;
  peso_producto?: number;
  materiales_usados?: Array<{
    material_id: string;
    cantidad: number;
  }>;
}

export interface JwlVentaFormData {
  joya_id: string;
  cantidad: number;
  precio_unitario_venta: number;
  cliente?: string;
  fecha_venta: string;
  metodo_pago?: string;
  notas?: string;
  // Campos para venta por peso
  venta_por_peso?: boolean;
  peso_vendido?: number;
  precio_por_peso_venta?: number;
}

export interface JwlGastoGeneralFormData {
  concepto: string;
  categoria: string;
  monto: number;
  fecha: string;
  notas?: string;
}

// Constantes
export const JWL_CATEGORIAS_MATERIAL = [
  'Metal',
  'Piedra',
  'Hilo',
  'Broche',
  'Insumo',
  'Empaque',
  'Herramienta',
  'Otro'
] as const;

export const JWL_UNIDADES_MEDIDA = [
  'Gramo',
  'Quilate',
  'Pieza',
  'Metro',
  'Centímetro',
  'Mililitro',
  'Litro'
] as const;

export const JWL_CATEGORIAS_JOYA = [
  'Anillo',
  'Collar',
  'Arete',
  'Pulsera',
  'Dije',
  'Cadena',
  'Otro'
] as const;

export const JWL_METODOS_PAGO = [
  'Efectivo',
  'Tarjeta',
  'Transferencia',
  'PayPal',
  'Otro'
] as const;

export const JWL_CATEGORIAS_GASTO = [
  'Mano de obra',
  'Herramientas',
  'Empaque',
  'Envío',
  'Servicios',
  'Otro'
] as const;

export type JwlCategoriaMaterial = typeof JWL_CATEGORIAS_MATERIAL[number];
export type JwlUnidadMedida = typeof JWL_UNIDADES_MEDIDA[number];
export type JwlCategoriaJoya = typeof JWL_CATEGORIAS_JOYA[number];
export type JwlMetodoPago = typeof JWL_METODOS_PAGO[number];
export type JwlCategoriaGasto = typeof JWL_CATEGORIAS_GASTO[number];

// =====================================================
// SISTEMA DE MONEDAS
// =====================================================

export interface JwlMoneda {
  id: string;
  codigo: string; // CLP, USD, EUR
  nombre: string;
  simbolo: string;
  tasa_cambio: number;
  es_moneda_base: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface JwlConfiguracionMoneda {
  id: string;
  business_id: string;
  moneda_id: string;
  moneda?: JwlMoneda;
  created_at: string;
  updated_at: string;
}

export interface CurrencyContextType {
  moneda: JwlMoneda | null;
  monedas: JwlMoneda[];
  cambiarMoneda: (monedaId: string) => Promise<void>;
  formatearMonto: (monto: number) => string;
  convertirMonto: (monto: number, monedaOrigenCodigo: string, monedaDestinoCodigo: string) => number;
  loading: boolean;
}

// Tipos para reportes
export interface JwlReporteFinanciero {
  categoria: string;
  total: number;
}

export interface JwlReporteVentas {
  categoria: string;
  total: number;
  utilidad: number;
}

export interface JwlReporteProduccion {
  nombre: string;
  sku: string;
  categoria: string;
  total_ventas: number;
  cantidad_vendida: number;
  ingresos_totales: number;
  utilidad_total: number;
}

export interface JwlReporteInventario {
  tipo: 'material' | 'joya';
  nombre: string;
  cantidad: number;
  valor_unitario: number;
  valor_total: number;
}

// =====================================================
// CATÁLOGO DE MATERIALES (IA 3D)
// =====================================================
// @deprecated El catálogo IA fue eliminado. Estos tipos se mantienen
// solo para compatibilidad con código existente.
// Las materias primas se gestionan directamente en jwl_materias_primas.

export type JwlForma3D = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'capsule';

/**
 * @deprecated El catálogo IA fue eliminado. Usar jwl_materias_primas directamente.
 */
export interface JwlCatalogoMaterial {
  id: string;
  business_id: string;
  nombre: string;
  categoria: string;
  palabras_clave: string[];
  
  // Propiedades 3D
  color: string;
  color_secundario?: string;
  forma: JwlForma3D;
  metalness: number;
  roughness: number;
  transparente: boolean;
  transmission?: number;
  color_emisivo?: string;
  intensidad_emisiva?: number;
  
  // Metadatos
  activo: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * @deprecated El catálogo IA fue eliminado. Usar jwl_materias_primas directamente.
 */
export interface JwlCatalogoMaterialInsert {
  business_id: string;
  nombre: string;
  categoria: string;
  palabras_clave: string[];
  color: string;
  color_secundario?: string;
  forma: JwlForma3D;
  metalness: number;
  roughness: number;
  transparente: boolean;
  transmission?: number;
  color_emisivo?: string;
  intensidad_emisiva?: number;
  activo?: boolean;
}

















