/**
 * Script para generar el enlace público de reservas
 * Uso: node scripts/generate-public-booking-link.js [businessId]
 */

import { encryptBusinessId } from '../src/lib/encryption.ts';

const businessId = process.argv[2];

if (!businessId) {
  console.log('❌ Error: Debes proporcionar un business ID');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/generate-public-booking-link.js [businessId]');
  console.log('');
  console.log('Ejemplo:');
  console.log('  node scripts/generate-public-booking-link.js 123e4567-e89b-12d3-a456-426614174000');
  process.exit(1);
}

console.log('🔐 Generando enlace público de reservas...');
console.log('');

try {
  const encryptedId = encryptBusinessId(businessId);
  
  console.log('✅ Enlace generado exitosamente:');
  console.log('');
  console.log('📋 Business ID:', businessId);
  console.log('🔐 ID Encriptado:', encryptedId);
  console.log('');
  console.log('🌐 Enlaces:');
  console.log('');
  console.log('Desarrollo:');
  console.log(`  http://localhost:4321/booking/${encryptedId}`);
  console.log('');
  console.log('Producción (ajusta el dominio):');
  console.log(`  https://tu-dominio.com/booking/${encryptedId}`);
  console.log('');
  
} catch (error) {
  console.error('❌ Error al generar el enlace:', error.message);
  process.exit(1);
}
