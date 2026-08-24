




/**
 * Utilidades para encriptar y desencriptar IDs de empresas
 * Usa base64url para crear URLs amigables
 * Compatible con navegadores y Cloudflare Workers
 */

// Función helper para convertir string a base64url (compatible con navegadores y Workers)
function stringToBase64Url(str: string): string {
  try {
    console.log('[Encryption] Starting encoding for:', str?.substring(0, 8) + '...');
    console.log('[Encryption] Environment check:', {
      hasWindow: typeof window !== 'undefined',
      hasBtoa: typeof btoa !== 'undefined',
      hasBuffer: typeof Buffer !== 'undefined'
    });
    
    // En el navegador, usar btoa
    if (typeof window !== 'undefined' && typeof btoa !== 'undefined') {
      console.log('[Encryption] Using btoa (browser)');
      const base64 = btoa(unescape(encodeURIComponent(str)));
      const result = base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      console.log('[Encryption] Encoded successfully');
      return result;
    }
    
    // En Node.js/Workers, usar Buffer
    if (typeof Buffer !== 'undefined') {
      console.log('[Encryption] Using Buffer (Node.js/Workers)');
      const base64 = Buffer.from(str, 'utf-8').toString('base64');
      const result = base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      console.log('[Encryption] Encoded successfully');
      return result;
    }
    
    // Fallback: usar TextEncoder y conversión manual
    console.log('[Encryption] Using fallback method');
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
    
    // Verificar que btoa esté disponible para el fallback
    if (typeof btoa === 'undefined') {
      throw new Error('No encoding method available (btoa not found)');
    }
    
    const base64 = btoa(binString);
    const result = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    console.log('[Encryption] Encoded successfully with fallback');
    return result;
  } catch (error) {
    console.error('[Encryption] Error encoding to base64url:', error);
    console.error('[Encryption] Input was:', str);
    throw new Error('Failed to encode business ID');
  }
}

// Función helper para convertir base64url a string (compatible con navegadores y Workers)
function base64UrlToString(base64url: string): string {
  try {
    console.log('[Decryption] Starting decoding');
    
    // Restaurar el formato base64 estándar
    let base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Agregar padding si es necesario
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // En el navegador, usar atob
    if (typeof window !== 'undefined' && typeof atob !== 'undefined') {
      console.log('[Decryption] Using atob (browser)');
      const result = decodeURIComponent(escape(atob(base64)));
      console.log('[Decryption] Decoded successfully');
      return result;
    }
    
    // En Node.js/Workers, usar Buffer
    if (typeof Buffer !== 'undefined') {
      console.log('[Decryption] Using Buffer (Node.js/Workers)');
      const result = Buffer.from(base64, 'base64').toString('utf-8');
      console.log('[Decryption] Decoded successfully');
      return result;
    }
    
    // Fallback: usar conversión manual
    console.log('[Decryption] Using fallback method');
    
    // Verificar que atob esté disponible para el fallback
    if (typeof atob === 'undefined') {
      throw new Error('No decoding method available (atob not found)');
    }
    
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    const decoder = new TextDecoder();
    const result = decoder.decode(bytes);
    console.log('[Decryption] Decoded successfully with fallback');
    return result;
  } catch (error) {
    console.error('[Decryption] Error decoding from base64url:', error);
    console.error('[Decryption] Input was:', base64url);
    throw new Error('Failed to decode business ID');
  }
}

export function encryptBusinessId(businessId: string): string {
  try {
    console.log('[encryptBusinessId] Called with ID:', businessId?.substring(0, 8) + '...');
    
    if (!businessId) {
      console.error('[encryptBusinessId] Business ID is empty or null');
      throw new Error('Business ID is required');
    }
    
    const result = stringToBase64Url(businessId);
    console.log('[encryptBusinessId] Success');
    return result;
  } catch (error) {
    console.error('[encryptBusinessId] Error encrypting business ID:', error);
    throw error;
  }
}

export function decryptBusinessId(encryptedId: string): string | null {
  try {
    console.log('[decryptBusinessId] Called');
    
    if (!encryptedId) {
      console.warn('[decryptBusinessId] Encrypted ID is empty or null');
      return null;
    }
    
    const result = base64UrlToString(encryptedId);
    console.log('[decryptBusinessId] Success');
    return result;
  } catch (error) {
    console.error('[decryptBusinessId] Error decrypting business ID:', error);
    return null;
  }
}

