#!/usr/bin/env node

/**
 * Script para corregir referencias a SUPABASE_URL por PUBLIC_SUPABASE_URL
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/pages/api/admin/delete-business.ts',
  'src/pages/api/admin/delete-user.ts',
  'src/pages/api/business/sms-usage.ts',
  'src/pages/api/cron/send-reminders.ts',
  'src/pages/api/debug/test-business.ts',
  'src/pages/api/notifications/process-queue.ts',
  'src/pages/api/register/create-services-business.ts',
];

console.log('🔧 Fixing SUPABASE_URL references...\n');

filesToFix.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Reemplazar todas las referencias a SUPABASE_URL por PUBLIC_SUPABASE_URL
    content = content.replace(
      /locals\?\.\s*runtime\?\.\s*env\?\.\s*SUPABASE_URL(?!\w)/g,
      'locals?.runtime?.env?.PUBLIC_SUPABASE_URL'
    );
    
    content = content.replace(
      /import\.meta\.env\.SUPABASE_URL(?!\w)/g,
      'import.meta.env.PUBLIC_SUPABASE_URL'
    );

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log('\n✨ Done!');
