# 🔄 UPDATES - Sistema AliadaDigital

## Historial Técnico de Actualizaciones

---

## Versión 1.2.0 - 15 de Diciembre 2024

### 🏢 SISTEMA MULTI-TENANT

#### 1. Base de Datos Neon para Multi-Tenant
**Descripción:** Sistema de redirección de empresas usando PostgreSQL en Neon para soportar múltiples clientes con una sola app.

**Tabla `tenants` en Neon:**
```sql
CREATE TABLE tenants (
  email VARCHAR(255) PRIMARY KEY,
  role VARCHAR(50) DEFAULT 'employee',
  enterprise_name VARCHAR(100) NOT NULL,
  api_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Archivos Nuevos:**
- `src/config/neonDb.js` - Pool de conexión a Neon con SSL
- `src/routes/tenant.js` - Endpoints para gestión de tenants

**Endpoints Implementados:**
```
GET  /api/tenant?email=xxx    # Obtener config por email
POST /api/tenant              # Crear/actualizar tenant
GET  /api/tenant/all          # Listar todos los tenants
```

**Variables de Entorno Nuevas:**
```bash
NEON_TENANT_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require
```

---

#### 2. Flujo Multi-Tenant
```
App Móvil → Login con email
         ↓
GET /api/tenant?email=xxx
         ↓
Backend consulta Neon DB
         ↓
Devuelve: { enterpriseName, apiUrl, theme, role }
         ↓
App configura tema y API URL dinámicamente
```

---

### 📱 APP MÓVIL REACT NATIVE

#### Repositorio Separado
**Ubicación:** `jarana_app_react_native/`

**Características Implementadas:**
- ✅ Google OAuth con deep linking (`registrohorario://`)
- ✅ Temas dinámicos por empresa (AliadaDigital theme)
- ✅ Navegación por roles (Admin vs Employee)
- ✅ 4 tabs empleado: Calendario, Fichar, Ausencia, Horario
- ✅ 6 tabs admin: Dashboard, Empleados, Registros, Horarios, Ausencias, Ajustes
- ✅ Servicio de tenant para redirección multi-empresa

**Archivos Clave App Móvil:**
- `src/services/tenantService.js` - Servicio multi-tenant
- `src/context/ThemeContext.js` - Temas dinámicos
- `src/theme/themes.js` - Definición de temas
- `src/theme/colors.js` - Colores AliadaDigital

---

### 🎨 TEMA ALIADADIGITAL

**Paleta de Colores (Turquesa/Navy):**
```javascript
colors: {
  brandLight: '#4ECDC4',    // Turquesa/Teal
  brandMedium: '#2C5364',   // Azul medio
  brandDark: '#1B3A4B',     // Azul navy principal
  brandDeep: '#0F2A3D',     // Azul navy oscuro
  brandAccent: '#6FE4DB',   // Turquesa claro
  brandCream: '#F9F7F4',    // Fondo crema
}
```

---

### 📊 ESTADÍSTICAS DE LA VERSIÓN

**Archivos Nuevos Backend:** 2
- `src/config/neonDb.js`
- `src/routes/tenant.js`

**Archivos Modificados Backend:** 2
- `src/index.js` (añadido tenant routes)
- `.env.example` (añadido NEON_TENANT_URL)

**Documentación Actualizada:** 2
- `docs2/CONTEXT_PROMPT.md`
- `docs2/UPDATES.md`

---

### 🔧 CONFIGURACIÓN RENDER (Producción)

**Nueva Variable de Entorno:**
```
NEON_TENANT_URL=postgresql://neondb_owner:xxx@ep-xxx.neon.tech/neondb?sslmode=require
```

---

## Versión 1.1.0 - 06-07 de Noviembre 2024

### 🚀 DEPLOYMENT EN RENDER

#### 1. Configuración Completa de Deployment
**Descripción:** Sistema desplegado exitosamente en Render con backend, frontend y base de datos PostgreSQL.

**Componentes Desplegados:**
- Backend (Web Service): `https://jarana-horas-back.onrender.com`
- Frontend (Static Site): `https://jarana-horas-back-front-1.onrender.com`
- PostgreSQL Database: `AliadaDigital-registro-db`

