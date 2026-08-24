# 🎨 Script: Seed del Catálogo de Materiales IA

## 📝 Descripción

Este script prueba la carga del catálogo de materiales desde la base de datos y verifica que el sistema de detección automática de materiales funcione correctamente.

## 🚀 Uso

```bash
node scripts/test-catalog-loading.js
```

## 📊 Qué hace el script

1. **Obtiene un business_id de prueba**
   - Busca el primer negocio en la base de datos
   - Muestra el nombre y ID del negocio

2. **Verifica catálogo existente**
   - Consulta `jwl_catalogo_materiales`
   - Cuenta cuántos materiales existen
   - Muestra detalles de cada material

3. **Crea catálogo inicial (si no existe)**
   - Ejecuta la función `insert_initial_material_catalog`
   - Inserta 17 materiales base
   - Verifica que se crearon correctamente

4. **Prueba búsquedas**
   - Busca materiales por nombre
   - Busca materiales por palabras clave
   - Muestra coincidencias encontradas

## ✅ Resultado Esperado

```
🔍 Probando carga del catálogo de materiales...

1️⃣ Obteniendo business_id de prueba...
✅ Business encontrado: MSI LLC (0f2c51a8-1533-4582-981c-47a6d76454f7)

2️⃣ Verificando catálogo existente...
📊 Materiales encontrados: 17

✅ Catálogo existente:
   1. Oro (Metales Preciosos)
      - Palabras clave: oro, gold, dorado, au, 24k, 18k, 14k
      - Color: #FFD700
      - Forma: box
      - Metalness: 0.95, Roughness: 0.05

   2. Plata (Metales Preciosos)
      - Palabras clave: plata, silver, plateado, ag, 925, sterling
      - Color: #C0C0C0
      - Forma: box
      - Metalness: 0.95, Roughness: 0.1

   ... (15 materiales más)

5️⃣ Probando búsqueda de materiales...
   ✅ "oro" → Oro (Metales Preciosos)
   ✅ "plata" → Plata (Metales Preciosos)
   ✅ "diamante" → Diamante (Piedras Preciosas)
   ✅ "ruby" → Rubí (Piedras Preciosas)
   ✅ "gold" → Oro (Metales Preciosos)

✅ Prueba completada exitosamente
```

## ❌ Errores Comunes

### Error: "new row violates row-level security policy"

**Causa:** Las políticas RLS bloquean la inserción del catálogo

**Solución:**
```bash
# Ejecutar en Supabase SQL Editor:
# FIX_CATALOGO_MATERIALES_RLS.sql
```

### Error: "function insert_initial_material_catalog does not exist"

**Causa:** La función no existe en la base de datos

**Solución:**
```bash
# Ejecutar en Supabase SQL Editor:
# supabase/migrations/add_material_catalog_table.sql
```

### Error: "Faltan variables de entorno de Supabase"

**Causa:** No se encontró el archivo `.env` o faltan variables

**Solución:**
```bash
# Verificar que exista .env con:
PUBLIC_SUPABASE_URL=https://...
PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 🔧 Configuración

El script usa estas variables de entorno:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📦 Dependencias

```json
{
  "@supabase/supabase-js": "^2.108.2",
  "dotenv": "^17.4.2"
}
```

## 🎯 Casos de Uso

### 1. Verificar que el catálogo existe

```bash
node scripts/test-catalog-loading.js
# Busca: "📊 Materiales encontrados: 17"
```

### 2. Crear catálogo para un negocio nuevo

```bash
# El script detecta automáticamente si no existe catálogo
# y lo crea usando insert_initial_material_catalog
node scripts/test-catalog-loading.js
```

### 3. Probar búsquedas de materiales

```bash
# El script prueba automáticamente estas búsquedas:
# - oro, plata, diamante, ruby, gold
node scripts/test-catalog-loading.js
```

## 🔍 Debugging

Para ver más detalles, modifica el script:

```javascript
// Agregar al inicio del script
console.log('DEBUG MODE: ON');

// Agregar después de cada query
console.log('Query result:', data);
console.log('Query error:', error);
```

## 📚 Archivos Relacionados

- `FIX_CATALOGO_MATERIALES_RLS.sql` - Fix de políticas RLS
- `SQL_SEED_CATALOGO_EJECUTAR_AHORA.sql` - Seed para todos los negocios
- `supabase/migrations/add_material_catalog_table.sql` - Migración original
- `INSTRUCCIONES_VISUALES_SEED_CATALOGO.md` - Guía visual paso a paso
- `RESUMEN_FIX_CATALOGO_IA.md` - Resumen ejecutivo del fix

## 🎉 Éxito

Si ves este mensaje, todo funciona correctamente:

```
✅ Prueba completada exitosamente
```

Esto significa:
- ✅ El catálogo se cargó desde la base de datos
- ✅ Todos los materiales tienen propiedades 3D
- ✅ Las búsquedas funcionan correctamente
- ✅ El sistema está listo para usar

---

**Última actualización:** 2026-01-XX
**Versión:** 1.0
