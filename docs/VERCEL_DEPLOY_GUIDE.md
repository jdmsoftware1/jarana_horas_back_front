# 🚀 Guía de Despliegue en Vercel - Sistema JARANA

## 📋 Preparación Previa

### **1. Base de Datos en la Nube**
Necesitas una base de datos PostgreSQL en la nube. Opciones recomendadas:

#### **Opción A: Vercel Postgres (Recomendado)**
1. Ve a tu dashboard de Vercel
2. Crea un nuevo proyecto
3. Ve a la pestaña "Storage"
4. Crea una nueva base de datos Postgres
5. Copia la `DATABASE_URL`

#### **Opción B: Neon (Gratuito)**
1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea una nueva base de datos
4. Copia la connection string

#### **Opción C: Railway**
1. Ve a [railway.app](https://railway.app)
2. Crea un proyecto PostgreSQL
3. Copia la connection string

---

## 🔧 **PASO 1: Desplegar Backend**

### **1.1 Preparar el Repositorio**
```bash
# Si no tienes Git inicializado
git init
git add .
git commit -m "Initial commit - JARANA system"

# Subir a GitHub
git remote add origin https://github.com/tu-usuario/registro-horario-backend.git
git branch -M main
git push -u origin main
```

### **1.2 Desplegar en Vercel**
1. **Ve a [vercel.com](https://vercel.com)**
2. **Conecta tu GitHub**
3. **Import Project** → Selecciona tu repo del backend
4. **Configure Project:**
   - **Framework Preset**: Other
   - **Root Directory**: `app/back`
   - **Build Command**: `npm run build`
   - **Output Directory**: (dejar vacío)
   - **Install Command**: `npm install`

### **1.3 Configurar Variables de Entorno**
En el dashboard de Vercel, ve a **Settings** → **Environment Variables**:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
OPENAI_API_KEY=sk-tu_clave_openai_aqui
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### **1.4 Deploy**
- Haz clic en **Deploy**
- Espera a que termine el build
- **Anota la URL del backend**: `https://tu-backend.vercel.app`

---

## 🎨 **PASO 2: Desplegar Frontend**

### **2.1 Actualizar configuración del Frontend**
Edita `app/front/src/utils/api.js`:

```javascript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://tu-backend.vercel.app/api'  // URL de tu backend desplegado
  : 'http://localhost:3000/api';

export const getApiUrl = () => API_BASE_URL;
```

### **2.2 Crear repositorio separado (o usar monorepo)**

#### **Opción A: Repositorio separado**
```bash
# Crear nuevo repo para frontend
git init
cd app/front
git add .
git commit -m "Frontend JARANA system"
git remote add origin https://github.com/tu-usuario/registro-horario-frontend.git
git push -u origin main
```

#### **Opción B: Monorepo (Recomendado)**
```bash
# Usar el mismo repo, Vercel puede manejar subdirectorios
git add .
git commit -m "Add Vercel configuration"
git push
```

### **2.3 Desplegar Frontend en Vercel**
1. **Import Project** → Selecciona tu repo del frontend
2. **Configure Project:**
   - **Framework Preset**: Vite
   - **Root Directory**: `app/front` (si es monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### **2.4 Configurar Variables de Entorno del Frontend**
```env
VITE_API_URL=https://tu-backend.vercel.app/api
```

### **2.5 Deploy Frontend**
- Haz clic en **Deploy**
- **Anota la URL del frontend**: `https://tu-frontend.vercel.app`

---

## 🔄 **PASO 3: Configurar CORS**

### **3.1 Actualizar Backend**
En tu backend desplegado, actualiza las variables de entorno:
```env
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### **3.2 Redeploy Backend**
- Ve al dashboard del backend en Vercel
- Haz clic en **Redeploy**

---

## 🗄️ **PASO 4: Configurar Base de Datos**

### **4.1 Ejecutar Migraciones**
Una vez desplegado el backend, necesitas crear las tablas:

#### **Opción A: Endpoint de Setup (Recomendado)**
1. Ve a: `https://tu-backend.vercel.app/api/setup-db`
2. Esto creará todas las tablas automáticamente

#### **Opción B: Manualmente**
```bash
# Conectarte a tu base de datos y ejecutar:
# Las queries están en back/src/models/
```

### **4.2 Crear Usuario Admin Inicial**
```bash
# POST a https://tu-backend.vercel.app/api/employees
{
  "name": "Administrador",
  "email": "admin@tuempresa.com",
  "employeeCode": "ADMIN001",
  "role": "admin"
}
```

---

## ✅ **PASO 5: Verificar Despliegue**

### **5.1 Probar Backend**
- `https://tu-backend.vercel.app/api/health` → Debe devolver status OK
- `https://tu-backend.vercel.app/api/employees` → Debe devolver lista de empleados

### **5.2 Probar Frontend**
- `https://tu-frontend.vercel.app` → Debe cargar la página principal
- Probar login y funcionalidades básicas

### **5.3 Probar Integración**
- Crear empleado desde admin dashboard
- Probar fichaje desde kiosk
- Probar chat IA

---

## 🔧 **Configuración Avanzada**

### **Custom Domains (Opcional)**
1. **En Vercel Dashboard** → **Settings** → **Domains**
2. **Agregar dominio personalizado**:
   - Backend: `api.tuempresa.com`
   - Frontend: `app.tuempresa.com`

### **SSL Certificates**
- Vercel maneja SSL automáticamente
- Para dominios custom, configura DNS según instrucciones

### **Monitoring**
- **Vercel Analytics**: Actívalo en Settings
- **Error Tracking**: Considera Sentry para producción

---

## 🚨 **Troubleshooting**

### **Error: Function Timeout**
```json
// En vercel.json del backend
{
  "functions": {
    "src/index.js": {
      "maxDuration": 30
    }
  }
}
```

### **Error: CORS**
- Verifica que `CORS_ORIGIN` apunte a tu frontend
- Asegúrate de que no hay trailing slash

### **Error: Database Connection**
- Verifica que `DATABASE_URL` sea correcta
- Asegúrate de que la DB acepta conexiones externas

### **Error: Build Failed**
```bash
# Verificar dependencias
npm install
npm run build

# Verificar logs en Vercel Dashboard
```

---

## 📊 **URLs Finales**

Una vez desplegado tendrás:

- **🎨 Frontend**: `https://tu-frontend.vercel.app`
  - Portal empleados: `/employee-portal`
  - Kiosk fichaje: `/employee-kiosk`  
  - Dashboard admin: `/admin`

- **🔧 Backend**: `https://tu-backend.vercel.app`
  - API: `/api/*`
  - Health check: `/api/health`
  - Docs: `/api/docs` (si implementas)

---

## 🎉 **¡Listo!**

Tu sistema JARANA está desplegado y listo para producción con:
- ✅ **Backend API** completamente funcional
- ✅ **Frontend React** responsive
- ✅ **Base de datos** en la nube
- ✅ **Asistente IA** integrado
- ✅ **SSL/HTTPS** automático
- ✅ **Escalabilidad** automática

**¡Disfruta tu sistema de registro horario en producción!** 🚀
