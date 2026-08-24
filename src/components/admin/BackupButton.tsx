import { useState } from 'react';
import { Button } from '../ui/button';
import { Download, Loader2, Database, Archive, FolderArchive } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { baseUrl } from '../../lib/base-url';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

export function BackupButton() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadBackup = async (type: 'data' | 'full' | 'site') => {
    setIsDownloading(true);
    
    try {
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('No hay sesión activa');
        return;
      }

      // Determinar el endpoint según el tipo
      let endpoint = '';
      let backupType = '';
      
      switch (type) {
        case 'site':
          endpoint = `${baseUrl}/api/admin/download-backup`;
          backupType = 'completo del sitio';
          break;
        case 'full':
          endpoint = `${baseUrl}/api/admin/backup-full`;
          backupType = 'completo';
          break;
        case 'data':
        default:
          endpoint = `${baseUrl}/api/admin/backup`;
          backupType = 'de datos';
          break;
      }
      
      toast.info(`Generando backup ${backupType}...`);

      // Hacer la petición al endpoint de backup
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el backup');
      }

      // Obtener el blob del backup
      const blob = await response.blob();
      
      // Crear un enlace temporal para descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'booking-suite-backup.zip';
      
      if (type === 'data') {
        filename = 'booking-suite-backup.json';
      }
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Backup ${backupType} descargado exitosamente`);
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error(error instanceof Error ? error.message : 'Error al descargar el backup');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={isDownloading}
          title="Descargar backup del sistema"
          className="relative"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => handleDownloadBackup('data')}
          disabled={isDownloading}
          className="cursor-pointer"
        >
          <Database className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Backup de Datos</span>
            <span className="text-xs text-muted-foreground">
              Solo base de datos (JSON)
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleDownloadBackup('full')}
          disabled={isDownloading}
          className="cursor-pointer"
        >
          <Archive className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Backup Completo</span>
            <span className="text-xs text-muted-foreground">
              Base de datos + info (ZIP)
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleDownloadBackup('site')}
          disabled={isDownloading}
          className="cursor-pointer"
        >
          <FolderArchive className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">Backup del Sitio</span>
            <span className="text-xs text-muted-foreground">
              Todos los archivos del proyecto (ZIP)
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


