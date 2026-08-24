// En desarrollo: BASE_URL será '' o '/'
// En producción de Webflow: BASE_URL será '/booking-suite'
// Siempre removemos el trailing slash para consistencia

// Para uso en el servidor (SSR)
export const baseUrl = (import.meta.env.BASE_URL || '').replace(/\/$/, '');

/**
 * Obtiene la URL pública del sitio (CON el base path si existe)
 * Útil para generar enlaces absolutos en emails y notificaciones
 * 
 * Prioridad:
 * 1. PUBLIC_SITE_URL (variable de entorno) - RECOMENDADO
 * 2. request.url (del request HTTP) + baseUrl
 * 3. window.location (solo en cliente) + baseUrl
 * 4. Fallback: https://www.drapsystems.com/booking-suite
 * 
 * @param request - Request HTTP opcional (para uso en servidor)
 * @returns URL pública del sitio CON base path (ej: https://www.drapsystems.com/booking-suite)
 */
export function getPublicSiteUrl(request?: Request): string {
  // 1. Primero intenta usar la variable de entorno
  const envUrl = import.meta.env.PUBLIC_SITE_URL;
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/$/, ''); // Remover trailing slash
    // Si ya incluye el baseUrl, devolverlo tal cual
    if (baseUrl && cleanUrl.endsWith(baseUrl)) {
      console.log('[getPublicSiteUrl] Using PUBLIC_SITE_URL (already includes baseUrl):', cleanUrl);
      return cleanUrl;
    }
    // Si no incluye el baseUrl, agregarlo
    const fullUrl = baseUrl ? `${cleanUrl}${baseUrl}` : cleanUrl;
    console.log('[getPublicSiteUrl] Using PUBLIC_SITE_URL + baseUrl:', fullUrl);
    return fullUrl;
  }

  // 2. Si hay un request, usar su URL
  if (request) {
    try {
      const url = new URL(request.url);
      const siteUrl = `${url.protocol}//${url.host}${baseUrl}`;
      console.log('[getPublicSiteUrl] Using request URL + baseUrl:', siteUrl);
      return siteUrl;
    } catch (error) {
      console.error('[getPublicSiteUrl] Error parsing request URL:', error);
    }
  }

  // 3. Si estamos en el cliente, usar window.location
  if (typeof window !== 'undefined') {
    const siteUrl = `${window.location.protocol}//${window.location.host}${baseUrl}`;
    console.log('[getPublicSiteUrl] Using window.location + baseUrl:', siteUrl);
    return siteUrl;
  }

  // 4. Fallback final (incluye /booking-suite para producción)
  const fallbackUrl = baseUrl ? `https://www.drapsystems.com${baseUrl}` : 'https://www.drapsystems.com';
  console.log('[getPublicSiteUrl] Using fallback URL:', fallbackUrl);
  return fallbackUrl;
}

// Para uso en el cliente, detectar automáticamente el base path
export function getClientBaseUrl(): string {
  if (typeof window === 'undefined') {
    return baseUrl;
  }
  
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  console.log('[getClientBaseUrl] hostname:', hostname);
  console.log('[getClientBaseUrl] pathname:', pathname);
  console.log('[getClientBaseUrl] baseUrl from env:', baseUrl);
  
  // Si estamos en producción (drapsystems.com), usar la URL completa
  if (hostname.includes('drapsystems.com')) {
    const fullUrl = 'https://www.drapsystems.com/booking-suite';
    console.log('[getClientBaseUrl] Detected production, using:', fullUrl);
    return fullUrl;
  }
  
  // Si el pathname incluye booking-suite, usarlo
  if (pathname.includes('/booking-suite')) {
    const result = window.location.origin + '/booking-suite';
    console.log('[getClientBaseUrl] Detected booking-suite in path, using:', result);
    return result;
  }
  
  // Si hay un base path configurado en import.meta.env, usarlo
  if (baseUrl && baseUrl !== '/') {
    console.log('[getClientBaseUrl] Using baseUrl from env:', baseUrl);
    return baseUrl;
  }
  
  // En desarrollo local, no usar base path
  console.log('[getClientBaseUrl] Using empty base path (development)');
  return '';
}






