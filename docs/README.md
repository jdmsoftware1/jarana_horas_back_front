# 🕐 Sistema de Registro Horario - JARANA

Un sistema completo de gestión de recursos humanos con **autenticación TOTP**, **portal del empleado**, **asistente IA integrado** y **dashboard administrativo** avanzado.

## 🏗️ Arquitectura del Sistema

### 🎯 **Componentes Principales**

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA JARANA                           │
├─────────────────────────────────────────────────────────────┤
│  🔐 AUTENTICACIÓN TOTP  │  🤖 ASISTENTE IA  │  📊 ANALYTICS │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 PORTAL EMPLEADO           🛠️ DASHBOARD ADMIN            │
│  • Dashboard personal         • Gestión empleados          │
│  • Mis fichajes              • Últimos registros           │
│  • Mis vacaciones            • Aprobación vacaciones       │
│  • Reportes personales       • Control del sistema         │
│  • Chat IA integrado         • Estadísticas globales       │
│                                                             │
│  ⏰ KIOSK FICHAJE                                           │
│  • Entrada/Salida simple                                   │
│  • Autenticación TOTP                                      │
│  • Feedback 5 segundos                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 **Flujo de Trabajo Moderno**

#### 🌅 **Empleados**
1. **Fichaje Diario** → `/employee-kiosk` → Código + TOTP → Entrada/Salida
2. **Portal Personal** → `/employee-portal` → Dashboard + Fichajes + Vacaciones + Reportes
3. **Consultas IA** → Chat integrado → "¿Cuántas horas trabajé?" → Respuesta inteligente
4. **Solicitar Vacaciones** → IA o formulario → Aprobación automática del supervisor

#### 👨‍💼 **Supervisores/Admins**
1. **Dashboard Central** → `/admin` → Vista completa del sistema
2. **Gestión Empleados** → Crear/editar → QR codes automáticos
3. **Últimos Fichajes** → Tiempo real → Estado de cada empleado
4. **Aprobación Vacaciones** → Un clic → Notificación automática

## 🚀 Características Principales

### 🔐 **Seguridad Avanzada**
- **Autenticación TOTP** con códigos de 6 dígitos
- **QR Codes automáticos** para configuración
- **Códigos únicos** por empleado
- **Validación temporal** (30 segundos)
- **Estados activo/inactivo** por empleado

### 🤖 **Inteligencia Artificial**
- **JARANA AI** - Asistente conversacional
- **Consultas inteligentes** sobre datos personales
- **Creación automática** de solicitudes de vacaciones
- **Análisis de patrones** de trabajo
- **Recomendaciones personalizadas** de productividad
- **Procesamiento de lenguaje natural** en español

### 👤 **Portal del Empleado Completo**
- **Dashboard personalizado** con métricas propias
- **Mis Fichajes** - Historial completo con filtros
- **Mis Vacaciones** - Crear y gestionar solicitudes
- **Reportes Personales** - Análisis de rendimiento
- **Chat IA integrado** en todas las secciones

### 🛠️ **Dashboard Administrativo**
- **Gestión completa** de empleados
- **Últimos fichajes** en tiempo real
- **Aprobación de vacaciones** con un clic
- **Control del sistema** global
- **Estadísticas** y métricas avanzadas

### 📊 **Analytics y Reportes**
- **Cálculo automático** de puntualidad
- **Detección de llegadas tarde** (después 9:15 AM)
- **Análisis de productividad** personal
- **Métricas de asistencia** por período
- **Recomendaciones IA** basadas en datos

### 🎨 **Experiencia de Usuario**
- **Diseño responsive** para todos los dispositivos
- **Interfaz intuitiva** con navegación por tabs
- **Feedback visual** inmediato (5 segundos)
- **Estados de carga** y spinners
- **Colores consistentes** y iconografía clara

## 📱 Interfaces del Sistema

### 🏠 **Página Principal** (`/`)
- **Selector de acceso** dinámico
- **Estado del sistema** en tiempo real
- **Información del supervisor** activo
- **Duración de sesión** actual

### 👨‍💼 **Dashboard Supervisor** (`/admin-dashboard`)
- **4 secciones principales**: Dashboard, Empleados, Registros, Configuración
- **Estadísticas en tiempo real**
- **Gestión completa de empleados**
- **Generación de QR codes**
- **Exportación de reportes**
- **Control de activación/desactivación**

### 👷‍♂️ **Kiosk Empleados** (`/employee-kiosk`)
- **Interfaz tablet optimizada**
- **Login: Código + Google Authenticator**
- **Fichaje automático** según estado
- **Feedback visual** de éxito/error
- **Auto-limpieza** después de fichar
- **Solo disponible** con sistema activo

## 🛠️ Tecnologías

### **Frontend**
- **React 18** con Vite
- **Clerk** para autenticación supervisor
- **React Router** para navegación
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **Date-fns** para fechas

### **Backend**
- **Node.js** con Express
- **Clerk SDK** para verificación
- **MySQL** con Sequelize ORM
- **Speakeasy** para Google Authenticator
- **Express Validator** para validación

### **Deployment**
- **Vercel** para hosting
- **Clerk** para autenticación
- **PlanetScale/Neon** para base de datos

