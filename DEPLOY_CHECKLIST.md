# ✅ CHECKLIST DE DEPLOY EN RENDER

## 📋 ANTES DE EMPEZAR

- [ ] Código funcionando localmente
- [ ] Todos los archivos `.env` en `.gitignore`
- [ ] Repositorio en GitHub
- [ ] Cuenta en Render creada
- [ ] Google OAuth configurado (si lo usas)
- [ ] OpenAI API Key (si usas IA)

---

## 🗄️ BASE DE DATOS

- [ ] Crear PostgreSQL en Render
- [ ] Nombre: `jarana-registro-db`
- [ ] Región: Frankfurt (o la más cercana)
- [ ] Plan: Free (para empezar)
- [ ] Copiar `Internal Database URL`

---

## 🖥️ BACKEND

### Crear Web Service:
- [ ] New + → Web Service
- [ ] Conectar repositorio GitHub
- [ ] Name: `jarana-registro-backend`
- [ ] Runtime: Node
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Plan: Free

### Variables de Entorno:
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `DATABASE_URL` (desde la BD)
- [ ] `JWT_SECRET` (generar)
- [ ] `SESSION_SECRET` (generar)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_CALLBACK_URL=https://tu-backend.onrender.com/api/auth/google/callback`
- [ ] `FRONTEND_URL=https://tu-frontend.onrender.com`
- [ ] `OPENAI_API_KEY` (opcional)
- [ ] `RATE_LIMIT_WINDOW_MS=900000`
- [ ] `RATE_LIMIT_MAX_REQUESTS=1000`
- [ ] `ENABLE_AI_CHAT=true`
- [ ] `ENABLE_AI_UTILS=true`
- [ ] `ENABLE_2FA=true`
- [ ] `ENABLE_GOOGLE_AUTH=true`

### Deploy:
- [ ] Click "Create Web Service"
- [ ] Esperar a que termine el build
- [ ] Verificar logs (sin errores)
- [ ] Probar: `https://tu-backend.onrender.com/api/health`

---

## 🌐 FRONTEND

### Crear Static Site:
- [ ] New + → Static Site
- [ ] Conectar mismo repositorio
- [ ] Name: `jarana-registro-frontend`
- [ ] Root Directory: `client`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `dist`
- [ ] Plan: Free

### Variables de Entorno:
- [ ] `VITE_API_URL=https://tu-backend.onrender.com`
- [ ] `VITE_APP_NAME=Jarana Registro Horario`
- [ ] `VITE_ENVIRONMENT=production`
- [ ] `VITE_ENABLE_AI_CHAT=true`
- [ ] `VITE_ENABLE_AI_UTILS=true`
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` (si usas Clerk)

### Deploy:
- [ ] Click "Create Static Site"
- [ ] Esperar a que termine el build
- [ ] Verificar logs (sin errores)
- [ ] Abrir URL del frontend

---

## 🔐 GOOGLE OAUTH

- [ ] Ir a [Google Cloud Console](https://console.cloud.google.com)
- [ ] Seleccionar proyecto
- [ ] APIs & Services → Credentials
- [ ] Editar OAuth 2.0 Client ID

### Authorized JavaScript origins:
- [ ] `https://tu-frontend.onrender.com`

### Authorized redirect URIs:
- [ ] `https://tu-backend.onrender.com/api/auth/google/callback`

- [ ] Guardar cambios

---

## ✅ VERIFICACIÓN

### Backend:
- [ ] `curl https://tu-backend.onrender.com/api/health`
- [ ] Responde con `{"status":"ok"}`
- [ ] No hay errores en logs

### Frontend:
- [ ] Abre `https://tu-frontend.onrender.com`
- [ ] La página carga correctamente
- [ ] No hay errores en consola (F12)
- [ ] Puedes hacer login

### Base de Datos:
- [ ] Backend conecta correctamente
- [ ] Tablas se crean automáticamente
- [ ] Puedes crear usuarios

### Google OAuth:
- [ ] Botón "Login con Google" funciona
- [ ] Redirige correctamente
- [ ] Crea usuario en BD

---

## 🔄 POST-DEPLOY

- [ ] Crear primer usuario admin
- [ ] Probar todas las funcionalidades principales
- [ ] Verificar que los registros se guardan
- [ ] Probar kiosk de fichaje
- [ ] Verificar horarios semanales
- [ ] Probar vista de registros

---

## 📊 MONITOREO

- [ ] Configurar alertas en Render (opcional)
- [ ] Revisar logs periódicamente
- [ ] Monitorear uso de recursos
- [ ] Verificar que el backend no se duerma mucho (plan free)

---

## 🎉 ¡COMPLETADO!

Si todos los checkboxes están marcados, ¡tu aplicación está en producción!

**URLs:**
- Backend: `https://jarana-registro-backend.onrender.com`
- Frontend: `https://jarana-registro-frontend.onrender.com`

---

## 📝 NOTAS

### Secrets Generados:
```
JWT_SECRET: ___________________________________
SESSION_SECRET: ________________________________
```

### URLs de Producción:
```
Backend: ________________________________________
Frontend: _______________________________________
Database: _______________________________________
```

### Fecha de Deploy:
```
Primera vez: ____________________________________
Última actualización: ___________________________
```
