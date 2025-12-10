# 🎯 CONTEXT PROMPT - Sistema de Registro Horario AliadaDigital

## 📋 INFORMACIÓN DEL PROYECTO

**Nombre**: Sistema de Registro Horario AliadaDigital  
**Tipo**: Aplicación web full-stack para gestión de recursos humanos  
**Estado**: Producción - Desplegado en Render  
**Versión**: 1.1.0  
**Última Actualización**: 02/12/2024

---

## 🌐 URLS DE PRODUCCIÓN

**Backend**: https://jarana-horas-back.onrender.com  
**Frontend**: https://jarana-horas-back-front-1.onrender.com  
**Base de Datos**: PostgreSQL en Render (AliadaDigital-registro-db)

**Desarrollo Local**:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

---

## 🏗️ ARQUITECTURA TÉCNICA

### **Backend (Node.js + Express)**
- **Runtime**: Node.js 18+
- **Framework**: Express 4.x
- **Base de datos**: PostgreSQL 14+ con Sequelize ORM
- **Autenticación**: 
  - JWT (JSON Web Tokens)
  - Google OAuth 2.0
  - TOTP (2FA)
- **IA**: OpenAI GPT-4o-mini + Embeddings
- **Seguridad**: Helmet, CORS, Rate Limiting
- **API REST**: Endpoints completos para todas las funcionalidades

### **Frontend (React + Vite)**
- **Framework**: React 18 con hooks
- **Build Tool**: Vite 4.x
- **Estilos**: TailwindCSS 3.x + componentes personalizados
- **Iconos**: Lucide React
- **Routing**: React Router DOM 6.x
- **Estado**: Context API + useState/useEffect
- **HTTP Client**: Axios

### **Infraestructura (Render)**
- **Backend**: Web Service (Node)
- **Frontend**: Static Site
- **Base de Datos**: PostgreSQL Managed
- **SSL**: Habilitado automáticamente
- **Dominio**: onrender.com

---

## 📁 ESTRUCTURA DEL PROYECTO

```
registro_horario/
├── src/                          # Backend Node.js
│   ├── models/                   # Modelos Sequelize
│   │   ├── Employee.js           # Empleados
│   │   ├── Record.js             # Registros de entrada/salida
│   │   ├── Schedule.js           # Horarios
│   │   ├── ScheduleTemplate.js   # Plantillas de horarios
│   │   ├── WeeklySchedule.js     # Horarios semanales
│   │   ├── DailyException.js     # Excepciones diarias
│   │   ├── ScheduleBreak.js      # Descansos
│   │   └── Vacation.js           # Vacaciones
│   ├── routes/                   # Rutas API
│   │   ├── auth.js               # Autenticación (JWT + Google OAuth)
│   │   ├── employees.js          # Gestión de empleados
│   │   ├── records.js            # Registros
│   │   ├── admin.js              # Funciones admin
│   │   ├── kiosk.js              # Kiosk de fichaje
│   │   ├── schedules.js          # Horarios
│   │   ├── vacations.js          # Vacaciones
│   │   └── ai.js                 # IA y chat
│   ├── services/                 # Servicios
│   │   ├── embeddingService.js   # Embeddings OpenAI
│   │   └── enhancedAIService.js  # IA con RAG
│   ├── middleware/               # Middlewares
│   │   ├── auth.js               # Verificación JWT
│   │   └── errorHandler.js       # Manejo de errores
│   ├── config/                   # Configuración
│   │   ├── database.js           # Conexión PostgreSQL
│   │   ├── env.js                # Variables de entorno
│   │   └── passport.js           # Estrategias OAuth
│   └── index.js                  # Entry point
│
├── client/                       # Frontend React
│   ├── src/
│   │   ├── pages/                # Páginas principales
│   │   │   ├── HomePage.jsx      # Página de inicio
│   │   │   ├── AdminDashboard.jsx # Dashboard admin
│   │   │   ├── EmployeePortal.jsx # Portal empleado
│   │   │   ├── EmployeeKioskPage.jsx # Kiosk de fichaje
│   │   │   ├── AdminLoginPage.jsx # Login admin
│   │   │   └── AuthCallback.jsx  # Callback OAuth
│   │   ├── components/           # Componentes reutilizables
│   │   │   ├── Navbar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── context/              # Context API
│   │   │   └── AuthContext.jsx   # Contexto de autenticación
│   │   ├── services/             # Servicios API
│   │   │   └── api.js            # Cliente Axios
│   │   ├── utils/                # Utilidades
│   │   ├── App.jsx               # Componente principal
│   │   └── main.jsx              # Entry point
│   ├── public/                   # Assets estáticos
│   │   ├── images/               # Imágenes (logo, etc.)
│   │   ├── _redirects            # Configuración SPA
│   │   └── _headers              # Headers HTTP
│   ├── .env                      # Variables de entorno (NO commitear)
│   ├── .env.example              # Ejemplo de variables
│   ├── package.json
│   ├── vite.config.js            # Configuración Vite
│   └── tailwind.config.js        # Configuración Tailwind
│
├── docs2/                        # Documentación actualizada
│   ├── RENDER_DEPLOYMENT.md     # Guía de deploy en Render
│   ├── GOOGLE_OAUTH_SETUP.md    # Configuración Google OAuth
│   ├── PROJECT_SETUP.md         # Setup del proyecto
│   ├── UPDATES.md               # Historial de cambios
│   └── CONTEXT_PROMPT.md        # Este archivo
│
├── .env                          # Variables backend (NO commitear)
├── .env.example                  # Ejemplo variables backend
├── .gitignore                    # Archivos ignorados
├── package.json                  # Dependencias backend
├── render.yaml                   # Configuración Render
└── README.md                     # Documentación principal
```

