import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    // Importar dinámicamente para ver si hay error
    const { decryptBusinessId } = await import('../../../lib/encryption');
    
    const testId = 'MzEzYjBmZDctNjdkOC00ZGZkLWE4NzgtZjRhNTY5MmU2MjUx';
    const decrypted = decryptBusinessId(testId);
    
    return new Response(JSON.stringify({ 
      success: true,
      encrypted: testId,
      decrypted: decrypted,
      hasDecrypted: !!decrypted
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      name: error.name
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
