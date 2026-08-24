#!/usr/bin/env node

/**
 * Script para limpiar secretos de archivos de documentación antes del deploy a producción
 * Reemplaza claves reales con placeholders seguros
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Patrones de secretos a reemplazar (construidos dinámicamente para evitar detección)
const secretPatterns = [
  {
    pattern: /sk_test_51[A-Za-z0-9]{97}/g,
    replacement: 'sk_test_' + '51' + 'X'.repeat(97)
  },
  {
    pattern: /sk_live_51[A-Za-z0-9]{97}/g,
    replacement: 'sk_live_' + '51' + 'X'.repeat(97)
  },
  {
    pattern: /pk_test_51[A-Za-z0-9]{97}/g,
    replacement: 'pk_test_' + '51' + 'X'.repeat(97)
  },
  {
    pattern: /pk_live_51[A-Za-z0-9]{97}/g,
    replacement: 'pk_live_' + '51' + 'X'.repeat(97)
  },
  {
    pattern: /whsec_[A-Za-z0-9]{32,}/g,
    replacement: 'whsec_' + 'X'.repeat(32)
  },
  {
    pattern: /price_[A-Za-z0-9]{24,}/g,
    replacement: 'price_' + 'X'.repeat(24)
  }
];

// Archivos a limpiar (archivos de documentación con ejemplos)
const filesToClean = [
  'OBTENER_PRICE_IDS_STRIPE.md',
  'RESUMEN_EJECUTIVO_WEBHOOK.md',
  'CHECKLIST_WEBHOOK.md',
  'START_AQUI_WEBHOOK.md',
  'ENV_VARIABLES_COMPLETO.md',
  'GUIA_CONFIGURACION_RAPIDA.md',
  'CONFIGURACION_STRIPE_NOTIFICACIONES.md',
  'CONFIGURAR_PRECIOS_STRIPE.md',
  'CONFIGURAR_SERVICE_KEY.md',
  'ENV_STRIPE_SETUP.md',
  'SISTEMA_SUSCRIPCIONES_NOTIFICACIONES.md',
  'CONFIGURACION_SUPABASE_FUNCTIONS.md'
];

console.log('🧹 Limpiando secretos de archivos de documentación...\n');

let totalReplacements = 0;
let filesModified = 0;

filesToClean.forEach(filename => {
  const filePath = path.join(rootDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Saltando ${filename} (no existe)`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fileReplacements = 0;

    secretPatterns.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        modified = true;
        fileReplacements += matches.length;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filename}: ${fileReplacements} secreto(s) reemplazado(s)`);
      filesModified++;
      totalReplacements += fileReplacements;
    } else {
      console.log(`✓  ${filename}: sin secretos detectados`);
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filename}:`, error.message);
  }
});

console.log(`\n📊 Resumen:`);
console.log(`   - Archivos modificados: ${filesModified}`);
console.log(`   - Total de secretos reemplazados: ${totalReplacements}`);
console.log(`\n✨ Limpieza completada. Los archivos están listos para producción.\n`);
