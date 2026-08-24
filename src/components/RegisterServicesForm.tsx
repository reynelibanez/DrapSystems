import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Loader2, Building2, User, Mail, Lock, Phone, MapPin, Wrench, Moon, Sun, Languages, Eye, EyeOff, Check } from 'lucide-react';
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

export function RegisterServicesForm() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'user' | 'business'>('user');
  const [smsConsent, setSmsConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Define schema inside component to access t function
  const registerSchema = useMemo(() => z.object({
    // User data
    userEmail: z.string().email(t('register.error.invalidEmail')),
    userPassword: z.string()
      .min(8, t('register.passwordMinLength8'))
      .regex(/[A-Z]/, t('register.passwordNeedsUppercase'))
      .regex(/[a-z]/, t('register.passwordNeedsLowercase'))
      .regex(/[0-9]/, t('register.passwordNeedsNumber'))
      .regex(/[^A-Za-z0-9]/, t('register.passwordNeedsSpecial')),
    userPasswordConfirm: z.string().min(1, t('register.confirmPassword')),
    userFullName: z.string().min(2, t('register.error.fullNameMin')),
    userPhone: z.string().min(10, t('register.error.phoneMin')),
    
    // Business data
    businessName: z.string().min(2, t('register.error.businessNameMin')),
    businessEmail: z.string().email(t('register.error.invalidEmail')),
    businessPhone: z.string().min(10, t('register.error.phoneMin')),
    businessAddress: z.string().optional(),
    businessDescription: z.string().optional(),
    
    // SMS Consent
    smsConsent: z.boolean().default(false),
  }).refine((data) => data.userPassword === data.userPasswordConfirm, {
    message: t('register.error.passwordsDoNotMatch'),
    path: ['userPasswordConfirm'],
  }), [i18n.language]);

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      smsConsent: false,
    },
  });

  const password = watch('userPassword');
  const passwordConfirm = watch('userPasswordConfirm');

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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!smsConsent) {
      toast.error(t('registerServices.smsConsentRequiredTitle'), {
        description: t('registerServices.smsConsentRequiredMessage'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/register/create-services-business`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          smsConsent: true,
          module: 'services', // Especificar que es para el módulo de servicios
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('registerServices.error.createAccount'));
      }

      toast.success(t('registerServices.success.title'), {
        description: t('registerServices.success.message'),
      });

      setTimeout(() => {
        window.location.href = `${baseUrl}/`;
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      
      let errorMessage = t('registerServices.error.createAccount');
      let errorDescription = t('registerServices.error.tryAgain');
      
      if (error instanceof Error) {
        errorMessage = error.message.replace('Error: ', '');
        
        try {
          const errorData = JSON.parse(errorMessage);
          errorMessage = errorData.error || errorMessage;
          errorDescription = errorData.details || errorDescription;
        } catch {
          errorDescription = errorMessage;
          errorMessage = t('registerServices.error.createAccount');
        }
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full px-2 py-4">
      {/* Theme toggle and language selector */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card border border-border/50 transition-all shadow-lg"
            >
              <Languages className="h-5 w-5 text-foreground" />
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

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card border border-border/50 transition-all shadow-lg"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-foreground" />
          )}
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </div>

      {/* Hero Section - Módulo de Servicios */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Wrench className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">
          {t('registerServices.heroTitle')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('registerServices.heroSubtitle')}
        </p>
      </div>

      {/* Features Grid - Específico para Servicios */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="border-2">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg">{t('registerServices.feature1Title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('registerServices.feature1Description')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <User className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg">{t('registerServices.feature2Title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('registerServices.feature2Description')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-lg">{t('registerServices.feature3Title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('registerServices.feature3Description')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registration Form */}
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{t('registerServices.formTitle')}</CardTitle>
          <CardDescription>
            {t('registerServices.formDescription')}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setStep('user')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  step === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="font-medium">{t('registerServices.yourData')}</span>
              </button>
              <div className="w-12 h-0.5 bg-border" />
              <button
                type="button"
                onClick={() => setStep('business')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  step === 'business'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{t('registerServices.yourBusiness')}</span>
              </button>
            </div>

            {/* User Information */}
            {step === 'user' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left duration-300">
                <div className="space-y-2">
                  <Label htmlFor="userFullName">
                    <User className="w-4 h-4 inline mr-2" />
                    {t('register.fullName')} *
                  </Label>
                  <Input
                    id="userFullName"
                    {...register('userFullName')}
                    placeholder={t('register.fullNamePlaceholder')}
                    disabled={isLoading}
                  />
                  {errors.userFullName && (
                    <p className="text-sm text-destructive">{errors.userFullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userEmail">
                    <Mail className="w-4 h-4 inline mr-2" />
                    {t('register.email')} *
                  </Label>
                  <Input
                    id="userEmail"
                    type="email"
                    {...register('userEmail')}
                    placeholder={t('register.emailPlaceholder')}
                    disabled={isLoading}
                  />
                  {errors.userEmail && (
                    <p className="text-sm text-destructive">{errors.userEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userPassword">
                    <Lock className="w-4 h-4 inline mr-2" />
                    {t('register.password')} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="userPassword"
                      type={showPassword ? 'text' : 'password'}
                      {...register('userPassword')}
                      placeholder={t('register.passwordPlaceholder')}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.userPassword && (
                    <p className="text-sm text-destructive">{errors.userPassword.message}</p>
                  )}
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground">
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
                  <Label htmlFor="userPasswordConfirm">
                    <Lock className="w-4 h-4 inline mr-2" />
                    {t('register.confirmPassword')} *
                  </Label>
                  <div className="relative">
                    <Input
                      id="userPasswordConfirm"
                      type={showPasswordConfirm ? 'text' : 'password'}
                      {...register('userPasswordConfirm')}
                      placeholder={t('register.confirmPasswordPlaceholder')}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      disabled={isLoading}
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.userPasswordConfirm && (
                    <p className="text-sm text-destructive">{errors.userPasswordConfirm.message}</p>
                  )}
                  
                  {password && passwordConfirm && (
                    <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                      password === passwordConfirm
                        ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                    }`}>
                      {password === passwordConfirm ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{t('registerServices.passwordsMatch')}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>{t('register.error.passwordsDoNotMatch')}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userPhone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    {t('register.phone')} *
                  </Label>
                  <Input
                    id="userPhone"
                    type="tel"
                    {...register('userPhone')}
                    placeholder={t('register.phonePlaceholder')}
                    disabled={isLoading}
                  />
                  {errors.userPhone && (
                    <p className="text-sm text-destructive">{errors.userPhone.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Business Information */}
            {step === 'business' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    {t('register.businessName')} *
                  </Label>
                  <Input
                    id="businessName"
                    {...register('businessName')}
                    placeholder={t('register.businessNamePlaceholder')}
                    disabled={isLoading}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">{errors.businessName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail">
                    <Mail className="w-4 h-4 inline mr-2" />
                    {t('register.businessEmail')} *
                  </Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    {...register('businessEmail')}
                    placeholder={t('register.businessEmailPlaceholder')}
                    disabled={isLoading}
                  />
                  {errors.businessEmail && (
                    <p className="text-sm text-destructive">{errors.businessEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPhone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    {t('register.businessPhone')} *
                  </Label>
                  <Input
                    id="businessPhone"
                    type="tel"
                    {...register('businessPhone')}
                    placeholder={t('register.businessPhonePlaceholder')}
                    disabled={isLoading}
                  />
                  {errors.businessPhone && (
                    <p className="text-sm text-destructive">{errors.businessPhone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    {t('register.businessAddress')}
                  </Label>
                  <Input
                    id="businessAddress"
                    {...register('businessAddress')}
                    placeholder={t('register.businessAddressPlaceholder')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessDescription">{t('register.businessDescription')}</Label>
                  <Textarea
                    id="businessDescription"
                    {...register('businessDescription')}
                    placeholder={t('register.businessDescriptionPlaceholder')}
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                {/* Consentimiento SMS */}
                <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/50">
                  <Checkbox
                    id="smsConsent"
                    checked={smsConsent}
                    onCheckedChange={(checked) => {
                      const isChecked = checked === true;
                      setSmsConsent(isChecked);
                      setValue('smsConsent', isChecked);
                    }}
                    disabled={isLoading}
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="smsConsent"
                      className="text-sm font-medium cursor-pointer"
                    >
                      {t('registerServices.smsConsentLabel')} *
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('registerServices.smsConsentDescription')}
                    </p>
                  </div>
                </div>
                {!smsConsent && (
                  <p className="text-xs text-muted-foreground">
                    {t('registerServices.smsConsentRequired')}
                  </p>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-4 border-t">
            {step === 'user' ? (
              <Button
                type="button"
                onClick={() => setStep('business')}
                className="w-full"
                size="lg"
              >
                {t('register.continue')}
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('user')}
                  size="lg"
                  disabled={isLoading}
                >
                  {t('register.back')}
                </Button>
                <Button type="submit" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('registerServices.creating')}
                    </>
                  ) : (
                    <>
                      <Wrench className="mr-2 h-4 w-4" />
                      {t('register.createAccount')}
                    </>
                  )}
                </Button>
              </div>
            )}
            
            <div className="text-center text-sm text-muted-foreground w-full">
              {t('register.alreadyHaveAccount')}{' '}
              <a href={baseUrl} className="text-primary hover:underline font-medium">
                {t('register.signInHere')}
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Trust Indicators */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {t('registerServices.trustIndicators')}
        </p>
      </div>
    </div>
  );
}





