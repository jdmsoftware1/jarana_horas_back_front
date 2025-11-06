# 🔐 Guía Completa de Autenticación - Sistema Jarana

Esta guía explica en detalle el **sistema híbrido de autenticación** que combina **Clerk** para supervisores y **autenticación interna** para empleados.

## 🏗️ Arquitectura de Autenticación

### 🔄 **Flujo Híbrido**

El sistema utiliza **dos métodos de autenticación diferentes** según el tipo de usuario:

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA HÍBRIDO                          │
├─────────────────────────┬───────────────────────────────────┤
│    SUPERVISOR (Clerk)   │      EMPLEADOS (Interno)         │
│                         │                                   │
│ ✅ Autenticación externa│ ✅ Sistema propio                 │
│ ✅ OAuth/Email/Password │ ✅ Código + Google Authenticator  │
│ ✅ Dashboard completa   │ ✅ Solo fichaje                   │
│ ✅ Gestión del sistema  │ ✅ Interfaz simplificada          │
└─────────────────────────┴───────────────────────────────────┘
```

## 🔑 Configuración de Clerk

### 1. **Crear Aplicación en Clerk**

1. **Registrarse** en [clerk.com](https://clerk.com)
2. **Crear nueva aplicación**:
   - Nombre: `Jarana - Sistema Horario`
   - Tipo: `React`
3. **Configurar métodos de login**:
   - ✅ Email + Password
   - ✅ Google OAuth (opcional)
   - ❌ Phone number (desactivar)

### 2. **Obtener Claves**

En el dashboard de Clerk:
```bash
# Publishable Key (para frontend)
pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Secret Key (para backend - opcional)
sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. **Configurar Variables de Entorno**

```bash
# En app/front/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_tu_clave_publishable_aqui
VITE_API_URL=http://localhost:3000/api
```

### 4. **Configurar Restricciones**

En Clerk Dashboard → **User & Authentication**:

#### **Sign-up Mode**
- ✅ **Restricted** (solo invitaciones)
- ❌ Public (cualquiera puede registrarse)

#### **Allowlist**
Añadir emails autorizados:
```
supervisor@empresa.com
admin@empresa.com
gerente@empresa.com
```

#### **Session Settings**
- **Session timeout**: 24 horas
- **Multi-session**: Desactivado
- **Sign out URL**: `/`

## 👨‍💼 Autenticación de Supervisores

### 🔄 **Flujo Completo**

#### **1. Acceso Inicial**
```
Usuario → Página Principal → "Activar Sistema" → Login Clerk
```

#### **2. Proceso de Login**
1. **Redirección** a `/admin-login`
2. **Componente Clerk** `<SignIn>` se muestra
3. **Usuario introduce** credenciales
4. **Clerk valida** y autentica
5. **Redirección** a `/` (página principal)

#### **3. Activación del Sistema**
```javascript
// SystemContext.jsx
useEffect(() => {
  if (isLoaded && user) {
    // Usuario autenticado → Activar sistema
    activateSystem({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.primaryEmailAddress?.emailAddress,
      role: userRole
    });
  }
}, [user, isLoaded]);
```

#### **4. Persistencia de Sesión**
```javascript
// Guardar en localStorage
const sessionData = {
  active: true,
  supervisor: supervisorData,
  startTime: new Date().toISOString(),
  date: new Date().toISOString(),
};
localStorage.setItem('jarana_system_session', JSON.stringify(sessionData));
```

### 🛡️ **Protección de Rutas**

#### **ProtectedAdminRoute**
```javascript
const ProtectedAdminRoute = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();

  // Mientras carga Clerk
  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  // Si no está logueado
  if (!isSignedIn) {
    return <Navigate to="/admin-login" replace />;
  }

  // Si está logueado, mostrar contenido
  return children;
};
```

#### **Triple Verificación**
1. **Nivel App.jsx**: `ProtectedAdminRoute`
2. **Nivel Dashboard**: Verificación interna
3. **Nivel Clerk**: Estado de autenticación

### 🔄 **Estados de Autenticación**

#### **No Autenticado**
```javascript
isLoaded: true
isSignedIn: false
user: null
```
**Resultado**: Redirección a `/admin-login`

#### **Cargando**
```javascript
isLoaded: false
isSignedIn: false
user: null
```
**Resultado**: `<LoadingSpinner />`

#### **Autenticado**
```javascript
isLoaded: true
isSignedIn: true
user: { id, firstName, lastName, ... }
```
**Resultado**: Acceso al dashboard

## 👷‍♂️ Autenticación de Empleados

### 🔄 **Sistema Interno**

Los empleados **NO usan Clerk**. Utilizan un sistema de autenticación propio con:
- **Código de empleado** (ej: EMP001)
- **Google Authenticator** (TOTP de 6 dígitos)

### 📱 **Google Authenticator Setup**

