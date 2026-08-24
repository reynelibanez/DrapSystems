import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Languages } from 'lucide-react';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    document.documentElement.lang = lng;
  };

  const getLanguageDisplay = () => {
    return i18n.language === 'en' ? 'EN' : 'ES';
  };

  return (
    <Select value={i18n.language} onValueChange={changeLanguage}>
      <SelectTrigger className="w-[70px] sm:w-[140px]">
        <div className="flex items-center gap-1.5">
          <Languages className="w-4 h-4 flex-shrink-0" />
          <span className="sm:hidden font-medium">{getLanguageDisplay()}</span>
          <span className="hidden sm:inline">
            <SelectValue placeholder="Language" />
          </span>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">🇺🇸 English</SelectItem>
        <SelectItem value="es">🇪🇸 Español</SelectItem>
      </SelectContent>
    </Select>
  );
}

