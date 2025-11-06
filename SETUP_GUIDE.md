# 🚀 Guía de Configuración - Sistema de Registro Horario

## 📋 Versión 2.0 - Unificado con Google OAuth

---

## 🎯 **Cambios Principales**

### **✅ Nuevo:**
- ✅ Backend y Frontend unificados en un solo proyecto
- ✅ Google OAuth 2.0 para autenticación
- ✅ Sistema de monitoreo de accesos
- ✅ Multi-tenant (configurable por empresa)
- ✅ Variables de entorno centralizadas

### **🔄 Migrado:**
- Backend: `app/back/` → `src/`
- Frontend: `app/front/` → `client/`

---

## 📦 **Instalación**

### **1. Instalar dependencias:**

```bash
# Instalar dependencias del servidor
npm install

# Instalar dependencias del cliente
cd client && npm install && cd ..
```

---

## ⚙️ **Configuración**

### **1. Copiar archivo de ejemplo:**

```bash
cp .env.example .env
```

### **2. Configurar variables de entorno:**

Edita `.env` con tus valores:

```env
# EMPRESA
COMPANY_NAME=TuEmpresa
COMPANY_LOGO_URL=https://tu-dominio.com/logo.png
PRIMARY_COLOR=#8B7355

# BASE DE DATOS
DATABASE_URL=postgresql://usuario:password@host:5432/database

# JWT
JWT_SECRET=genera-un-secret-largo-aqui-minimo-32-caracteres
SESSION_SECRET=otro-secret-diferente-para-sesiones

# GOOGLE OAUTH (Ver sección abajo)
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# EMAILS AUTORIZADOS
AUTHORIZED_EMAILS=admin@tuempresa.com,manager@tuempresa.com
# O usar dominio:
# AUTHORIZED_DOMAIN=@tuempresa.com

# OPENAI
OPENAI_API_KEY=sk-proj-tu-clave-aqui
```

---

## 🔐 **Configurar Google OAuth**

### **Paso 1: Crear proyecto en Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Nombre sugerido: "Sistema Registro Horario - [Tu Empresa]"

### **Paso 2: Habilitar Google+ API**

1. En el menú lateral → **APIs y servicios** → **Biblioteca**
2. Busca "Google+ API"
3. Haz clic en **Habilitar**

### **Paso 3: Crear credenciales OAuth 2.0**

1. **APIs y servicios** → **Credenciales**
2. Clic en **+ CREAR CREDENCIALES** → **ID de cliente de OAuth**
3. Tipo de aplicación: **Aplicación web**
4. Nombre: "Jarana Registro Horario"

5. **Orígenes de JavaScript autorizados:**
   ```
   http://localhost:3000
   https://tu-dominio.com
   ```

6. **URIs de redireccionamiento autorizados:**
   ```
   http://localhost:3000/auth/google/callback
   https://tu-dominio.com/auth/google/callback
   ```

7. Clic en **CREAR**

### **Paso 4: Copiar credenciales**

Copia el **ID de cliente** y el **Secreto del cliente** a tu `.env`:

```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
```

### **Paso 5: Configurar pantalla de consentimiento**

1. **APIs y servicios** → **Pantalla de consentimiento de OAuth**
2. Tipo de usuario: **Interno** (si es para tu organización) o **Externo**
3. Completa la información:
   - Nombre de la aplicación
   - Email de soporte
   - Logo (opcional)
4. Ámbitos: Añade `email` y `profile`
5. Guardar

---

## 🗄️ **Configurar Base de Datos**

### **Opción 1: Neon (Recomendado para producción)**

