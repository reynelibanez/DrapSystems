import type { APIRoute } from 'astro';
import { readFileSync } from 'fs';
import { join } from 'path';

export const GET: APIRoute = async () => {
  try {
    // Leer el archivo sw.js desde public/
    const swPath = join(process.cwd(), 'public', 'sw.js');
    const swContent = readFileSync(swPath, 'utf-8');

    return new Response(swContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[SW Route] Error serving service worker:', error);
    
    return new Response('Service Worker not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
};
