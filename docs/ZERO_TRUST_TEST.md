# 🔐 Probar Zero Trust Configuration

## 📋 **URLs para probar después de configurar:**

### **1. Endpoints públicos (sin autenticación):**
- ✅ https://jarana-backend.jdmsoftware1.workers.dev/api/health
- ✅ https://jarana-backend.jdmsoftware1.workers.dev/api/debug

### **2. Endpoints protegidos (requieren autenticación):**
- 🔒 https://jarana-backend.jdmsoftware1.workers.dev/api/user/profile
- 🔒 https://jarana-backend.jdmsoftware1.workers.dev/api/employees
- 🔒 https://jarana-backend.jdmsoftware1.workers.dev/api/records

## 🧪 **Proceso de prueba:**

### **Paso 1: Probar sin autenticación**
1. Abre una ventana de incógnito
2. Ve a: https://jarana-backend.jdmsoftware1.workers.dev/api/user/profile
3. **Resultado esperado**: Cloudflare te redirige al login

### **Paso 2: Autenticarte**
1. Completa el proceso de login
2. **Resultado esperado**: Ves la respuesta JSON con tu información

### **Paso 3: Probar otros endpoints**
1. Ve a: https://jarana-backend.jdmsoftware1.workers.dev/api/employees
2. **Resultado esperado**: Ves datos de empleados (mock data)

## 🔧 **Si algo no funciona:**

### **Error: "Access denied"**
- Verifica que tu email esté en la política de acceso
- Revisa la configuración de la aplicación en Zero Trust

### **Error: "Application not found"**
- Verifica que el dominio sea exactamente: `jarana-backend.jdmsoftware1.workers.dev`
- Verifica que el path sea: `/api/*`

### **Error: "Too many redirects"**
- Verifica que no tengas múltiples políticas conflictivas
- Revisa que la aplicación esté activa

## ✅ **Configuración correcta:**

```
Application name: JARANA Backend API
Domain: jarana-backend.jdmsoftware1.workers.dev
Path: /api/*
Policy: Allow emails - tu-email@gmail.com
Status: Active
```

## 🎉 **Una vez que funcione:**

Podrás usar tu API con autenticación automática:
- El frontend recibirá automáticamente la información del usuario
- No necesitas manejar tokens JWT
- Cloudflare maneja toda la seguridad
- Logout automático con `/cdn-cgi/access/logout`
