

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Package, 
  ShoppingCart, 
  Factory,
  TrendingDown,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getMateriaPrimas,
  getComprasByMaterial,
  getFichaCostoByJoya,
  getProduccionByJoya,
  getJoyas
} from '../../lib/api/jewelry';
import type { 
  JwlMateriaPrima,
  JwlCompraMaterial,
  JwlFichaCosto,
  JwlProduccion,
  JwlJoya
} from '../../lib/types/jewelry.types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { toast } from 'sonner';
import { useCurrency } from '../../lib/hooks/useCurrency';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';

interface ReporteMateriaPrimaProps {
  businessId: string;
}

interface MaterialConDetalle extends JwlMateriaPrima {
  compras: JwlCompraMaterial[];
  totalComprado: number;
  totalGastado: number;
  usoEnJoyas: {
    joya: JwlJoya;
    cantidadPorUnidad: number;
    totalProducido: number;
    totalUsado: number;
  }[];
  totalUsado: number;
  stockDisponible: number;
}

export function ReporteMateriaPrima({ businessId }: ReporteMateriaPrimaProps) {
  const { t } = useTranslation();
  const { formatearMonto } = useCurrency(businessId);
  const [loading, setLoading] = useState(true);
  const [materiales, setMateriales] = useState<MaterialConDetalle[]>([]);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);

  useEffect(() => {
    loadReporte();
  }, [businessId]);

  const loadReporte = async () => {
    try {
      setLoading(true);
      
      // 1. Obtener todas las materias primas
      const materiasRaw = await getMateriaPrimas();
      
      // 2. Obtener todas las joyas
      const joyas = await getJoyas();
      
      // 3. Para cada materia prima, obtener su detalle
      const materialesConDetalle = await Promise.all(
        materiasRaw.map(async (materia) => {
          // Obtener compras
          const compras = await getComprasByMaterial(materia.id);
          const totalComprado = compras.reduce((sum, c) => sum + c.cantidad, 0);
          const totalGastado = compras.reduce((sum, c) => sum + c.costo_total, 0);
          
          // Obtener uso en joyas
          const usoEnJoyas = await Promise.all(
            joyas.map(async (joya) => {
              // Obtener ficha de costo de esta joya
              const fichaCosto = await getFichaCostoByJoya(joya.id);
              const materialEnFicha = fichaCosto.find(f => f.materia_prima_id === materia.id);
              
              // Obtener producción de esta joya
              const produccion = await getProduccionByJoya(joya.id);
              
              let totalUsado = 0;
              let cantidadPorUnidad = 0;
              
              // Calcular uso desde la ficha de costo (método antiguo)
              if (materialEnFicha) {
                cantidadPorUnidad = materialEnFicha.cantidad_usada;
                const totalProducidoFicha = produccion.reduce((sum, p) => sum + p.cantidad_producida, 0);
                totalUsado += cantidadPorUnidad * totalProducidoFicha;
              }
              
              // Calcular uso desde materiales_usados en cada producción (método nuevo)
              produccion.forEach(prod => {
                if (prod.materiales_usados && Array.isArray(prod.materiales_usados)) {
                  const materialEnProduccion = prod.materiales_usados.find(
                    (m: any) => m.material_id === materia.id
                  );
                  if (materialEnProduccion) {
                    totalUsado += materialEnProduccion.cantidad * prod.cantidad_producida;
                  }
                }
              });
              
              // Si no se usó este material en esta joya, retornar null
              if (totalUsado === 0) {
                return null;
              }
              
              const totalProducido = produccion.reduce((sum, p) => sum + p.cantidad_producida, 0);
              
              return {
                joya,
                cantidadPorUnidad,
                totalProducido,
                totalUsado
              };
            })
          );
          
          // Filtrar nulls
          const usoFiltrado = usoEnJoyas.filter(u => u !== null) as MaterialConDetalle['usoEnJoyas'];
          const totalUsado = usoFiltrado.reduce((sum, u) => sum + u.totalUsado, 0);
          
          return {
            ...materia,
            compras,
            totalComprado,
            totalGastado,
            usoEnJoyas: usoFiltrado,
            totalUsado,
            stockDisponible: materia.stock_actual
          };
        })
      );
      
      setMateriales(materialesConDetalle);
    } catch (error) {
      console.error('Error loading reporte:', error);
      toast.error(t('jewelry.common.error'));
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Material',
      'Categoría',
      'Unidad',
      'Total Comprado',
      'Total Gastado',
      'Total Usado',
      'Stock Disponible',
      'Stock Mínimo',
      'Valor Inventario'
    ].join(',');
    
    const rows = materiales.map(m => [
      m.nombre,
      m.categoria,
      m.unidad_medida,
      m.totalComprado,
      m.totalGastado,
      m.totalUsado,
      m.stockDisponible,
      m.stock_minimo,
      m.stockDisponible * m.costo_unitario_actual
    ].join(','));
    
    const csv = `${headers}\n${rows.join('\n')}`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_materias_primas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(t('jewelry.common.saveSuccess'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const totalInventario = materiales.reduce(
    (sum, m) => sum + (m.stockDisponible * m.costo_unitario_actual),
    0
  );
  
  const totalGastado = materiales.reduce((sum, m) => sum + m.totalGastado, 0);
  const totalUsado = materiales.reduce((sum, m) => sum + m.totalUsado, 0);
  const materialesBajoStock = materiales.filter(m => m.stockDisponible <= m.stock_minimo);

  return (
    <div className="space-y-4">
      {/* Header con resumen */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('jewelry.materials.detailedReport')}</CardTitle>
              <CardDescription>
                {t('jewelry.materials.reportDescription')}
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {t('jewelry.reports.export')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('jewelry.materials.totalInventoryValue')}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatearMonto(totalInventario)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('jewelry.materials.totalPurchased')}
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatearMonto(totalGastado)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('jewelry.materials.totalUsed')}
                </CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalUsado.toFixed(2)} {t('jewelry.materials.units')}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('jewelry.materials.lowStock')}
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {materialesBajoStock.length}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Lista de materiales con detalle */}
      <div className="space-y-2">
        {materiales.map((material) => (
          <Collapsible
            key={material.id}
            open={expandedMaterial === material.id}
            onOpenChange={(open) => setExpandedMaterial(open ? material.id : null)}
          >
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{material.nombre}</CardTitle>
                        <Badge variant="outline">{material.categoria}</Badge>
                        {material.stockDisponible <= material.stock_minimo && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {t('jewelry.materials.lowStock')}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.materials.available')}:</span>
                          <p className="font-medium">
                            {material.stockDisponible.toFixed(2)} {material.unidad_medida}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.materials.totalPurchased')}:</span>
                          <p className="font-medium">
                            {material.totalComprado.toFixed(2)} {material.unidad_medida}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.materials.totalUsed')}:</span>
                          <p className="font-medium">
                            {material.totalUsado.toFixed(2)} {material.unidad_medida}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.materials.totalSpent')}:</span>
                          <p className="font-medium text-blue-600">
                            {formatearMonto(material.totalGastado)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.materials.inventoryValue')}:</span>
                          <p className="font-medium text-green-600">
                            {formatearMonto(material.stockDisponible * material.costo_unitario_actual)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {expandedMaterial === material.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {/* Historial de compras */}
                  {material.compras.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {t('jewelry.materials.purchaseHistory')} ({material.compras.length})
                      </h4>
                      <div className="space-y-2">
                        {material.compras.slice(0, 5).map((compra) => (
                          <div
                            key={compra.id}
                            className="flex justify-between items-center p-2 bg-muted rounded text-sm"
                          >
                            <div>
                              <p className="font-medium">
                                {new Date(compra.fecha_compra).toLocaleDateString()}
                              </p>
                              <p className="text-muted-foreground">
                                {compra.cantidad} {material.unidad_medida} × {formatearMonto(compra.costo_unitario)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatearMonto(compra.costo_total)}</p>
                              {compra.proveedor && (
                                <p className="text-xs text-muted-foreground">{compra.proveedor}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {material.compras.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{material.compras.length - 5} {t('jewelry.materials.morePurchases')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Uso en joyas */}
                  {material.usoEnJoyas.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Factory className="h-4 w-4" />
                        {t('jewelry.materials.usedIn')} ({material.usoEnJoyas.length} {t('jewelry.materials.jewels')})
                      </h4>
                      <div className="space-y-2">
                        {material.usoEnJoyas.map((uso) => (
                          <div
                            key={uso.joya.id}
                            className="flex justify-between items-center p-2 bg-muted rounded text-sm"
                          >
                            <div>
                              <p className="font-medium">{uso.joya.nombre}</p>
                              <p className="text-muted-foreground">
                                {uso.cantidadPorUnidad} {material.unidad_medida} {t('jewelry.materials.perUnit')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {uso.totalUsado.toFixed(2)} {material.unidad_medida}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {uso.totalProducido} {t('jewelry.materials.unitsProduced')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Balance */}
                  <div className="pt-4 border-t">
                    <div className="mb-2 text-sm text-muted-foreground text-center">
                      <p className="font-medium">Balance de Inventario</p>
                      <p className="text-xs">El stock disponible ya incluye las rebajas por producción</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded">
                        <p className="text-muted-foreground">{t('jewelry.materials.purchased')}</p>
                        <p className="text-lg font-bold text-blue-600">
                          +{material.totalComprado.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Total comprado</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded">
                        <p className="text-muted-foreground">{t('jewelry.materials.used')}</p>
                        <p className="text-lg font-bold text-red-600">
                          -{material.totalUsado.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Usado en producción</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                        <p className="text-muted-foreground">{t('jewelry.materials.remaining')}</p>
                        <p className="text-lg font-bold text-green-600">
                          ={material.stockDisponible.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Stock actual</p>
                      </div>
                    </div>
                    
                    {/* Verificación del balance */}
                    {Math.abs((material.totalComprado - material.totalUsado) - material.stockDisponible) > 0.01 && (
                      <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          ⚠️ Nota: La diferencia puede deberse a:
                        </p>
                        <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 mt-1">
                          <li>Stock inicial antes del sistema</li>
                          <li>Ajustes manuales de inventario</li>
                          <li>Mermas o pérdidas no registradas</li>
                        </ul>
                        <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                          Diferencia: {((material.totalComprado - material.totalUsado) - material.stockDisponible).toFixed(2)} {material.unidad_medida}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {materiales.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('jewelry.materials.noMaterials')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


