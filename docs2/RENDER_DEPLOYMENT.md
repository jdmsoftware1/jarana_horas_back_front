# 🚀 GUÍA COMPLETA DE DEPLOYMENT EN RENDER

## 📋 ÍNDICE
1. [Variables de Entorno](#variables-de-entorno)
2. [Configuración del Backend](#configuración-del-backend)
3. [Configuración del Frontend](#configuración-del-frontend)
4. [Base de Datos PostgreSQL](#base-de-datos-postgresql)
5. [Verificación Post-Deploy](#verificación-post-deploy)

---

## 🔐 VARIABLES DE ENTORNO

### **BACKEND (Web Service)**

#### Variables Obligatorias:
```bash
# Entorno
NODE_ENV=production
PORT=3000

# Base de Datos
DATABASE_URL=<Internal Database URL desde Render PostgreSQL>

# Seguridad - Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<generar_secret_32_caracteres>
SESSION_SECRET=<generar_otro_secret_diferente>

# Google OAuth
GOOGLE_CLIENT_ID=<tu_client_id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<tu_client_secret>
GOOGLE_CALLBACK_URL=https://<tu-backend>.onrender.com/auth/google/callback

# URLs del Frontend
FRONTEND_URL=https://<tu-frontend>.onrender.com
CLIENT_URL=https://<tu-frontend>.onrender.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Feature Flags
ENABLE_AI_CHAT=true
ENABLE_AI_UTILS=true
ENABLE_2FA=true
ENABLE_GOOGLE_AUTH=true
```

#### Variables Opcionales:
```bash
# OpenAI (si usas funciones de IA)
OPENAI_API_KEY=sk-<tu_openai_api_key>

# Emails autorizados (separados por comas)
AUTHORIZED_EMAILS=admin@example.com,user@example.com

# Dominio autorizado
AUTHORIZED_DOMAIN=example.com
```

---

### **FRONTEND (Static Site)**

```bash
# URL del Backend
VITE_API_URL=https://<tu-backend>.onrender.com

# Configuración de la App
VITE_APP_NAME=Jarana Registro Horario
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_AI_UTILS=true
```

---

## 🖥️ CONFIGURACIÓN DEL BACKEND

### **Paso 1: Crear Web Service**

1. **Render Dashboard** → **New +** → **Web Service**
2. Conectar repositorio de GitHub
3. Configurar:

```yaml
Name: jarana-registro-backend
Region: Frankfurt (EU Central)
Branch: main o master
Root Directory: (vacío)
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

### **Paso 2: Añadir Variables de Entorno**

En la sección **Environment**, añadir todas las variables listadas arriba.

### **Paso 3: Conectar Base de Datos**

Para `DATABASE_URL`:
1. Click en **"Add from Database"**
2. Seleccionar tu PostgreSQL database
3. Render añadirá automáticamente la Internal Database URL

---

## 🌐 CONFIGURACIÓN DEL FRONTEND

### **Paso 1: Crear Static Site**

1. **Render Dashboard** → **New +** → **Static Site**
2. Conectar el **mismo repositorio**
3. Configurar:

```yaml
Name: jarana-registro-frontend
Branch: main o master
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: dist
```

### **Paso 2: Añadir Variables de Entorno**

En la sección **Environment**, añadir las variables VITE_* listadas arriba.

### **Paso 3: Configurar Redirects para SPA**

En **Settings** → **Redirects/Rewrites**, añadir:

```
Source: /*
Destination: /index.html
Action: Rewrite
```

Esto permite que React Router maneje las rutas del lado del cliente.

---

## 💾 BASE DE DATOS POSTGRESQL

### **Paso 1: Crear Database**

1. **Render Dashboard** → **New +** → **PostgreSQL**
2. Configurar:

```yaml
Name: jarana-registro-db
Database: jarana_registro
User: jarana_user
Region: Frankfurt (mismo que el backend)
Plan: Free
```

### **Paso 2: Obtener Connection String**

Una vez creada, copiar la **Internal Database URL**:
```
postgresql://user:password@host:5432/database
```

### **Paso 3: Conectar al Backend**

En el Backend Web Service:
- Environment → DATABASE_URL → Add from Database → Seleccionar tu DB

---

## ✅ VERIFICACIÓN POST-DEPLOY

### **1. Backend Health Check**

```bash
curl https://<tu-backend>.onrender.com/health
```

Debería responder:
```json
{
  "status": "OK",
  "timestamp": "2024-11-07T..."
}
```

### **2. Frontend Carga Correctamente**

Visitar: `https://<tu-frontend>.onrender.com`

Debería mostrar la página de inicio.

### **3. Google OAuth Funciona**

1. Click en "Iniciar sesión con Google"
2. Seleccionar cuenta
3. Debería redirigir al dashboard

### **4. API Endpoints Responden**

```bash
# Verificar CORS
curl -H "Origin: https://<tu-frontend>.onrender.com" \
     https://<tu-backend>.onrender.com/api/employees
```

---

## 🔧 TROUBLESHOOTING

### **Backend no inicia:**

**Síntoma:** Service fails to start

**Solución:**
1. Verificar logs en Render Dashboard
2. Comprobar que todas las variables obligatorias están configuradas
3. Verificar que DATABASE_URL es correcta

### **Frontend muestra 404 en rutas:**

**Síntoma:** `/auth/callback` da 404

**Solución:**
1. Verificar que la regla de rewrite está configurada
2. Comprobar que `_redirects` está en `public/`
3. Verificar que Root Directory es `client` y Publish Directory es `dist`

### **Google OAuth falla:**

**Síntoma:** redirect_uri_mismatch

**Solución:**
1. Verificar Google Cloud Console → Authorized redirect URIs
2. Debe ser: `https://<tu-backend>.onrender.com/auth/google/callback`
3. Sin `/api` en la ruta
4. Exactamente igual (sin espacios, sin barra final)

### **CORS Errors:**

**Síntoma:** Access-Control-Allow-Origin error

**Solución:**
1. Verificar que `FRONTEND_URL` y `CLIENT_URL` están configuradas
2. Deben apuntar a la URL correcta del frontend
3. Sin barra `/` al final

---

## 📊 ARQUITECTURA EN RENDER

```
┌─────────────────────────────────────────────┐
│  🌐 Frontend (Static Site)                  │
│  https://tu-frontend.onrender.com           │
│                                             │
│  - Sirve archivos estáticos (HTML, JS, CSS)│
│  - React Router maneja rutas cliente       │
│  - Variables: VITE_*                        │
└──────────────┬──────────────────────────────┘
               │
               │ API Calls (VITE_API_URL)
               │
               ▼
┌─────────────────────────────────────────────┐
│  🖥️ Backend (Web Service)                   │
│  https://tu-backend.onrender.com            │
│                                             │
│  - API REST (Express)                       │
│  - Autenticación (JWT + Google OAuth)      │
│  - Lógica de negocio                        │
│  - Variables: NODE_ENV, JWT_SECRET, etc.   │
└──────────────┬──────────────────────────────┘
               │
               │ DATABASE_URL
               │
               ▼
┌─────────────────────────────────────────────┐
│  💾 PostgreSQL Database                     │
│  jarana-registro-db                         │
│                                             │
│  - Datos persistentes                       │
│  - Conexión: Internal Database URL         │
└─────────────────────────────────────────────┘
```

---

## 🔄 ACTUALIZAR DESPUÉS DE CAMBIOS

### **Cambios en el Backend:**

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render detecta el push y redespliega automáticamente.

### **Cambios en el Frontend:**

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Render detecta el push y reconstruye el Static Site.

### **Cambios en Variables de Entorno:**

1. Render Dashboard → Tu servicio → Environment
2. Editar/añadir variables
3. Save Changes
4. Render redespliega automáticamente

---

## ⚠️ LIMITACIONES DEL PLAN GRATUITO

### **Backend (Web Service Free):**
- ⏰ Se duerme después de 15 min sin actividad
- ⏳ Primera petición tarda 30-60 segundos en despertar
- 💾 750 horas/mes de runtime
- 🔄 Redeploys ilimitados

### **Frontend (Static Site Free):**
- ✅ Siempre activo (no se duerme)
- 📦 100 GB bandwidth/mes
- 🔄 Redeploys ilimitados

### **PostgreSQL Free:**
- 💾 1 GB de almacenamiento
- 🔒 Expira después de 90 días (necesita upgrade)
- ⚡ Conexiones limitadas

---

## 💡 MEJORES PRÁCTICAS

### **Seguridad:**
- ✅ Usar secrets de 32+ caracteres
- ✅ Nunca commitear archivos `.env` a Git
- ✅ Rotar secrets periódicamente
- ✅ Usar diferentes secrets para dev y prod

### **Performance:**
- ✅ Habilitar sourcemaps solo en desarrollo
- ✅ Comprimir assets en el build
- ✅ Usar CDN para assets estáticos (si es posible)
- ✅ Implementar caching en el backend

### **Monitoreo:**
- ✅ Revisar logs regularmente
- ✅ Configurar alertas en Render
- ✅ Monitorear uso de base de datos
- ✅ Verificar health checks

---

## 📞 SOPORTE

### **Render:**
- Docs: https://render.com/docs
- Status: https://status.render.com
- Community: https://community.render.com

### **Proyecto:**
- Issues: GitHub Issues del repositorio
- Logs: Render Dashboard → Tu servicio → Logs

---

## 🎉 CHECKLIST FINAL

Antes de considerar el deploy completo:

- [ ] Backend desplegado y respondiendo en `/health`
- [ ] Frontend cargando correctamente
- [ ] Base de datos conectada
- [ ] Google OAuth funcionando
- [ ] Todas las variables de entorno configuradas
- [ ] Redirects/Rewrites configurados en frontend
- [ ] CORS funcionando correctamente
- [ ] Login con Google funciona
- [ ] Registros se guardan en la base de datos
- [ ] Dashboard admin accesible
- [ ] Kiosk de empleados funciona

---

**Última actualización:** Noviembre 2024
**Versión:** 1.0
