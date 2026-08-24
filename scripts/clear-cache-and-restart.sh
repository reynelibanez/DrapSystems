#!/bin/bash

echo "🧹 Clearing build cache..."
rm -rf .astro dist node_modules/.vite

echo "✅ Cache cleared!"
echo ""
echo "📝 Next steps:"
echo "1. Restart your dev server: npm run dev"
echo "2. Hard refresh your browser:"
echo "   - Chrome/Edge: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "   - Firefox: Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "   - Safari: Cmd+Option+R (Mac)"
echo ""
echo "🎉 Your translations should now appear correctly!"
