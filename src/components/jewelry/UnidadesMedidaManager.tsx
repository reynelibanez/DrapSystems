import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface UnidadMedida {
  id: string;
  nombre: string;
  abreviatura: string;
  tipo: string;
  activo: boolean;
}

interface UnidadesMedidaManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidades: UnidadMedida[];
  onUnidadesChange: () => void;
  businessId: string;
}

const TIPOS_UNIDAD = [
  { value: 'peso', label: 'Peso' },
  { value: 'longitud', label: 'Longitud' },
  { value: 'volumen', label: 'Volumen' },
  { value: 'cantidad', label: 'Cantidad' },
  { value: 'otro', label: 'Otro' },
];

export function UnidadesMedidaManager({
  open,
  onOpenChange,
  unidades,
  onUnidadesChange,
  businessId,
}: UnidadesMedidaManagerProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nombre: '',
    abreviatura: '',
    tipo: 'peso',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim() || !formData.abreviatura.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);

    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { error } = await supabase
        .from('jwl_unidades_medida')
        .insert({
          business_id: businessId,
          nombre: formData.nombre.trim(),
          abreviatura: formData.abreviatura.trim(),
          tipo: formData.tipo,
          activo: true,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Ya existe una unidad con ese nombre o abreviatura');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Unidad de medida agregada correctamente');
      setFormData({ nombre: '', abreviatura: '', tipo: 'peso' });
      onUnidadesChange();
    } catch (error) {
      console.error('Error al agregar unidad:', error);
      toast.error('Error al agregar la unidad de medida');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const { error } = await supabase
        .from('jwl_unidades_medida')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Unidad de medida eliminada');
      onUnidadesChange();
    } catch (error) {
      console.error('Error al eliminar unidad:', error);
      toast.error('Error al eliminar la unidad de medida');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Unidades de Medida</DialogTitle>
          <DialogDescription>
            Agrega o elimina unidades de medida personalizadas para tu negocio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="ej: Gramos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abreviatura">Abreviatura</Label>
              <Input
                id="abreviatura"
                value={formData.abreviatura}
                onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })}
                placeholder="ej: g"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_UNIDAD.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Unidad
          </Button>
        </form>

        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Unidades Existentes</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unidades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay unidades de medida. Agrega la primera.
              </p>
            ) : (
              unidades.map((unidad) => (
                <div
                  key={unidad.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{unidad.nombre}</span>
                      <span className="text-sm text-muted-foreground">
                        ({unidad.abreviatura})
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {unidad.tipo}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(unidad.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