1. Ve a [Neon](https://neon.tech/)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la connection string
5. Pégala en `.env`:
   ```env
   DATABASE_URL=postgresql://usuario:password@ep-xxx.neon.tech/database?sslmode=require
   ```

### **Opción 2: PostgreSQL Local**

```bash
# Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Crear base de datos
createdb jarana_db

# Configurar en .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/jarana_db
```

### **Sincronizar base de datos:**

```bash
npm run db:sync
```

Esto creará todas las tablas automáticamente.

---

## 🚀 **Ejecutar la Aplicación**

### **Desarrollo (con hot-reload):**

```bash
npm run dev
```

Esto inicia:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### **Producción:**

```bash
# 1. Compilar frontend
npm run build

# 2. Iniciar servidor
npm start
```

El servidor servirá el frontend compilado en http://localhost:3000

---

## 🎨 **Personalizar para tu Empresa**

### **1. Cambiar nombre y logo:**

Edita `.env`:
```env
COMPANY_NAME=MiEmpresa
COMPANY_LOGO_URL=https://mi-dominio.com/logo.png
```

### **2. Cambiar colores:**

Edita `.env`:
```env
PRIMARY_COLOR=#FF5733
SECONDARY_COLOR=#C70039
ACCENT_COLOR=#900C3F
```

O edita `client/tailwind.config.js` para colores más avanzados.

### **3. Cambiar logo físico:**

Reemplaza el archivo:
```
client/public/assets/logo.png
```

---

## 🔒 **Seguridad**

### **Generar secretos seguros:**

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### **Emails autorizados:**

Solo los emails en `AUTHORIZED_EMAILS` o del dominio `AUTHORIZED_DOMAIN` podrán acceder.

```env
# Opción 1: Lista de emails
AUTHORIZED_EMAILS=admin@empresa.com,manager@empresa.com

# Opción 2: Dominio completo
AUTHORIZED_DOMAIN=@empresa.com
```

---

## 📊 **Monitoreo de Accesos**

### **Ver logs de acceso:**

```
GET /auth/access-logs
```

Requiere rol de admin.

### **Ver estadísticas:**

```
GET /auth/access-stats
```

Incluye:
- Total de accesos
- Accesos exitosos/fallidos
- Actividad sospechosa (múltiples intentos fallidos)

---

## 🌐 **Desplegar en Render**

### **1. Crear cuenta en Render:**

Ve a [Render.com](https://render.com/) y crea una cuenta.

### **2. Conectar repositorio:**

1. Clic en **New +** → **Web Service**
2. Conecta tu repositorio de GitHub
3. Selecciona el repositorio

### **3. Configurar servicio:**

- **Name:** jarana-registro-horario
- **Environment:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Plan:** Free o Starter ($7/mes)

### **4. Variables de entorno:**

Añade todas las variables de `.env` en la sección **Environment**:

```
COMPANY_NAME=TuEmpresa
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=https://tu-app.onrender.com/auth/google/callback
JWT_SECRET=...
SESSION_SECRET=...
AUTHORIZED_EMAILS=...
OPENAI_API_KEY=...
NODE_ENV=production
```

### **5. Actualizar Google OAuth:**

En Google Cloud Console, añade la URL de Render:

**Orígenes autorizados:**
```
https://tu-app.onrender.com
```

**URIs de redireccionamiento:**
```
https://tu-app.onrender.com/auth/google/callback
```

### **6. Desplegar:**

Clic en **Create Web Service**

¡Listo! Tu app estará en `https://tu-app.onrender.com`

---

## 🧪 **Testing**

### **Login con Google:**

1. Ve a http://localhost:3000
2. Clic en "Iniciar sesión con Google"
3. Selecciona tu cuenta de Google
4. Serás redirigido con un token JWT

### **Login con PIN:**

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "employeeCode": "EMP001",
  "pin": "1234"
}
```

---

## 📚 **Estructura del Proyecto**

```
registro_horario/
├── src/                          # Backend
│   ├── config/
│   │   ├── database.js          # Configuración de DB
│   │   ├── env.js               # Variables de entorno
│   │   └── passport.js          # Google OAuth
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT auth
│   │   └── accessLogger.js      # Logger de accesos
│   ├── models/
│   │   ├── Employee.js          # Modelo de empleados
│   │   ├── AccessLog.js         # Logs de acceso
│   │   └── ...
│   ├── routes/
│   │   ├── auth.js              # Rutas de autenticación
│   │   └── ...
│   └── index.js                 # Servidor principal
├── client/                       # Frontend React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── config/
│   │       └── branding.js      # Configuración de marca
│   └── public/
│       └── assets/
│           └── logo.png         # Logo de la empresa
├── .env                          # Variables de entorno
├── .env.example                  # Plantilla de .env
├── package.json                  # Dependencias
└── SETUP_GUIDE.md               # Esta guía
```

---

## ❓ **Preguntas Frecuentes**

### **¿Cómo añado un nuevo admin?**

1. Crea el empleado con Google OAuth
2. En la base de datos, cambia su `role` a `'admin'`

O usa el endpoint (requiere ser admin):

```bash
PUT /api/employees/:id
{
  "role": "admin"
}
```

### **¿Puedo deshabilitar Google OAuth?**

Sí, en `.env`:
```env
ENABLE_GOOGLE_AUTH=false
```

### **¿Cómo cambio el logo?**

1. Sube tu logo a un servidor (ej: Cloudinary, AWS S3)
2. Actualiza `.env`:
   ```env
   COMPANY_LOGO_URL=https://tu-cdn.com/logo.png
   ```

O reemplaza `client/public/assets/logo.png`

### **¿Funciona sin OpenAI?**

Sí, el chat de IA se deshabilitará automáticamente si no hay `OPENAI_API_KEY`.

---

## 🆘 **Soporte**

Si tienes problemas:

1. Verifica que todas las variables de `.env` estén configuradas
2. Revisa los logs del servidor
3. Verifica que la base de datos esté accesible
4. Comprueba que Google OAuth esté configurado correctamente

---

## 📝 **Changelog**

### **v2.0.0 (06/11/2025)**
- ✅ Unificación de backend y frontend
- ✅ Google OAuth 2.0
- ✅ Sistema de monitoreo de accesos
- ✅ Multi-tenant configurable
- ✅ Variables de entorno centralizadas

### **v1.0.2 (04/11/2025)**
- Sistema de horarios semanales
- Múltiples pausas
- Plantillas de horarios

---

**¡Listo para producción!** 🚀
