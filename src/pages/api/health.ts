import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const env = {
    supabaseUrl: !!(locals?.runtime?.env?.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL),
    supabaseAnonKey: !!(locals?.runtime?.env?.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceKey: !!(locals?.runtime?.env?.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY),
    resendApiKey: !!(locals?.runtime?.env?.RESEND_API_KEY || import.meta.env.RESEND_API_KEY),
    stripeSecretKey: !!(locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY),
  };

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env,
      endpoints: {
        notifications: '/api/notifications/send-email',
        admin: {
          createUser: '/api/admin/create-user',
          updateUser: '/api/admin/update-user',
          backup: '/api/admin/backup-full'
        },
        public: {
          appointments: '/api/public/appointments/create',
          availableSlots: '/api/public/appointments/available-slots',
          business: '/api/public/business/[businessId]',
          services: '/api/public/services/[businessId]'
        },
        stripe: '/api/stripe/webhook'
      }
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};
