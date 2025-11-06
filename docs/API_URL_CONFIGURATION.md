# 🌐 Configuración de URL de API

## 📋 Resumen

Toda la configuración de la URL de la API está centralizada y se gestiona mediante la variable de entorno `VITE_API_URL`.

---

## 🔧 Configuración

### **1. Archivo .env (Desarrollo Local)**

Ubicación: `app/front/.env`

```env
VITE_API_URL=http://localhost:3000
```

**Nota:** Solo la URL base, **SIN** `/api` al final.

---

### **2. Archivo .env.production (Producción)**

Ubicación: `app/front/.env.production`

```env
VITE_API_URL=https://tu-backend.onrender.com
```

---

### **3. Variables de Entorno en Netlify**

Si despliegas en Netlify, configura la variable en el dashboard:

1. Ve a tu sitio en Netlify
2. **Site settings** → **Environment variables**
3. Añade:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://tu-backend.onrender.com`

---

## 📁 Archivos Modificados

### **1. Configuración Centralizada**

**`app/front/src/config/api.js`** - Archivo principal de configuración

```javascript
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

export const getApiUrl = () => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api`;
};
```

---

### **2. Vite Config**

**`app/front/vite.config.js`** - Proxy para desarrollo

```javascript
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:3000'

  return {
    server: {
      proxy: {
        '/api': {
          target: apiUrl,  // ← Usa la variable de entorno
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
```

---

### **3. Utilidad de API**

**`app/front/src/utils/api.js`** - Cliente de API

```javascript
const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();
```

---

### **4. Componentes Actualizados**

Todos estos componentes ahora importan `getApiUrl` desde `config/api.js`:

- ✅ `AdminDashboard.jsx`
- ✅ `EmployeePortal.jsx`
- ✅ `EmployeeKioskPage.jsx`
- ✅ `AIChat.jsx`

**Antes:**
```javascript
const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

**Ahora:**
```javascript
import { getApiUrl } from '../config/api';
```

---

## 🎯 Cómo Funciona

### **Desarrollo Local:**

1. Lees `VITE_API_URL` del `.env`
2. Si no existe, usa `http://localhost:3000` por defecto
3. El proxy de Vite redirige `/api/*` al backend

```
Frontend (localhost:5173)
    ↓
Fetch a /api/employees
    ↓
Vite Proxy redirige a http://localhost:3000/api/employees
    ↓
Backend (localhost:3000)
```

---

### **Producción:**

1. Lees `VITE_API_URL` de `.env.production` o Netlify
2. Las peticiones van directamente al backend en producción

```
Frontend (Netlify)
    ↓
Fetch a https://tu-backend.onrender.com/api/employees
    ↓
Backend (Render)
```

---

## ✅ Ejemplos de Uso

### **En componentes:**

```javascript
import { getApiUrl } from '../config/api';

// Obtener URL completa con /api
const apiUrl = getApiUrl();
// Resultado: http://localhost:3000/api

// Hacer petición
const response = await fetch(`${apiUrl}/employees`);
```

### **En utils/api.js:**

```javascript
import { getApiUrl } from '../config/api';

const API_BASE_URL = getApiUrl();

// Usar en todas las peticiones
fetch(`${API_BASE_URL}/auth/login`, { ... })
fetch(`${API_BASE_URL}/records/checkin`, { ... })
```

---

## 🔄 Cambiar la URL de la API

### **Para desarrollo local:**

1. Edita `app/front/.env`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

2. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

### **Para producción:**

**Opción A: Archivo .env.production**

1. Edita `app/front/.env.production`:
   ```env
   VITE_API_URL=https://tu-backend.onrender.com
   ```

2. Haz commit y push:
   ```bash
   git add app/front/.env.production
   git commit -m "Update production API URL"
   git push
   ```

**Opción B: Netlify Dashboard**

1. Ve a Netlify → Site settings → Environment variables
2. Edita `VITE_API_URL`
3. Redespliega el sitio

---

## 🚨 Errores Comunes

### **1. "Failed to fetch"**

**Causa:** URL incorrecta o backend no está corriendo

**Solución:**
```bash
# Verificar que el backend esté corriendo
cd app/back
npm run start

# Verificar la URL en .env
cat app/front/.env
```

---

### **2. "CORS error"**

**Causa:** Backend no permite peticiones desde el frontend

**Solución:** Verifica que el backend tenga configurado CORS correctamente en `app/back/src/index.js`:

```javascript
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    // ... otras URLs
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

---

### **3. "Cannot read property 'VITE_API_URL'"**

**Causa:** Archivo `.env` no existe o no está siendo leído

**Solución:**
```bash
# Crear archivo .env si no existe
cd app/front
echo "VITE_API_URL=http://localhost:3000" > .env

# Reiniciar servidor
npm run dev
```

---

## 📊 Checklist de Configuración

### **Desarrollo Local:**
- [ ] Archivo `app/front/.env` existe
- [ ] Variable `VITE_API_URL=http://localhost:3000` configurada
- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5173
- [ ] Proxy configurado en `vite.config.js`

### **Producción:**
- [ ] Archivo `app/front/.env.production` existe
- [ ] Variable `VITE_API_URL=https://tu-backend.onrender.com` configurada
- [ ] O variable configurada en Netlify dashboard
- [ ] Backend desplegado y accesible
- [ ] CORS configurado en backend

---

## 🎯 URLs Correctas

### **✅ Correcto:**

```env
# Desarrollo
VITE_API_URL=http://localhost:3000

# Producción
VITE_API_URL=https://jarana-demo-api.onrender.com
VITE_API_URL=https://api.tudominio.com
```

### **❌ Incorrecto:**

```env
# NO incluir /api al final
VITE_API_URL=http://localhost:3000/api

# NO incluir barra final
VITE_API_URL=http://localhost:3000/

# NO usar puerto incorrecto
VITE_API_URL=http://localhost:5173
```

---

## 🔍 Debugging

### **Ver la URL que se está usando:**

Añade esto temporalmente en cualquier componente:

```javascript
import { getApiUrl } from '../config/api';

console.log('API URL:', getApiUrl());
// Debería mostrar: http://localhost:3000/api
```

### **Verificar variables de entorno:**

```javascript
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('MODE:', import.meta.env.MODE);
console.log('DEV:', import.meta.env.DEV);
console.log('PROD:', import.meta.env.PROD);
```

---

## 📚 Archivos de Referencia

```
app/front/
├── .env                          ← Desarrollo (no commitear)
├── .env.production              ← Producción (opcional)
├── .env.example                 ← Plantilla
├── vite.config.js               ← Proxy configurado
├── src/
│   ├── config/
│   │   └── api.js               ← Configuración centralizada ⭐
│   ├── utils/
│   │   └── api.js               ← Cliente de API
│   ├── components/
│   │   └── AIChat.jsx           ← Usa getApiUrl()
│   └── pages/
│       ├── AdminDashboard.jsx   ← Usa getApiUrl()
│       ├── EmployeePortal.jsx   ← Usa getApiUrl()
│       └── EmployeeKioskPage.jsx ← Usa getApiUrl()
```

---

**Versión**: 1.0.2  
**Última actualización**: 05/11/2025  
**Autor**: JDMSoftware
