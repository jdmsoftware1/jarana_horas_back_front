# 🔒 Configuración Segura - Variables de Entorno

## ⚠️ **IMPORTANTE - Seguridad:**

**❌ NUNCA hagas esto:**
- Hardcodear credenciales en el código
- Subir archivos `.env.production` al repositorio
- Exponer Service Tokens en el frontend

**✅ SIEMPRE haz esto:**
- Usar variables de entorno
- Configurar secrets en Cloudflare Pages
- Mantener credenciales fuera del código fuente

## 🔧 **Configuración en Cloudflare Pages:**

### **1. Variables de Entorno:**
En **Cloudflare Pages** → **Settings** → **Environment variables** → **Production**:

```
VITE_CF_ACCESS_CLIENT_ID = f8be2fa610a6a7e18c57581097319bc7.access
VITE_CF_ACCESS_CLIENT_SECRET = f5ad25eccd4cc76870a546357171296a3caf8a261ba6e2c87a8cee66bcac65d8
```

### **2. Variables para Preview (opcional):**
En **Preview** tab (para testing):
```
VITE_CF_ACCESS_CLIENT_ID = (mismo valor)
VITE_CF_ACCESS_CLIENT_SECRET = (mismo valor)
```

## 🧪 **Para Desarrollo Local:**

### **1. Crear archivo .env.local:**
```bash
# Solo para desarrollo local - NO subir al repo
VITE_CF_ACCESS_CLIENT_ID=f8be2fa610a6a7e18c57581097319bc7.access
VITE_CF_ACCESS_CLIENT_SECRET=f5ad25eccd4cc76870a546357171296a3caf8a261ba6e2c87a8cee66bcac65d8
```

### **2. Verificar .gitignore:**
```
.env
.env.local
.env.production
.env.production.local
```

## 🔍 **Verificar Configuración:**

### **1. En desarrollo:**
```javascript
console.log('Client ID:', import.meta.env.VITE_CF_ACCESS_CLIENT_ID);
console.log('Has Secret:', !!import.meta.env.VITE_CF_ACCESS_CLIENT_SECRET);
```

### **2. En producción:**
- Las variables se configuran en Cloudflare Pages
- No aparecen en el código fuente
- Solo están disponibles durante el build

## 🛡️ **Mejores Prácticas:**

### **✅ Seguridad:**
1. **Variables de entorno** para credenciales
2. **Cloudflare Pages Environment Variables** para producción
3. **Gitignore** para archivos sensibles
4. **Rotación regular** de Service Tokens

### **🔄 Rotación de Tokens:**
1. Generar nuevo Service Token en Zero Trust
2. Actualizar variables en Cloudflare Pages
3. Hacer redeploy
4. Revocar token anterior

## 🎯 **Resultado:**
- ✅ **Credenciales seguras** fuera del código
- ✅ **Variables de entorno** en Cloudflare
- ✅ **Sin secretos** en el repositorio
- ✅ **Fácil rotación** de credenciales
