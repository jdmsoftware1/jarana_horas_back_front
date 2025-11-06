# 🔐 Configuración de Seguridad - Jarana

## 🏗️ Arquitectura de Seguridad Multi-Nivel

### **Separación de Interfaces**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ADMIN PANEL   │    │    BACKEND      │    │ EMPLOYEE KIOSK  │
│   Port: 5174    │────│   Port: 3000    │────│   Port: 5175    │
│ admin.jarana.com│    │  api.jarana.com │    │ kiosk.jarana.com│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **1. Interfaces Separadas**

#### **🖥️ Admin Panel** (`/app/admin/`)
- **Puerto**: 5174
- **Acceso**: Solo administradores
- **Funciones**: Gestión completa, analytics, empleados
- **URL Producción**: `admin.jarana.com`

#### **📱 Employee Kiosk** (`/app/kiosk/`)
- **Puerto**: 5175  
- **Acceso**: Solo empleados
- **Funciones**: Login, checkin/checkout, registros básicos
- **URL Producción**: `kiosk.jarana.com`

#### **🔧 Backend API** (`/app/back/`)
- **Puerto**: 3000
- **Rutas Separadas**:
  - `/api/admin/*` - Solo admin panel
  - `/api/kiosk/*` - Solo employee kiosk

## 🛡️ Capas de Seguridad

### **Nivel 1: Validación de Origen**
```javascript
// Solo admin panel puede acceder a rutas admin
adminOriginOnly: [
  'http://localhost:5174',
  'https://admin.jarana.com',
  /^https:\/\/.*-admin\.netlify\.app$/
]

// Solo kiosk puede acceder a rutas kiosk
kioskOriginOnly: [
  'http://localhost:5175', 
  'https://kiosk.jarana.com',
  /^https:\/\/.*-kiosk\.netlify\.app$/
]
```

### **Nivel 2: Rate Limiting Diferenciado**
```javascript
// Admin: 100 requests/15min
adminRateLimit: 100 requests per 15 minutes

// Kiosk: 50 requests/15min  
kioskRateLimit: 50 requests per 15 minutes

// Login: 5 intentos/15min
loginRateLimit: 5 attempts per 15 minutes
```

### **Nivel 3: Autenticación JWT**
```javascript
// Admin: Token 24h con permisos completos
adminToken: { role: 'admin', permissions: ['all'] }

// Kiosk: Token 8h con permisos limitados
kioskToken: { role: 'employee', permissions: ['checkin', 'checkout'] }
```

### **Nivel 4: Validación de Entrada**
- **Sanitización**: Todos los inputs son validados y sanitizados
- **Longitud**: Límites estrictos en todos los campos
- **Formato**: Validación de emails, PINs, códigos

### **Nivel 5: Logging y Auditoría**
```javascript
// Logs de seguridad automáticos
🚨 Unauthorized access attempts
📊 All API requests with user context  
🔐 Login attempts (success/failure)
📥📤 Checkin/checkout events
👤 Employee management actions
```

## 🚀 Configuración de Despliegue Seguro

### **Opción 1: Subdominios Separados**
```bash
# DNS Configuration
admin.jarana.com    → Admin Panel (Netlify/Vercel)
kiosk.jarana.com    → Employee Kiosk (Netlify/Vercel)  
api.jarana.com      → Backend API (Railway/Heroku)
```

### **Opción 2: Netlify Functions + Pages**
```bash
# Netlify Sites
jarana-admin.netlify.app    → Admin Panel
jarana-kiosk.netlify.app    → Employee Kiosk
jarana-api.netlify.app      → Backend Functions
```

### **Opción 3: Cloudflare Pages + Workers**
```bash
# Cloudflare
admin.jarana.com     → Pages (Admin)
kiosk.jarana.com     → Pages (Kiosk)
api.jarana.com       → Workers (Backend)
```

## 🔧 Variables de Entorno de Producción

### **Backend (.env)**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/jarana_prod

# Security
JWT_SECRET=super-secure-random-key-256-bits
NODE_ENV=production

# CORS Origins
ADMIN_URL=https://admin.jarana.com
KIOSK_URL=https://kiosk.jarana.com

# Optional: IP Restrictions
ADMIN_IPS=192.168.1.100,10.0.0.50
ENABLE_IP_WHITELIST=true
```

### **Admin Panel (.env)**
```bash
VITE_API_URL=https://api.jarana.com
VITE_APP_NAME=Jarana Admin
VITE_ENVIRONMENT=production
```

### **Kiosk (.env)**
```bash
VITE_API_URL=https://api.jarana.com
VITE_APP_NAME=Jarana Kiosk
VITE_ENVIRONMENT=production
VITE_KIOSK_MODE=true
```

## 🛠️ Comandos de Desarrollo

### **Desarrollo Local Completo**
```bash
# Todas las interfaces (desarrollo)
npm run dev

# Solo interfaces seguras (sin frontend original)
npm run dev:secure
```

### **Desarrollo Individual**
```bash
npm run dev:back    # Backend (puerto 3000)
npm run dev:admin   # Admin Panel (puerto 5174)
npm run dev:kiosk   # Employee Kiosk (puerto 5175)
```

### **Build para Producción**
```bash
npm run build       # Build todas las interfaces
npm run build:admin # Solo admin panel
npm run build:kiosk # Solo kiosk
```

## 🔒 Características de Seguridad Implementadas

### **✅ Protección contra Ataques**
- **CSRF**: Validación de origen estricta
- **XSS**: Sanitización de inputs con express-validator
- **SQL Injection**: Sequelize ORM con queries parametrizadas
- **Timing Attacks**: Delays aleatorios en login
- **Brute Force**: Rate limiting agresivo
- **Session Hijacking**: JWT con expiración corta

### **✅ Monitoreo y Auditoría**
- **Logs estructurados** de todas las acciones
- **Detección de intentos** de acceso no autorizado
- **Tracking de dispositivos** (tablet/móvil/desktop)
- **Geolocalización de IPs** (opcional)

### **✅ Separación de Responsabilidades**
- **Admin**: Gestión completa desde oficina/PC
- **Kiosk**: Solo fichaje desde tablet/entrada
- **APIs separadas** con permisos específicos
- **Tokens diferenciados** por tipo de usuario

## 📱 Uso Recomendado

### **👨‍💼 Administradores**
- **Dispositivo**: PC/Laptop en oficina
- **URL**: `admin.jarana.com`
- **Funciones**: Crear empleados, ver analytics, gestión completa

### **👷‍♂️ Empleados**
- **Dispositivo**: Tablet en entrada/recepción
- **URL**: `kiosk.jarana.com`
- **Funciones**: Login, fichar entrada/salida, ver registros propios

## 🚨 Alertas de Seguridad

El sistema detecta y alerta sobre:
- Intentos de acceso admin desde kiosk
- Múltiples fallos de login
- Accesos desde IPs no autorizadas
- Requests desde orígenes no válidos
- Patrones de uso anómalos

## 🔄 Mantenimiento

### **Rotación de Secretos**
```bash
# Cambiar JWT_SECRET periódicamente
# Regenerar TOTP secrets si es necesario
# Actualizar IPs autorizadas
```

### **Monitoreo**
```bash
# Revisar logs de seguridad diariamente
# Verificar intentos de acceso fallidos
# Auditar creación/modificación de empleados
```

Esta arquitectura garantiza que tu sistema sea **completamente seguro** y **no esté público** para acceso no autorizado, con separación clara entre funciones administrativas y de empleados.
