import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LoginApp } from './LoginApp';
import { Dashboard } from './Dashboard';
import { ModuleSelector } from './shared/ModuleSelector';
import { ServicesDashboard } from './services/ServicesDashboard';
import { JewelryDashboard } from './jewelry/JewelryDashboard';
import { AdminModuleDashboard } from './admin/AdminModuleDashboard';
import { InventarioDashboard } from './inventario/InventarioDashboard';
import { useAuth } from './AuthProvider';
import type { User } from '@supabase/supabase-js';
import { Toaster } from './ui/sonner';
import { ThemeProvider, useTheme } from 'next-themes';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from '../lib/i18n';
import '../lib/i18n';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LanguageSelector } from './shared/LanguageSelector';
import { NotificationCenter } from './shared/NotificationCenter';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Building2, LogOut, Menu, Moon, Sun, AlertCircle } from 'lucide-react';
import { BackupButton } from './admin/BackupButton';

function AppContent() {
  const { user, profile, loading, error, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [userModules, setUserModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [loadingModules, setLoadingModules] = useState(true);

  // Debug: Ver el estado actual
  console.log('🎯 AppContent - loading:', loading, 'user:', user?.id, 'profile:', profile?.id, 'role:', profile?.role);

  useEffect(() => {
    if (profile?.business_id) {
      loadBusiness();
    }
  }, [profile]);

  // Detectar módulo seleccionado desde URL o localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const moduleParam = params.get('module');
    
    if (moduleParam) {
      setSelectedModule(moduleParam);
      localStorage.setItem('selected_module', moduleParam);
    } else {
      const savedModule = localStorage.getItem('selected_module');
      if (savedModule) {
        setSelectedModule(savedModule);
      }
    }
  }, []);

  // Cargar módulos del usuario
  useEffect(() => {
    if (user && profile) {
      loadUserModules();
    }
  }, [user, profile]);

  const loadUserModules = async () => {
    if (!user) return;

    try {
      setLoadingModules(true);
      
      // Si es admin, tiene acceso a todos los módulos
      if (profile?.role === 'admin') {
        const { data, error } = await supabase
          .from('system_modules')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;
        setUserModules(data || []);
        
        // Admin SIEMPRE debe ver el selector si no ha seleccionado un módulo
        if (!selectedModule) {
          setShowModuleSelector(true);
        }
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

        const modules = data
          ?.map((p: any) => p.system_modules)
          .filter(Boolean)
          .sort((a: any, b: any) => a.display_order - b.display_order) || [];

        setUserModules(modules);

        // Si tiene múltiples módulos y no ha seleccionado uno, mostrar selector
        if (modules.length > 1 && !selectedModule) {
          setShowModuleSelector(true);
        } else if (modules.length === 1 && !selectedModule) {
          // Si solo tiene un módulo, seleccionarlo automáticamente
          setSelectedModule(modules[0].slug);
        } else if (modules.length === 0) {
          // Si no tiene ningún módulo, no puede acceder al sistema
          setShowModuleSelector(false);
          setSelectedModule(null);
        }
      }
    } catch (error: any) {
      console.error('Error loading user modules:', error);
    } finally {
      setLoadingModules(false);
    }
  };

  const loadBusiness = async () => {
    if (!profile?.business_id) {
      console.log('⚠️ No business_id en profile');
      return;
    }
    
    console.log('🔍 Cargando business con ID:', profile.business_id);
    
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .single();

      if (!error && data) {
        console.log('✅ Business cargado:', data);
        console.log('🖼️ Logo URL:', data.logo_url);
        setBusiness(data);
      } else {
        console.error('❌ Error cargando business:', error);
      }
    } catch (error) {
      console.error('❌ Error loading business:', error);
    }
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    return <Moon className="w-4 h-4" />;
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Solo mostrar loading si realmente estamos cargando la sesión inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t('reload')}
          </Button>
        </div>
      </div>
    );
  }

  // Si no hay usuario NI perfil, mostrar login
  // Los clientes pueden tener profile sin user (autenticación custom)
  if (!user && !profile) {
    return <LoginApp />;
  }

  // Si hay usuario pero no perfil, mostrar un indicador pequeño pero permitir continuar
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">{t('loadingProfile')}</p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se cargan los módulos
  if (loadingModules) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Si debe mostrar el selector de módulos
  if (showModuleSelector) {
    return <ModuleSelector />;
  }

  // Si el usuario no tiene ningún módulo asignado (excepto admin)
  if (profile.role !== 'admin' && userModules.length === 0) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">
              {i18n.language === 'es' ? 'Acceso Restringido' : 'Access Restricted'}
            </h2>
            <p className="text-muted-foreground">
              {i18n.language === 'es' 
                ? 'No tienes ningún módulo asignado. Por favor, contacta al administrador para obtener acceso al sistema.'
                : 'You do not have any modules assigned. Please contact the administrator to get access to the system.'}
            </p>
          </div>
          <Button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {i18n.language === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = profile.role === 'admin';

  // Obtener iniciales para el avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Si el módulo seleccionado es administración, mostrar el dashboard de admin
  if (selectedModule === 'admin') {
    return (
      <div className="min-h-screen w-full bg-background">
        <header className="fixed top-0 left-0 right-0 border-b bg-card shadow-sm z-50">
          <div className="w-full px-2 sm:px-3 py-3 sm:py-4 flex justify-between items-center gap-3">
            {/* Logo y nombre de la empresa */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {business?.logo_url ? (
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 border-2 border-primary/20">
                  <AvatarImage src={business.logo_url} alt={business.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-primary truncate">
                  {business?.name || 'DRAP Appointment'}
                </h1>
              </div>
            </div>
            
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {userModules.length > 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedModule(null);
                    setShowModuleSelector(true);
                    localStorage.removeItem('selected_module');
                  }}
                >
                  {t('changeModule')}
                </Button>
              )}
              {isAdmin && <BackupButton />}
              <LanguageSelector />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleTheme}
                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {getThemeIcon()}
              </Button>
              <Button
                onClick={signOut}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">{t('logout')}</span>
              </Button>
            </div>

            {/* Mobile menu */}
            <div className="flex sm:hidden items-center gap-2">
              {isAdmin && <BackupButton />}
              <LanguageSelector />
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {getThemeIcon()}
              </Button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 mt-8">
                    <div className="pb-4 border-b">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || t('client')} />
                          <AvatarFallback>
                            {getInitials(profile.full_name || profile.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{profile.full_name || t('client')}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                        </div>
                      </div>
                    </div>
                    {userModules.length > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedModule(null);
                          setShowModuleSelector(true);
                          localStorage.removeItem('selected_module');
                          setMobileMenuOpen(false);
                        }}
                      >
                        {t('changeModule')}
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      variant="destructive"
                      className="w-full flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
        <main className="w-full bg-background pt-[73px]">
          <AdminModuleDashboard />
        </main>
      </div>
    );
  }

  // Si el módulo seleccionado es servicios, mostrar el dashboard de servicios
  if (selectedModule === 'services') {
    console.log('🏢 Módulo Servicios - business:', business);
    console.log('🖼️ Logo URL:', business?.logo_url);
    console.log('📛 Business Name:', business?.name);
    
    return (
      <div className="min-h-screen w-full bg-background">
        <header className="fixed top-0 left-0 right-0 border-b bg-card shadow-sm z-50">
          <div className="w-full px-2 sm:px-3 py-3 sm:py-4 flex justify-between items-center gap-3">
            {/* Logo y nombre de la empresa */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {business?.logo_url ? (
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 border-2 border-primary/20">
                  <AvatarImage src={business.logo_url} alt={business.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-primary truncate">
                  {business?.name || 'DRAP Appointment'}
                </h1>
              </div>
            </div>
            
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {userModules.length > 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedModule(null);
                    setShowModuleSelector(true);
                    localStorage.removeItem('selected_module');
                  }}
                >
                  {t('changeModule')}
                </Button>
              )}
              {isAdmin && <BackupButton />}
              <LanguageSelector />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleTheme}
                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {getThemeIcon()}
              </Button>
              <Button
                onClick={signOut}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">{t('logout')}</span>
              </Button>
            </div>

            {/* Mobile menu */}
            <div className="flex sm:hidden items-center gap-2">
              {isAdmin && <BackupButton />}
              <LanguageSelector />
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {getThemeIcon()}
              </Button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 mt-8">
                    <div className="pb-4 border-b">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || t('client')} />
                          <AvatarFallback>
                            {getInitials(profile.full_name || profile.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{profile.full_name || t('client')}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                        </div>
                      </div>
                    </div>
                    {userModules.length > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedModule(null);
                          setShowModuleSelector(true);
                          localStorage.removeItem('selected_module');
                          setMobileMenuOpen(false);
                        }}
                      >
                        {t('changeModule')}
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      variant="destructive"
                      className="w-full flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
        <main className="w-full bg-background pt-[73px] p-4">
          <ServicesDashboard />
        </main>
      </div>
    );
  }

  // Si el módulo seleccionado es joyería, mostrar el dashboard de joyería
  if (selectedModule === 'jewelry') {
    console.log('🏢 Módulo Joyería - business:', business);
    console.log('🖼️ Logo URL:', business?.logo_url);
    console.log('📛 Business Name:', business?.name);
    
    return (
      <div className="min-h-screen w-full bg-background">
        <header className="fixed top-0 left-0 right-0 border-b bg-card shadow-sm z-50">
          <div className="w-full px-2 sm:px-3 py-3 sm:py-4 flex justify-between items-center gap-3">
            {/* Logo y nombre de la empresa */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {business?.logo_url ? (
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 border-2 border-primary/20">
                  <AvatarImage 
                    src={business.logo_url} 
                    alt={business.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-primary truncate">
                  {business?.name || 'DRAP Appointment'}
                </h1>
              </div>
            </div>
            
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {userModules.length > 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedModule(null);
                    setShowModuleSelector(true);
                    localStorage.removeItem('selected_module');
                  }}
                >
                  {t('changeModule')}
                </Button>
              )}
              {isAdmin && <BackupButton />}
              <LanguageSelector />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleTheme}
                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {getThemeIcon()}
              </Button>
              <Button
                onClick={signOut}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">{t('logout')}</span>
              </Button>
            </div>

            {/* Mobile menu */}
            <div className="flex sm:hidden items-center gap-2">
              {isAdmin && <BackupButton />}
              <LanguageSelector />
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {getThemeIcon()}
              </Button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 mt-8">
                    <div className="pb-4 border-b">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || t('client')} />
                          <AvatarFallback>
                            {getInitials(profile.full_name || profile.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{profile.full_name || t('client')}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                        </div>
                      </div>
                    </div>
                    {userModules.length > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedModule(null);
                          setShowModuleSelector(true);
                          localStorage.removeItem('selected_module');
                          setMobileMenuOpen(false);
                        }}
                      >
                        {t('changeModule')}
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      variant="destructive"
                      className="w-full flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
        <main className="w-full bg-background pt-[73px] p-4">
          <JewelryDashboard businessId={profile?.business_id} business={business} />
        </main>
      </div>
    );
  }

  // Si el módulo seleccionado es inventario, mostrar el dashboard de inventario
  if (selectedModule === 'inventario') {
    return (
      <div className="min-h-screen w-full bg-background">
        <header className="fixed top-0 left-0 right-0 border-b bg-card shadow-sm z-50">
          <div className="w-full px-2 sm:px-3 py-3 sm:py-4 flex justify-between items-center gap-3">
            {/* Logo y nombre de la empresa */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {business?.logo_url ? (
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 border-2 border-primary/20">
                  <AvatarImage src={business.logo_url} alt={business.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-primary truncate">
                  {business?.name || 'DRAP Appointment'}
                </h1>
              </div>
            </div>
            
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {userModules.length > 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedModule(null);
                    setShowModuleSelector(true);
                    localStorage.removeItem('selected_module');
                  }}
                >
                  {t('changeModule')}
                </Button>
              )}
              {isAdmin && <BackupButton />}
              <LanguageSelector />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleTheme}
                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {getThemeIcon()}
              </Button>
              <Button
                onClick={signOut}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">{t('logout')}</span>
              </Button>
            </div>

            {/* Mobile menu */}
            <div className="flex sm:hidden items-center gap-2">
              {isAdmin && <BackupButton />}
              <LanguageSelector />
              <Button 
                variant="outline" 
                size="icon"
                className="h-9 w-9"
                onClick={toggleTheme}
                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {getThemeIcon()}
              </Button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-4 mt-8">
                    <div className="pb-4 border-b">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || t('client')} />
                          <AvatarFallback>
                            {getInitials(profile.full_name || profile.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{profile.full_name || t('client')}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                        </div>
                      </div>
                    </div>
                    {userModules.length > 1 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedModule(null);
                          setShowModuleSelector(true);
                          localStorage.removeItem('selected_module');
                          setMobileMenuOpen(false);
                        }}
                      >
                        {t('changeModule')}
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      variant="destructive"
                      className="w-full flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
        <main className="w-full bg-background pt-[73px]">
          <InventarioDashboard businessId={profile?.business_id} />
        </main>
      </div>
    );
  }

  // Por defecto, mostrar el dashboard de citas
  return (
    <div className="min-h-screen w-full bg-background">
      <header className="fixed top-0 left-0 right-0 border-b bg-card shadow-sm z-50">
        <div className="w-full px-2 sm:px-3 py-3 sm:py-4 flex justify-between items-center gap-3">

          {/* Logo y nombre de la empresa */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {business?.logo_url ? (
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 border-2 border-primary/20">
                <AvatarImage src={business.logo_url} alt={business.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-primary truncate">
                {business?.name || 'DRAP Appointment'}
              </h1>
            </div>
          </div>
          
          {/* Desktop buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {userModules.length > 1 && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedModule(null);
                  setShowModuleSelector(true);
                  localStorage.removeItem('selected_module');
                }}
              >
                {t('changeModule')}
              </Button>
            )}
            {isAdmin && <BackupButton />}
            <LanguageSelector />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleTheme}
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {getThemeIcon()}
            </Button>
            <Button
              onClick={signOut}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">{t('logout')}</span>
            </Button>
          </div>

          {/* Mobile menu */}
          <div className="flex sm:hidden items-center gap-2">
            {isAdmin && <BackupButton />}
            <LanguageSelector />
            <Button 
              variant="outline" 
              size="icon"
              className="h-9 w-9"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {getThemeIcon()}
            </Button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  <div className="pb-4 border-b">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || t('client')} />
                        <AvatarFallback>
                          {getInitials(profile.full_name || profile.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{profile.full_name || t('client')}</p>
                        <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                      </div>
                    </div>
                    {business && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        {business.logo_url ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={business.logo_url} alt={business.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              <Building2 className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <p className="text-xs font-medium truncate">{business.name}</p>
                      </div>
                    )}
                  </div>
                  {userModules.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedModule(null);
                        setShowModuleSelector(true);
                        localStorage.removeItem('selected_module');
                        setMobileMenuOpen(false);
                      }}
                    >
                      {t('changeModule')}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    variant="destructive"
                    className="w-full flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout')}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="w-full bg-background pt-[73px]">
        <div className="w-full px-0 bg-background">
          {console.log('🎨 Renderizando Dashboard con user:', user?.id, 'profile:', profile?.id, 'role:', profile?.role)}
          <Dashboard user={user} theme={theme as 'light' | 'dark'} />
        </div>
      </main>
    </div>
  );
}

export function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="light" 
        enableSystem={false}
        themes={['light', 'dark']}
        storageKey="booking-suite-theme"
      >
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </I18nextProvider>
  );
}








































































