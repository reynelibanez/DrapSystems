/**
 * Utilidades para manejo de cámara en dispositivos móviles y desktop
 */

export interface CameraConstraints {
  video: {
    facingMode?: 'user' | 'environment' | { exact: 'environment' | 'user' };
    width?: { ideal: number; max?: number };
    height?: { ideal: number; max?: number };
  };
  audio?: boolean;
}

export interface CameraError {
  type: 'permission' | 'not_found' | 'not_supported' | 'unknown';
  message: string;
  originalError?: Error;
}

/**
 * Detecta si el dispositivo es móvil
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Verifica si el navegador soporta getUserMedia
 */
export function isCameraSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
}

/**
 * Obtiene las restricciones de cámara según el dispositivo
 */
export function getCameraConstraints(preferBackCamera: boolean = true): CameraConstraints {
  const isMobile = isMobileDevice();
  
  const constraints: CameraConstraints = {
    video: {
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
    },
    audio: false,
  };

  // En móviles, intentar usar la cámara trasera por defecto
  if (isMobile && preferBackCamera) {
    constraints.video.facingMode = { exact: 'environment' };
  } else if (isMobile) {
    constraints.video.facingMode = 'user';
  }

  return constraints;
}

/**
 * Intenta obtener acceso a la cámara con fallbacks
 */
export async function requestCameraAccess(
  preferBackCamera: boolean = true
): Promise<MediaStream> {
  // Verificar soporte
  if (!isCameraSupported()) {
    throw {
      type: 'not_supported',
      message: 'Tu navegador no soporta acceso a la cámara. Por favor, usa un navegador moderno como Chrome, Firefox o Safari.',
    } as CameraError;
  }

  const isMobile = isMobileDevice();
  let stream: MediaStream | null = null;

  try {
    // Intento 1: Con facingMode específico (móviles)
    if (isMobile) {
      try {
        const constraints = getCameraConstraints(preferBackCamera);
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Cámara obtenida con facingMode específico');
        return stream;
      } catch (err: any) {
        console.warn('⚠️ No se pudo usar facingMode específico, intentando alternativa...', err.name);
        
        // Intento 2: Con facingMode sin 'exact' (más flexible)
        try {
          const fallbackConstraints: CameraConstraints = {
            video: {
              facingMode: preferBackCamera ? 'environment' : 'user',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          };
          stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          console.log('✅ Cámara obtenida con facingMode flexible');
          return stream;
        } catch (err2: any) {
          console.warn('⚠️ No se pudo usar facingMode flexible, intentando básico...', err2.name);
        }
      }
    }

    // Intento 3: Configuración básica (desktop o fallback móvil)
    try {
      const basicConstraints: CameraConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      console.log('✅ Cámara obtenida con configuración básica');
      return stream;
    } catch (err3: any) {
      console.warn('⚠️ No se pudo usar configuración básica, intentando mínima...', err3.name);
    }

    // Intento 4: Configuración mínima (última opción)
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    console.log('✅ Cámara obtenida con configuración mínima');
    return stream;

  } catch (error: any) {
    console.error('❌ Error al acceder a la cámara:', error);

    // Clasificar el error
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      throw {
        type: 'permission',
        message: 'Permiso denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.',
        originalError: error,
      } as CameraError;
    }

    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      throw {
        type: 'not_found',
        message: 'No se encontró ninguna cámara en tu dispositivo.',
        originalError: error,
      } as CameraError;
    }

    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      throw {
        type: 'unknown',
        message: 'La cámara está siendo usada por otra aplicación. Por favor, cierra otras apps que puedan estar usando la cámara.',
        originalError: error,
      } as CameraError;
    }

    if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      throw {
        type: 'unknown',
        message: 'La cámara no cumple con los requisitos necesarios.',
        originalError: error,
      } as CameraError;
    }

    throw {
      type: 'unknown',
      message: `Error desconocido al acceder a la cámara: ${error.message || 'Error desconocido'}`,
      originalError: error,
    } as CameraError;
  }
}

/**
 * Detiene un stream de cámara de forma segura
 */
export function stopCameraStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log('🛑 Track de cámara detenido:', track.kind);
    });
  }
}

/**
 * Captura una foto del video stream
 */
export function capturePhotoFromVideo(
  videoElement: HTMLVideoElement,
  quality: number = 0.9
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }

      ctx.drawImage(videoElement, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve({ blob, dataUrl });
          } else {
            reject(new Error('No se pudo crear el blob de la imagen'));
          }
        },
        'image/jpeg',
        quality
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Obtiene la lista de cámaras disponibles
 */
export async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error al enumerar dispositivos:', error);
    return [];
  }
}

/**
 * Cambia entre cámara frontal y trasera (móviles)
 */
export async function switchCamera(
  currentStream: MediaStream,
  useBackCamera: boolean
): Promise<MediaStream> {
  // Detener el stream actual
  stopCameraStream(currentStream);
  
  // Obtener nuevo stream con la cámara opuesta
  return requestCameraAccess(useBackCamera);
}
