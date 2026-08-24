import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('=== TEST SIMPLE ENDPOINT ===');
    
    const body = await request.json();
    console.log('Body recibido:', body);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Test endpoint funcionando',
      receivedData: body
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error en test simple:', error);
    return new Response(JSON.stringify({ 
      error: 'Error en test simple',
      message: error?.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    status: 'ok',
    message: 'Test endpoint activo'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