**Configuración Implementada:**
- ✅ Variables de entorno configuradas para producción
- ✅ Google OAuth funcionando en producción
- ✅ CORS configurado correctamente
- ✅ Redirects/Rewrites para SPA (React Router)
- ✅ Rate limiting en producción
- ✅ SSL/HTTPS habilitado

---

#### 2. Correcciones de Rutas y Assets
**Problema:** Imágenes y rutas no funcionaban en producción
**Solución Implementada:**

**a) Movimiento de Assets:**
- Imágenes movidas de `src/Images/` a `public/images/`
- Actualización de todas las rutas en componentes:
  * `MainMenuPage.jsx`
  * `HomePage.jsx`
  * `EmployeeKioskPage.jsx`
  * `AdminDashboard.jsx`
  * `Navbar.jsx`
  * `Header.jsx`

**b) Configuración de Vite:**
```javascript
// vite.config.js
build: {
  outDir: 'dist',
  sourcemap: true,
  copyPublicDir: true
},
publicDir: 'public',
```

**c) Redirects para SPA:**
- Archivo `_redirects` en `public/`
- Configuración manual en Render Dashboard
- Regla: `/* → /index.html (Rewrite)`

**Archivos Modificados:**
- `client/vite.config.js`
- `client/src/pages/MainMenuPage.jsx`
- `client/src/pages/HomePage.jsx`
- `client/src/pages/EmployeeKioskPage.jsx`
- `client/src/pages/AdminDashboard.jsx`
- `client/src/components/Navbar.jsx`
- `client/src/components/Header.jsx`

---

#### 3. Configuración de Google OAuth para Producción
**Descripción:** Google OAuth configurado y funcionando en producción.

**URLs Configuradas en Google Cloud Console:**

**Authorized JavaScript origins:**
```
http://localhost:5173
http://localhost:3000
https://jarana-horas-back.onrender.com
https://jarana-horas-back-front-1.onrender.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/google/callback
https://jarana-horas-back.onrender.com/auth/google/callback
```

**Variables de Entorno Configuradas:**
```bash
# Backend
GOOGLE_CALLBACK_URL=https://jarana-horas-back.onrender.com/auth/google/callback
FRONTEND_URL=https://jarana-horas-back-front-1.onrender.com
CLIENT_URL=https://jarana-horas-back-front-1.onrender.com
```

**Correcciones Realizadas:**
- ❌ Ruta incorrecta: `/api/auth/google/callback`
- ✅ Ruta correcta: `/auth/google/callback`
- Actualización de rutas en `src/index.js` (línea 89)

---

#### 4. Correcciones de .gitignore
**Problema:** Carpeta `client/` no se subía a GitHub
**Causa:** `.git` dentro de `client/` lo convertía en submódulo
**Solución:**
- Eliminado `.git` de `client/`
- Actualizado `.gitignore` del cliente
- Eliminada línea `public` del `.gitignore` de cliente
- Carpeta `client/` ahora parte del repositorio principal

**Archivos Modificados:**
- `.gitignore` (raíz)
- `client/.gitignore`

---

### 🔧 CONFIGURACIÓN DE RENDER

#### Backend (Web Service)
```yaml
Name: jarana-horas-back
Runtime: Node
Root Directory: (vacío)
Build Command: npm install
Start Command: npm start
Branch: master
```

**Variables de Entorno (15):**
- NODE_ENV=production
- PORT=3000
- DATABASE_URL=(Internal Database URL)
- JWT_SECRET=(32+ caracteres)
- SESSION_SECRET=(32+ caracteres)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_CALLBACK_URL
- FRONTEND_URL
- CLIENT_URL
- RATE_LIMIT_WINDOW_MS=900000
- RATE_LIMIT_MAX_REQUESTS=1000
- ENABLE_AI_CHAT=true
- ENABLE_AI_UTILS=true
- ENABLE_2FA=true
- ENABLE_GOOGLE_AUTH=true

#### Frontend (Static Site)
```yaml
Name: jarana-horas-back-front-1
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: dist
Branch: master
```

