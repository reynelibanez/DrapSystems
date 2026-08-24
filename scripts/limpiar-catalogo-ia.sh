#!/bin/bash

# ============================================
# SCRIPT DE LIMPIEZA - CATÁLOGO IA
# ============================================
# Elimina todos los archivos relacionados con
# la sesión del catálogo IA que ya no se necesita
# ============================================

echo "🧹 Iniciando limpieza de archivos del catálogo IA..."
echo ""

# Contador de archivos eliminados
count=0

# 1. Eliminar scripts relacionados
echo "📁 Eliminando scripts..."
rm -f scripts/seed-catalogo-materiales.js && ((count++)) && echo "  ✓ seed-catalogo-materiales.js"
rm -f scripts/test-catalog-loading.js && ((count++)) && echo "  ✓ test-catalog-loading.js"
rm -f scripts/check-catalogo-structure.js && ((count++)) && echo "  ✓ check-catalogo-structure.js"
rm -f scripts/fix-catalogo-columns.js && ((count++)) && echo "  ✓ fix-catalogo-columns.js"

# 2. Eliminar migraciones SQL
echo ""
echo "📁 Eliminando migraciones SQL..."
rm -f supabase/migrations/add_material_catalog_table.sql && ((count++)) && echo "  ✓ add_material_catalog_table.sql"
rm -f supabase/migrations/seed_catalogo_materiales_ia.sql && ((count++)) && echo "  ✓ seed_catalogo_materiales_ia.sql"

# 3. Eliminar archivos SQL de catálogo
echo ""
echo "📁 Eliminando archivos SQL..."
rm -f SQL_COMANDOS_CATALOGO_MATERIALES.md && ((count++)) && echo "  ✓ SQL_COMANDOS_CATALOGO_MATERIALES.md"
rm -f SQL_SEED_CATALOGO_EJECUTAR_AHORA.sql && ((count++)) && echo "  ✓ SQL_SEED_CATALOGO_EJECUTAR_AHORA.sql"
rm -f SQL_SEED_CATALOGO_MATERIALES_EJECUTAR_AHORA.sql && ((count++)) && echo "  ✓ SQL_SEED_CATALOGO_MATERIALES_EJECUTAR_AHORA.sql"
rm -f FIX_CATALOGO_MATERIALES_RLS.sql && ((count++)) && echo "  ✓ FIX_CATALOGO_MATERIALES_RLS.sql"