---

## 🎯 FUNCIONALIDADES PRINCIPALES

### **1. 🔐 Sistema de Autenticación**

#### **Google OAuth 2.0 (Administradores)**
- Login con cuenta de Google
- JWT tokens (access + refresh)
- Sesiones seguras
- Callback: `/auth/google/callback`

#### **TOTP 2FA (Empleados)**
- Códigos de 6 dígitos (30 segundos)
- QR codes para Google Authenticator
- Códigos de empleado únicos (ej: EMP123456)
- Estados: activo/inactivo

### **2. ⏰ Sistema de Fichaje**

#### **Kiosk Web** (`/employee-kiosk`)
- Interfaz simple y rápida
- Validaciones:
  - No permitir doble check-in
  - No permitir check-out sin check-in
- Tracking de dispositivo
- Confirmación visual (5 segundos)
- Auto-limpieza del formulario

#### **Tipos de Registro**
- `checkin`: Entrada
- `checkout`: Salida
- `break_start`: Inicio de pausa
- `break_end`: Fin de pausa

### **3. 👤 Portal del Empleado** (`/employee-portal`)

#### **Dashboard Personal**
- Estado actual (dentro/fuera)
- Horas trabajadas (hoy, semana, mes)
- Vacaciones disponibles/usadas
- Próximos eventos

#### **Mis Fichajes**
- Historial completo de registros
- Vista agrupada por día con timeline
- Cálculo automático de horas trabajadas
- Filtros: hoy, semana, mes, personalizado
- Paginación

#### **Mis Vacaciones**
- Crear solicitudes
- Ver estado (pendiente/aprobada/rechazada)
- Días disponibles

#### **Chat IA**
- Asistente inteligente
- Consultas en lenguaje natural
- Acceso a datos personales

### **4. 🛠️ Dashboard Administrativo** (`/admin`)

#### **Gestión de Empleados**
- CRUD completo
- Generación de QR codes
- Activar/desactivar empleados
- Asignación de horarios
- Exportar datos

