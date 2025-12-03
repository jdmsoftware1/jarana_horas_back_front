# 🔐 CONFIGURACIÓN DE GOOGLE OAUTH

## 📋 ÍNDICE
1. [Crear Proyecto en Google Cloud](#crear-proyecto)
2. [Configurar OAuth Consent Screen](#oauth-consent-screen)
3. [Crear Credenciales OAuth 2.0](#crear-credenciales)
4. [Configurar URLs Autorizadas](#configurar-urls)
5. [Obtener Client ID y Secret](#obtener-credenciales)
6. [Configurar en la Aplicación](#configurar-en-app)

---

## 🚀 CREAR PROYECTO

### **Paso 1: Acceder a Google Cloud Console**

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Iniciar sesión con tu cuenta de Google

### **Paso 2: Crear Nuevo Proyecto**

1. Click en el selector de proyectos (arriba a la izquierda)
2. Click en **"New Project"** o **"Nuevo Proyecto"**
3. Configurar:
   ```
   Project Name: AliadaDigital Registro Horario
   Organization: (opcional)
   Location: (opcional)
   ```
4. Click en **"Create"** o **"Crear"**
5. Esperar a que se cree el proyecto (10-30 segundos)

### **Paso 3: Seleccionar el Proyecto**

1. Click en el selector de proyectos
2. Seleccionar el proyecto recién creado

---

## 🎨 OAUTH CONSENT SCREEN

### **Paso 1: Acceder a OAuth Consent Screen**

1. En el menú lateral: **APIs & Services** → **OAuth consent screen**
2. O buscar "OAuth consent screen" en la barra de búsqueda

### **Paso 2: Configurar Tipo de Usuario**

Seleccionar el tipo según tus necesidades:

#### **Opción A: Internal (Solo para Google Workspace)**
- ✅ Solo usuarios de tu organización
- ✅ No requiere verificación de Google
- ❌ Requiere Google Workspace

#### **Opción B: External (Recomendado para la mayoría)**
- ✅ Cualquier usuario con cuenta de Google
- ✅ Funciona sin Google Workspace
- ⚠️ Limitado a 100 usuarios en modo "Testing"
- 📝 Requiere verificación para producción

**Seleccionar "External"** y click en **"Create"**

### **Paso 3: Configurar App Information**

#### **App Information:**
```
App name: AliadaDigital Registro Horario
User support email: tu-email@gmail.com
App logo: (opcional, 120x120 px)
```

#### **App Domain (opcional pero recomendado):**
```
Application home page: https://tu-frontend.onrender.com
Application privacy policy link: https://tu-frontend.onrender.com/privacy
Application terms of service link: https://tu-frontend.onrender.com/terms
```

#### **Authorized domains:**
```
onrender.com
```

#### **Developer contact information:**
```
Email addresses: tu-email@gmail.com
```

Click en **"Save and Continue"**

### **Paso 4: Configurar Scopes**

1. Click en **"Add or Remove Scopes"**
2. Seleccionar los scopes necesarios:
   ```
   .../auth/userinfo.email
   .../auth/userinfo.profile
   openid
   ```
3. Click en **"Update"**
4. Click en **"Save and Continue"**

### **Paso 5: Test Users (solo si es External)**

Si estás en modo "Testing", añadir usuarios de prueba:

1. Click en **"Add Users"**
2. Añadir emails:
   ```
   admin@gmail.com
   usuario1@gmail.com
   usuario2@gmail.com
   ```
3. Click en **"Add"**
4. Click en **"Save and Continue"**

### **Paso 6: Revisar y Confirmar**

1. Revisar toda la configuración
2. Click en **"Back to Dashboard"**

---

## 🔑 CREAR CREDENCIALES

### **Paso 1: Acceder a Credentials**

1. En el menú lateral: **APIs & Services** → **Credentials**
2. O buscar "Credentials" en la barra de búsqueda

### **Paso 2: Crear OAuth 2.0 Client ID**

1. Click en **"+ Create Credentials"** (arriba)
2. Seleccionar **"OAuth client ID"**

### **Paso 3: Configurar Application Type**

1. **Application type:** Web application
2. **Name:** AliadaDigital Registro Horario - Web Client

---

## 🌐 CONFIGURAR URLS

### **Authorized JavaScript origins**

Añadir las siguientes URLs (una por línea):

#### **Desarrollo:**
```
http://localhost:5173
http://localhost:3000
```

#### **Producción:**
```
https://tu-backend.onrender.com
https://tu-frontend.onrender.com
```

**⚠️ IMPORTANTE:**
- Sin barra `/` al final
- Protocolo correcto (`http` para localhost, `https` para producción)
- Sin paths adicionales

---

### **Authorized redirect URIs**

Añadir las siguientes URLs (una por línea):

#### **Desarrollo:**
```
http://localhost:3000/auth/google/callback
```

#### **Producción:**
```
https://tu-backend.onrender.com/auth/google/callback
```

**⚠️ CRÍTICO:**
- La ruta es `/auth/google/callback` (NO `/api/auth/google/callback`)
- Sin barra `/` al final
- Debe coincidir EXACTAMENTE con `GOOGLE_CALLBACK_URL` en Render

---

### **Ejemplo Completo:**

```
Authorized JavaScript origins:
  http://localhost:5173
  http://localhost:3000
  https://AliadaDigital-horas-back.onrender.com
  https://AliadaDigital-horas-front.onrender.com

Authorized redirect URIs:
  http://localhost:3000/auth/google/callback
  https://AliadaDigital-horas-back.onrender.com/auth/google/callback
```

Click en **"Create"**

---

## 📝 OBTENER CREDENCIALES

### **Paso 1: Copiar Client ID y Secret**

Después de crear, aparecerá un modal con:

```
Your Client ID:
123456789-abcdefghijklmnop.apps.googleusercontent.com

Your Client Secret:
GOCSPX-abcdefghijklmnopqrstuvwxyz
```

**⚠️ IMPORTANTE:**
- Copiar ambos valores
- Guardarlos en un lugar seguro
- Nunca compartirlos públicamente
- Nunca commitearlos a Git

### **Paso 2: Descargar JSON (opcional)**

Puedes descargar el archivo JSON con las credenciales:
- Click en **"Download JSON"**
- Guardar en lugar seguro
- **NO** incluir en el repositorio

---

## 🔧 CONFIGURAR EN APP

### **Variables de Entorno - Backend**

#### **Desarrollo (archivo `.env` en la raíz):**
```bash
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

#### **Producción (Render Dashboard):**
```bash
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=https://tu-backend.onrender.com/auth/google/callback
```

---

## ✅ VERIFICACIÓN

### **1. Verificar Configuración en Google Cloud**

1. Google Cloud Console → APIs & Services → Credentials
2. Click en tu OAuth 2.0 Client ID
3. Verificar que las URLs están correctas

### **2. Probar en Desarrollo**

```bash
# Iniciar backend
npm run dev:server

# Iniciar frontend
npm run dev:client

# Abrir navegador
http://localhost:5173
```

1. Click en "Iniciar sesión con Google"
2. Seleccionar cuenta
3. Debería redirigir al dashboard

### **3. Probar en Producción**

1. Ir a tu frontend: `https://tu-frontend.onrender.com`
2. Click en "Iniciar sesión con Google"
3. Seleccionar cuenta
4. Debería redirigir al dashboard

---

## 🐛 TROUBLESHOOTING

### **Error: redirect_uri_mismatch**

**Causa:** La URL de callback no coincide con las configuradas en Google Cloud.

**Solución:**
1. Verificar Google Cloud Console → Authorized redirect URIs
2. Verificar variable `GOOGLE_CALLBACK_URL` en Render
3. Deben ser EXACTAMENTE iguales
4. Esperar 1-2 minutos después de cambios en Google Cloud

### **Error: Access blocked: This app's request is invalid**

**Causa:** Falta configuración en OAuth Consent Screen o URLs incorrectas.

**Solución:**
1. Completar OAuth Consent Screen
2. Verificar Authorized JavaScript origins
3. Añadir tu email como Test User (si está en modo Testing)

### **Error: 403 - access_denied**

**Causa:** Usuario no autorizado (modo Testing) o app no verificada.

**Solución:**
1. Añadir usuario a Test Users en OAuth Consent Screen
2. O publicar la app (requiere verificación de Google)

### **Error: invalid_client**

**Causa:** Client ID o Secret incorrectos.

**Solución:**
1. Verificar que copiaste correctamente Client ID y Secret
2. Verificar que no hay espacios al inicio/final
3. Regenerar credenciales si es necesario

---

## 🔄 ACTUALIZAR CREDENCIALES

### **Si necesitas cambiar las URLs:**

1. Google Cloud Console → Credentials
2. Click en tu OAuth 2.0 Client ID
3. Editar Authorized JavaScript origins o Redirect URIs
4. **Save**
5. Esperar 1-2 minutos para que se propaguen los cambios

### **Si necesitas regenerar Secret:**

1. Google Cloud Console → Credentials
2. Click en tu OAuth 2.0 Client ID
3. Click en **"Reset Secret"**
4. Copiar el nuevo secret
5. Actualizar en Render y en `.env` local

---

## 📊 LÍMITES Y CUOTAS

### **Modo Testing:**
- 👥 Máximo 100 usuarios de prueba
- ⏰ Sin límite de tiempo
- ✅ Suficiente para desarrollo y pruebas

### **Modo Production (verificado):**
- 👥 Usuarios ilimitados
- 📝 Requiere verificación de Google
- ⏱️ Proceso de verificación: 4-6 semanas
- 💰 Puede requerir pago si superas cuotas

### **Cuotas de API:**
- 🔄 10,000 requests/día (gratis)
- 📈 Ampliable con billing habilitado

---

## 🔒 SEGURIDAD

### **Mejores Prácticas:**

✅ **Hacer:**
- Usar HTTPS en producción
- Mantener Client Secret seguro
- Rotar credenciales periódicamente
- Limitar scopes a lo necesario
- Usar diferentes credenciales para dev/prod

❌ **NO Hacer:**
- Commitear credenciales a Git
- Compartir Client Secret públicamente
- Usar mismas credenciales en múltiples apps
- Deshabilitar HTTPS en producción

---

## 📞 RECURSOS

### **Documentación Oficial:**
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [OAuth Consent Screen](https://support.google.com/cloud/answer/10311615)
- [Verification Process](https://support.google.com/cloud/answer/9110914)

### **Herramientas:**
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [JWT Debugger](https://jwt.io/)

---

## 🎯 CHECKLIST

Antes de considerar la configuración completa:

- [ ] Proyecto creado en Google Cloud
- [ ] OAuth Consent Screen configurado
- [ ] OAuth 2.0 Client ID creado
- [ ] Authorized JavaScript origins añadidas
- [ ] Authorized redirect URIs añadidas
- [ ] Client ID copiado
- [ ] Client Secret copiado
- [ ] Variables configuradas en backend
- [ ] Login funciona en desarrollo
- [ ] Login funciona en producción
- [ ] Test users añadidos (si es modo Testing)

---

**Última actualización:** Noviembre 2024
**Versión:** 1.0
