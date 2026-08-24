import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Package, Gem, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { 
  getValorInventarioMateriales,
  getValorInventarioJoyas
} from '../../lib/api/jewelry';
import type { 
  JwlValorInventarioMaterial,
  JwlValorInventarioJoya
} from '../../lib/types/jewelry.types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useCurrency } from '../../lib/hooks/useCurrency';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface InventarioViewProps {
  businessId: string;
}

export function InventarioView({ businessId }: InventarioViewProps) {
  const { t } = useTranslation();
  const { formatearMonto } = useCurrency(businessId);
  const [materiales, setMateriales] = useState<JwlValorInventarioMaterial[]>([]);
  const [joyas, setJoyas] = useState<JwlValorInventarioJoya[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [materialesData, joyasData] = await Promise.all([
        getValorInventarioMateriales(),
        getValorInventarioJoyas()
      ]);
      setMateriales(materialesData);
      setJoyas(joyasData);
    } catch (error) {
      console.error('Error loading inventario:', error);
      toast.error(t('jewelry.common.error'));
    } finally {
      setLoading(false);
    }
  };

  const totalMateriales = materiales.reduce((sum, m) => sum + m.valor_total, 0);
  const totalJoyasCosto = joyas.reduce((sum, j) => sum + j.valor_costo, 0);
  const totalJoyasVenta = joyas.reduce((sum, j) => sum + j.valor_venta, 0);

  // Calcular alertas de stock bajo desde los materiales
  const alertas = materiales.filter(m => m.stock_actual <= (m as any).stock_minimo);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('jewelry.rawMaterials.title')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearMonto(totalMateriales)}</div>
            <p className="text-xs text-muted-foreground">
              {materiales.length} {t('jewelry.rawMaterials.noMaterials').toLowerCase().replace('no hay ', '').replace(' registradas', '')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('jewelry.inventory.title')} ({t('jewelry.inventory.form.cost')})</CardTitle>
            <Gem className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearMonto(totalJoyasCosto)}</div>
            <p className="text-xs text-muted-foreground">
              {joyas.length} {t('jewelry.inventory.noItems').toLowerCase().replace('no hay ', '').replace(' en el inventario', '')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('jewelry.inventory.title')} ({t('jewelry.inventory.form.price')})</CardTitle>
            <Gem className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatearMonto(totalJoyasVenta)}</div>
            <p className="text-xs text-muted-foreground">
              {t('jewelry.reports.summary.profitMargin')}: {formatearMonto(totalJoyasVenta - totalJoyasCosto)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('jewelry.rawMaterials.table.minStock')} ({alertas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertas.map(alerta => (
                <div key={alerta.id} className="flex justify-between items-center p-2 bg-destructive/10 rounded">
                  <div>
                    <p className="font-medium">{alerta.nombre}</p>
                    <p className="text-sm text-muted-foreground">{alerta.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">{alerta.stock_actual}</p>
                    <p className="text-xs text-muted-foreground">{t('jewelry.rawMaterials.table.minStock')}: {(alerta as any).stock_minimo || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de inventario */}
      <Tabs defaultValue="materiales">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materiales">{t('jewelry.rawMaterials.title')}</TabsTrigger>
          <TabsTrigger value="joyas">{t('jewelry.inventory.title')}</TabsTrigger>
        </TabsList>

        <TabsContent value="materiales" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('jewelry.rawMaterials.title')}</CardTitle>
              <CardDescription>
                {t('jewelry.common.total')}: {formatearMonto(totalMateriales)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {materiales.map(material => (
                  <Card key={material.id}>
                    <CardContent className="py-3">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="md:col-span-2">
                          <p className="font-medium">{material.nombre}</p>
                          <p className="text-xs text-muted-foreground">{material.categoria}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.rawMaterials.table.stock')}:</span>
                          <p className="font-medium">{material.stock_actual}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.rawMaterials.table.cost')}:</span>
                          <p>{formatearMonto(material.costo_unitario_actual)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.common.total')}:</span>
                          <p className="font-bold">{formatearMonto(material.valor_total)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {materiales.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {t('jewelry.rawMaterials.noMaterials')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="joyas" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('jewelry.inventory.title')}</CardTitle>
              <CardDescription>
                {t('jewelry.inventory.form.cost')}: {formatearMonto(totalJoyasCosto)} | {t('jewelry.inventory.form.price')}: {formatearMonto(totalJoyasVenta)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {joyas.map(joya => (
                  <Card key={joya.id}>
                    <CardContent className="py-3">
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                        <div className="md:col-span-2">
                          <p className="font-medium">{joya.nombre}</p>
                          <p className="text-xs text-muted-foreground">SKU: {joya.sku} | {joya.categoria}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.inventory.table.stock')}:</span>
                          <p className="font-medium">{joya.stock_actual} pzas</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.inventory.form.cost')}:</span>
                          <p>{formatearMonto(joya.costo_produccion)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.inventory.form.price')}:</span>
                          <p className="text-green-600">{formatearMonto(joya.precio_venta)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('jewelry.common.total')}:</span>
                          <p className="font-bold">{formatearMonto(joya.valor_costo)}</p>
                          <p className="text-xs text-green-600">{formatearMonto(joya.valor_venta)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {joyas.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {t('jewelry.inventory.noItems')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}





