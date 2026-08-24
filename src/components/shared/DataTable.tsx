import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  mobileHidden?: boolean; // Nueva propiedad para ocultar columnas en móvil
  className?: string; // Nueva propiedad para clases CSS personalizadas
}

interface Action<T> {
  label: string | ((item: T) => string);
  icon?: React.ComponentType<{ className?: string }> | ((item: T) => React.ComponentType<{ className?: string }>);
  onClick: (item: T) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  condition?: (item: T) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  loading = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  // Función helper para generar keys únicas
  const getItemKey = (item: T, index: number): string => {
    if (item.id) return String(item.id);
    if (item.slug) return String(item.slug);
    if (item.email) return String(item.email);
    return `item-${index}-${JSON.stringify(item).substring(0, 50)}`;
  };

  // Filtrar datos
  const filteredData = searchable
    ? data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Ordenar datos
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const modifier = sortDirection === 'asc' ? 1 : -1;
        
        if (aVal < bVal) return -1 * modifier;
        if (aVal > bVal) return 1 * modifier;
        return 0;
      })
    : filteredData;

  // Paginar datos
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getVisibleActions = (item: T) => {
    if (!actions) return [];
    return actions.filter(action => !action.condition || action.condition(item));
  };

  const getActionLabel = (action: Action<T>, item: T): string => {
    return typeof action.label === 'function' ? action.label(item) : action.label;
  };

  const getActionIcon = (action: Action<T>, item: T) => {
    if (!action.icon) return null;
    const Icon = typeof action.icon === 'function' ? action.icon(item) : action.icon;
    return <Icon className="h-4 w-4 mr-2" />;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-10 sm:h-11"
            />
          </div>
        </div>
      )}

      {/* Vista de tabla para desktop, cards para móvil */}
      <div className="hidden sm:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, colIndex) => (
                  <TableHead
                    key={`header-${column.key}-${colIndex}`}
                    className={`${column.sortable ? 'cursor-pointer select-none' : ''} ${column.className || ''}`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && sortColumn === column.key && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions && actions.length > 0 && (
                  <TableHead className="w-[100px]">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (actions && actions.length > 0 ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow
                    key={getItemKey(item, index)}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  >
                    {columns.map((column, colIndex) => (
                      <TableCell 
                        key={`${getItemKey(item, index)}-${column.key}-${colIndex}`}
                        className={column.className || ''}
                        onClick={() => onRowClick?.(item)}
                      >
                        {column.render ? column.render(item) : String(item[column.key] ?? '')}
                      </TableCell>
                    ))}
                    {actions && actions.length > 0 && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {getVisibleActions(item).map((action, actionIndex) => (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={() => action.onClick(item)}
                                className={action.variant === 'destructive' ? 'text-destructive' : ''}
                              >
                                {getActionIcon(action, item)}
                                {getActionLabel(action, item)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Vista de cards para móvil */}
      <div className="sm:hidden space-y-3">
        {paginatedData.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {emptyMessage}
          </Card>
        ) : (
          paginatedData.map((item, index) => (
            <Card
              key={getItemKey(item, index)}
              className="p-4"
            >
              <div className="space-y-2">
                {columns
                  .filter(col => !col.mobileHidden)
                  .map((column, colIndex) => (
                    <div key={`${getItemKey(item, index)}-${column.key}-${colIndex}`} className="flex justify-between items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground min-w-[80px]">
                        {column.label}:
                      </span>
                      <span className="text-sm text-right flex-1">
                        {column.render ? column.render(item) : String(item[column.key] ?? '')}
                      </span>
                    </div>
                  ))}
                
                {actions && actions.length > 0 && getVisibleActions(item).length > 0 && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    {getVisibleActions(item).map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={() => action.onClick(item)}
                        className="flex-1"
                      >
                        {getActionIcon(action, item)}
                        {getActionLabel(action, item)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <p className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedData.length)} de{' '}
            {sortedData.length}
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 p-0 sm:w-auto sm:px-3"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Anterior</span>
            </Button>
            <span className="text-xs sm:text-sm px-2">
              {currentPage}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-9 w-9 p-0 sm:w-auto sm:px-3"
            >
              <span className="hidden sm:inline mr-1">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
















