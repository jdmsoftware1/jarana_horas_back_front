# 🚀 Guía de Despliegue en Vercel

## 📋 **Pasos para Desplegar**

### **1. Preparar el Proyecto**
```bash
# Instalar dependencias
npm install

# Verificar que todo funciona localmente
npm run dev:secure
```

### **2. Configurar Clerk (Autenticación)**

#### **Crear cuenta en Clerk**
1. Ve a [clerk.com](https://clerk.com)
2. Crea una cuenta gratuita
3. Crea una nueva aplicación: "Jarana Registro Horario"

#### **Configurar Clerk**
```javascript
// En el dashboard de Clerk:
1. Ir a "User & Authentication" → "Email, Phone, Username"
2. Habilitar: Email + Password
3. Opcional: Google, Microsoft (para SSO empresarial)

// En "Organizations" (opcional):
1. Habilitar organizaciones si tienes múltiples empresas
2. Configurar roles: admin, employee
```

#### **Obtener las claves**
```bash
# En Clerk Dashboard → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### **3. Configurar Base de Datos**

#### **Opción A: PlanetScale (Recomendado)**
```bash
# 1. Crear cuenta en planetscale.com
# 2. Crear base de datos: jarana-registro
# 3. Obtener connection string
DATABASE_URL=mysql://user:pass@host/jarana-registro?sslaccept=strict
```

#### **Opción B: Neon (PostgreSQL)**
```bash
# 1. Crear cuenta en neon.tech  
# 2. Crear proyecto: jarana-registro
# 3. Obtener connection string
DATABASE_URL=postgresql://user:pass@host/jarana-registro?sslmode=require
```

### **4. Desplegar en Vercel**

#### **Conectar Repositorio**
```bash
# 1. Subir código a GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/jarana-registro.git
git push -u origin main

# 2. En vercel.com:
# - Importar proyecto desde GitHub
# - Seleccionar tu repositorio
```

#### **Configurar Variables de Entorno**
```bash
# En Vercel Dashboard → Settings → Environment Variables
DATABASE_URL=tu_connection_string_de_bd
JWT_SECRET=tu_jwt_secret_super_seguro
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NODE_ENV=production
```

#### **Configurar Dominios (Opcional)**
```bash
# En Vercel Dashboard → Settings → Domains
admin.jarana.com    → /admin
kiosk.jarana.com    → /kiosk
api.jarana.com      → /api
```

### **5. Configurar Usuarios y Roles**

#### **Crear Usuarios Admin**
```javascript
// En Clerk Dashboard → Users
1. Crear usuario manualmente
2. Email: admin@tuempresa.com
3. En "Metadata" → "Private":
{
  "role": "admin",
  "employeeCode": "ADM001"
}
```

#### **Crear Empleados**
```javascript
// Opción 1: Desde el panel admin (una vez desplegado)
// Opción 2: Invitaciones por email desde Clerk
// Opción 3: Crear manualmente en Clerk Dashboard

// Metadata para empleados:
{
  "role": "employee", 
  "employeeCode": "EMP001"
}
```

## 🔐 **Configuración de Seguridad**

### **Restricciones de Acceso**
```javascript
// En Clerk Dashboard → Restrictions
1. "Sign-up restrictions" → "Restricted"
2. Solo usuarios invitados pueden registrarse
3. Dominios permitidos: @tuempresa.com (opcional)
```

### **Configurar Roles**
```javascript
// En tu código (ya incluido):
- Admin: Acceso completo al panel /admin
- Employee: Solo acceso al kiosk /kiosk
- Verificación automática de roles en cada request
```

## 📱 **URLs Finales**

### **Desarrollo Local**
```bash
http://localhost:5174/admin  # Panel Admin
http://localhost:5175/kiosk  # Kiosk Empleados
http://localhost:3000/api    # API Backend
```

### **Producción**
```bash
https://tu-app.vercel.app/admin  # Panel Admin
https://tu-app.vercel.app/kiosk  # Kiosk Empleados
https://tu-app.vercel.app/api    # API Backend

# O con dominios personalizados:
https://admin.jarana.com
https://kiosk.jarana.com
```

## 🎯 **Flujo de Usuario Final**

### **Para Administradores**
1. Van a `tu-app.vercel.app/admin`
2. Clerk les pide login (email/password o Google)
3. Solo usuarios con rol "admin" pueden entrar
4. Acceso completo: crear empleados, ver analytics, etc.

### **Para Empleados**
1. Van a `tu-app.vercel.app/kiosk`
2. Clerk les pide login
3. Solo usuarios con rol "employee" pueden entrar
4. Solo pueden fichar entrada/salida y ver sus registros

## 💰 **Costos**

### **Gratis (Para empezar)**
- **Vercel**: Gratis (100GB bandwidth, funciones serverless)
- **Clerk**: Gratis (hasta 5000 usuarios activos/mes)
- **PlanetScale**: Gratis (1GB storage, 1 billion reads)
- **Total**: $0/mes

### **Escalado (Si creces)**
- **Vercel Pro**: $20/mes (más bandwidth y funciones)
- **Clerk Pro**: $25/mes (usuarios ilimitados + features avanzadas)
- **PlanetScale**: $29/mes (10GB + branching)

## ✅ **Checklist de Despliegue**

- [ ] Código subido a GitHub
- [ ] Cuenta Clerk creada y configurada
- [ ] Base de datos creada (PlanetScale/Neon)
- [ ] Variables de entorno configuradas en Vercel
- [ ] Proyecto desplegado en Vercel
- [ ] Usuario admin creado en Clerk
- [ ] Probado acceso a /admin y /kiosk
- [ ] Empleados invitados y configurados

## 🆘 **Solución de Problemas**

### **Error: "Unauthorized"**
- Verificar que CLERK_SECRET_KEY está configurada
- Verificar que el usuario tiene el rol correcto en metadata

### **Error: "Database connection failed"**
- Verificar DATABASE_URL en variables de entorno
- Verificar que la base de datos está activa

### **Error: "Build failed"**
- Verificar que todas las dependencias están en package.json
- Verificar que no hay errores de TypeScript/ESLint

¡Con esta configuración tendrás un sistema **100% seguro** y **privado** funcionando en Vercel!
