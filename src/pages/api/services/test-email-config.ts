import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const config = {
    hasSupabaseUrl: !!(locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL),
    hasServiceKey: !!(locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY),
    hasResendKey: !!(locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY),
    supabaseUrl: (locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || '').substring(0, 30) + '...',
    serviceKeyPrefix: (locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '').substring(0, 20) + '...',
    resendKeyPrefix: (locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY || '').substring(0, 8) + '...',
  };

  return new Response(JSON.stringify(config, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