/**
 * Genera un enlace de reserva público para un negocio
 * @param businessId - ID del negocio
 * @param baseUrl - URL base (opcional, por defecto usa el dominio de producción)
 * @returns Enlace completo de reserva
 */
export function generateBookingLink(businessId: string, baseUrl?: string): string {
  console.log('[generateBookingLink] Called with businessId:', businessId?.substring(0, 8) + '...');
  
  const encryptedId = encryptBusinessId(businessId);
  
  // Si se proporciona baseUrl, usarlo
  if (baseUrl) {
    const link = `${baseUrl}?business=${encryptedId}`;
    console.log('[generateBookingLink] Generated link with custom baseUrl');
    return link;
  }
  
  // Detectar el entorno
  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname;
    
    console.log('[generateBookingLink] Detected environment:', {
      origin: currentOrigin,
      path: currentPath
    });
    
    // Si estamos en Webflow o en producción, usar el dominio de producción con el path correcto
    if (currentOrigin.includes('webflow.io') || currentOrigin.includes('drapsystems.com')) {
      const link = `https://www.drapsystems.com/booking-suite?business=${encryptedId}`;
      console.log('[generateBookingLink] Generated production link');
      return link;
    }
    
    // Si estamos en desarrollo local, usar el origen actual
    const link = `${currentOrigin}?business=${encryptedId}`;
    console.log('[generateBookingLink] Generated local link');
    return link;
  }
  
  // Fallback al dominio de producción con path completo
  const link = `https://www.drapsystems.com/booking-suite?business=${encryptedId}`;
  console.log('[generateBookingLink] Generated fallback link');
  return link;
}

/**
 * Encripta el ID de una cita para usarlo en URLs
 * @param appointmentId - ID de la cita
 * @returns ID encriptado en formato base64url
 */
export function encryptAppointmentId(appointmentId: string): string {
  try {
    console.log('[encryptAppointmentId] Called with ID:', appointmentId?.substring(0, 8) + '...');
    
    if (!appointmentId) {
      console.error('[encryptAppointmentId] Appointment ID is empty or null');
      throw new Error('Appointment ID is required');
    }
    
    const result = stringToBase64Url(appointmentId);
    console.log('[encryptAppointmentId] Success');
    return result;
  } catch (error) {
    console.error('[encryptAppointmentId] Error encrypting appointment ID:', error);
    throw error;
  }
}

/**
 * Desencripta el ID de una cita desde formato base64url
 * @param encryptedId - ID encriptado
 * @returns ID de la cita original o null si falla
 */
export function decryptAppointmentId(encryptedId: string): string | null {
  try {
    console.log('[decryptAppointmentId] Called');
    
    if (!encryptedId) {
      console.warn('[decryptAppointmentId] Encrypted ID is empty or null');
      return null;
    }
    
    const result = base64UrlToString(encryptedId);
    console.log('[decryptAppointmentId] Success');
    return result;
  } catch (error) {
    console.error('[decryptAppointmentId] Error decrypting appointment ID:', error);
    return null;
  }
}

/**
 * Genera un enlace de confirmación de cita
 * @param appointmentId - ID de la cita
 * @param siteUrl - URL base del sitio (opcional)
 * @returns Enlace completo de confirmación
 */
export function generateAppointmentConfirmationLink(appointmentId: string, siteUrl?: string): string {
  console.log('[generateAppointmentConfirmationLink] Called with appointmentId:', appointmentId?.substring(0, 8) + '...');
  
  const encryptedId = encryptAppointmentId(appointmentId);
  
  // Determinar la URL base
  let baseUrl = siteUrl;
  
  if (!baseUrl) {
    // Detectar el entorno
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      
      // Si estamos en Webflow o en producción, usar el dominio de producción
      if (currentOrigin.includes('webflow.io') || currentOrigin.includes('drapsystems.com')) {
        baseUrl = 'https://www.drapsystems.com/booking-suite';
      } else {
        // Si estamos en desarrollo local, usar el origen actual
        baseUrl = currentOrigin;
      }
    } else {
      // Fallback al dominio de producción
      baseUrl = 'https://www.drapsystems.com/booking-suite';
    }
  }
  
  const link = `${baseUrl}/appointment-confirmed?id=${encryptedId}`;
  console.log('[generateAppointmentConfirmationLink] Generated link:', link.substring(0, 80) + '...');
  return link;
}