# 4. Eliminar documentación relacionada
echo ""
echo "📁 Eliminando documentación..."
rm -f CHECKLIST_CATALOGO_IA_INTEGRADO.md && ((count++)) && echo "  ✓ CHECKLIST_CATALOGO_IA_INTEGRADO.md"
rm -f DIAGRAMA_CATALOGO_MATERIALES_DB.md && ((count++)) && echo "  ✓ DIAGRAMA_CATALOGO_MATERIALES_DB.md"
rm -f EMPIEZA_AQUI_FIX_CATALOGO_IA.md && ((count++)) && echo "  ✓ EMPIEZA_AQUI_FIX_CATALOGO_IA.md"
rm -f FIX_CATALOGO_BOTON_NO_CARGA.md && ((count++)) && echo "  ✓ FIX_CATALOGO_BOTON_NO_CARGA.md"
rm -f FIX_CATALOGO_BUSINESS_ID_CORRECTO.md && ((count++)) && echo "  ✓ FIX_CATALOGO_BUSINESS_ID_CORRECTO.md"
rm -f FIX_CATALOGO_IA_ADDEVENTLISTENER_ERROR.md && ((count++)) && echo "  ✓ FIX_CATALOGO_IA_ADDEVENTLISTENER_ERROR.md"
rm -f FIX_CATALOGO_IA_ADDEVENTLISTENER_ERROR_COMPLETO.md && ((count++)) && echo "  ✓ FIX_CATALOGO_IA_ADDEVENTLISTENER_ERROR_COMPLETO.md"
rm -f FIX_COLORES_CATALOGO.md && ((count++)) && echo "  ✓ FIX_COLORES_CATALOGO.md"
rm -f GUIA_CATALOGO_IA_INTEGRADO.md && ((count++)) && echo "  ✓ GUIA_CATALOGO_IA_INTEGRADO.md"
rm -f GUIA_GESTOR_CATALOGO_IA.md && ((count++)) && echo "  ✓ GUIA_GESTOR_CATALOGO_IA.md"
rm -f GUIA_RAPIDA_SEED_CATALOGO.md && ((count++)) && echo "  ✓ GUIA_RAPIDA_SEED_CATALOGO.md"
rm -f GUIA_VISUAL_SELECTOR_CATALOGO.md && ((count++)) && echo "  ✓ GUIA_VISUAL_SELECTOR_CATALOGO.md"
rm -f INDICE_CATALOGO_MATERIALES_DB.md && ((count++)) && echo "  ✓ INDICE_CATALOGO_MATERIALES_DB.md"
rm -f INDICE_FIX_CATALOGO_IA.md && ((count++)) && echo "  ✓ INDICE_FIX_CATALOGO_IA.md"
rm -f INICIO_RAPIDO_CATALOGO_DB.md && ((count++)) && echo "  ✓ INICIO_RAPIDO_CATALOGO_DB.md"
rm -f INICIO_RAPIDO_CATALOGO_IA.md && ((count++)) && echo "  ✓ INICIO_RAPIDO_CATALOGO_IA.md"
rm -f INICIO_RAPIDO_GESTOR_CATALOGO.md && ((count++)) && echo "  ✓ INICIO_RAPIDO_GESTOR_CATALOGO.md"
rm -f INSTRUCCIONES_CATALOGO_MATERIALES_DB.md && ((count++)) && echo "  ✓ INSTRUCCIONES_CATALOGO_MATERIALES_DB.md"
rm -f INSTRUCCIONES_VISUALES_SEED_CATALOGO.md && ((count++)) && echo "  ✓ INSTRUCCIONES_VISUALES_SEED_CATALOGO.md"
rm -f LEEME_CATALOGO_DB.md && ((count++)) && echo "  ✓ LEEME_CATALOGO_DB.md"
rm -f LEEME_CATALOGO_IA.md && ((count++)) && echo "  ✓ LEEME_CATALOGO_IA.md"
rm -f PRUEBA_RAPIDA_CATALOGO_DB.md && ((count++)) && echo "  ✓ PRUEBA_RAPIDA_CATALOGO_DB.md"
rm -f PRUEBA_RAPIDA_SELECTOR_CATALOGO.md && ((count++)) && echo "  ✓ PRUEBA_RAPIDA_SELECTOR_CATALOGO.md"
rm -f README_CATALOGO_DB.md && ((count++)) && echo "  ✓ README_CATALOGO_DB.md"
rm -f README_CATALOGO_IA.md && ((count++)) && echo "  ✓ README_CATALOGO_IA.md"
rm -f RESUMEN_CATALOGO_IA_INTEGRADO.md && ((count++)) && echo "  ✓ RESUMEN_CATALOGO_IA_INTEGRADO.md"
rm -f RESUMEN_CATALOGO_MATERIALES_DB.md && ((count++)) && echo "  ✓ RESUMEN_CATALOGO_MATERIALES_DB.md"
rm -f RESUMEN_EJECUTIVO_FIX_CATALOGO_IA.md && ((count++)) && echo "  ✓ RESUMEN_EJECUTIVO_FIX_CATALOGO_IA.md"
rm -f RESUMEN_EJECUTIVO_SELECTOR_CATALOGO.md && ((count++)) && echo "  ✓ RESUMEN_EJECUTIVO_SELECTOR_CATALOGO.md"
rm -f RESUMEN_EXPANSION_MATERIALES_IA.md && ((count++)) && echo "  ✓ RESUMEN_EXPANSION_MATERIALES_IA.md"
rm -f RESUMEN_FINAL_CATALOGO_DB.md && ((count++)) && echo "  ✓ RESUMEN_FINAL_CATALOGO_DB.md"
rm -f RESUMEN_FINAL_INTEGRACION_CATALOGO.md && ((count++)) && echo "  ✓ RESUMEN_FINAL_INTEGRACION_CATALOGO.md"
rm -f RESUMEN_FIX_CATALOGO_CARGA.md && ((count++)) && echo "  ✓ RESUMEN_FIX_CATALOGO_CARGA.md"
rm -f RESUMEN_FIX_CATALOGO_IA.md && ((count++)) && echo "  ✓ RESUMEN_FIX_CATALOGO_IA.md"
rm -f RESUMEN_FIX_VISTA_3D_Y_CATALOGO.md && ((count++)) && echo "  ✓ RESUMEN_FIX_VISTA_3D_Y_CATALOGO.md"
rm -f RESUMEN_GESTOR_CATALOGO_IA.md && ((count++)) && echo "  ✓ RESUMEN_GESTOR_CATALOGO_IA.md"
rm -f RESUMEN_SEED_CATALOGO_MATERIALES.md && ((count++)) && echo "  ✓ RESUMEN_SEED_CATALOGO_MATERIALES.md"
rm -f RESUMEN_SELECTOR_MATERIALES_CATALOGO.md && ((count++)) && echo "  ✓ RESUMEN_SELECTOR_MATERIALES_CATALOGO.md"
rm -f RESUMEN_VISUAL_INTEGRACION.md && ((count++)) && echo "  ✓ RESUMEN_VISUAL_INTEGRACION.md"
rm -f SESION_AGREGAR_MATERIALES_IA.md && ((count++)) && echo "  ✓ SESION_AGREGAR_MATERIALES_IA.md"
rm -f VERIFICAR_CATALOGO_IA_AHORA.md && ((count++)) && echo "  ✓ VERIFICAR_CATALOGO_IA_AHORA.md"
rm -f VISUAL_CATALOGO_IA_INTEGRADO.md && ((count++)) && echo "  ✓ VISUAL_CATALOGO_IA_INTEGRADO.md"

# 5. Eliminar README específico
echo ""
echo "📁 Eliminando README específico..."
rm -f supabase/migrations/README_SEED_CATALOGO.md && ((count++)) && echo "  ✓ README_SEED_CATALOGO.md"

echo ""
echo "✅ Limpieza completada!"
echo "📊 Total de archivos eliminados: $count"
echo ""
echo "⚠️  IMPORTANTE: Ahora ejecuta el script SQL para eliminar las tablas:"
echo "   ELIMINAR_CATALOGO_IA.sql"
