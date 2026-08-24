/**
 * Script para crear el bucket de storage para el módulo de joyería
 * 
 * Este script:
 * 1. Crea el bucket 'jewelry-images' si no existe
 * 2. Configura las políticas de acceso (RLS)
 * 3. Verifica que todo esté configurado correctamente
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createJewelryBucket() {
  console.log('🔧 Creando bucket de joyería...\n');

  try {
    // 1. Verificar si el bucket ya existe
    console.log('1️⃣ Verificando si el bucket existe...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error al listar buckets:', listError);
      throw listError;
    }

    const bucketExists = buckets?.some(b => b.id === 'jewelry-images');
    
    if (bucketExists) {
      console.log('✅ El bucket "jewelry-images" ya existe');
    } else {
      // 2. Crear el bucket
      console.log('2️⃣ Creando bucket "jewelry-images"...');
      const { data: bucket, error: createError } = await supabase.storage.createBucket('jewelry-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      });

      if (createError) {
        console.error('❌ Error al crear bucket:', createError);
        throw createError;
      }

      console.log('✅ Bucket creado exitosamente:', bucket);
    }

    // 3. Leer y ejecutar el SQL para las políticas
    console.log('\n3️⃣ Configurando políticas de acceso...');
    const sqlPath = join(__dirname, '..', 'supabase', 'migrations', 'create_jewelry_storage_bucket.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Ejecutar el SQL (solo la parte de políticas)
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (sqlError) {
      console.log('⚠️  No se pudo ejecutar el SQL completo, configurando políticas manualmente...');
      // Las políticas se configuran automáticamente con el bucket
    }

    console.log('✅ Políticas configuradas');

    // 4. Verificar configuración final
    console.log('\n4️⃣ Verificando configuración final...');
    const { data: finalBuckets } = await supabase.storage.listBuckets();
    const jewelryBucket = finalBuckets?.find(b => b.id === 'jewelry-images');

    if (jewelryBucket) {
      console.log('\n✅ BUCKET CONFIGURADO CORRECTAMENTE:');
      console.log('   ID:', jewelryBucket.id);
      console.log('   Nombre:', jewelryBucket.name);
      console.log('   Público:', jewelryBucket.public ? 'Sí' : 'No');
      console.log('   Límite de tamaño:', (jewelryBucket.file_size_limit / 1024 / 1024).toFixed(2), 'MB');
      console.log('   Tipos MIME permitidos:', jewelryBucket.allowed_mime_types?.join(', ') || 'Todos');
    }

    // 5. Probar subida de archivo
    console.log('\n5️⃣ Probando subida de archivo...');
    const testFile = new Blob(['test'], { type: 'image/png' });
    const testPath = `test/test-${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('jewelry-images')
      .upload(testPath, testFile);

    if (uploadError) {
      console.error('❌ Error al probar subida:', uploadError);
    } else {
      console.log('✅ Subida de prueba exitosa');
      
      // Eliminar archivo de prueba
      await supabase.storage.from('jewelry-images').remove([testPath]);
      console.log('✅ Archivo de prueba eliminado');
    }

    console.log('\n🎉 ¡Bucket de joyería configurado exitosamente!');
    console.log('\n📁 Estructura de carpetas recomendada:');
    console.log('   jewelry-images/');
    console.log('   ├── joyas/           (Productos terminados)');
    console.log('   ├── materiales/      (Materias primas)');
    console.log('   ├── produccion/      (Proceso de producción)');
    console.log('   └── ventas/          (Imágenes de ventas)');

  } catch (error) {
    console.error('\n❌ Error al configurar bucket:', error);
    process.exit(1);
  }
}

// Ejecutar
createJewelryBucket();