#### **Visualización de Registros**
- Todos los fichajes del sistema
- Vista agrupada por empleado y día
- Filtros avanzados:
  - Por empleado
  - Por fecha (hoy, semana, mes, personalizado)
  - Por tipo de registro
- Timeline visual
- Cálculo de horas trabajadas
- Paginación

#### **Gestión de Horarios**
- Horarios base
- Plantillas de horarios
- Horarios semanales
- Excepciones diarias
- Pausas configurables
- Vista semanal

#### **Gestión de Vacaciones**
- Aprobar/rechazar solicitudes
- Ver calendario de vacaciones
- Estadísticas de uso
- Historial completo

#### **Gestión de IA**
- Subir documentos de conocimiento
- Ver/eliminar documentos
- Instrucciones personalizadas
- Estadísticas del sistema
- Recargar base de conocimiento

#### **Control del Sistema**
- Activar/desactivar fichaje global
- Configuración general
- Logs y auditoría

### **5. 🤖 Asistente IA (AliadaDigital AI)**

#### **Características**
- RAG (Retrieval Augmented Generation)
- Embeddings con OpenAI
- Búsqueda semántica en documentos
- Consultas SQL dinámicas
- Respuestas contextualizadas

#### **Capacidades**
- Consultas sobre horas trabajadas
- Análisis de puntualidad
- Estado de vacaciones
- Creación de solicitudes
- Estadísticas personalizadas
- Recomendaciones basadas en patrones
- Acceso a documentación del sistema

---

## 🗄️ MODELOS DE BASE DE DATOS

### **Employee (Empleados)**
```javascript
{
  id: UUID (PK),
  name: String,
  email: String (unique),
  employeeCode: String (unique, ej: EMP123456),
  pin: String (hashed),
  role: Enum ('admin', 'employee'),
  isActive: Boolean,
  totpSecret: String,
  qrCodeUrl: String,
  googleId: String (para OAuth),
  profilePhoto: String,
  authMethod: Enum ('pin', 'google', 'totp'),
  createdAt: Date,
  updatedAt: Date
}
```

### **Record (Registros)**
```javascript
{
  id: UUID (PK),
  employeeId: UUID (FK → Employee),
  type: Enum ('checkin', 'checkout', 'break_start', 'break_end'),
  timestamp: Date,
  device: String,
  location: String (opcional),
  notes: String (opcional),
  createdAt: Date,
  updatedAt: Date
}
```