**Variables de Entorno (5):**
- VITE_API_URL=https://jarana-horas-back.onrender.com
- VITE_APP_NAME=AliadaDigital Registro Horario
- VITE_ENVIRONMENT=production
- VITE_ENABLE_AI_CHAT=true
- VITE_ENABLE_AI_UTILS=true

**Redirects/Rewrites:**
```
Source: /*
Destination: /index.html
Action: Rewrite
```

#### PostgreSQL Database
```yaml
Name: AliadaDigital-registro-db
Database: AliadaDigital_registro
User: AliadaDigital_user
Region: Frankfurt (EU Central)
Plan: Free
```

---

### 📚 DOCUMENTACIÓN CREADA

#### 1. Guías de Deployment
**Archivos Nuevos en `docs2/`:**

**a) RENDER_DEPLOYMENT.md (500+ líneas)**
- Variables de entorno completas
- Configuración paso a paso del backend
- Configuración paso a paso del frontend
- Configuración de PostgreSQL
- Verificación post-deploy
- Troubleshooting completo
- Arquitectura del sistema
- Checklist final

**b) GOOGLE_OAUTH_SETUP.md (400+ líneas)**
- Crear proyecto en Google Cloud
- Configurar OAuth Consent Screen
- Crear credenciales OAuth 2.0
- Configurar URLs autorizadas
- Obtener Client ID y Secret
- Configurar en la aplicación
- Troubleshooting de OAuth
- Límites y cuotas

**c) PROJECT_SETUP.md (600+ líneas)**
- Requisitos previos
- Instalación local completa
- Configuración de base de datos
- Variables de entorno detalladas
- Estructura del proyecto
- Scripts disponibles
- Tecnologías utilizadas
- Flujo de autenticación
- Troubleshooting común

**d) UPDATES.md (este archivo)**
- Historial completo de cambios
- Versión 1.1.0 con deployment
- Versión 1.0.2 con IA

---

### 🐛 BUGS CORREGIDOS

#### 1. Error 404 en /auth/callback
**Problema:** Frontend devolvía 404 en la ruta de callback de Google OAuth
**Causa:** Archivo `_redirects` no se copiaba al build
**Solución:**
- Actualizado `vite.config.js` con `copyPublicDir: true`
- Configuración manual de redirect en Render Dashboard
- Verificación de que `_redirects` está en `public/`

#### 2. Imágenes no cargan (404)
**Problema:** Logo y otras imágenes devolvían 404 en producción
**Causa:** Rutas apuntaban a `/src/Images/` que no existe en el build
**Solución:**
- Movidas imágenes a `public/images/`
- Actualizadas todas las rutas de `/src/Images/` a `/images/`
- Vite ahora copia automáticamente de `public/` a `dist/`

#### 3. Redirect a localhost después de Google OAuth
**Problema:** Después de login con Google, redirigía a localhost
**Causa:** Variables `CLIENT_URL` y `FRONTEND_URL` no configuradas en Render
**Solución:**
- Configuradas ambas variables apuntando a la URL del frontend en Render
- Redeploy automático del backend

#### 4. redirect_uri_mismatch en Google OAuth
**Problema:** Google rechazaba el callback con error 400
**Causa:** URL de callback no coincidía exactamente
**Solución:**
- Verificación de URL exacta: `/auth/google/callback` (sin `/api`)
- Actualización en Google Cloud Console
- Actualización de variable `GOOGLE_CALLBACK_URL` en Render

#### 5. Carpeta client/ vacía en GitHub
**Problema:** `client/` aparecía en GitHub pero sin contenido
**Causa:** Tenía su propio `.git/` (submódulo)
**Solución:**
- Eliminado `client/.git/`
- `git rm -r --cached client`
- `git add client/`
- Push con contenido completo

---

### 📊 ESTADÍSTICAS DE LA VERSIÓN

**Archivos de Documentación Nuevos:** 4
- RENDER_DEPLOYMENT.md (500+ líneas)
- GOOGLE_OAUTH_SETUP.md (400+ líneas)
- PROJECT_SETUP.md (600+ líneas)
- UPDATES.md (actualizado)

