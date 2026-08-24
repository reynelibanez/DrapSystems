#!/usr/bin/env node

/**
 * Script para agregar traducciones a los componentes de joyería
 * Actualiza automáticamente los imports y reemplaza textos estáticos
 */

const fs = require('fs');
const path = require('path');

// Mapeo de textos en español a claves de traducción
const translations = {
  // Común
  'Cargando...': "t('jewelry.common.loading')",
  'Guardar': "t('jewelry.common.save')",
  'Cancelar': "t('jewelry.common.cancel')",
  'Eliminar': "t('jewelry.common.delete')",
  'Editar': "t('jewelry.common.edit')",
  'Agregar': "t('jewelry.common.add')",
  'Buscar': "t('jewelry.common.search')",
  'Filtrar': "t('jewelry.common.filter')",
  'Exportar': "t('jewelry.common.export')",
  'Acciones': "t('jewelry.common.actions')",
  'No hay datos disponibles': "t('jewelry.common.noData')",
  '¿Estás seguro de que deseas eliminar este elemento?': "t('jewelry.common.confirmDelete')",
  'Elemento eliminado exitosamente': "t('jewelry.common.deleteSuccess')",
  'Guardado exitosamente': "t('jewelry.common.saveSuccess')",
  'Error': "t('jewelry.common.error')",
  'Éxito': "t('jewelry.common.success')",
  
  // Inventario
  'Inventario de Joyas': "t('jewelry.inventory.title')",
  'Gestiona tu inventario de joyas': "t('jewelry.inventory.description')",
  'Agregar Joya': "t('jewelry.inventory.addItem')",
  'Editar Joya': "t('jewelry.inventory.editItem')",
  'Eliminar Joya': "t('jewelry.inventory.deleteItem')",
  'No hay joyas en el inventario': "t('jewelry.inventory.noItems')",
  'Buscar por nombre, código o tipo...': "t('jewelry.inventory.searchPlaceholder')",
  
  // Producción
  'Producción': "t('jewelry.production.title')",
  'Gestiona tus órdenes de producción': "t('jewelry.production.description')",
  'Nueva Orden': "t('jewelry.production.addOrder')",
  'Editar Orden': "t('jewelry.production.editOrder')",
  'Eliminar Orden': "t('jewelry.production.deleteOrder')",
  'No hay órdenes de producción': "t('jewelry.production.noOrders')",
  'Buscar por código o producto...': "t('jewelry.production.searchPlaceholder')",
  
  // Ventas
  'Ventas': "t('jewelry.sales.title')",
  'Gestiona tus ventas de joyería': "t('jewelry.sales.description')",
  'Nueva Venta': "t('jewelry.sales.addSale')",
  'Editar Venta': "t('jewelry.sales.editSale')",
  'Eliminar Venta': "t('jewelry.sales.deleteSale')",
  'No hay ventas registradas': "t('jewelry.sales.noSales')",
  'Buscar por código, cliente o producto...': "t('jewelry.sales.searchPlaceholder')",
  
  // Reportes
  'Reportes': "t('jewelry.reports.title')",
  'Análisis y reportes del módulo de joyería': "t('jewelry.reports.description')",
  'Período': "t('jewelry.reports.period')",
  'Seleccionar período': "t('jewelry.reports.selectPeriod')",
  'Generar Reporte': "t('jewelry.reports.generateReport')",
  'Exportar CSV': "t('jewelry.reports.exportCSV')",
};

// Componentes a actualizar
const components = [
  'src/components/jewelry/JoyasList.tsx',
  'src/components/jewelry/ProduccionList.tsx',
  'src/components/jewelry/VentasList.tsx',
  'src/components/jewelry/InventarioView.tsx',
  'src/components/jewelry/ReportesView.tsx'
];

function addTranslationImport(content) {
  // Verificar si ya tiene el import
  if (content.includes("import { useTranslation } from 'react-i18next'")) {
    return content;
  }
  
  // Buscar la última línea de imports
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex !== -1) {
    lines.splice(lastImportIndex + 1, 0, "import { useTranslation } from 'react-i18next';");
    return lines.join('\n');
  }
  
  return content;
}

function addUseTranslationHook(content) {
  // Verificar si ya tiene el hook
  if (content.includes("const { t } = useTranslation()")) {
    return content;
  }
  
  // Buscar el inicio del componente funcional
  const componentMatch = content.match(/export function \w+\([^)]*\) \{/);
  if (componentMatch) {
    const insertPosition = componentMatch.index + componentMatch[0].length;
    const before = content.substring(0, insertPosition);
    const after = content.substring(insertPosition);
    return before + "\n  const { t } = useTranslation();" + after;
  }
  
  return content;
}

function replaceTexts(content) {
  let updatedContent = content;
  
  // Reemplazar textos en JSX (entre comillas simples o dobles)
  for (const [spanish, translation] of Object.entries(translations)) {
    // Reemplazar en strings literales
    const patterns = [
      new RegExp(`'${spanish.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`, 'g'),
      new RegExp(`"${spanish.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
      new RegExp(`>{spanish.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`, 'g')
    ];
    
    patterns.forEach(pattern => {
      updatedContent = updatedContent.replace(pattern, (match) => {
        if (match.startsWith('>') && match.endsWith('<')) {
          return `>{${translation}}<`;
        }
        return `{${translation}}`;
      });
    });
  }
  
  return updatedContent;
}

function updateComponent(filePath) {
  console.log(`\n📝 Actualizando: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Agregar import de useTranslation
    content = addTranslationImport(content);
    
    // 2. Agregar hook useTranslation
    content = addUseTranslationHook(content);
    
    // 3. Reemplazar textos
    content = replaceTexts(content);
    
    // Guardar archivo
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Actualizado exitosamente`);
    
  } catch (error) {
    console.error(`❌ Error al actualizar ${filePath}:`, error.message);
  }
}

// Ejecutar actualización
console.log('🚀 Iniciando actualización de componentes de joyería...\n');

components.forEach(updateComponent);

console.log('\n✨ Proceso completado!\n');
