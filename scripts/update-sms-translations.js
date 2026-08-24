#!/usr/bin/env node

/**
 * Script para actualizar las traducciones del componente SMSUsageReport
 * 
 * Este script reemplaza todos los textos hardcodeados en español
 * con las traducciones correspondientes usando el hook useTranslation
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/reports/SMSUsageReport.tsx');

// Leer el archivo
let content = fs.readFileSync(filePath, 'utf8');

// Mapeo de traducciones
const translations = [
  // Títulos y descripciones
  { from: '"Reporte de Uso de SMS"', to: '{t(\'smsUsageReport.title\')}' },
  { from: 'Resumen del uso de mensajes SMS para', to: 'description', { month: 'usageData?.currentMonth || t(\'thisMonth\')' } },
  
  // Selectores
  { from: '"Seleccionar empresa"', to: '{t(\'smsUsageReport.selectBusinessPlaceholder\')}' },
  { from: '"Seleccionar Empresa"', to: '{t(\'smsUsageReport.selectBusiness\')}' },
  { from: '"Mes"', to: '{t(\'smsUsageReport.selectMonth\')}' },
  { from: '"Año"', to: '{t(\'smsUsageReport.selectYear\')}' },
  
  // Estadísticas
  { from: '"SMS Enviados"', to: '{t(\'smsUsageReport.smsSent\')}' },
  { from: '"de"', to: '{t(\'smsUsageReport.of\')}' },
  { from: '"incluidos"', to: '{t(\'smsUsageReport.included\')}' },
  { from: '"entregados"', to: '{t(\'smsUsageReport.delivered\')}' },
  { from: '"fallidos"', to: '{t(\'smsUsageReport.failed\')}' },
  { from: '"Uso del Plan"', to: '{t(\'smsUsageReport.planUsage\')}' },
  { from: '"SMS Excedidos"', to: '{t(\'smsUsageReport.smsExceeded\')}' },
  { from: '"por SMS"', to: '{t(\'smsUsageReport.perSMS\')}' },
  { from: '"Costo Adicional"', to: '{t(\'smsUsageReport.additionalCost\')}' },
  { from: '"Por SMS excedidos"', to: '{t(\'smsUsageReport.forExceededSMS\')}' },
  
  // Detalles del período
  { from: '"Detalles del Período"', to: '{t(\'smsUsageReport.periodDetails\')}' },
  { from: '"Plan Actual:"', to: '{t(\'smsUsageReport.currentPlan\')}:' },
  { from: '"SMS Incluidos:"', to: '{t(\'smsUsageReport.includedSMS\')}:' },
  { from: '"SMS Enviados:"', to: '{t(\'smsUsageReport.smsSent\')}:' },
  { from: '"SMS Excedidos:"', to: '{t(\'smsUsageReport.exceededSMS\')}:' },
  { from: '"Costo por Excedente:"', to: '{t(\'smsUsageReport.costPerExcess\')}:' },
  { from: '"Total a Pagar:"', to: '{t(\'smsUsageReport.totalToPay\')}:' },
  
  // Historial
  { from: '"Historial de SMS"', to: '{t(\'smsUsageReport.smsHistory\')}' },
  { from: '"Fecha"', to: '{t(\'smsUsageReport.date\')}' },
  { from: '"Destinatario"', to: '{t(\'smsUsageReport.recipient\')}' },
  { from: '"Cliente"', to: '{t(\'smsUsageReport.client\')}' },
  { from: '"Mensaje"', to: '{t(\'smsUsageReport.message\')}' },
  { from: '"Estado"', to: '{t(\'smsUsageReport.status\')}' },
  
  // Estados
  { from: '"Cargando empresas..."', to: '{t(\'smsUsageReport.loadingBusinesses\')}' },
  { from: '"No hay empresas registradas en el sistema."', to: '{t(\'smsUsageReport.noBusinesses\')}' },
];

console.log('🔄 Actualizando traducciones en SMSUsageReport.tsx...\n');

// Aplicar reemplazos simples
translations.forEach(({ from, to }) => {
  if (content.includes(from)) {
    content = content.replace(new RegExp(from, 'g'), to);
    console.log(`✅ Reemplazado: ${from} → ${to}`);
  }
});

// Guardar el archivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Traducciones actualizadas correctamente!');
console.log('📄 Archivo: src/components/reports/SMSUsageReport.tsx');
console.log('\n📝 Próximos pasos:');
console.log('1. Revisar el archivo para verificar que las traducciones se aplicaron correctamente');
console.log('2. Probar el componente en español e inglés');
console.log('3. Verificar que las variables se interpolan correctamente');