#### **1. Crear Empleado (Admin)**
```javascript
// En el dashboard admin
const newEmployee = {
  name: "Juan Pérez",
  employeeCode: "EMP001",
  email: "juan@empresa.com"
};

// Se genera automáticamente:
const totpSecret = speakeasy.generateSecret({
  name: `Jarana - ${employeeCode}`,
  issuer: 'Jarana Sistema Horario'
});

// QR Code para escanear
const qrCodeUrl = speakeasy.otpauthURL({
  secret: totpSecret.base32,
  label: employeeCode,
  issuer: 'Jarana'
});
```

#### **2. Configurar en Google Authenticator**
1. **Admin genera QR** en el dashboard
2. **Empleado escanea** con Google Authenticator
3. **App genera códigos** de 6 dígitos cada 30 segundos

#### **3. Login de Empleado**
```javascript
// EmployeeKioskPage.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const response = await fetch('/api/kiosk/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      employeeCode, 
      totpCode 
    })
  });
  
  if (response.ok) {
    // Autenticado → Fichar automáticamente
    const action = employee.isCheckedIn ? 'checkout' : 'checkin';
    await performCheckin(action);
  }
};
```

### 🔒 **Validación TOTP**

#### **Backend Validation**
```javascript
// Backend - kiosk routes
const speakeasy = require('speakeasy');

const validateTOTP = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Permite 2 intervalos de diferencia
  });
};
```

## 🔐 Seguridad del Sistema

### 🛡️ **Niveles de Protección**

#### **Nivel 1: Clerk Authentication**
- **OAuth 2.0** estándar
- **JWT tokens** seguros
- **Session management** automático
- **Multi-factor** opcional

#### **Nivel 2: Route Protection**
```javascript
// App.jsx
<Route 
  path="/admin-dashboard" 
  element={
    <ProtectedAdminRoute>
      <AdminDashboard />
    </ProtectedAdminRoute>
  } 
/>
```

#### **Nivel 3: Component Protection**
```javascript
// AdminDashboard.jsx
if (!isLoaded) return <LoadingSpinner />;
if (!isSignedIn) return <Navigate to="/admin-login" />;
```

### 🔄 **Session Management**

#### **Persistencia Diaria**
```javascript
// Verificar sesión guardada
const savedSession = localStorage.getItem('jarana_system_session');
if (savedSession) {
  const session = JSON.parse(savedSession);
  const now = new Date();
  const sessionDate = new Date(session.date);
  
  // Verificar si es el mismo día
  if (sessionDate.toDateString() === now.toDateString()) {
    // Restaurar sesión
    setSystemActive(true);
  } else {
    // Limpiar sesión expirada
    localStorage.removeItem('jarana_system_session');
  }
}
```

#### **Auto-expiración**
- **Diaria**: Se limpia automáticamente cada día
- **Manual**: Supervisor puede desactivar
- **Logout**: Se limpia al cerrar sesión

## 🚨 Troubleshooting

### **Problema: Sistema no se activa después del login**

#### **Diagnóstico**
1. **Verificar clave Clerk**:
   ```bash
   # En app/front/.env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

2. **Comprobar consola del navegador**:
   ```javascript
   // Buscar errores de Clerk
   console.log('Clerk user:', user);
   console.log('System active:', systemActive);
   ```

3. **Verificar localStorage**:
   ```javascript
   // En DevTools → Application → Local Storage
   jarana_system_session: {"active":true,"supervisor":{...}}
   ```

#### **Soluciones**
- **Clave incorrecta**: Verificar en Clerk Dashboard
- **Dominio incorrecto**: Verificar configuración de Clerk
- **Cache**: Limpiar localStorage y cookies

### **Problema: Empleados no pueden fichar**

#### **Diagnóstico**
1. **Sistema activo**:
   ```javascript
   // Verificar en HomePage
   systemActive: true
   supervisor: { name: "..." }
   ```

2. **TOTP válido**:
   ```javascript
   // Verificar código de 6 dígitos
   // Sincronizar tiempo del dispositivo
   ```

#### **Soluciones**
- **Sistema inactivo**: Supervisor debe activar
- **TOTP incorrecto**: Regenerar QR code
- **Tiempo desincronizado**: Ajustar reloj del dispositivo

### **Problema: Dashboard hace loop**

#### **Diagnóstico**
```javascript
// Verificar estados de Clerk
console.log('isLoaded:', isLoaded);
console.log('isSignedIn:', isSignedIn);
console.log('user:', user);
```

#### **Soluciones**
- **Clerk no carga**: Verificar clave publishable
- **Redirección infinita**: Verificar ProtectedAdminRoute
- **Cache**: Limpiar datos de Clerk

## 📚 Referencias

### **Clerk Documentation**
- [Clerk React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Clerk Authentication](https://clerk.com/docs/authentication/overview)
- [Clerk Session Management](https://clerk.com/docs/authentication/session-management)

### **Google Authenticator**
- [Speakeasy Library](https://github.com/speakeasyjs/speakeasy)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [Google Authenticator Guide](https://support.google.com/accounts/answer/1066447)

### **Security Best Practices**
- [OWASP Authentication](https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication)
- [JWT Security](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

---

**¿Necesitas ayuda?** Consulta la documentación adicional o contacta con el equipo de desarrollo.
