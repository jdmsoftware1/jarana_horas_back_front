# 🚀 Despliegue en Render

## 📋 **Resumen:**

Este proyecto es un **monorepo** con:
- **Backend:** Node.js + Express (puerto 3000)
- **Frontend:** React + Vite (compilado a `client/dist`)
- **Base de datos:** PostgreSQL (Neon)

En producción, el backend sirve el frontend compilado.

---

## 🔧 **CONFIGURACIÓN EN RENDER**

### **1. Crear Web Service**

1. Ve a: https://dashboard.render.com/
2. Clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub/GitLab

---

### **2. Configuración del Servicio**

**Name:** `AliadaDigital-registro-horario`

**Region:** `Frankfurt (EU Central)` (o el más cercano)

**Branch:** `main` (o tu rama principal)

**Root Directory:** (dejar vacío)

**Runtime:** `Node`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Plan:** `Free` (o el que prefieras)

---

### **3. Variables de Entorno**

Añade estas variables en **Environment**:

```env
# Base de datos
DATABASE_URL=postgresql://usuario:password@host:5432/database

# JWT
JWT_SECRET=tu-secret-super-largo-minimo-32-caracteres
JWT_REFRESH_SECRET=otro-secret-diferente-muy-largo
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session
SESSION_SECRET=otro-secret-para-sesiones-muy-largo

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-secret
GOOGLE_CALLBACK_URL=https://tu-app.onrender.com/auth/google/callback

# Emails autorizados
AUTHORIZED_EMAILS=admin@empresa.com,user@empresa.com
# O dominio completo:
# AUTHORIZED_DOMAIN=@empresa.com

# OpenAI (opcional)
OPENAI_API_KEY=sk-proj-tu-clave

# Configuración
NODE_ENV=production
PORT=3000
CLIENT_URL=https://tu-app.onrender.com

# Empresa (branding)
COMPANY_NAME=AliadaDigital
COMPANY_LOGO_URL=https://tu-logo.com/logo.png
PRIMARY_COLOR=#8B4513
SECONDARY_COLOR=#D2691E
```

---

### **4. Actualizar Google Cloud Console**

Después de desplegar, añade las URLs de producción:

**Orígenes de JavaScript autorizados:**
```
http://localhost:3000
http://localhost:5173
https://tu-app.onrender.com
```

**URIs de redireccionamiento autorizados:**
```
http://localhost:3000/auth/google/callback
https://tu-app.onrender.com/auth/google/callback
```

---

## 🔄 **FLUJO DE DESPLIEGUE**

```
1. Push a GitHub/GitLab
   ↓
2. Render detecta cambios
   ↓
3. Ejecuta: npm install
   ↓
4. Ejecuta: npm run build
   (Compila React → client/dist)
   ↓
5. Ejecuta: npm start
   (Inicia backend en puerto 3000)
   ↓
6. Backend sirve archivos de client/dist
   ↓
7. ✅ Aplicación disponible en:
   https://tu-app.onrender.com
```

---

## 📁 **ESTRUCTURA EN PRODUCCIÓN**

```
registro_horario/
├── src/                    # Backend (Node.js)
│   └── index.js           # Sirve API + frontend
├── client/
│   └── dist/              # Frontend compilado (React)
│       ├── index.html
│       ├── assets/
│       └── ...
└── package.json           # Scripts de build/start
```

---

## ✅ **VERIFICACIÓN**

### **Después del despliegue:**

1. **Backend API:**
   ```
   https://tu-app.onrender.com/health
   ```
   Debería responder: `{"status":"OK","timestamp":"..."}`

2. **Frontend:**
   ```
   https://tu-app.onrender.com
   ```
   Debería mostrar la página de inicio

3. **Google OAuth:**
   ```
   https://tu-app.onrender.com/auth/google
   ```
   Debería redirigir a Google

---

## 🐛 **TROUBLESHOOTING**

### **Error: "Cannot GET /"**
**Causa:** El frontend no se compiló correctamente.

**Solución:**
```bash
# Local:
npm run build

# Verifica que exista:
client/dist/index.html
```

### **Error: "Google OAuth failed"**
**Causa:** URLs no configuradas en Google Cloud Console.

**Solución:**
1. Ve a Google Cloud Console
2. Añade `https://tu-app.onrender.com` a orígenes
3. Añade `https://tu-app.onrender.com/auth/google/callback` a callbacks

### **Error: "Database connection failed"**
**Causa:** `DATABASE_URL` incorrecta o BD no accesible.

**Solución:**
1. Verifica que `DATABASE_URL` esté en variables de entorno
2. Verifica que Neon permita conexiones externas
3. Verifica que la URL sea correcta

---

## 📊 **LOGS EN RENDER**

Para ver logs en tiempo real:

1. Ve a tu servicio en Render
2. Clic en **"Logs"**
3. Busca errores o warnings

---

## 🔐 **SEGURIDAD**

### **Variables sensibles:**
- ✅ Nunca commitear `.env` al repositorio
- ✅ Usar variables de entorno en Render
- ✅ Generar secretos largos y aleatorios
- ✅ Usar HTTPS en producción (automático en Render)

### **Generar secretos:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🚀 **COMANDOS ÚTILES**

### **Local (Desarrollo):**
```bash
# Iniciar backend + frontend
npm run dev

# Solo backend
npm run start

# Solo frontend
npm run dev:client

# Compilar frontend
npm run build

# Verificar configuración
npm run check-env
```

### **Producción (Render):**
```bash
# Build (automático)
npm install && npm run build

# Start (automático)
npm start
```

---

## 📝 **CHECKLIST DE DESPLIEGUE**

- [ ] Repositorio en GitHub/GitLab
- [ ] Crear Web Service en Render
- [ ] Configurar Build Command: `npm install && npm run build`
- [ ] Configurar Start Command: `npm start`
- [ ] Añadir todas las variables de entorno
- [ ] Actualizar Google Cloud Console con URLs de producción
- [ ] Actualizar `GOOGLE_CALLBACK_URL` en variables de entorno
- [ ] Actualizar `CLIENT_URL` en variables de entorno
- [ ] Verificar que `DATABASE_URL` apunte a Neon
- [ ] Probar `/health` endpoint
- [ ] Probar login con Google
- [ ] Verificar que el frontend cargue correctamente

---

## 🎯 **RESULTADO FINAL**

**URL de producción:** `https://AliadaDigital-registro-horario.onrender.com`

**Funcionalidades:**
- ✅ Login con Google OAuth
- ✅ Admin Dashboard
- ✅ Portal de Empleado (TOTP)
- ✅ Kiosk (PIN)
- ✅ Gestión de horarios
- ✅ Registros de asistencia
- ✅ Reportes y analytics

---

**¡Listo para producción!** 🚀
