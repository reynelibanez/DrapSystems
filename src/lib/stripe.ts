import Stripe from 'stripe';

// Inicializar Stripe en el servidor
export function getStripeInstance(apiKey: string): Stripe {
  return new Stripe(apiKey, {
    apiVersion: '2024-12-18.acacia',
  });
}

// Función para obtener variables de entorno (compatible con Cloudflare Workers y Node)
function getEnvVar(key: string, runtime?: any): string {
  // Primero intentar desde runtime (Cloudflare Workers en producción)
  if (runtime?.env?.[key]) {
    return runtime.env[key];
  }
  // Luego desde import.meta.env (Astro)
  if (import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Finalmente desde process.env (Node.js)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  return '';
}

// Precios de los planes - función para obtenerlos dinámicamente
export function getStripePriceIds(runtime?: any) {
  return {
    // Precios mensuales
    professional: getEnvVar('STRIPE_PRICE_PROFESSIONAL', runtime),
    professionalMonth: getEnvVar('STRIPE_PRICE_PROFESSIONAL_MONTH', runtime) || getEnvVar('STRIPE_PRICE_PROFESSIONAL', runtime),
    business: getEnvVar('STRIPE_PRICE_BUSINESS', runtime),
    businessMonth: getEnvVar('STRIPE_PRICE_BUSINESS_MONTH', runtime) || getEnvVar('STRIPE_PRICE_BUSINESS', runtime),
    enterprise: getEnvVar('STRIPE_PRICE_ENTERPRISE', runtime),
    enterpriseMonth: getEnvVar('STRIPE_PRICE_ENTERPRISE_MONTH', runtime) || getEnvVar('STRIPE_PRICE_ENTERPRISE', runtime),
    
    // Precios anuales (con 10% de descuento)
    professionalYear: getEnvVar('STRIPE_PRICE_PROFESSIONAL_YEAR', runtime),
    businessYear: getEnvVar('STRIPE_PRICE_BUSINESS_YEAR', runtime),
    enterpriseYear: getEnvVar('STRIPE_PRICE_ENTERPRISE_YEAR', runtime),
  };
}

// Mantener compatibilidad con código existente
export const STRIPE_PRICE_IDS = getStripePriceIds();

// Crear sesión de checkout
export async function createCheckoutSession(
  stripe: Stripe,
  priceId: string,
  customerId: string | undefined,
  businessId: string,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string
) {
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      businessId,
    },
  };

  // Validar que el customerId sea un ID válido de Stripe (debe comenzar con 'cus_')
  const isValidCustomerId = customerId && typeof customerId === 'string' && customerId.startsWith('cus_');

  // Si hay un customerId VÁLIDO, usarlo y permitir actualización de suscripción
  if (isValidCustomerId) {
    sessionConfig.customer = customerId;
    // Permitir que el usuario actualice su suscripción existente
    sessionConfig.customer_update = {
      address: 'auto',
    };
    console.log('[Stripe] Usando customer existente:', customerId);
    console.log('[Stripe] Permitiendo actualización de suscripción');
  } 
  // Si el customerId no es válido pero hay email, pre-llenar el email
  else if (customerEmail) {
    if (customerId && !isValidCustomerId) {
      console.warn('[Stripe] Customer ID inválido detectado:', customerId, '- Creando nuevo customer');
    }
    sessionConfig.customer_email = customerEmail;
    console.log('[Stripe] Creando nuevo customer con email:', customerEmail);
  }

  console.log('[Stripe] Configuración de sesión:', {
    mode: sessionConfig.mode,
    priceId,
    hasCustomerId: !!isValidCustomerId,
    hasEmail: !!customerEmail,
    businessId,
  });

  const session = await stripe.checkout.sessions.create(sessionConfig);

  console.log('[Stripe] Sesión creada:', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
  });

  return session;
}

// Crear portal de cliente para gestionar suscripción
export async function createCustomerPortalSession(
  stripe: Stripe,
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Crear o actualizar cliente en Stripe
export async function createOrUpdateStripeCustomer(
  stripe: Stripe,
  email: string,
  name: string,
  customerId?: string
) {
  if (customerId) {
    // Actualizar cliente existente
    const customer = await stripe.customers.update(customerId, {
      email,
      name,
    });
    return customer;
  } else {
    // Crear nuevo cliente
    const customer = await stripe.customers.create({
      email,
      name,
    });
    return customer;
  }
}

// Cancelar suscripción
export async function cancelSubscription(
  stripe: Stripe,
  subscriptionId: string
) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

// Obtener información de suscripción
export async function getSubscription(
  stripe: Stripe,
  subscriptionId: string
) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}





