import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('=== ENDPOINT SIMPLE - INICIO ===');
    
    // Paso 1: Parsear body
    const body = await request.json();
    console.log('Body recibido:', body);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Endpoint simple funcionando',
      receivedData: body
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en endpoint simple:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