**Archivos de Código Modificados:** 10
- `client/vite.config.js`
- `client/.gitignore`
- `.gitignore`
- 6 archivos de componentes React (rutas de imágenes)

**Líneas de Documentación Añadidas:** ~1,500+

**Configuraciones Nuevas:**
- 15 variables de entorno (backend)
- 5 variables de entorno (frontend)
- 1 regla de redirect/rewrite
- 4 URLs en Google OAuth

---

### 🎯 MEJORAS DE INFRAESTRUCTURA

#### 1. Separación de Entornos
- ✅ Variables diferentes para desarrollo y producción
- ✅ Secrets seguros (32+ caracteres)
- ✅ URLs específicas por entorno
- ✅ Feature flags configurables

#### 2. Seguridad
- ✅ HTTPS en producción
- ✅ CORS configurado correctamente
- ✅ Rate limiting habilitado
- ✅ Secrets no commiteados a Git
- ✅ Helmet para headers seguros

#### 3. Performance
- ✅ Assets estáticos optimizados
- ✅ Sourcemaps solo en desarrollo
- ✅ Compresión de assets
- ✅ CDN de Render para static files

#### 4. Monitoreo
- ✅ Logs en tiempo real en Render
- ✅ Health check endpoint (`/health`)
- ✅ Estadísticas de uso en dashboard
- ✅ Alertas de errores

---

### 🔄 COMPATIBILIDAD

**Plataformas Soportadas:**
- Render (Web Service + Static Site + PostgreSQL)
- Cualquier hosting compatible con Node.js + PostgreSQL

**Requisitos de Producción:**
- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- SSL/HTTPS habilitado
- Dominio personalizado (opcional)

**Navegadores Soportados:**
- Chrome/Edge: últimas 2 versiones
- Firefox: últimas 2 versiones
- Safari: últimas 2 versiones
- Mobile: iOS Safari, Chrome Android

---

### 📝 NOTAS DE MIGRACIÓN

#### Para desplegar en Render desde cero:

1. **Preparar Repositorio:**
   ```bash
   # Verificar que client/ está en Git
   git ls-files | grep client
   
   # Si no, añadirlo
   git add client/
   git commit -m "Add client folder"
   git push origin master
   ```

2. **Crear Base de Datos:**
   - Render Dashboard → New + → PostgreSQL
   - Copiar Internal Database URL

3. **Crear Backend:**
   - Render Dashboard → New + → Web Service
   - Configurar según `RENDER_DEPLOYMENT.md`
   - Añadir todas las variables de entorno

4. **Crear Frontend:**
   - Render Dashboard → New + → Static Site
   - Configurar según `RENDER_DEPLOYMENT.md`
   - Añadir variables VITE_*
   - Configurar redirect: `/* → /index.html`

5. **Configurar Google OAuth:**
   - Seguir guía en `GOOGLE_OAUTH_SETUP.md`
   - Actualizar URLs en Google Cloud Console

6. **Verificar:**
   - Backend: `https://tu-backend.onrender.com/health`
   - Frontend: `https://tu-frontend.onrender.com`
   - Login con Google

---

### 🐛 PROBLEMAS CONOCIDOS

#### 1. Cold Start en Plan Gratuito
**Descripción:** Backend se duerme después de 15 min sin actividad
**Impacto:** Primera petición tarda 30-60 segundos
**Solución:** Upgrade a plan de pago ($7/mes) o implementar keep-alive

#### 2. Límite de Base de Datos Gratuita
**Descripción:** PostgreSQL gratuita expira después de 90 días
**Impacto:** Requiere upgrade o migración
**Solución:** Planificar upgrade antes de expiración

---

### 🎯 PRÓXIMAS FUNCIONALIDADES (v1.2.0)

- [ ] Keep-alive script para evitar cold starts
- [ ] Backup automático de base de datos
- [ ] Monitoreo de uptime
- [ ] Alertas por email en errores críticos
- [ ] Métricas de uso y performance
- [ ] CDN personalizado para assets
- [ ] Dominio personalizado
- [ ] CI/CD con GitHub Actions
- [ ] Tests automatizados en deploy
- [ ] Staging environment

