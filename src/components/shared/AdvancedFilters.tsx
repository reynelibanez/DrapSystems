import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Filter, X, Search } from 'lucide-react';

export interface FilterOptions {
  searchTerm?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  serviceId?: string;
  staffId?: string;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  showServiceFilter?: boolean;
  showStaffFilter?: boolean;
  showStatusFilter?: boolean;
  showDateFilter?: boolean;
  services?: Array<{ id: string; name: string }>;
  staff?: Array<{ id: string; full_name: string }>;
}

export function AdvancedFilters({
  onFilterChange,
  showServiceFilter = false,
  showStaffFilter = false,
  showStatusFilter = true,
  showDateFilter = true,
  services = [],
  staff = [],
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== '');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
              {hasActiveFilters && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({Object.values(filters).filter(v => v).length} activos)
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Filtra y busca resultados
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar..."
                  className="pl-9"
                  value={filters.searchTerm || ''}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            {showStatusFilter && (
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="no_show">No asistió</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Service Filter */}
            {showServiceFilter && services.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="service">Servicio</Label>
                <Select
                  value={filters.serviceId || ''}
                  onValueChange={(value) => handleFilterChange('serviceId', value)}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Todos los servicios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Staff Filter */}
            {showStaffFilter && staff.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="staff">Personal</Label>
                <Select
                  value={filters.staffId || ''}
                  onValueChange={(value) => handleFilterChange('staffId', value)}
                >
                  <SelectTrigger id="staff">
                    <SelectValue placeholder="Todo el personal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || 'Sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date From */}
            {showDateFilter && (
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Desde</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
            )}

            {/* Date To */}
            {showDateFilter && (
              <div className="space-y-2">
                <Label htmlFor="dateTo">Hasta</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
