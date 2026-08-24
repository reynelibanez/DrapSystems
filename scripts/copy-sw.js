/**
 * Script para copiar el service worker al directorio de salida
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist', 'booking-suite');
const swSource = path.join(rootDir, 'public', 'sw.js');
const swDest = path.join(distDir, 'sw.js');

try {
  // Verificar que el directorio de destino existe
  if (!fs.existsSync(distDir)) {
    console.log('⚠️  Directorio dist no encontrado, creándolo...');
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Verificar que el archivo fuente existe
  if (!fs.existsSync(swSource)) {
    console.log('⚠️  Service worker no encontrado en public/sw.js');
    process.exit(0);
  }

  // Copiar el service worker
  fs.copyFileSync(swSource, swDest);
  console.log('✅ Service worker copiado correctamente');
} catch (error) {
  console.error('❌ Error copiando service worker:', error);
  process.exit(1);
}
