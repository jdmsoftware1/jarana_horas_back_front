# 🚀 Guía de Despliegue DEMO - Sistema AliadaDigital

## 📋 Resumen

Esta guía te ayudará a desplegar una demo completa del sistema AliadaDigital usando:
- **Backend**: Render (gratis)
- **Frontend**: Netlify (gratis)
- **Base de Datos**: Neon PostgreSQL (branch demo)

---

## 🎯 PARTE 1: Desplegar Backend en Render

### **Paso 1: Crear cuenta en Render**
1. Ve a [render.com](https://render.com)
2. Regístrate con GitHub (recomendado)

### **Paso 2: Conectar repositorio**
1. Haz clic en "New +" → "Web Service"
2. Conecta tu repositorio de GitHub
3. Selecciona el repositorio del proyecto

### **Paso 3: Configurar el servicio**

**Configuración básica:**
- **Name**: `AliadaDigital-demo-api`
- **Region**: Frankfurt (o el más cercano)
- **Branch**: `main` (o la que uses)
- **Root Directory**: `app/back`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### **Paso 4: Variables de entorno**

Añade estas variables en Render:

```env
NODE_ENV=production
PORT=3000
DEMO_DATABASE_URL=postgresql://usuario:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
OPENAI_API_KEY=sk-proj-tu-clave-aqui
FRONTEND_URL=https://tu-app.netlify.app
ADMIN_URL=https://tu-app.netlify.app
KIOSK_URL=https://tu-app.netlify.app
```

**Cómo obtener DEMO_DATABASE_URL de Neon:**
1. Ve a tu proyecto en [console.neon.tech](https://console.neon.tech)
2. Selecciona la branch "demo"
3. Copia la connection string
4. Pégala en `DEMO_DATABASE_URL`

### **Paso 5: Desplegar**
1. Haz clic en "Create Web Service"
2. Espera 5-10 minutos
3. Tu API estará en: `https://AliadaDigital-demo-api.onrender.com`

### **Paso 6: Verificar**
Visita: `https://AliadaDigital-demo-api.onrender.com/health`

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2025-11-05T12:00:00.000Z"
}
```

---

## 🎨 PARTE 2: Desplegar Frontend en Netlify

### **Paso 1: Crear cuenta en Netlify**
1. Ve a [netlify.com](https://netlify.com)
2. Regístrate con GitHub (recomendado)

### **Paso 2: Configurar variables de entorno**

Antes de desplegar, crea el archivo `.env.production` en `app/front/`:

```env
VITE_API_URL=https://AliadaDigital-demo-api.onrender.com/api
```

**⚠️ IMPORTANTE**: Asegúrate de que este archivo NO esté en `.gitignore` para producción, o configúralo en Netlify.

### **Paso 3: Desplegar**

**Opción A: Desde la web de Netlify**
1. Haz clic en "Add new site" → "Import an existing project"
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Base directory**: `app/front`
   - **Build command**: `npm run build`
   - **Publish directory**: `app/front/dist`
4. En "Environment variables" añade:
   ```
   VITE_API_URL=https://AliadaDigital-demo-api.onrender.com/api
   ```
5. Haz clic en "Deploy site"

**Opción B: Usando Netlify CLI (más rápido)**
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Ir a la carpeta del frontend
cd app/front

# Construir
npm run build

# Desplegar
netlify deploy --prod
```

### **Paso 4: Configurar dominio personalizado (opcional)**
1. En Netlify, ve a "Domain settings"
2. Puedes usar el dominio gratuito: `tu-app.netlify.app`
3. O conectar tu propio dominio

### **Paso 5: Actualizar CORS en Backend**

Vuelve a Render y actualiza la variable `FRONTEND_URL` con tu URL de Netlify:
```env
FRONTEND_URL=https://tu-app.netlify.app
ADMIN_URL=https://tu-app.netlify.app
KIOSK_URL=https://tu-app.netlify.app
```

Render redesplegará automáticamente.

---

## 🗄️ PARTE 3: Configurar Base de Datos Demo en Neon

### **Paso 1: Crear branch demo (ya lo hiciste)**
✅ Ya tienes la branch "demo" creada en Neon

### **Paso 2: Poblar con datos de ejemplo**

Conéctate a tu branch demo y ejecuta:

```sql
-- Crear empleado de ejemplo
INSERT INTO employees (id, name, email, employee_code, pin_hash, role, is_active)
VALUES 
  (gen_random_uuid(), 'Juan Pérez', 'juan@demo.com', 'EMP001', '$2a$10$...', 'employee', true),
  (gen_random_uuid(), 'María García', 'maria@demo.com', 'EMP002', '$2a$10$...', 'employee', true),
  (gen_random_uuid(), 'Admin Demo', 'admin@demo.com', 'ADMIN', '$2a$10$...', 'admin', true);

-- Crear registros de ejemplo
INSERT INTO records (id, employee_id, type, timestamp, device)
VALUES
  (gen_random_uuid(), (SELECT id FROM employees WHERE employee_code = 'EMP001'), 'checkin', NOW() - INTERVAL '2 hours', 'web'),
  (gen_random_uuid(), (SELECT id FROM employees WHERE employee_code = 'EMP001'), 'checkout', NOW() - INTERVAL '30 minutes', 'web');
```

### **Paso 3: Verificar conexión**

Desde tu backend desplegado, la conexión debería funcionar automáticamente.

---

## ✅ PARTE 4: Verificación Final

### **Checklist de verificación:**

- [ ] Backend desplegado en Render
- [ ] Frontend desplegado en Netlify
- [ ] Variables de entorno configuradas
- [ ] Base de datos demo conectada
- [ ] CORS configurado correctamente
- [ ] Health check funcionando
- [ ] Login funcionando
- [ ] Chat de IA funcionando (si tienes OpenAI configurado)

### **URLs de tu demo:**

- **Frontend**: `https://tu-app.netlify.app`
- **Backend API**: `https://AliadaDigital-demo-api.onrender.com/api`
- **Health Check**: `https://AliadaDigital-demo-api.onrender.com/health`

---

## 🔧 Solución de Problemas

### **Error: "Failed to fetch" en el frontend**
- Verifica que `VITE_API_URL` esté correctamente configurado
- Verifica que el backend esté corriendo (visita `/health`)
- Revisa CORS en el backend

### **Error: "Database connection failed"**
- Verifica que `DEMO_DATABASE_URL` esté correctamente configurado en Render
- Asegúrate de que la branch "demo" esté activa en Neon
- Verifica que la connection string incluya `?sslmode=require`

### **Backend tarda en responder (primera petición)**
- Render en plan gratuito "duerme" después de 15 minutos de inactividad
- La primera petición puede tardar 30-60 segundos en despertar
- Esto es normal en el plan gratuito

### **Error: "Cannot find module"**
- Asegúrate de que `node_modules` no esté en `.gitignore`
- Verifica que el `Build Command` sea `npm install`
- Revisa los logs de despliegue en Render

---

## 💡 Consejos para la Demo

### **1. Datos de prueba**
Crea usuarios de ejemplo con credenciales fáciles:
- Usuario: `demo@AliadaDigital.com`
- PIN: `1234`

### **2. Documentación de IA**
Asegúrate de que los documentos en `/knowledge` estén actualizados con información de la demo.

### **3. Monitoreo**
- Render te envía emails si el servicio falla
- Netlify tiene analytics básicos gratuitos
- Neon tiene métricas de uso de la base de datos

### **4. Actualizaciones**
- Cada push a `main` redesplegará automáticamente
- Puedes configurar deploys automáticos en Render y Netlify
- Usa branches para probar cambios antes de producción

---

## 🚀 Despliegue Rápido (Resumen)

### **Backend (Render)**
```bash
# 1. Push tu código a GitHub
git add .
git commit -m "Preparar para deploy"
git push

# 2. En Render:
# - New Web Service
# - Conectar repo
# - Root: app/back
# - Build: npm install
# - Start: npm start
# - Añadir variables de entorno
```

### **Frontend (Netlify)**
```bash
# 1. Crear .env.production
echo "VITE_API_URL=https://AliadaDigital-demo-api.onrender.com/api" > app/front/.env.production

# 2. Push a GitHub
git add .
git commit -m "Configurar producción"
git push

# 3. En Netlify:
# - New site from Git
# - Conectar repo
# - Base: app/front
# - Build: npm run build
# - Publish: app/front/dist
```

---

## 📊 Costos

### **Plan Gratuito:**
- ✅ Render: 750 horas/mes (suficiente para 1 servicio 24/7)
- ✅ Netlify: 100GB bandwidth/mes
- ✅ Neon: 3GB storage, 1 proyecto

### **Limitaciones del plan gratuito:**
- ⚠️ Render: El servicio "duerme" después de 15 min de inactividad
- ⚠️ Netlify: 100GB bandwidth (más que suficiente para demos)
- ⚠️ Neon: 3GB storage (suficiente para demos)

---

## 🎯 Próximos Pasos

1. **Personalizar dominio**: Conecta tu propio dominio en Netlify
2. **Monitoreo**: Configura alertas en Render
3. **Analytics**: Añade Google Analytics al frontend
4. **SEO**: Optimiza meta tags para compartir en redes sociales
5. **CI/CD**: Configura tests automáticos antes de desplegar

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Render (pestaña "Logs")
2. Revisa los logs en Netlify (pestaña "Deploys" → "Deploy log")
3. Verifica la consola del navegador (F12)
4. Revisa la documentación oficial:
   - [Render Docs](https://render.com/docs)
   - [Netlify Docs](https://docs.netlify.com)
   - [Neon Docs](https://neon.tech/docs)

---

**¡Tu demo está lista para mostrar a clientes!** 🎉

**Versión**: 1.0.2  
**Última actualización**: 05/11/2025  
**Autor**: JDMSoftware
