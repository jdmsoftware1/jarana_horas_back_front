# 🔐 VARIABLES DE ENTORNO PARA RENDER

## 📌 IMPORTANTE
**NO subas archivos .env a Git**. Estas variables se configuran directamente en el dashboard de Render.

---

## 🖥️ BACKEND (Web Service)

### Variables Obligatorias:

```bash
# Base de datos (se autoconfigura si usas Render PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=tu_secret_jwt_super_seguro_aqui_minimo_32_caracteres

# Session
SESSION_SECRET=tu_session_secret_super_seguro_aqui

# Google OAuth
GOOGLE_CLIENT_ID=tu_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_CALLBACK_URL=https://tu-backend.onrender.com/api/auth/google/callback

# OpenAI (opcional)
OPENAI_API_KEY=sk-tu_openai_api_key

# Configuración
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://tu-frontend.onrender.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Feature Flags
ENABLE_AI_CHAT=true
ENABLE_AI_UTILS=true
ENABLE_2FA=true
ENABLE_GOOGLE_AUTH=true
```

---

## 🌐 FRONTEND (Static Site)

### Variables Obligatorias:

```bash
# API URL (apunta a tu backend en Render)
VITE_API_URL=https://tu-backend.onrender.com

# Clerk (si lo usas)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_tu_clerk_key

# Configuración
VITE_APP_NAME=Jarana Registro Horario
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_AI_UTILS=true
```

---

## 📝 NOTAS IMPORTANTES:

### 1. **URLs en Render:**
- Backend: `https://tu-nombre-backend.onrender.com`
- Frontend: `https://tu-nombre-frontend.onrender.com`

### 2. **Google OAuth Callback:**
Debes actualizar en Google Cloud Console:
- Authorized JavaScript origins: `https://tu-frontend.onrender.com`
- Authorized redirect URIs: `https://tu-backend.onrender.com/api/auth/google/callback`

### 3. **CORS:**
El backend ya está configurado para aceptar el frontend en producción.

### 4. **Base de Datos:**
- Render te proporciona automáticamente `DATABASE_URL`
- No necesitas configurarla manualmente si usas Render PostgreSQL

---

## 🔄 CÓMO CONFIGURAR EN RENDER:

### Backend:
1. Ve a tu servicio backend en Render
2. Click en "Environment"
3. Añade cada variable con su valor
4. Click "Save Changes"

### Frontend:
1. Ve a tu servicio frontend en Render
2. Click en "Environment"
3. Añade solo las variables `VITE_*`
4. Click "Save Changes"

---

## ⚠️ SEGURIDAD:

- **NUNCA** compartas estos valores
- **NUNCA** los subas a Git
- Usa valores diferentes para desarrollo y producción
- Genera secrets seguros (mínimo 32 caracteres)

---

## 🛠️ GENERAR SECRETS SEGUROS:

En Node.js:
```javascript
require('crypto').randomBytes(32).toString('hex')
```

En terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
