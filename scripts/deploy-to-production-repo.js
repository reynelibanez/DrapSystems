
#!/usr/bin/env node

/**
 * Script para subir el build de producción al repositorio separado
 * Repositorio: git@github.com:reynelibanez/Booking-Suite-Production.git
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const PRODUCTION_REMOTE = 'production';
const PRODUCTION_BRANCH = 'main';

function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return result;
  } catch (error) {
    if (!options.ignoreError) {
      console.error(`❌ Error ejecutando: ${command}`);
      console.error(error.message);
      process.exit(1);
    }
    return null;
  }
}

console.log('🚀 Iniciando deploy a repositorio de producción...\n');

// 1. Verificar que estamos en main
console.log('📍 Verificando branch actual...');
const currentBranch = exec('git branch --show-current', { silent: true }).trim();
if (currentBranch !== 'main') {
  console.log(`⚠️  Estás en branch '${currentBranch}', cambiando a 'main'...`);
  exec('git checkout main');
}

// 2. Asegurar que main está actualizado
console.log('\n📥 Actualizando branch main...');
exec('git pull origin main', { ignoreError: true });

// 3. Construir el proyecto
console.log('\n🏗️  Construyendo proyecto para producción...');
if (!existsSync('dist')) {
  exec('npm run build');
} else {
  console.log('⚠️  Carpeta dist/ ya existe. ¿Reconstruir? (Ctrl+C para cancelar)');
  exec('npm run build');
}

// 4. Verificar que dist existe
if (!existsSync('dist')) {
  console.error('❌ Error: La carpeta dist/ no fue creada');
  process.exit(1);
}

console.log('\n✅ Build completado exitosamente');

// 5. Limpiar secretos de archivos de documentación
console.log('\n🧹 Limpiando secretos de archivos de documentación...');
exec('node scripts/clean-secrets-for-production.js');

// 6. Crear commit temporal con dist
console.log('\n📦 Preparando archivos para producción...');
exec('git add -f dist/');

const hasChanges = exec('git status --porcelain', { silent: true }).trim();
if (hasChanges) {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const commitMessage = `build: deploy producción ${date} ${time}`;
  
  exec(`git commit -m "${commitMessage}"`, { ignoreError: true });
  console.log(`✅ Commit creado: ${commitMessage}`);
} else {
  console.log('ℹ️  No hay cambios nuevos en dist/');
}

// 7. Push al repositorio de producción
console.log('\n🚀 Subiendo a repositorio de producción...');
console.log(`   Remote: ${PRODUCTION_REMOTE}`);
console.log(`   Branch: ${PRODUCTION_BRANCH}`);

try {
  exec(`git push ${PRODUCTION_REMOTE} main:${PRODUCTION_BRANCH} --force`);
  console.log('\n✅ Deploy exitoso al repositorio de producción!');
} catch (error) {
  console.error('\n❌ Error al hacer push. Verifica tu configuración SSH.');
  console.error('   Asegúrate de tener acceso al repositorio:');
  console.error('   git@github.com:reynelibanez/Booking-Suite-Production.git');
  process.exit(1);
}

// 8. Limpiar: resetear el commit temporal
console.log('\n🧹 Limpiando commit temporal...');
exec('git reset HEAD~1');
exec('git restore --staged dist/');

console.log('\n✨ Proceso completado!');
console.log('\n📊 Resumen:');
console.log('   ✅ Build generado');
console.log('   ✅ Subido a repositorio de producción');
console.log('   ✅ Branch main limpio (sin dist/)');
console.log('\n🌐 Repositorio de producción:');
console.log('   https://github.com/reynelibanez/Booking-Suite-Production');

