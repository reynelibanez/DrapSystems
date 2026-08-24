/**
 * Language Detector
 * Detecta y aplica el idioma preferido del usuario usando la traducción del navegador
 */

export type Language = 'en' | 'es';

export function detectLanguage(): Language {
  // 1. Verificar si hay un idioma guardado en localStorage
  const savedLang = localStorage.getItem('preferred-language') as Language;
  if (savedLang && (savedLang === 'en' || savedLang === 'es')) {
    return savedLang;
  }

  // 2. Detectar el idioma del navegador
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('es')) {
    return 'es';
  }

  // 3. Por defecto, inglés
  return 'en';
}

export function applyLanguage(lang: Language) {
  // Aplicar el atributo lang al documento
  document.documentElement.lang = lang;
  
  // Guardar la preferencia
  localStorage.setItem('preferred-language', lang);
  
  // Disparar evento para que otros componentes puedan reaccionar
  const event = new CustomEvent('languagechange', { detail: { language: lang } });
  window.dispatchEvent(event);
}

export function initLanguageDetector() {
  const lang = detectLanguage();
  applyLanguage(lang);
}

// Auto-inicializar cuando se carga el módulo
if (typeof window !== 'undefined') {
  initLanguageDetector();
}
