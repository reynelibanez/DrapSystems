import type { APIRoute } from 'astro';
import { generateICSContent } from '../../../lib/email-service';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    
    // Obtener parámetros de la URL
    const title = url.searchParams.get('title');
    const description = url.searchParams.get('description');
    const location = url.searchParams.get('location') || '';
    const startDate = url.searchParams.get('start');
    const endDate = url.searchParams.get('end');

    // Validar parámetros requeridos
    if (!title || !startDate || !endDate) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Convertir fechas
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validar fechas
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return new Response('Invalid date format', { status: 400 });
    }

    // Generar contenido ICS
    const icsContent = generateICSContent({
      title,
      description: description || '',
      location,
      startDate: start,
      endDate: end
    });

    // Retornar el archivo ICS
    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cita.ics"',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error generating ICS file:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
