import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, locals } = context;
  
  // Manejo especial para el Service Worker
  if (url.pathname === '/sw.js' || url.pathname === '/booking-suite/sw.js') {
    console.log('[Middleware] Service Worker requested:', url.pathname);
    
    // Continuar con la respuesta normal pero agregar headers especiales
    const response = await next();
    
    // Agregar headers necesarios para Service Workers
    response.headers.set('Content-Type', 'application/javascript; charset=utf-8');
    response.headers.set('Service-Worker-Allowed', '/');
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;
  }

  if (import.meta.env.DEV && url.pathname === '/-wf/ready') {
    const resHeaders = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    return new Response(JSON.stringify({ready: true}), {
      headers: resHeaders,
    });
  }

  return next();
});

