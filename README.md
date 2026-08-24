





# 📅 Sistema de Gestión de Citas Multiempresa

> Una aplicación completa de gestión de citas construida con React, Astro y Supabase

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.1.1-61dafb.svg)
![Astro](https://img.shields.io/badge/Astro-5.13.5-ff5d01.svg)
![Supabase](https://img.shields.io/badge/Supabase-3.2.0-3ecf8e.svg)

## 🌟 Características Principales

- ✅ **Gestión Multi-empresa**: Administra múltiples negocios desde una sola plataforma
- ✅ **Sistema de Roles**: Admin, Business Owner, Staff, Client
- ✅ **Gestión de Citas**: Calendario interactivo con vista diaria, semanal y mensual
- ✅ **Gestión de Clientes**: Perfiles completos con historial de citas y notas
- ✅ **Gestión de Servicios**: Catálogo de servicios por negocio
- ✅ **Gestión de Personal**: Asignación de staff a servicios y citas
- ✅ **Sistema de Suscripciones**: Integración con Stripe (4 planes disponibles)
- ✅ **Notificaciones**: Email, SMS y WhatsApp (según plan)
- ✅ **Recordatorios Automáticos**: Sistema de recordatorios configurables
- ✅ **Reportes y Estadísticas**: Análisis de citas, ingresos y rendimiento
- ✅ **Sistema de Backup**: Backup de datos (JSON) y backup completo (ZIP) 🆕
- ✅ **Responsive**: Optimizado para móvil, tablet y desktop
- ✅ **Temas**: Modo claro y oscuro

## 📦 Sistema de Backup

El sistema incluye un **sistema completo de backup** para administradores:

- 🔒 **Solo para Admins**: Botón visible únicamente para usuarios administradores
- 📥 **Un Solo Clic**: Descarga todos los datos del sistema en formato JSON
- 🔐 **Seguro**: Autenticación JWT y verificación de rol
- 📊 **Completo**: Incluye todas las tablas y estadísticas del sistema
- 📁 **Organizado**: Archivo JSON estructurado con metadata

**Ubicación**: Botón de descarga en la barra superior, al lado del botón de cambio de tema.

**Documentación**:
- [BACKUP_RAPIDO.md](BACKUP_RAPIDO.md) - Guía rápida de uso
- [SISTEMA_BACKUP.md](SISTEMA_BACKUP.md) - Documentación técnica completa
- [DEPLOY_BACKUP_PRODUCCION.md](DEPLOY_BACKUP_PRODUCCION.md) - Guía de despliegue

**Probar el sistema**:
```bash
npm run test-backup
```

### ⚠️ Error 403 en Producción

Si obtienes un error 403 al intentar descargar el backup en producción:

```
GET /api/admin/backup 403 (Forbidden)
Error: Acceso denegado. Solo administradores.
```

**Causa**: Variables de entorno no configuradas en Cloudflare Workers.

**Solución Rápida** (2 minutos):
```bash
# 1. Configurar service role key
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# 2. Verificar
npx wrangler secret list

# 3. Redeploy
npm run deploy
```

**Documentación**:
- [SOLUCION_RAPIDA_403_BACKUP.md](SOLUCION_RAPIDA_403_BACKUP.md) - Solución en 2 minutos
- [CONFIGURAR_CLOUDFLARE_VARS.md](CONFIGURAR_CLOUDFLARE_VARS.md) - Guía completa de configuración
- [SOLUCION_ERROR_403_BACKUP.md](SOLUCION_ERROR_403_BACKUP.md) - Troubleshooting detallado

**Verificar configuración**:
```bash
npm run check-cloudflare
```

## 💾 Sistema de Backup

### Dos Tipos de Backup Disponibles

#### 1. Backup de Datos (JSON)
- Solo base de datos
- Formato JSON legible
- ~100-500 KB
- Ideal para importar/exportar datos

#### 2. Backup Completo (ZIP) 🆕
- Base de datos + información del sistema
- Formato ZIP comprimido
- ~50-200 KB
- Incluye documentación y estadísticas

### Uso Rápido

**Desde la Interfaz**:
1. Iniciar sesión como administrador
2. Hacer clic en el botón de backup (↓)
3. Seleccionar tipo de backup:
   - "Backup de Datos" → JSON
   - "Backup Completo" → ZIP
4. Descargar archivo

**Desde la Terminal**:
```bash
# Probar backup de datos
npm run test-backup

# Probar backup completo
npm run test-backup-full
```

### Contenido del Backup Completo

```
booking-suite-backup-2025-01-XX.zip
├── database-backup.json    # Todos los datos
├── package.json            # Info del proyecto
├── README.md               # Instrucciones
└── backup-info.json        # Estadísticas
```

### Documentación

- **Guía rápida**: [GUIA_BACKUP_COMPLETO.md](GUIA_BACKUP_COMPLETO.md)
- **Documentación completa**: [BACKUP_COMPLETO.md](BACKUP_COMPLETO.md)
- **Sistema original**: [SISTEMA_BACKUP.md](SISTEMA_BACKUP.md)
- **Solución errores**: [SOLUCION_ERROR_403_BACKUP.md](SOLUCION_ERROR_403_BACKUP.md)

**Probar el sistema**:
```bash
npm run test-backup-full
```

### ⚠️ Error 403 en Producción

Si obtienes un error 403 al intentar descargar el backup completo en producción:

```
GET /api/admin/backup-full 403 (Forbidden)
Error: Acceso denegado. Solo administradores.
```

**Causa**: Variables de entorno no configuradas en Cloudflare Workers.

**Solución Rápida** (2 minutos):
```bash
# 1. Configurar service role key
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# 2. Verificar
npx wrangler secret list

# 3. Redeploy
npm run deploy
```

**Documentación**:
- [SOLUCION_RAPIDA_403_BACKUP.md](SOLUCION_RAPIDA_403_BACKUP.md) - Solución en 2 minutos
- [CONFIGURAR_CLOUDFLARE_VARS.md](CONFIGURAR_CLOUDFLARE_VARS.md) - Guía completa de configuración
- [SOLUCION_ERROR_403_BACKUP.md](SOLUCION_ERROR_403_BACKUP.md) - Troubleshooting detallado

**Verificar configuración**:
```bash
npm run check-cloudflare
```

## 🔧 Solución: Edición de Usuarios

El sistema incluye una **solución robusta para la edición de usuarios** que resuelve problemas de RLS (Row Level Security):

- 🔐 **Endpoint API Seguro**: Usa service role para bypasear RLS de forma controlada
- ✅ **Validación de Permisos**: Verifica roles antes de permitir actualizaciones
- 🏢 **Scope por Empresa**: Business owners solo pueden editar usuarios de su empresa
- 📝 **Logging Completo**: Auditoría de todas las actualizaciones
- 🎯 **Funciona Correctamente**: Los cambios se guardan y persisten en la base de datos

**Problema resuelto**: Anteriormente, al editar un usuario, los cambios no se guardaban en la base de datos debido a políticas RLS.

**Documentación**:
- [SOLUCION_RAPIDA_EDICION.md](SOLUCION_RAPIDA_EDICION.md) - Guía rápida de uso
- [DIAGRAMA_EDICION_USUARIOS.md](DIAGRAMA_EDICION_USUARIOS.md) - Diagramas visuales del flujo
- [RESUMEN_EJECUTIVO_EDICION.md](RESUMEN_EJECUTIVO_EDICION.md) - Resumen ejecutivo
- [SOLUCION_EDICION_USUARIOS.md](SOLUCION_EDICION_USUARIOS.md) - Documentación técnica completa

**Probar el sistema**:
```bash
npm run test-user-update
```

## ⚠️ IMPORTANTE: Antes de Empezar

**Si vas a usar el script de datos de prueba (`DATOS_DE_PRUEBA.sql`):**

1. **PRIMERO** regístrate en la aplicación con tu email
2. **SEGUNDO** abre `DATOS_DE_PRUEBA.sql` y reemplaza **TODAS** las instancias de `'TU_EMAIL_AQUI'` con tu email real
3. **TERCERO** ejecuta el script en Supabase SQL Editor

❌ **NO ejecutes el script sin reemplazar el email** o obtendrás errores como:
```
ERROR: null value in column "owner_id" violates not-null constraint
```

✅ **Solución:** Ver [SOLUCION_PROBLEMAS.md](SOLUCION_PROBLEMAS.md) para más detalles.

## 🚀 Inicio Rápido

### Para reynelibanez@gmail.com

**📖 Sigue la guía paso a paso:** [GUIA_INICIO_RAPIDO.md](GUIA_INICIO_RAPIDO.md)

Esta guía te llevará de 0 a 100 en menos de 10 minutos con:
- ✅ Configuración de Supabase
- ✅ Setup de la base de datos
- ✅ Creación de tu usuario admin
- ✅ 6 empresas de ejemplo
- ✅ 24 servicios pre-configurados

### Inicio Rápido (Resumen)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env con tus credenciales de Supabase
# Ver GUIA_INICIO_RAPIDO.md para detalles

# 3. Ejecutar en Supabase SQL Editor:
#    - supabase-schema.sql
#    - SETUP_COMPLETO.sql

# 4. Iniciar la aplicación
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321) en tu navegador.

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [GUIA_INICIO_RAPIDO.md](GUIA_INICIO_RAPIDO.md) | Guía paso a paso para empezar |
| [SISTEMA_SUSCRIPCIONES_NOTIFICACIONES.md](SISTEMA_SUSCRIPCIONES_NOTIFICACIONES.md) | Sistema de pagos y notificaciones |
| [CONFIGURACION_STRIPE_NOTIFICACIONES.md](CONFIGURACION_STRIPE_NOTIFICACIONES.md) | Configurar Stripe, Resend y Twilio |
| [BACKUP_RAPIDO.md](BACKUP_RAPIDO.md) | Guía rápida del sistema de backup |
| [SISTEMA_BACKUP.md](SISTEMA_BACKUP.md) | Documentación técnica del backup |
| [DEPLOY_BACKUP_PRODUCCION.md](DEPLOY_BACKUP_PRODUCCION.md) | Desplegar backup en producción |
| [SOLUCION_RAPIDA_EDICION.md](SOLUCION_RAPIDA_EDICION.md) | Guía rápida de edición de usuarios |
| [DIAGRAMA_EDICION_USUARIOS.md](DIAGRAMA_EDICION_USUARIOS.md) | Diagramas del flujo de edición |
| [RESUMEN_EJECUTIVO_EDICION.md](RESUMEN_EJECUTIVO_EDICION.md) | Resumen ejecutivo de la solución |
| [SOLUCION_EDICION_USUARIOS.md](SOLUCION_EDICION_USUARIOS.md) | Documentación técnica completa |
| [PROYECTO_CITAS.md](PROYECTO_CITAS.md) | Documentación completa del proyecto |
| [ENV_SETUP.md](ENV_SETUP.md) | Configuración de variables de entorno |
| [ARQUITECTURA.md](ARQUITECTURA.md) | Arquitectura técnica del sistema |
| [ROLES_Y_PERMISOS.md](ROLES_Y_PERMISOS.md) | Detalles de roles y permisos |
| [FAQ.md](FAQ.md) | Preguntas frecuentes |
| [SOLUCION_PROBLEMAS.md](SOLUCION_PROBLEMAS.md) | Solución a problemas comunes |

## 👥 Roles del Sistema

### 🔴 Admin
- Gestiona todas las empresas
- Modifica planes de suscripción
- Administra todos los usuarios
- Acceso a estadísticas globales

### 🟢 Business Owner
- Gestiona su empresa
- Administra servicios y personal
- Ve todas las citas de su empresa
- Configura su negocio

### 🔵 Staff
- Gestiona sus propias citas
- Confirma y completa citas
- Ve sus clientes
- Actualiza estados de citas

### 🟡 Client
- Reserva citas
- Ve su historial
- Cancela citas futuras
- Selecciona servicios y personal

## 💎 Planes de Suscripción

| Plan | Precio | Usuarios | Clientes | Notificaciones | Recordatorios |
|------|--------|----------|----------|----------------|---------------|
| **Trial** | Gratis (30 días) | 1 | ∞ | ❌ | ❌ |
| **Profesional** | $29/mes | 1 | 500 | Email + SMS | 24h y 2h antes |
| **Business** | $79/mes | 5 | 1,000 | Email + SMS | 24h y 2h antes |
| **Enterprise** | $199/mes | ∞ | ∞ | Email + SMS | 24h y 2h antes |

**📖 Documentación completa:** [SISTEMA_SUSCRIPCIONES_NOTIFICACIONES.md](SISTEMA_SUSCRIPCIONES_NOTIFICACIONES.md)

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript
- **Framework**: Astro 5
- **Backend**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Pagos**: Stripe
- **Email**: Resend
- **SMS**: Twilio
- **UI**: shadcn/ui + Tailwind CSS
- **Gráficos**: Recharts
- **Deployment**: Cloudflare Workers

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/
│   │   ├── admin/          # Componentes de administración
│   │   ├── business/       # Componentes de business owner
│   │   ├── staff/          # Componentes de personal
│   │   ├── client/         # Componentes de cliente
│   │   ├── dashboards/     # Dashboards por rol
│   │   └── ui/             # Componentes UI (shadcn)
│   ├── lib/
│   │   ├── supabase.ts     # Cliente de Supabase
│   │   └── database.types.ts
│   └── pages/
│       └── index.astro     # Página principal
├── supabase-schema.sql     # Schema de la base de datos
└── docs/                   # Documentación
```

## 🔐 Seguridad

- ✅ Autenticación con JWT
- ✅ Row Level Security (RLS)
- ✅ Validación de permisos por rol
- ✅ Aislamiento de datos por empresa
- ✅ Variables de entorno seguras

## 🎯 Casos de Uso

### Salón de Belleza
- Gestión de estilistas
- Reserva de servicios (corte, tinte, manicure)
- Recordatorios automáticos

### Clínica Dental
- Agenda de dentistas
- Servicios especializados
- Historial de pacientes

### Gimnasio
- Clases grupales
- Entrenamiento personal
- Evaluaciones físicas

### Veterinaria
- Consultas veterinarias
- Vacunación
- Peluquería canina

## 📊 Características Implementadas y Futuras

### ✅ Implementado
- [x] Integración de pagos (Stripe)
- [x] Envío de notificaciones (Email y SMS)
- [x] Recordatorios automáticos (24h y 2h antes)
- [x] Sistema de suscripciones con 4 planes
- [x] Webhooks de Stripe
- [x] Cola de notificaciones

### 🔜 Próximamente
- [ ] Calendario visual interactivo mejorado
- [ ] Sistema de reseñas y calificaciones
- [ ] Reportes avanzados con exportación
- [ ] API pública REST
- [ ] App móvil (React Native)
- [ ] Integración con Google Calendar
- [ ] Notificaciones push
- [ ] Sistema de fidelización

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Scripts Disponibles

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Preview de la build
npm run astro        # CLI de Astro
npm run test-backup  # Probar sistema de backup
```

## 🐛 Reportar Bugs

Si encuentras un bug, por favor abre un issue con:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado
- Screenshots (si aplica)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) - Backend as a Service
- [Astro](https://astro.build) - Framework web
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS

## 📞 Contacto

¿Preguntas? Revisa la [FAQ](FAQ.md) o la documentación completa.

---

**Desarrollado con ❤️ usando React, Astro y Supabase**

⭐ Si te gusta este proyecto, dale una estrella en GitHub!
















