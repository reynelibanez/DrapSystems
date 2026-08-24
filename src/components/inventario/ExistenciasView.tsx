import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DataTable } from '@/components/shared/DataTable';
import { BoxIcon, AlertTriangle, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Existencia {
  idproducto: string;
  codigo_producto: string;
  nombre_producto: string;
  idalmacen: string;
  nombre_almacen: string;
  existencia: number;
  unidad: string;
  stock_minimo: number;
  stock_maximo: number;
  costo: number;
}

interface AlmacenGroup {
  id: string;
  nombre: string;
  existencias: Existencia[];
  totalProductos: number;
  totalCantidad: number;
  totalValor: number;
}

interface ExistenciasViewProps {
  businessId?: string;
}

export function ExistenciasView({ businessId }: ExistenciasViewProps) {
  const { t } = useTranslation();
  const [almacenesAgrupados, setAlmacenesAgrupados] = useState<AlmacenGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      loadExistencias();
    }
  }, [businessId]);

  const loadExistencias = async () => {
    if (!businessId) {
      toast.error('No se encontró el ID del negocio');
      return;
    }

    try {
      setLoading(true);

      // Consultar directamente las tablas
      const { data, error } = await supabase
        .from('il_existencias_inventario')
        .select(`
          idproducto,
          idalmacen,
          cantidad,
          costo,
          producto:ng_productos_inventario(
            codigo,
            nombre,
            producto,
            unidad,
            stock_minimo,
            stock_maximo
          ),
          almacen:ng_almacen_inventario(
            id,
            almacen
          )
        `)
        .eq('business_id', businessId)
        .gt('cantidad', 0)
        .order('idalmacen');

      if (error) throw error;

      // Transformar y agrupar los datos por almacén
      const existenciasFormateadas = (data || []).map((item: any) => ({
        idproducto: item.idproducto,
        codigo_producto: item.producto?.codigo || '',
        nombre_producto: item.producto?.nombre || item.producto?.producto || '',
        idalmacen: item.idalmacen,
        nombre_almacen: item.almacen?.almacen || '',
        existencia: Number(item.cantidad),
        unidad: item.producto?.unidad || 'UND',
        stock_minimo: Number(item.producto?.stock_minimo || 0),
        stock_maximo: Number(item.producto?.stock_maximo || 0),
        costo: Number(item.costo || 0)
      }));

      // Agrupar por almacén
      const grupos = existenciasFormateadas.reduce((acc: { [key: string]: AlmacenGroup }, item: Existencia) => {
        if (!acc[item.idalmacen]) {
          acc[item.idalmacen] = {
            id: item.idalmacen,
            nombre: item.nombre_almacen,
            existencias: [],
            totalProductos: 0,
            totalCantidad: 0,
            totalValor: 0
          };
        }
        
        acc[item.idalmacen].existencias.push(item);
        acc[item.idalmacen].totalProductos += 1;
        acc[item.idalmacen].totalCantidad += item.existencia;
        acc[item.idalmacen].totalValor += item.existencia * item.costo;
        
        return acc;
      }, {});

      setAlmacenesAgrupados(Object.values(grupos));
    } catch (error) {
      console.error('Error cargando existencias:', error);
      toast.error(t('inventario.existencias.errorCargar', 'Error al cargar existencias'));
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (existencia: Existencia) => {
    if (existencia.existencia <= existencia.stock_minimo) {
      return { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Bajo' };
    } else if (existencia.existencia >= existencia.stock_maximo) {
      return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Alto' };
    }
    return { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Normal' };
  };

  const columns = [
    {
      key: 'codigo_producto',
      label: t('inventario.existencias.codigo', 'Código'),
      sortable: true
    },
    {
      key: 'nombre_producto',
      label: t('inventario.existencias.producto', 'Producto'),
      sortable: true
    },
    {
      key: 'existencia',
      label: t('inventario.existencias.cantidad', 'Existencia'),
      sortable: true,
      render: (item: Existencia) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {item.existencia.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-muted-foreground">{item.unidad}</span>
          {item.existencia <= item.stock_minimo && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
      )
    },
    {
      key: 'stock_minimo',
      label: t('inventario.existencias.minimo', 'Mínimo'),
      render: (item: Existencia) => (
        <span className="text-sm text-muted-foreground">
          {item.stock_minimo.toLocaleString('es-CL')}
        </span>
      )
    },
    {
      key: 'stock_maximo',
      label: t('inventario.existencias.maximo', 'Máximo'),
      render: (item: Existencia) => (
        <span className="text-sm text-muted-foreground">
          {item.stock_maximo.toLocaleString('es-CL')}
        </span>
      )
    },
    {
      key: 'costo',
      label: 'Costo Unit.',
      render: (item: Existencia) => (
        <span className="text-sm">
          ${item.costo.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'valor_total',
      label: 'Valor Total',
      render: (item: Existencia) => (
        <span className="text-sm font-medium">
          ${(item.existencia * item.costo).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      label: t('inventario.existencias.estado', 'Estado'),
      render: (item: Existencia) => {
        const status = getStockStatus(item);
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        );
      }
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BoxIcon className="h-5 w-5" />
            {t('inventario.existencias.title', 'Existencias')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Cargando existencias...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <BoxIcon className="h-5 w-5" />
            {t('inventario.existencias.title', 'Existencias por Almacén')}
          </CardTitle>
          <CardDescription>
            {t('inventario.existencias.description', 'Consulta el stock disponible agrupado por almacén')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {almacenesAgrupados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay existencias registradas
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {almacenesAgrupados.map((almacen) => (
              <AccordionItem 
                key={almacen.id} 
                value={almacen.id}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-primary" />
                      <div className="text-left">
                        <div className="font-semibold text-base">{almacen.nombre}</div>
                        <div className="text-sm text-muted-foreground">
                          {almacen.totalProductos} producto{almacen.totalProductos !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right hidden sm:block">
                        <div className="text-muted-foreground">Cantidad Total</div>
                        <div className="font-semibold">
                          {almacen.totalCantidad.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground">Valor Total</div>
                        <div className="font-semibold text-primary">
                          ${almacen.totalValor.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <DataTable
                    data={almacen.existencias}
                    columns={columns}
                    searchable
                    searchPlaceholder="Buscar producto..."
                    emptyMessage="No hay existencias en este almacén"
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}







