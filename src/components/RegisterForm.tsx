import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Loader2, Building2, User, Mail, Lock, Phone, MapPin, Sparkles, Moon, Sun, Languages, Eye, EyeOff, Calendar, Wrench, Package, ShoppingCart, Users as UsersIcon, Check, ChevronRight, X } from 'lucide-react';
import { baseUrl } from '../lib/base-url';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Checkbox } from './ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { flushSync } from 'react-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

// Lista de prefijos de países más comunes
const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸', name: 'United States / Canada' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'México' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'España' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Perú' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brasil' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+506', country: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '+507', country: 'PA', flag: '🇵🇦', name: 'Panamá' },
  { code: '+503', country: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '+502', country: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '+504', country: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '+505', country: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '+53', country: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '+1-809', country: 'DO', flag: '🇩🇴', name: 'República Dominicana' },
  { code: '+1-787', country: 'PR', flag: '🇵🇷', name: 'Puerto Rico' },
];

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { theme, setTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const [step, setStep] = useState<'user' | 'business' | 'modules'>('user');
  const [loading, setLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>(['appointments']);
  const [smsConsent, setSmsConsent] = useState(false);
  const [userCountryCode, setUserCountryCode] = useState('+1');
  const [businessCountryCode, setBusinessCountryCode] = useState('+1');

  // Define schema inside component to access t function
  const registerSchema = useMemo(() => z.object({
    fullName: z.string().min(2, t('register.error.fullNameMin')),
    email: z.string().email(t('register.error.invalidEmail')),
    password: z.string()
      .min(8, t('register.passwordMinLength8'))
      .regex(/[A-Z]/, t('register.passwordNeedsUppercase'))
      .regex(/[a-z]/, t('register.passwordNeedsLowercase'))
      .regex(/[0-9]/, t('register.passwordNeedsNumber'))
      .regex(/[^A-Za-z0-9]/, t('register.passwordNeedsSpecial')),
    passwordConfirm: z.string(),
    phone: z.string().optional(),
    businessName: z.string().min(2, t('register.error.businessNameMin')),
    businessEmail: z.string().email(t('register.error.invalidEmail')),
    businessPhone: z.string().min(10, t('register.error.phoneMin')),
    businessAddress: z.string().optional(),
    businessDescription: z.string().optional(),
  }).refine((data) => data.password === data.passwordConfirm, {
    message: t('register.error.passwordsDoNotMatch'),
    path: ['passwordConfirm'],
  }), [i18n.language]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Watch password field to update strength indicator
  const password = watch('password');
  const passwordConfirm = watch('passwordConfirm');
  const passwordsMatch = passwordConfirm && password === passwordConfirm;
  const passwordsDontMatch = passwordConfirm && password !== passwordConfirm;

  // Update password strength in real-time
  useEffect(() => {
    if (password) {
      setPasswordStrength({
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
      });
    } else {
      setPasswordStrength({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });
    }
  }, [password]);

  const handleContinueToBusinessStep = useCallback(async () => {
    const userFieldsValid = await trigger(['fullName', 'email', 'password', 'passwordConfirm', 'phone']);
    
    if (userFieldsValid) {
      setStep('business');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error(t('register.error.validation'), {
        description: t('register.error.completeFields'),
      });
    }
  }, [trigger, t]);

  const handleContinueToModulesStep = useCallback(async () => {
    const businessFieldsValid = await trigger(['businessName', 'businessEmail', 'businessPhone']);
    
    if (businessFieldsValid) {
      setStep('modules');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error(t('register.error.validation'), {
        description: t('register.error.completeFields'),
      });
    }
  }, [trigger, t]);

  const handleSmsConsentChange = useCallback((checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setSmsConsent(isChecked);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const onSubmit = async (data: RegisterFormData) => {
    // Validar campos del paso 1 (Usuario)
    const userFieldsValid = await trigger(['fullName', 'email', 'password', 'passwordConfirm', 'phone']);
    
    if (!userFieldsValid) {
      console.log('Errores en paso 1, navegando a user');
      flushSync(() => {
        setStep('user');
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        toast.error(t('register.error.userDataError'), {
          description: t('register.error.completeUserFields'),
        });
      }, 100);
      return;
    }

    // Validar campos del paso 2 (Empresa)
    const businessFieldsValid = await trigger(['businessName', 'businessEmail', 'businessPhone']);
    
    if (!businessFieldsValid) {
      console.log('Errores en paso 2, navegando a business');
      flushSync(() => {
        setStep('business');
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        toast.error(t('register.error.businessDataError'), {
          description: t('register.error.completeBusinessFields'),
        });
      }, 100);
      return;
    }

    // Validar consentimiento SMS
    if (!smsConsent) {
      flushSync(() => {
        setStep('modules');
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        toast.error(t('register.error.consentRequired'), {
          description: t('register.error.consentDescription'),
        });
      }, 100);
      return;
    }

    // Validar que al menos un módulo esté seleccionado
    if (selectedModules.length === 0) {
      flushSync(() => {
        setStep('modules');
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        toast.error(t('register.error.moduleRequired'), {
          description: t('register.error.moduleDescription'),
        });
      }, 100);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/register/create-business-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: data.email,
          userPassword: data.password,
          userFullName: data.fullName,
          userPhone: data.phone ? `${userCountryCode}${data.phone}` : null,
          businessName: data.businessName,
          businessEmail: data.businessEmail,
          businessPhone: data.businessPhone ? `${businessCountryCode}${data.businessPhone}` : null,
          businessAddress: data.businessAddress,
          businessDescription: data.businessDescription,
          smsConsent: true,
          modules: selectedModules,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('register.error.createAccount'));
      }

      toast.success(t('register.success'), {
        description: t('register.successDescription'),
      });

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        window.location.href = `${baseUrl}/`;
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      
      let errorMessage = t('register.error.generic');
      let errorDescription = t('register.error.tryAgain');
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        description: errorDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Theme toggle and language selector */}
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex gap-1 sm:gap-2">
        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card border border-border/50 transition-all shadow-lg"
            >
              <Languages className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
              <span className="sr-only">Cambiar idioma</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('es')}>
              🇪🇸 Español
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              🇺🇸 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card border border-border/50 transition-all shadow-lg"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
          ) : (
            <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
          )}
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 mb-3 sm:mb-4">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </div>
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{t('register.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">
            {t('register.subtitle')}
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 max-w-4xl mx-auto">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1 text-sm sm:text-base">{t('register.feature1.title')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('register.feature1.description')}
          </p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1 text-sm sm:text-base">{t('register.feature2.title')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('register.feature2.description')}
          </p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1 text-sm sm:text-base">{t('register.feature3.title')}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('register.feature3.description')}
          </p>
        </div>
      </div>

      {/* Registration Form */}
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">{t('register.formTitle')}</CardTitle>
          <CardDescription className="text-sm">
            {t('register.formDescription')}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={(e) => e.preventDefault()}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {/* Step Indicator - Responsive */}
            {/* Desktop: Horizontal */}
            <div className="hidden sm:flex items-center gap-2 lg:gap-4 mb-4 sm:mb-6">
              <button
                type="button"
                onClick={() => setStep('user')}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                1
              </button>
              <button
                type="button"
                onClick={() => setStep('user')}
                className="flex-1 min-w-0 text-left"
              >
                <h3 className={`font-semibold text-sm lg:text-base truncate transition-colors ${
                  step === 'user' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}>
                  {t('register.step.user')}
                </h3>
              </button>
              <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0" />
              <button
                type="button"
                onClick={() => setStep('business')}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step === 'business' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                2
              </button>
              <button
                type="button"
                onClick={() => setStep('business')}
                className="flex-1 min-w-0 text-left"
              >
                <h3 className={`font-semibold text-sm lg:text-base truncate transition-colors ${
                  step === 'business' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}>
                  {t('register.step.business')}
                </h3>
              </button>
              <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0" />
              <button
                type="button"
                onClick={() => setStep('modules')}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step === 'modules' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                3
              </button>
              <button
                type="button"
                onClick={() => setStep('modules')}
                className="flex-1 min-w-0 text-left"
              >
                <h3 className={`font-semibold text-sm lg:text-base truncate transition-colors ${
                  step === 'modules' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}>
                  {t('register.step.modules')}
                </h3>
              </button>
            </div>

            {/* Mobile: Vertical */}
            <div className="flex sm:hidden flex-col gap-3 mb-4">
              <button
                type="button"
                onClick={() => setStep('user')}
                className="flex items-center gap-3 text-left w-full"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}>
                  1
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-sm transition-colors ${
                    step === 'user' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    {t('register.step.user')}
                  </h3>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setStep('business')}
                className="flex items-center gap-3 text-left w-full"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step === 'business' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}>
                  2
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-sm transition-colors ${
                    step === 'business' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    {t('register.step.business')}
                  </h3>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setStep('modules')}
                className="flex items-center gap-3 text-left w-full"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step === 'modules' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}>
                  3
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-sm transition-colors ${
                    step === 'modules' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    {t('register.step.modules')}
                  </h3>
                </div>
              </button>
            </div>

            {/* User Information */}
            {step === 'user' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('register.fullName')}</Label>
                    <Input
                      id="fullName"
                      placeholder={t('register.fullNamePlaceholder')}
                      {...register('fullName')}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('register.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('register.emailPlaceholder')}
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t('register.password')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('register.passwordPlaceholder')}
                        {...register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {t('register.passwordRequirements')}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              passwordStrength.length ? 'bg-green-500' : 'bg-muted'
                            }`}>
                              {passwordStrength.length && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={passwordStrength.length ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                              {t('register.passwordMinLength8')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              passwordStrength.uppercase ? 'bg-green-500' : 'bg-muted'
                            }`}>
                              {passwordStrength.uppercase && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={passwordStrength.uppercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                              {t('register.passwordNeedsUppercase')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              passwordStrength.lowercase ? 'bg-green-500' : 'bg-muted'
                            }`}>
                              {passwordStrength.lowercase && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={passwordStrength.lowercase ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                              {t('register.passwordNeedsLowercase')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              passwordStrength.number ? 'bg-green-500' : 'bg-muted'
                            }`}>
                              {passwordStrength.number && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={passwordStrength.number ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                              {t('register.passwordNeedsNumber')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              passwordStrength.special ? 'bg-green-500' : 'bg-muted'
                            }`}>
                              {passwordStrength.special && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={passwordStrength.special ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                              {t('register.passwordNeedsSpecial')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordConfirm">{t('register.confirmPassword')}</Label>
                    <div className="relative">
                      <Input
                        id="passwordConfirm"
                        type={showPasswordConfirm ? 'text' : 'password'}
                        placeholder={t('register.confirmPasswordPlaceholder')}
                        {...register('passwordConfirm')}
                        className={passwordsMatch ? 'border-green-500' : passwordsDontMatch ? 'border-red-500' : ''}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      >
                        {showPasswordConfirm ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {passwordsMatch && (
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('register.passwordsMatch')}
                      </p>
                    )}
                    {passwordsDontMatch && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {t('register.passwordsDontMatch')}
                      </p>
                    )}
                    {errors.passwordConfirm && (
                      <p className="text-sm text-destructive">{errors.passwordConfirm.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('register.phone')}</Label>
                    <div className="flex gap-2">
                      <Select
                        value={userCountryCode}
                        onValueChange={setUserCountryCode}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {COUNTRY_CODES.map((cc) => (
                            <SelectItem key={cc.code} value={cc.code}>
                              <div className="flex items-center gap-2">
                                <span>{cc.flag}</span>
                                <span className="font-mono text-sm">{cc.code}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t('register.phonePlaceholder') || '1234567890'}
                        {...register('phone')}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('phoneWillBeSaved') || `Se guardará como: ${userCountryCode}${watch('phone') || ''}`}
                    </p>
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleContinueToBusinessStep}
                    className="w-full"
                  >
                    {t('register.continue')}
                  </Button>
                </div>
              </div>
            )}

            {/* Module Selection */}
            {step === 'modules' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">{t('register.modules.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('register.modules.description')}
                  </p>
                </div>

                {/* Módulo de Citas */}
                <div
                  onClick={() => {
                    if (selectedModules.includes('appointments')) {
                      setSelectedModules(selectedModules.filter(m => m !== 'appointments'));
                    } else {
                      setSelectedModules([...selectedModules, 'appointments']);
                    }
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedModules.includes('appointments')
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedModules.includes('appointments')
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{t('register.modules.appointments')}</h4>
                        {selectedModules.includes('appointments') && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('register.modules.appointmentsDescription')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary">
                          {t('register.modules.freeTrial')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Módulo de Servicios */}
                <div
                  className="p-4 border-2 rounded-lg transition-all opacity-50 cursor-not-allowed border-border"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold">{t('register.modules.services')}</h4>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {t('register.modules.comingSoon')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('register.modules.servicesDescription')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t('register.modules.availableSoon')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedModules.length === 0 && (
                  <p className="text-sm text-destructive text-center">
                    {t('register.modules.selectAtLeastOne')}
                  </p>
                )}

                {/* Consentimiento SMS */}
                <div className="flex items-start gap-3 p-4 border-2 rounded-lg bg-muted/30">
                  <Checkbox
                    id="smsConsent"
                    checked={smsConsent}
                    onCheckedChange={handleSmsConsentChange}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="smsConsent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {t('register.smsConsent.title')}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('register.smsConsent.description')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('business')}
                    className="flex-1"
                  >
                    {t('register.back')}
                  </Button>
                  <Button
                    type="button"
                    disabled={isLoading || selectedModules.length === 0}
                    className="flex-1"
                    onClick={handleSubmit(onSubmit)}
                  >
                    {isLoading ? t('register.creating') : t('register.createAccount')}
                  </Button>
                </div>
              </div>
            )}

            {/* Business Information */}
            {step === 'business' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">{t('register.businessName')}</Label>
                  <Input
                    id="businessName"
                    placeholder={t('register.businessNamePlaceholder')}
                    {...register('businessName')}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">{errors.businessName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail">{t('register.businessEmail')}</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    placeholder={t('register.businessEmailPlaceholder')}
                    {...register('businessEmail')}
                  />
                  {errors.businessEmail && (
                    <p className="text-sm text-destructive">{errors.businessEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPhone">{t('register.businessPhone')}</Label>
                  <div className="flex gap-2">
                    <Select
                      value={businessCountryCode}
                      onValueChange={setBusinessCountryCode}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {COUNTRY_CODES.map((cc) => (
                          <SelectItem key={cc.code} value={cc.code}>
                            <div className="flex items-center gap-2">
                              <span>{cc.flag}</span>
                              <span className="font-mono text-sm">{cc.code}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="businessPhone"
                      type="tel"
                      placeholder={t('register.businessPhonePlaceholder') || '1234567890'}
                      {...register('businessPhone')}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('phoneWillBeSaved') || `Se guardará como: ${businessCountryCode}${watch('businessPhone') || ''}`}
                  </p>
                  {errors.businessPhone && (
                    <p className="text-sm text-destructive">{errors.businessPhone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">{t('register.businessAddress')}</Label>
                  <Input
                    id="businessAddress"
                    placeholder={t('register.businessAddressPlaceholder')}
                    {...register('businessAddress')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">{t('register.businessDescription')}</Label>
                  <Input
                    id="businessDescription"
                    placeholder={t('register.businessDescriptionPlaceholder')}
                    {...register('businessDescription')}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('user')}
                    className="flex-1"
                  >
                    {t('register.back')}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleContinueToModulesStep}
                    className="flex-1"
                  >
                    {t('register.continue')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-4 border-t pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              {t('register.alreadyHaveAccount')}{' '}
              <a href={`${baseUrl}/`} className="text-primary hover:underline">
                {t('register.signInHere')}
              </a>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              {t('register.trustIndicators')}
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Trust Indicators */}
      <div className="mt-8 sm:mt-12 text-center px-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          <span className="block sm:inline">✓ Sin tarjeta de crédito requerida</span>
          <span className="hidden sm:inline"> &nbsp;&nbsp;|&nbsp;&nbsp; </span>
          <span className="block sm:inline">✓ Cancela cuando quieras</span>
          <span className="hidden sm:inline"> &nbsp;&nbsp;|&nbsp;&nbsp; </span>
          <span className="block sm:inline">✓ Soporte incluido</span>
        </p>
      </div>
    </div>
  );
}





