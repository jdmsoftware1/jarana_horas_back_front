# 🚀 GUÍA DE DEPLOY EN RENDER

## 📋 ÍNDICE
1. [Preparación](#preparación)
2. [Deploy del Backend](#deploy-del-backend)
3. [Deploy del Frontend](#deploy-del-frontend)
4. [Configuración de Base de Datos](#configuración-de-base-de-datos)
5. [Variables de Entorno](#variables-de-entorno)
6. [Verificación](#verificación)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 PREPARACIÓN

### 1. Subir código a GitHub

```bash
# Si aún no tienes un repositorio
git init
git add .
git commit -m "Initial commit for Render deploy"

# Crear repositorio en GitHub y conectarlo
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

### 2. Crear cuenta en Render
- Ve a [render.com](https://render.com)
- Regístrate con GitHub
- Conecta tu repositorio

---

## 🖥️ DEPLOY DEL BACKEND

### Paso 1: Crear Web Service

1. **Dashboard de Render** → Click "New +"
2. Selecciona **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configuración:

```yaml
Name: jarana-registro-backend
Runtime: Node
Region: Frankfurt (o el más cercano)
Branch: main
Root Directory: (dejar vacío)
Build Command: npm install
Start Command: npm start
```

### Paso 2: Configurar Variables de Entorno

En la sección **Environment**, añade:

#### Variables Básicas:
```bash
NODE_ENV=production
PORT=3000
```

#### Base de Datos:
```bash
# Se configurará automáticamente cuando crees la BD
DATABASE_URL=(se añade automáticamente)
```

#### JWT y Sesión:
```bash
JWT_SECRET=genera_un_secret_seguro_aqui
SESSION_SECRET=genera_otro_secret_seguro_aqui
```

#### Google OAuth:
```bash
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=https://jarana-registro-backend.onrender.com/api/auth/google/callback
```

#### OpenAI (opcional):
```bash
OPENAI_API_KEY=sk-tu_openai_key
```

#### Frontend URL:
```bash
FRONTEND_URL=https://jarana-registro-frontend.onrender.com
```

#### Rate Limiting:
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

#### Feature Flags:
```bash
ENABLE_AI_CHAT=true
ENABLE_AI_UTILS=true
ENABLE_2FA=true
ENABLE_GOOGLE_AUTH=true
```

### Paso 3: Plan
- Selecciona **"Free"** (para empezar)
- Click **"Create Web Service"**

---

## 🌐 DEPLOY DEL FRONTEND

### Paso 1: Crear Static Site

1. **Dashboard de Render** → Click "New +"
2. Selecciona **"Static Site"**
3. Conecta el mismo repositorio
4. Configuración:

```yaml
Name: jarana-registro-frontend
Branch: main
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: dist
```

### Paso 2: Configurar Variables de Entorno

En la sección **Environment**, añade:

```bash
# API URL (usa la URL de tu backend)
VITE_API_URL=https://jarana-registro-backend.onrender.com

# App Config
VITE_APP_NAME=Jarana Registro Horario
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_AI_UTILS=true

# Clerk (si lo usas)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_tu_clerk_key
```

### Paso 3: Plan
- Selecciona **"Free"** (para empezar)
- Click **"Create Static Site"**

---

## 💾 CONFIGURACIÓN DE BASE DE DATOS

### Opción 1: PostgreSQL en Render (Recomendado)

1. **Dashboard de Render** → Click "New +"
2. Selecciona **"PostgreSQL"**
3. Configuración:

```yaml
Name: jarana-registro-db
Database: jarana_registro
User: jarana_user
Region: Frankfurt (mismo que el backend)
```

4. Plan: **Free** (para empezar)
5. Click **"Create Database"**

### Conectar Backend con la BD:

1. Ve a tu **Web Service** (backend)
2. En **Environment**, añade:
   - Click en "Add Environment Variable"
   - Key: `DATABASE_URL`
   - Value: Click en "Add from Database" → Selecciona tu BD → `Internal Database URL`

### Opción 2: Base de Datos Externa

Si ya tienes una BD en otro lugar:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

---

## 🔐 VARIABLES DE ENTORNO

### Generar Secrets Seguros:

```bash
# En terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O en Node.js:
```javascript
require('crypto').randomBytes(32).toString('hex')
```

### Variables Críticas:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `JWT_SECRET` | Secret para tokens JWT | `a1b2c3d4e5f6...` (32+ chars) |
| `SESSION_SECRET` | Secret para sesiones | `x1y2z3w4v5u6...` (32+ chars) |
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://...` |
| `GOOGLE_CLIENT_ID` | OAuth de Google | `123456.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Secret de Google OAuth | `GOCSPX-...` |

---

## ✅ VERIFICACIÓN

### 1. Backend

Verifica que el backend esté funcionando:

```bash
# Healthcheck
curl https://jarana-registro-backend.onrender.com/api/health

# Debería responder:
{
  "status": "ok",
  "timestamp": "2024-11-06T..."
}
```

### 2. Frontend

1. Abre tu frontend: `https://jarana-registro-frontend.onrender.com`
2. Verifica que cargue correctamente
3. Intenta hacer login
4. Verifica la consola del navegador (F12) para errores

### 3. Base de Datos

En el dashboard de Render:
1. Ve a tu base de datos
2. Click en "Connect"
3. Usa las credenciales para conectarte con un cliente SQL

---

## 🔧 TROUBLESHOOTING

### Problema: Backend no inicia

**Solución:**
1. Ve a **Logs** en tu Web Service
2. Busca errores
3. Verifica que todas las variables de entorno estén configuradas
4. Verifica que `DATABASE_URL` esté correcta

### Problema: Frontend no conecta con Backend

**Solución:**
1. Verifica `VITE_API_URL` en el frontend
2. Debe ser: `https://tu-backend.onrender.com` (sin `/api`)
3. Verifica CORS en el backend
4. Verifica que el backend esté corriendo

### Problema: Error de Base de Datos

**Solución:**
1. Verifica que la BD esté creada
2. Verifica `DATABASE_URL`
3. Ejecuta migraciones si es necesario
4. Verifica logs de la BD en Render

### Problema: Google OAuth no funciona

**Solución:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Actualiza **Authorized JavaScript origins**:
   - `https://tu-frontend.onrender.com`
3. Actualiza **Authorized redirect URIs**:
   - `https://tu-backend.onrender.com/api/auth/google/callback`
4. Verifica `GOOGLE_CALLBACK_URL` en variables de entorno

### Problema: Build falla

**Solución:**
1. Verifica que `package.json` tenga todos los scripts necesarios
2. Verifica que las dependencias estén correctas
3. Revisa los logs de build en Render
4. Asegúrate de que `node_modules` no esté en Git

---

## 📊 MONITOREO

### Logs en Tiempo Real:

1. Ve a tu servicio en Render
2. Click en **"Logs"**
3. Verás logs en tiempo real

### Métricas:

1. Click en **"Metrics"**
2. Verás CPU, memoria, requests, etc.

---

## 🔄 ACTUALIZACIONES

### Deploy Automático:

Render hace deploy automático cuando haces push a `main`:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Deploy Manual:

1. Ve a tu servicio en Render
2. Click en **"Manual Deploy"**
3. Selecciona la rama
4. Click **"Deploy"**

---

## 💰 COSTOS

### Plan Free:
- **Web Services**: 750 horas/mes (se duerme después de 15 min de inactividad)
- **Static Sites**: Ilimitado
- **PostgreSQL**: 90 días gratis, luego $7/mes

### Recomendación:
- Empieza con Free
- Upgrade a Starter ($7/mes) cuando tengas usuarios reales
- El backend se despertará automáticamente cuando reciba requests

---

## 🎉 ¡LISTO!

Tu aplicación debería estar funcionando en:
- **Backend**: `https://jarana-registro-backend.onrender.com`
- **Frontend**: `https://jarana-registro-frontend.onrender.com`

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa los logs en Render
2. Verifica las variables de entorno
3. Consulta la [documentación de Render](https://render.com/docs)
4. Revisa este documento de troubleshooting
