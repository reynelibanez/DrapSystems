import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { showError, showLoading, dismissToast, showSuccess } from '../../lib/toast-notifications';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  bucket?: string;
  folder?: string;
  fallbackText?: string;
  variant?: 'avatar' | 'product';
}

export function ImageUpload({ 
  currentImageUrl, 
  onImageUploaded, 
  bucket = 'avatars',
  folder = 'profiles',
  fallbackText = 'U',
  variant = 'avatar'
}: ImageUploadProps) {
  const { t } = useTranslation();
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar el estado cuando cambie el prop currentImageUrl
  useEffect(() => {
    console.log('ImageUpload useEffect - currentImageUrl recibido:', currentImageUrl);
    console.log('ImageUpload - estableciendo imageUrl a:', currentImageUrl || null);
    setImageUrl(currentImageUrl || null);
  }, [currentImageUrl]);

  const uploadImage = async (file: File) => {
    const toastId = showLoading(t('imageUpload.uploading'));
    setUploading(true);

    try {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(t('imageUpload.maxSizeError'));
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        throw new Error(t('imageUpload.invalidTypeError'));
      }

      // Generar nombre único
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setImageUrl(publicUrl);
      onImageUploaded(publicUrl);
      
      dismissToast(toastId);
      showSuccess(t('imageUpload.uploadSuccess'));
    } catch (error: any) {
      dismissToast(toastId);
      console.error('Error uploading image:', error);
      showError(error.message || t('imageUpload.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleRemoveImage = async () => {
    if (!imageUrl) return;

    try {
      // Extraer el path del URL
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === bucket);
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        // Eliminar de storage
        await supabase.storage
          .from(bucket)
          .remove([filePath]);
      }

      setImageUrl(null);
      onImageUploaded('');
      showSuccess(t('imageUpload.removeSuccess'));
    } catch (error) {
      console.error('Error removing image:', error);
      showError(t('imageUpload.removeError'));
    }
  };

  if (variant === 'product') {
    return (
      <div className="flex flex-col gap-4">
        <div className="relative w-full aspect-square max-w-xs mx-auto rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-muted/10">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Product" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Sin imagen</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
          </Button>

          {imageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              disabled={uploading}
            >
              <X className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG, WebP o GIF (máx. 5MB)
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="w-32 h-32">
        <AvatarImage src={imageUrl || undefined} alt="Avatar" />
        <AvatarFallback className="text-2xl">{fallbackText}</AvatarFallback>
      </Avatar>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {t('imageUpload.uploadButton')}
        </Button>

        {imageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            disabled={uploading}
          >
            <X className="w-4 h-4 mr-2" />
            {t('imageUpload.removeButton')}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        {t('imageUpload.formats')}
      </p>
    </div>
  );
}







