#!/usr/bin/env node

/**
 * Script de Verificación del Sistema de Recuperación de Contraseña
 * Verifica que todos los componentes estén en su lugar
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔍 Verificando Sistema de Recuperación de Contraseña...\n');

let allChecksPass = true;

// Función para verificar si un archivo existe
function checkFile(filePath, description) {
  const fullPath = path.join(rootDir, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    console.log(`✅ ${description}`);
  } else {
    console.log(`❌ ${description} - NO ENCONTRADO`);
    allChecksPass = false;
  }
  
  return exists;
}

// Función para verificar contenido de archivo
function checkFileContent(filePath, searchString, description) {
  const fullPath = path.join(rootDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${description} - ARCHIVO NO ENCONTRADO`);
    allChecksPass = false;
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const found = content.includes(searchString);
  
  if (found) {
    console.log(`✅ ${description}`);
  } else {
    console.log(`❌ ${description} - CONTENIDO NO ENCONTRADO`);
    allChecksPass = false;
  }
  
  return found;
}

console.log('📁 Verificando Componentes React...');
checkFile('src/components/ForgotPasswordForm.tsx', 'ForgotPasswordForm.tsx');
checkFile('src/components/ResetPasswordForm.tsx', 'ResetPasswordForm.tsx');

console.log('\n📄 Verificando Páginas Astro...');
checkFile('src/pages/forgot-password.astro', 'forgot-password.astro');
checkFile('src/pages/reset-password.astro', 'reset-password.astro');

console.log('\n🔌 Verificando API Endpoints...');
checkFile('src/pages/api/auth/request-password-reset.ts', 'request-password-reset.ts');
checkFile('src/pages/api/auth/validate-reset-token.ts', 'validate-reset-token.ts');
checkFile('src/pages/api/auth/reset-password.ts', 'reset-password.ts');

console.log('\n📚 Verificando Documentación...');
checkFile('ADD_RESET_TOKEN_TO_PROFILES.sql', 'ADD_RESET_TOKEN_TO_PROFILES.sql');
checkFile('SISTEMA_RECUPERACION_PASSWORD.md', 'SISTEMA_RECUPERACION_PASSWORD.md');
checkFile('RESUMEN_PASSWORD_RESET.md', 'RESUMEN_PASSWORD_RESET.md');

console.log('\n🌐 Verificando URL de Producción...');
checkFileContent(
  'src/pages/api/auth/request-password-reset.ts',
  'https://www.drapsystems.com/booking-suite',
  'URL de producción en request-password-reset.ts'
);

console.log('\n🔐 Verificando Seguridad...');
checkFileContent(
  'src/pages/api/auth/request-password-reset.ts',
  'crypto.randomBytes(32)',
  'Generación de tokens seguros'
);
checkFileContent(
  'src/pages/api/auth/reset-password.ts',
  'bcrypt.hash',
  'Hash de contraseñas con bcrypt'
);

console.log('\n📧 Verificando Configuración de Email...');
checkFileContent(
  'src/pages/api/auth/request-password-reset.ts',
  'resend.emails.send',
  'Envío de emails con Resend'
);
checkFileContent(
  'src/pages/api/auth/request-password-reset.ts',
  'noreply@drapsystems.com',
  'Email remitente configurado'
);

console.log('\n🌍 Verificando Traducciones...');
checkFileContent(
  'src/lib/i18n.ts',
  'forgotPassword',
  'Traducciones de recuperación de contraseña'
);
checkFileContent(
  'src/lib/i18n.ts',
  'resetPassword',
  'Traducciones de reset de contraseña'
);

console.log('\n🔗 Verificando Integración con LoginForm...');
checkFileContent(
  'src/components/LoginForm.tsx',
  '¿Olvidaste tu contraseña?',
  'Enlace de recuperación en LoginForm'
);

console.log('\n📊 Verificando Variables de Entorno...');
const envExample = fs.existsSync(path.join(rootDir, '.env.example'));
if (envExample) {
  const envContent = fs.readFileSync(path.join(rootDir, '.env.example'), 'utf-8');
  
  if (envContent.includes('RESEND_API_KEY')) {
    console.log('✅ RESEND_API_KEY en .env.example');
  } else {
    console.log('⚠️  RESEND_API_KEY no está en .env.example (puede estar en otro lugar)');
  }
}

// Verificar .env local
const envLocal = fs.existsSync(path.join(rootDir, '.env'));
if (envLocal) {
  const envContent = fs.readFileSync(path.join(rootDir, '.env'), 'utf-8');
  
  if (envContent.includes('RESEND_API_KEY=re_')) {
    console.log('✅ RESEND_API_KEY configurado en .env');
  } else {
    console.log('⚠️  RESEND_API_KEY no configurado en .env');
  }
} else {
  console.log('⚠️  Archivo .env no encontrado');
}

console.log('\n' + '='.repeat(60));

if (allChecksPass) {
  console.log('✅ TODAS LAS VERIFICACIONES PASARON');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Ejecutar SQL: ADD_RESET_TOKEN_TO_PROFILES.sql en Supabase');
  console.log('2. Verificar RESEND_API_KEY en variables de entorno');
  console.log('3. Verificar dominio drapsystems.com en Resend');
  console.log('4. Probar flujo completo en desarrollo');
  console.log('5. Desplegar a producción');
  process.exit(0);
} else {
  console.log('❌ ALGUNAS VERIFICACIONES FALLARON');
  console.log('\n⚠️  Revisa los errores arriba y corrige los archivos faltantes');
  process.exit(1);
}
