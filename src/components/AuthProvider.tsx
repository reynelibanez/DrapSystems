import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { baseUrl } from '@/lib/base-url';
import { toast } from 'sonner';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setError('Error al cargar el perfil');
        return;
      }

      if (data) {
        setProfile(data);
        setError(null);
      }
    } catch (err) {
      console.error('Exception fetching profile:', err);
      setError('Error al cargar el perfil');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Timeout reducido a 1 segundo
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⏱️ Auth timeout - forcing loading to false');
        setLoading(false);
      }
    }, 1000); // 1 segundo

    // Obtener sesión inicial
    const initAuth = async () => {
      try {
        console.log('🔄 Iniciando autenticación...');
        
        // Primero verificar si hay una sesión de cliente en localStorage
        const clientSessionStr = localStorage.getItem('client_session');
        if (clientSessionStr) {
          try {
            const clientSession = JSON.parse(clientSessionStr);
            console.log('✅ Restaurando sesión de cliente desde localStorage:', clientSession);
            
            // Crear un objeto user simulado para el cliente
            const clientUser = {
              id: clientSession.id,
              email: clientSession.email || '',
              app_metadata: {},
              user_metadata: {},
              aud: 'authenticated',
              created_at: clientSession.created_at || new Date().toISOString(),
            } as User;
            
            // Restaurar el perfil del cliente INMEDIATAMENTE desde localStorage
            const clientProfile: Profile = {
              id: clientSession.id,
              email: clientSession.email || '',
              full_name: clientSession.full_name,
              role: 'client',
              business_id: clientSession.business_id,
              avatar_url: clientSession.avatar_url,
              created_at: clientSession.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              phone: clientSession.phone,
              is_active: true,
              password: null,
            };
            
            if (mounted) {
              console.log('📝 Estableciendo user y perfil de cliente...');
              setUser(clientUser);
              setProfile(clientProfile);
              console.log('⏹️ Estableciendo loading = false para cliente');
              setLoading(false);
              console.log('✅ Sesión de cliente restaurada exitosamente');
            }
            
            // Verificar en segundo plano que el cliente aún existe y está activo
            supabase
              .from('clients')
              .select('*')
              .eq('id', clientSession.id)
              .eq('is_active', true)
              .maybeSingle()
              .then(({ data: client, error: clientError }) => {
                if (clientError || !client) {
                  console.warn('⚠️ Cliente no encontrado o inactivo, cerrando sesión');
                  localStorage.removeItem('client_session');
                  if (mounted) {
                    setProfile(null);
                    window.location.reload();
                  }
                } else {
                  console.log('✅ Sesión de cliente verificada en segundo plano');
                }
              });
            
            return;
          } catch (err) {
            console.error('❌ Error restaurando sesión de cliente:', err);
            localStorage.removeItem('client_session');
          }
        }
        
        console.log('🔍 No hay sesión de cliente, verificando Supabase Auth...');
        
        // Si no hay sesión de cliente, verificar sesión normal de Supabase Auth
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            console.log('⏹️ Estableciendo loading = false por error');
            setLoading(false);
          }
          return;
        }

        console.log('📊 Sesión de Supabase:', session ? 'Encontrada' : 'No encontrada');

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Cambiar loading a false inmediatamente después de obtener la sesión
          console.log('⏹️ Estableciendo loading = false después de verificar sesión');
          setLoading(false);
          
          // Cargar perfil en segundo plano sin bloquear
          if (session?.user) {
            console.log('👤 Cargando perfil de usuario en segundo plano...');
            fetchProfile(session.user.id);
          }
        }
      } catch (err) {
        console.error('❌ Exception in initAuth:', err);
        if (mounted) {
          console.log('⏹️ Estableciendo loading = false por excepción');
          setLoading(false);
        }
      }
    };

    initAuth();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔔 Auth state change:', _event, 'Session:', session ? 'Existe' : 'No existe');
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Cargar perfil en segundo plano
          console.log('👤 Cargando perfil por cambio de auth...');
          fetchProfile(session.user.id);
        } else {
          // Solo limpiar el perfil si NO es un cliente
          // Los clientes usan autenticación custom y no tienen sesión de Supabase Auth
          setProfile((currentProfile) => {
            if (currentProfile?.role === 'client') {
              console.log('🔒 Manteniendo sesión de cliente activa');
              return currentProfile;
            }
            console.log('🧹 Limpiando perfil (no es cliente)');
            return null;
          });
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('=== INICIO DE LOGIN ===');
      console.log('Email recibido:', email);
      console.log('Contraseña recibida:', password ? '***' : 'VACÍA');
      
      // Primero intentar login normal con Supabase Auth (usuarios en profiles)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data.user) {
        // Login exitoso con usuario normal
        console.log('✅ Login exitoso con usuario normal');
        return;
      }
      
      // Si falla el login normal, intentar buscar en la tabla clients
      console.log('Login normal falló, intentando login de cliente...');
      console.log('Error de auth:', error?.message);
      
      // Llamar al endpoint de verificación de contraseña de cliente
      const response = await fetch(`${baseUrl}/api/auth/verify-client-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.log('❌ Error en verificación de cliente:', result.error);
        throw new Error(result.error || 'Credenciales inválidas');
      }
      
      if (!result.success || !result.client) {
        console.log('❌ Respuesta inválida del servidor');
        throw new Error('Error en la autenticación');
      }
      
      // Cliente autenticado correctamente
      console.log('✅ Cliente autenticado correctamente:', result.client.full_name);
      
      // Guardar información del cliente en localStorage para mantener la sesión
      localStorage.setItem('client_session', JSON.stringify(result.client));
      console.log('✅ Sesión de cliente guardada en localStorage');
      
      // Crear un perfil temporal para el cliente
      const clientProfile: Profile = {
        id: result.client.id,
        email: result.client.email || '',
        full_name: result.client.full_name,
        role: 'client',
        business_id: result.client.business_id,
        avatar_url: result.client.avatar_url,
        created_at: result.client.created_at,
        updated_at: new Date().toISOString(),
        phone: result.client.phone,
        is_active: true,
        password: null,
      };
      
      setProfile(clientProfile);
      
      // Recargar la página para que se apliquen los cambios
      console.log('✅ Recargando página...');
      window.location.reload();
      
    } catch (err) {
      console.error('❌ Error en signIn:', err);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    try {
      // Limpiar el módulo seleccionado del localStorage
      localStorage.removeItem('selected_module');
      
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      
      // Redirigir al login
      window.location.href = `${baseUrl}/`;
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}