---

### 👥 CONTRIBUIDORES

- Desarrollo y Deployment: Equipo AliadaDigital
- Fecha de release: 06-07 de Noviembre 2024
- Versión: 1.1.0

---

### 📞 SOPORTE

**Documentación:**
- Deployment: `docs2/RENDER_DEPLOYMENT.md`
- Google OAuth: `docs2/GOOGLE_OAUTH_SETUP.md`
- Setup Local: `docs2/PROJECT_SETUP.md`

**Recursos:**
- Render Docs: https://render.com/docs
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- GitHub Issues: Repositorio del proyecto

---

## RESUMEN EJECUTIVO v1.1.0

La versión 1.1.0 marca el primer deployment exitoso del sistema AliadaDigital en producción usando Render. Se han configurado tres servicios principales (backend, frontend y base de datos) con todas las variables de entorno necesarias, Google OAuth funcionando correctamente, y se han corregido múltiples bugs relacionados con rutas, assets y redirects.

Se ha creado documentación completa (1,500+ líneas) que cubre todo el proceso de deployment, configuración de Google OAuth, y setup del proyecto tanto en desarrollo como en producción.

El sistema está ahora completamente funcional en producción con HTTPS, autenticación segura, y todas las funcionalidades operativas.

---

## Versión 1.0.2 - 05 de Noviembre 2024

### 🎉 NUEVAS FUNCIONALIDADES PRINCIPALES

#### 1. Sistema de IA con Embeddings y RAG
**Descripción:** Sistema completo de inteligencia artificial que combina búsqueda semántica en documentos con consultas en tiempo real a la base de datos.

**Componentes Implementados:**
- `embeddingService.js` - Servicio de gestión de embeddings con OpenAI
- `enhancedAIService.js` - Servicio mejorado de IA con RAG
- Vector store en memoria para búsqueda semántica
- Integración con GPT-4o-mini para generación de respuestas

**Características:**
- ✅ Carga automática de documentos .txt desde carpeta /knowledge
- ✅ Creación de embeddings con OpenAI (text-embedding-3-small)
- ✅ Búsqueda semántica por similitud de coseno
- ✅ Consultas SQL dinámicas según el contexto de la pregunta
- ✅ Combinación inteligente de documentos + datos de BD
- ✅ Respuestas contextualizadas y precisas

**Endpoints Nuevos:**
- POST /api/ai/chat - Chat mejorado con embeddings + BD
- POST /api/ai/reload-knowledge - Recargar base de conocimiento
- GET /api/ai/knowledge-stats - Estadísticas del sistema
- POST /api/ai/upload-document - Subir documento .txt
- GET /api/ai/view-document/:filename - Ver contenido de documento
- DELETE /api/ai/delete-document/:filename - Eliminar documento
- GET /api/ai/custom-instructions - Obtener instrucciones personalizadas
- POST /api/ai/custom-instructions - Guardar instrucciones personalizadas

---

#### 2. Gestión de Conocimiento de IA en AdminDashboard
**Descripción:** Nueva sección completa en el panel de administración para gestionar el conocimiento de la IA.

**Ubicación:** AdminDashboard → Pestaña "Gestión IA" (🧠)

**Funcionalidades:**
- ✅ Estadísticas en tiempo real
- ✅ Subir documentos (drag & drop)
- ✅ Eliminar documentos
- ✅ Instrucciones personalizadas
- ✅ Gestión de documentos
- ✅ Visor de documentos en modal

---

#### 3. Base de Conocimiento Inicial
**Documentos Creados:**
- sistema_AliadaDigital.txt (81 líneas)
- guia_uso_sistema.txt (450+ líneas)
- preguntas_frecuentes.txt (400+ líneas)
- README.md (knowledge)

---

### 🔧 CORRECCIONES DE BUGS v1.0.2

1. Error de Enum en Records
2. Error de clerkUserId en AI Chat
3. Mensajes de Error Mejorados

---

**Versión Actual:** 1.1.0
**Fecha:** 06-07/11/2024
**Estado:** Producción - Estable
**Changelog técnico generado:** 07/11/2024 08:30 AM
