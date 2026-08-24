import React, { useEffect, useState } from 'react';
import { Calendar, ShoppingBag, Settings, Loader2, LogOut, User, ArrowRight, Sparkles, Moon, Sun, Gem, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { baseUrl } from '@/lib/base-url';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';

interface Module {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  calendar: Calendar,
  ShoppingBag,
  shoppingbag: ShoppingBag,
  Settings,
  settings: Settings,
  Gem,
  gem: Gem,
  Package,
  package: Package,
};

export function ModuleSelector() {
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    loadUserModules();
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, [user]);

  const loadUserModules = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Si es admin, obtener todos los módulos
      if (profile?.role === 'admin') {
        const { data, error } = await supabase
          .from('system_modules')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;
        setModules(data || []);
      } else {
        // Obtener módulos con permisos del usuario
        const { data, error } = await supabase
          .from('user_module_permissions')
          .select(`
            module_id,
            system_modules (
              id,
              name,
              slug,
              description,
              icon,
              display_order
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        const userModules = data
          ?.map((p: any) => p.system_modules)
          .filter(Boolean)
          .sort((a: Module, b: Module) => a.display_order - b.display_order) || [];

        setModules(userModules);
      }
    } catch (error: any) {
      console.error('Error loading modules:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleModuleSelect = (slug: string) => {
    // Guardar la selección del módulo en localStorage
    localStorage.setItem('selected_module', slug);
    
    // Redirigir según el módulo - usar baseUrl para producción
    switch (slug) {
      case 'appointments':
        window.location.href = `${baseUrl}/?module=appointments`;
        break;
      case 'services':
        window.location.href = `${baseUrl}/?module=services`;
        break;
      case 'jewelry':
        window.location.href = `${baseUrl}/?module=jewelry`;
        break;
      case 'inventario':
        window.location.href = `${baseUrl}/?module=inventario`;
        break;
      case 'admin':
        window.location.href = `${baseUrl}/?module=admin`;
        break;
      default:
        toast.error(t('error'));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t('moduleSelector.loadingModules')}</p>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <Settings className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold">{t('moduleSelector.noAccess')}</h2>
          <p className="text-muted-foreground">
            {t('moduleSelector.noAccessDescription')}
          </p>
          <Button onClick={signOut} variant="outline" className="mt-4">
            <LogOut className="h-4 w-4 mr-2" />
            {t('logout')}
          </Button>
        </div>
      </div>
    );
  }

  // Si solo tiene un módulo Y NO es admin, redirigir automáticamente
  if (modules.length === 1 && profile?.role !== 'admin') {
    handleModuleSelect(modules[0].slug);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t('moduleSelector.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/20 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary/30 shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || t('you')} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-semibold">
                  {profile?.full_name ? getInitials(profile.full_name) : <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{profile?.full_name || t('you')}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={toggleTheme}
                className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              <div className="[&_button]:bg-white/50 [&_button]:dark:bg-slate-800/50 [&_button]:backdrop-blur-sm [&_button]:hover:bg-white [&_button]:dark:hover:bg-slate-800 [&_button]:border-slate-200 [&_button]:dark:border-slate-700">
                <LanguageSelector />
              </div>
              <Button 
                variant="outline" 
                onClick={signOut}
                className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('logout')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Title Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t('moduleSelector.controlPanel')}</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
            {t('moduleSelector.welcomeBack')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('moduleSelector.selectModuleToWork')}
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {modules.map((module, index) => {
            const IconComponent = iconMap[module.icon] || ShoppingBag;
            const isHovered = hoveredModule === module.id;

            return (
              <button
                key={module.id}
                onClick={() => handleModuleSelect(module.slug)}
                onMouseEnter={() => setHoveredModule(module.id)}
                onMouseLeave={() => setHoveredModule(null)}
                className="group relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/50 dark:border-slate-800/50 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 text-left overflow-hidden"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-6 inline-flex p-4 bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2 mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {module.name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {module.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <span className="text-sm">{t('moduleSelector.access')}</span>
                    <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                  </div>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            );
          })}
        </div>

        {/* Admin Info */}
        {profile?.role === 'admin' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent rounded-2xl p-6 border border-primary/20 dark:border-primary/30">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {t('moduleSelector.adminModeActive')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('moduleSelector.adminModeDescription', { changeModule: t('changeModule') })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/20 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground">
            {t('moduleSelector.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}