## ⚡ Instalación y Configuración

### 1. **Clonar Repositorio**
```bash
git clone https://github.com/tu-usuario/registro-horario.git
cd registro-horario
```

### 2. **Configurar Frontend**
```bash
cd app/front
npm install

# Crear .env con tu clave de Clerk
echo "VITE_CLERK_PUBLISHABLE_KEY=pk_test_tu_clave_aqui" > .env
echo "VITE_API_URL=http://localhost:3000/api" >> .env
```

### 3. **Configurar Backend**
```bash
cd ../back
npm install

# Configurar base de datos
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. **Ejecutar en Desarrollo**
```bash
# Frontend
cd app/front
npm run dev

# Backend (en otra terminal)
cd app/back
npm run dev
```

## 🔑 Configuración de Clerk

### 1. **Crear Cuenta en Clerk**
1. Ve a [clerk.com](https://clerk.com)
2. Crea una aplicación nueva
3. Copia la **Publishable Key**

### 2. **Configurar Variables**
```bash
# En app/front/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_tu_clave_de_clerk
VITE_API_URL=http://localhost:3000/api
```

### 3. **Configurar Usuarios**
En tu Clerk Dashboard:
- **Crear usuario supervisor**
- **Configurar metadata** (opcional):
  ```json
  {
    "role": "admin",
    "employeeCode": "SUP001"
  }
  ```

## 📊 Uso del Sistema

### 🔐 **Para Supervisores**

#### **Activar Sistema**
1. Ir a la aplicación
2. Clic en **"Activar Sistema"**
3. Login con Clerk (email/password)
4. Sistema activado automáticamente

#### **Acceder al Dashboard**
1. Una vez activado, clic **"Dashboard Supervisor"**
2. Acceso completo a todas las funciones
3. Gestión de empleados y reportes

#### **Desactivar Sistema**
1. En el dashboard, botón **"Desactivar Sistema"**
2. Confirmar acción
3. Kiosk se bloquea hasta mañana

### 👷‍♂️ **Para Empleados**

#### **Fichar Entrada/Salida**
1. Ir al kiosk (solo si sistema activo)
2. Introducir **código de empleado**
3. Introducir **código Google Authenticator**
4. Fichaje automático según estado
5. Confirmación visual

## 🏛️ Guía del Dashboard

### 📊 **Pestaña Dashboard**
- **Estadísticas generales**: Total empleados, fichajes hoy, horas trabajadas
- **Actividad reciente**: Últimos fichajes en tiempo real
- **Gráficos**: Visualización de datos

### 👥 **Pestaña Empleados**
- **Lista completa** de empleados
- **Crear nuevo empleado** con botón "+"
- **Generar QR codes** para Google Authenticator
- **Editar/eliminar** empleados existentes
- **Estados**: Activo/Inactivo

### 📋 **Pestaña Registros**
- **Todos los fichajes** del sistema
- **Filtros avanzados** por fecha, empleado, tipo
- **Exportar datos** en CSV/Excel
- **Búsqueda** en tiempo real

### ⚙️ **Pestaña Configuración**
- **Configuración general**: Nombre empresa, horarios
- **Configuración de seguridad**: Opciones de autenticación
- **Guardar cambios** persistentes

## 🔒 Seguridad del Sistema

### **Niveles de Protección**
1. **Clerk Authentication** → Primera barrera
2. **ProtectedAdminRoute** → Verificación de rutas
3. **AdminDashboard** → Doble verificación interna

### **Características de Seguridad**
- ✅ **Imposible acceder** sin Clerk
- ✅ **Redirecciones automáticas** si no autenticado
- ✅ **Estados persistentes** con localStorage
- ✅ **Expiración diaria** automática
- ✅ **Google Authenticator** para empleados

## 🚀 Deploy en Vercel

### 1. **Preparar Proyecto**
```bash
# Asegurar que vercel.json existe
# Configurar variables de entorno
```

### 2. **Deploy**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. **Variables de Entorno en Vercel**
- `VITE_CLERK_PUBLISHABLE_KEY`
- `DATABASE_URL`
- `CLERK_SECRET_KEY`

## 🐛 Troubleshooting

### **Sistema no se activa después del login**
- Verificar clave de Clerk en `.env`
- Comprobar consola del navegador
- Verificar localStorage: `jarana_system_session`

### **Kiosk no disponible**
- Verificar que el sistema esté activo
- Comprobar que el supervisor haya hecho login
- Revisar fecha de activación (expira diariamente)

### **Dashboard hace loop**
- Verificar autenticación de Clerk
- Comprobar ProtectedAdminRoute
- Revisar redirecciones en App.jsx

## 📄 Documentación Adicional

- [**AUTHENTICATION.md**](./AUTHENTICATION.md) - Guía completa de autenticación
- [**DASHBOARD_GUIDE.md**](./DASHBOARD_GUIDE.md) - Manual del dashboard
- [**VERCEL_DEPLOY.md**](./VERCEL_DEPLOY.md) - Guía de despliegue

## 📞 Soporte

¿Problemas? Contacta con el equipo de desarrollo o revisa la documentación adicional.


---

**Desarrollado con ❤️ usando React + Clerk + Node.js**