### **Schedule (Horarios)**
```javascript
{
  id: UUID (PK),
  employeeId: UUID (FK → Employee),
  dayOfWeek: Integer (0-6),
  startTime: Time,
  endTime: Time,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **Vacation (Vacaciones)**
```javascript
{
  id: UUID (PK),
  employeeId: UUID (FK → Employee),
  startDate: Date,
  endDate: Date,
  days: Integer,
  status: Enum ('pending', 'approved', 'rejected'),
  reason: String (opcional),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 ENDPOINTS API PRINCIPALES

### **Autenticación** (`/auth` y `/api/auth`)
```
GET  /auth/google                    # Iniciar OAuth
GET  /auth/google/callback           # Callback OAuth
POST /api/auth/login                 # Login con PIN
POST /api/auth/verify-totp           # Verificar 2FA
POST /api/auth/refresh               # Refresh token
POST /api/auth/logout                # Logout
```

### **Empleados** (`/api/employees`)
```
GET    /api/employees                # Listar todos
GET    /api/employees/:id            # Obtener uno
POST   /api/employees                # Crear
PUT    /api/employees/:id            # Actualizar
DELETE /api/employees/:id            # Eliminar
POST   /api/employees/:id/qr         # Generar QR
PUT    /api/employees/:id/activate   # Activar
PUT    /api/employees/:id/deactivate # Desactivar
```

### **Registros** (`/api/records`)
```
GET    /api/records/all              # Todos los registros
GET    /api/records/employee/:id     # Por empleado
POST   /api/records                  # Crear registro
DELETE /api/records/:id              # Eliminar
GET    /api/records/stats            # Estadísticas
```

### **Kiosk** (`/api/kiosk`)
```
POST /api/kiosk/checkin              # Fichar entrada
POST /api/kiosk/checkout             # Fichar salida
POST /api/kiosk/verify-totp          # Verificar TOTP
```

### **Vacaciones** (`/api/vacations`)
```
GET    /api/vacations                # Listar todas
GET    /api/vacations/employee/:id   # Por empleado
POST   /api/vacations                # Crear solicitud
PUT    /api/vacations/:id/approve    # Aprobar
PUT    /api/vacations/:id/reject     # Rechazar
DELETE /api/vacations/:id            # Eliminar
```

### **IA** (`/api/ai`)
```
POST   /api/ai/chat                  # Chat con IA
POST   /api/ai/upload-document       # Subir documento
GET    /api/ai/view-document/:name   # Ver documento
DELETE /api/ai/delete-document/:name # Eliminar documento
GET    /api/ai/knowledge-stats       # Estadísticas
POST   /api/ai/reload-knowledge      # Recargar conocimiento
GET    /api/ai/custom-instructions   # Obtener instrucciones
POST   /api/ai/custom-instructions   # Guardar instrucciones
```

### **Horarios** (`/api/schedules`)
```
GET    /api/schedules                # Listar todos
GET    /api/schedules/employee/:id   # Por empleado
POST   /api/schedules                # Crear
PUT    /api/schedules/:id            # Actualizar
DELETE /api/schedules/:id            # Eliminar
```

### **Plantillas de Horarios** (`/api/schedule-templates`)
```
GET    /api/schedule-templates       # Listar plantillas
POST   /api/schedule-templates       # Crear plantilla
PUT    /api/schedule-templates/:id   # Actualizar plantilla
DELETE /api/schedule-templates/:id   # Eliminar plantilla
```

### **Horarios Semanales** (`/api/weekly-schedules`)
```
GET    /api/weekly-schedules         # Listar horarios semanales
POST   /api/weekly-schedules         # Crear horario semanal
PUT    /api/weekly-schedules/:id     # Actualizar horario semanal
DELETE /api/weekly-schedules/:id     # Eliminar horario semanal
```

### **Excepciones Diarias** (`/api/daily-exceptions`)
```
GET    /api/daily-exceptions         # Listar excepciones
POST   /api/daily-exceptions         # Crear excepción
PUT    /api/daily-exceptions/:id     # Actualizar excepción
DELETE /api/daily-exceptions/:id     # Eliminar excepción
```

### **Programación Avanzada** (`/api/advanced-scheduling`)
```
GET    /api/advanced-scheduling      # Obtener programación avanzada
POST   /api/advanced-scheduling      # Crear programación avanzada
```

### **Descansos en Horarios** (`/api/schedule-breaks`)
```
GET    /api/schedule-breaks          # Listar descansos
POST   /api/schedule-breaks          # Crear descanso
PUT    /api/schedule-breaks/:id      # Actualizar descanso
DELETE /api/schedule-breaks/:id      # Eliminar descanso
```

### **Descansos Avanzados** (`/api/advanced-breaks`)
```
GET    /api/advanced-breaks          # Obtener descansos avanzados
POST   /api/advanced-breaks          # Crear descanso avanzado
```

### **Categorías de Ausencias** (`/api/absence-categories`)
```
GET    /api/absence-categories       # Listar categorías
POST   /api/absence-categories       # Crear categoría
PUT    /api/absence-categories/:id   # Actualizar categoría
DELETE /api/absence-categories/:id   # Eliminar categoría
```

### **Conversaciones IA** (`/api/ai-conversations`)
```
GET    /api/ai-conversations         # Listar conversaciones
GET    /api/ai-conversations/:id     # Obtener conversación
POST   /api/ai-conversations         # Crear conversación
DELETE /api/ai-conversations/:id     # Eliminar conversación
```

### **Documentos** (`/api/documents`)
```
GET    /api/documents                # Listar documentos
GET    /api/documents/:id            # Obtener documento
POST   /api/documents                # Subir documento
DELETE /api/documents/:id            # Eliminar documento
```

---

## 🔐 VARIABLES DE ENTORNO

### **Backend (`.env` en raíz)**
```bash
# Entorno
NODE_ENV=production|development
PORT=3000

# Base de Datos
DATABASE_URL=postgresql://user:pass@host:5432/db

# Seguridad (generar con crypto.randomBytes(32).toString('hex'))
JWT_SECRET=<32+ caracteres>
SESSION_SECRET=<32+ caracteres diferente>

# Google OAuth
GOOGLE_CLIENT_ID=<client_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<client_secret>
GOOGLE_CALLBACK_URL=https://backend.onrender.com/auth/google/callback

# URLs
FRONTEND_URL=https://frontend.onrender.com
CLIENT_URL=https://frontend.onrender.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Feature Flags
ENABLE_AI_CHAT=true
ENABLE_AI_UTILS=true
ENABLE_2FA=true
ENABLE_GOOGLE_AUTH=true

# OpenAI (opcional)
OPENAI_API_KEY=sk-<api_key>
```

### **Frontend (`client/.env`)**
```bash
# API
VITE_API_URL=https://backend.onrender.com

# Configuración
VITE_APP_NAME=AliadaDigital Registro Horario
VITE_ENVIRONMENT=production|development

# Feature Flags
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_AI_UTILS=true
```

---

## 🎨 ESTILOS Y DISEÑO

### **Paleta de Colores (Tailwind)**
```javascript
colors: {
  brand: {
    dark: '#4A2900',      // Fondo principal
    deep: '#2E1800',      // Sombras / contornos
    medium: '#7A4E1E',    // Marrón medio
    light: '#C47A3F',     // Acento principal (naranja terracota)
    accent: '#D6B48D',    // Complementario cálido
    cream: '#F8ECDC',     // Texto claro / logo
  },
  neutral: {
    light: '#FAF6F3',     // Fondo de paneles / inputs
    mid: '#BFB0A3',       // Placeholder / bordes suaves
    dark: '#3B2C1E',      // Texto sobre fondos claros
  },
  accent: {
    olive: '#4D5B36',     // Verde oliva oscuro
  }
}
```

### **Componentes Principales**
- Botones con estados hover/active
- Cards con sombras y bordes
- Modals con overlay
- Tablas responsivas
- Formularios con validación
- Alerts y notificaciones
- Loading spinners
- Timeline visual

### **Tipografía**
```javascript
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui'],
  serif: ['Playfair Display', 'ui-serif', 'Georgia'],
}
```

---

## 🔒 SEGURIDAD

### **Implementaciones**
- ✅ JWT con expiración (15 min access, 7 días refresh)
- ✅ Google OAuth 2.0
- ✅ TOTP 2FA
- ✅ Helmet para headers seguros
- ✅ CORS configurado
- ✅ Rate limiting (1000 req/15min)
- ✅ Rate limiting estricto en login (10 req/15min)
- ✅ Prepared statements (Sequelize)
- ✅ Validación de inputs
- ✅ Sanitización de datos
- ✅ HTTPS en producción
- ✅ Secrets no hardcoded

### **Roles y Permisos**
- **Admin**: Acceso completo
- **Employee**: Acceso limitado a sus datos

---

## 🚀 DEPLOYMENT

### **Plataforma**: Render
- **Backend**: Web Service (Node)
- **Frontend**: Static Site
- **Base de Datos**: PostgreSQL Managed

### **Configuración Render**

**Backend:**
```yaml
Build Command: npm install
Start Command: npm start
Root Directory: (vacío)
```

**Frontend:**
```yaml
Build Command: npm install && npm run build
Publish Directory: dist
Root Directory: client
Redirects: /* → /index.html (Rewrite)
```

### **Proceso de Deploy**
1. Push a GitHub (rama `master`)
2. Render detecta cambios automáticamente
3. Build y deploy automático
4. Verificación en URLs de producción

---

## 📊 FLUJO DE AUTENTICACIÓN

```
Usuario Admin → Click "Login con Google"
              ↓
Frontend → Redirect a /auth/google
              ↓
Backend → Redirect a Google OAuth
              ↓
Google → Usuario autoriza
              ↓
Google → Redirect a /auth/google/callback
              ↓
Backend → Genera JWT tokens
              ↓
Backend → Redirect a frontend con tokens
              ↓
Frontend → Guarda tokens en localStorage
              ↓
Frontend → Redirect a /admin
              ↓
Dashboard Admin (autenticado)
```

---

## 🐛 TROUBLESHOOTING COMÚN

### **Backend no inicia**
- Verificar DATABASE_URL
- Verificar todas las variables obligatorias
- Revisar logs en Render

### **Frontend 404 en rutas**
- Verificar redirect configurado: `/* → /index.html`
- Verificar que `_redirects` está en `public/`
- Verificar Root Directory = `client`

### **Google OAuth falla**
- Verificar URLs en Google Cloud Console
- Verificar GOOGLE_CALLBACK_URL exacta
- Esperar 1-2 min después de cambios en Google

### **CORS errors**
- Verificar FRONTEND_URL y CLIENT_URL
- Sin barra `/` al final
- URLs exactas

### **Imágenes no cargan**
- Verificar que están en `public/images/`
- Rutas deben ser `/images/logo.jpg` (no `/src/Images/`)

---

## 📚 DOCUMENTACIÓN ADICIONAL

### **Guías Completas** (en `docs2/`)
- `RENDER_DEPLOYMENT.md` - Deploy en Render
- `GOOGLE_OAUTH_SETUP.md` - Configurar Google OAuth
- `PROJECT_SETUP.md` - Setup local del proyecto
- `UPDATES.md` - Historial de cambios

### **Scripts Útiles**
```bash
# Desarrollo
npm run dev              # Backend + Frontend
npm run dev:server       # Solo backend
npm run dev:client       # Solo frontend

# Producción
npm start                # Iniciar backend
npm run build            # Build completo
npm run build:client     # Build solo frontend

# Utilidades
npm run lint             # Linting
npm test                 # Tests
```

---

## 🎯 MEJORES PRÁCTICAS

### **Desarrollo**
- ✅ Usar variables de entorno
- ✅ No commitear `.env`
- ✅ Seguir estructura de carpetas
- ✅ Comentar código complejo
- ✅ Usar nombres descriptivos
- ✅ Validar inputs
- ✅ Manejar errores correctamente

### **Git**
- ✅ Commits descriptivos
- ✅ Branches para features
- ✅ Pull requests para cambios importantes
- ✅ No commitear `node_modules/`
- ✅ No commitear archivos de build

### **Seguridad**
- ✅ Secrets de 32+ caracteres
- ✅ Diferentes secrets para dev/prod
- ✅ Rotar secrets periódicamente
- ✅ HTTPS en producción
- ✅ Validar y sanitizar inputs

---

## 📞 RECURSOS

### **Documentación Oficial**
- [Node.js](https://nodejs.org/docs)
- [Express](https://expressjs.com)
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Sequelize](https://sequelize.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Render](https://render.com/docs)

### **APIs Externas**
- [OpenAI](https://platform.openai.com/docs)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)

---

## 🎉 ESTADO ACTUAL

**Versión**: 1.1.0  
**Estado**: ✅ Producción  
**Deployment**: ✅ Render  
**Autenticación**: ✅ Google OAuth + TOTP  
**IA**: ✅ RAG con Embeddings  
**Documentación**: ✅ Completa  

**Última Actualización**: 02/12/2024

---

**Este documento es el contexto completo del proyecto para asistentes de IA y desarrolladores.**
