# ⚙️ CONFIGURACIÓN DEL PROYECTO

## 📋 ÍNDICE
1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Local](#instalación-local)
3. [Configuración de Base de Datos](#base-de-datos)
4. [Variables de Entorno](#variables-de-entorno)
5. [Estructura del Proyecto](#estructura)
6. [Scripts Disponibles](#scripts)
7. [Tecnologías Utilizadas](#tecnologías)

---

## 💻 REQUISITOS PREVIOS

### **Software Necesario:**

```bash
Node.js: >= 18.0.0
npm: >= 9.0.0
PostgreSQL: >= 14.0
Git: >= 2.30.0
```

### **Verificar Instalación:**

```bash
node --version
npm --version
psql --version
git --version
```

---

## 🚀 INSTALACIÓN LOCAL

### **Paso 1: Clonar Repositorio**

```bash
git clone https://github.com/tu-usuario/AliadaDigital-registro.git
cd AliadaDigital-registro
```

### **Paso 2: Instalar Dependencias del Backend**

```bash
npm install
```

### **Paso 3: Instalar Dependencias del Frontend**

```bash
cd client
npm install
cd ..
```

### **Paso 4: Configurar Variables de Entorno**

Crear archivo `.env` en la raíz:

```bash
cp .env.example .env
```

Editar `.env` con tus valores (ver sección [Variables de Entorno](#variables-de-entorno))

Crear archivo `client/.env`:

```bash
cp client/.env.example client/.env
```

Editar `client/.env` con tus valores

### **Paso 5: Configurar Base de Datos**

```bash
# Crear base de datos
createdb AliadaDigital_registro

# O usando psql
psql -U postgres
CREATE DATABASE AliadaDigital_registro;
\q
```

### **Paso 6: Ejecutar Migraciones**

```bash
# Las tablas se crean automáticamente al iniciar el servidor
# gracias a Sequelize sync
npm run dev:server
```

### **Paso 7: Iniciar Aplicación**

```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client
```

Abrir navegador en: `http://localhost:5173`

---

## 💾 BASE DE DATOS

### **Configuración PostgreSQL Local:**

#### **Opción 1: Instalación Nativa**

**Windows:**
1. Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)
2. Instalar con configuración por defecto
3. Recordar contraseña de usuario `postgres`

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### **Opción 2: Docker**

```bash
docker run --name AliadaDigital-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=AliadaDigital_registro \
  -p 5432:5432 \
  -d postgres:14
```

### **Connection String:**

```bash
# Desarrollo local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/AliadaDigital_registro

# Producción (Render)
DATABASE_URL=<Internal Database URL desde Render>
```

### **Modelos de Base de Datos:**

El proyecto usa Sequelize ORM con los siguientes modelos:

- **Employee:** Empleados del sistema
- **Record:** Registros de entrada/salida
- **Schedule:** Horarios asignados
- **ScheduleTemplate:** Plantillas de horarios
- **WeeklySchedule:** Horarios semanales
- **DailyException:** Excepciones diarias
- **ScheduleBreak:** Descansos en horarios
- **Vacation:** Vacaciones

---

## 🔐 VARIABLES DE ENTORNO

### **Backend (`.env` en raíz):**

```bash
# ============================================
# ENTORNO
# ============================================
NODE_ENV=development
PORT=3000

# ============================================
# BASE DE DATOS
# ============================================
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/AliadaDigital_registro

# ============================================
# SEGURIDAD
# ============================================
# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=tu_jwt_secret_de_32_caracteres_minimo
SESSION_SECRET=tu_session_secret_diferente_32_caracteres

# ============================================
# GOOGLE OAUTH
# ============================================
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# ============================================
# URLS
# ============================================
FRONTEND_URL=http://localhost:5173
CLIENT_URL=http://localhost:5173

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_AI_CHAT=true
ENABLE_AI_UTILS=true
ENABLE_2FA=true
ENABLE_GOOGLE_AUTH=true

# ============================================
# OPENAI (Opcional)
# ============================================
OPENAI_API_KEY=sk-tu_openai_api_key

# ============================================
# AUTORIZACIÓN (Opcional)
# ============================================
AUTHORIZED_EMAILS=admin@example.com,user@example.com
AUTHORIZED_DOMAIN=example.com
```

### **Frontend (`client/.env`):**

```bash
# ============================================
# API
# ============================================
VITE_API_URL=http://localhost:3000

# ============================================
# CONFIGURACIÓN
# ============================================
VITE_APP_NAME=AliadaDigital Registro Horario
VITE_ENVIRONMENT=development

# ============================================
# FEATURE FLAGS
# ============================================
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_AI_UTILS=true
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
AliadaDigital-registro/
├── client/                      # Frontend (React + Vite)
│   ├── public/                  # Archivos estáticos
│   │   ├── images/              # Imágenes
│   │   ├── _redirects           # Configuración SPA para Render
│   │   └── _headers             # Headers HTTP
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   ├── context/             # Context API (Auth, etc.)
│   │   ├── pages/               # Páginas/Vistas
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── EmployeePortal.jsx
│   │   │   ├── EmployeeKioskPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   └── AuthCallback.jsx
│   │   ├── services/            # Servicios API
│   │   ├── utils/               # Utilidades
│   │   ├── App.jsx              # Componente principal
│   │   └── main.jsx             # Entry point
│   ├── .env                     # Variables de entorno (NO commitear)
│   ├── .env.example             # Ejemplo de variables
│   ├── package.json
│   ├── vite.config.js           # Configuración de Vite
│   └── tailwind.config.js       # Configuración de Tailwind
│
├── src/                         # Backend (Node.js + Express)
│   ├── config/                  # Configuraciones
│   │   ├── database.js          # Conexión a BD
│   │   ├── env.js               # Variables de entorno
│   │   └── passport.js          # Estrategias de autenticación
│   ├── models/                  # Modelos de Sequelize
│   │   ├── Employee.js
│   │   ├── Record.js
│   │   ├── Schedule.js
│   │   └── ...
│   ├── routes/                  # Rutas de la API
│   │   ├── auth.js              # Autenticación
│   │   ├── employees.js         # Empleados
│   │   ├── records.js           # Registros
│   │   ├── admin.js             # Admin
│   │   └── ...
│   ├── middleware/              # Middlewares
│   │   ├── auth.js              # Verificación de JWT
│   │   └── errorHandler.js     # Manejo de errores
│   ├── services/                # Lógica de negocio
│   │   ├── embeddingService.js  # Embeddings para IA
│   │   └── ...
│   ├── utils/                   # Utilidades
│   └── index.js                 # Entry point del servidor
│
├── docs/                        # Documentación antigua
├── docs2/                       # Documentación actualizada
│   ├── RENDER_DEPLOYMENT.md    # Guía de deploy en Render
│   ├── GOOGLE_OAUTH_SETUP.md   # Configuración de Google OAuth
│   ├── PROJECT_SETUP.md        # Este archivo
│   ├── UPDATES.md              # Historial de cambios
│   └── CONTEXT_PROMPT.md       # Contexto para IA
│
├── scripts/                     # Scripts de utilidad
│   └── build.sh                 # Script de build para producción
│
├── .env                         # Variables de entorno backend (NO commitear)
├── .env.example                 # Ejemplo de variables backend
├── .gitignore                   # Archivos ignorados por Git
├── package.json                 # Dependencias y scripts del backend
├── render.yaml                  # Configuración para Render
└── README.md                    # Documentación principal

```

---

## 🛠️ SCRIPTS DISPONIBLES

### **Backend:**

```bash
# Desarrollo (con hot reload)
npm run dev:server

# Producción
npm start

# Linting
npm run lint

# Tests (si están configurados)
npm test
```

### **Frontend:**

```bash
# Desarrollo (con hot reload)
npm run dev:client
# O desde client/
cd client && npm run dev

# Build para producción
npm run build:client
# O desde client/
cd client && npm run build

# Preview del build
cd client && npm run preview

# Linting
cd client && npm run lint
```

### **Ambos:**

```bash
# Desarrollo (backend + frontend simultáneamente)
npm run dev

# Build completo
npm run build

# Instalar todas las dependencias
npm run postinstall
```

---

## 🔧 TECNOLOGÍAS UTILIZADAS

### **Backend:**

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Runtime de JavaScript |
| Express | 4.x | Framework web |
| Sequelize | 6.x | ORM para PostgreSQL |
| PostgreSQL | 14+ | Base de datos |
| Passport.js | 0.6.x | Autenticación |
| JWT | 9.x | Tokens de autenticación |
| bcrypt | 5.x | Hash de contraseñas |
| cors | 2.x | CORS middleware |
| helmet | 7.x | Seguridad HTTP |
| express-rate-limit | 6.x | Rate limiting |
| dotenv | 16.x | Variables de entorno |

### **Frontend:**

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 18.x | Librería UI |
| Vite | 4.x | Build tool |
| React Router | 6.x | Enrutamiento |
| Tailwind CSS | 3.x | Estilos |
| Lucide React | - | Iconos |
| date-fns | 2.x | Manejo de fechas |
| Axios | 1.x | Cliente HTTP |

### **Desarrollo:**

| Herramienta | Propósito |
|-------------|-----------|
| ESLint | Linting de código |
| Prettier | Formateo de código |
| Git | Control de versiones |
| GitHub | Repositorio remoto |
| Render | Hosting y deployment |

---

## 🎨 CONFIGURACIÓN DE ESTILOS

### **Tailwind CSS:**

El proyecto usa Tailwind CSS con colores personalizados:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#4A3728',      // Marrón oscuro
          medium: '#8B7355',    // Marrón medio
          light: '#D4C4B0',     // Beige claro
          cream: '#F5E6D3',     // Crema
          accent: '#4D5B36',    // Verde oliva
          deep: '#2C1810',      // Marrón muy oscuro
        },
        neutral: {
          dark: '#1F2937',
          mid: '#6B7280',
          light: '#F3F4F6',
        }
      }
    }
  }
}
```

---

## 🔒 SEGURIDAD

### **Mejores Prácticas Implementadas:**

✅ **Autenticación:**
- JWT con expiración
- Refresh tokens
- Google OAuth 2.0
- 2FA con TOTP

✅ **Autorización:**
- Roles (admin, employee)
- Middleware de verificación
- Rutas protegidas

✅ **Seguridad HTTP:**
- Helmet para headers seguros
- CORS configurado
- Rate limiting
- HTTPS en producción

✅ **Base de Datos:**
- Prepared statements (Sequelize)
- Validación de inputs
- Sanitización de datos

✅ **Secrets:**
- Variables de entorno
- No hardcoded
- Diferentes para dev/prod

---

## 📊 FLUJO DE AUTENTICACIÓN

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       │ 1. Click "Login con Google"
       ▼
┌─────────────────────┐
│  Frontend (React)   │
│  /admin-login       │
└──────┬──────────────┘
       │
       │ 2. Redirect a backend
       ▼
┌─────────────────────┐
│  Backend (Express)  │
│  /auth/google       │
└──────┬──────────────┘
       │
       │ 3. Redirect a Google
       ▼
┌─────────────────────┐
│  Google OAuth       │
│  Consent Screen     │
└──────┬──────────────┘
       │
       │ 4. Usuario autoriza
       ▼
┌─────────────────────┐
│  Backend (Express)  │
│  /auth/google/      │
│  callback           │
└──────┬──────────────┘
       │
       │ 5. Genera JWT
       │ 6. Redirect con tokens
       ▼
┌─────────────────────┐
│  Frontend (React)   │
│  /auth/callback     │
└──────┬──────────────┘
       │
       │ 7. Guarda tokens
       │ 8. Redirect a dashboard
       ▼
┌─────────────────────┐
│  Dashboard          │
│  (Autenticado)      │
└─────────────────────┘
```

---

## 🐛 TROUBLESHOOTING COMÚN

### **Error: Cannot find module**

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Frontend
cd client
rm -rf node_modules package-lock.json
npm install
```

### **Error: Database connection failed**

```bash
# Verificar que PostgreSQL está corriendo
# Windows
pg_ctl status

# macOS/Linux
brew services list
# o
sudo systemctl status postgresql

# Verificar DATABASE_URL en .env
```

### **Error: Port already in use**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### **Error: CORS**

Verificar que `FRONTEND_URL` y `CLIENT_URL` están configuradas correctamente en `.env`

---

## 📞 RECURSOS

### **Documentación:**
- [Node.js](https://nodejs.org/docs)
- [Express](https://expressjs.com)
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Sequelize](https://sequelize.org)
- [Tailwind CSS](https://tailwindcss.com)

### **Comunidad:**
- GitHub Issues del proyecto
- Stack Overflow
- Discord/Slack del equipo

---

## 🎯 CHECKLIST DE SETUP

- [ ] Node.js y npm instalados
- [ ] PostgreSQL instalado y corriendo
- [ ] Repositorio clonado
- [ ] Dependencias del backend instaladas
- [ ] Dependencias del frontend instaladas
- [ ] Archivo `.env` creado y configurado
- [ ] Archivo `client/.env` creado y configurado
- [ ] Base de datos creada
- [ ] Google OAuth configurado
- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] Login con Google funciona
- [ ] Registros se guardan correctamente

---

**Última actualización:** Noviembre 2024
**Versión:** 1.0
