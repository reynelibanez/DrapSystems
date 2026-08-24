import type { APIRoute } from 'astro';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const GET: APIRoute = async () => {
  const swPath = join(process.cwd(), 'public', 'sw.js');
  
  const result = {
    exists: existsSync(swPath),
    path: swPath,
    content: null as string | null,
    size: 0,
    error: null as string | null
  };

  try {
    if (result.exists) {
      const content = readFileSync(swPath, 'utf-8');
      result.content = content.substring(0, 500); // Primeros 500 caracteres
      result.size = content.length;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
