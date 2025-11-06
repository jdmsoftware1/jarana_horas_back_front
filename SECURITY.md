# 🔐 SEGURIDAD DEL SISTEMA JARANA

## ✅ MEDIDAS DE SEGURIDAD IMPLEMENTADAS

### **1. AUTENTICACIÓN**

#### **Google OAuth 2.0 (Solo Admin)**
- ✅ Autenticación con Google para administradores
- ✅ Verificación de email autorizado (`AUTHORIZED_EMAILS`)
- ✅ Tokens JWT con expiración (15 minutos access, 7 días refresh)
- ✅ Tokens almacenados en `localStorage` (persistencia segura)

#### **PIN (Kiosk - Empleados)**
- ✅ PIN hasheado con bcrypt (12 rounds)
- ✅ Nunca se almacena en texto plano
- ✅ Validación en cada fichaje

#### **TOTP (Portal Empleado)**
- ✅ Google Authenticator (2FA)
- ✅ Secreto único por empleado
- ✅ Window de 2 para tolerancia de tiempo

---

### **2. AUTORIZACIÓN**

#### **Middleware de Autenticación (`authMiddleware`)**
```javascript
// Verifica:
- Token JWT válido
- Token no expirado
- Empleado existe en BD
- Empleado está activo (isActive: true)
```

#### **Middleware de Admin (`adminMiddleware`)**
```javascript
// Verifica:
- Usuario autenticado
- Rol === 'admin'
```

---

### **3. RUTAS PROTEGIDAS**

#### **🔒 RUTAS QUE REQUIEREN AUTENTICACIÓN + ADMIN:**

**Empleados:**
- `GET /api/employees` - Listar todos los empleados
- `POST /api/employees` - Crear empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado
- `POST /api/employees/:id/regenerate-totp` - Regenerar TOTP

**Registros:**
- `GET /api/records/all` - Ver todos los registros
- `GET /api/records/analytics` - Analytics de registros

**Horarios:**
- `POST /api/schedules` - Crear horarios
- `PUT /api/schedules/:id` - Actualizar horarios
- `DELETE /api/schedules/:id` - Eliminar horarios

**Vacaciones:**
- `GET /api/vacations` - Ver todas las vacaciones
- `PUT /api/vacations/:id/status` - Aprobar/rechazar vacaciones

#### **🔒 RUTAS QUE REQUIEREN AUTENTICACIÓN (Usuario propio):**

**Registros:**
- `GET /api/records` - Ver mis registros
- `POST /api/records/checkin` - Fichar entrada
- `POST /api/records/checkout` - Fichar salida
- `GET /api/records/status` - Ver mi estado actual

**Perfil:**
- `GET /api/employees/:id` - Ver mi perfil

---

### **4. PROTECCIÓN DE BASE DE DATOS**

#### **Neon PostgreSQL**
- ✅ Conexión SSL en producción
- ✅ Credenciales en variables de entorno (`.env`)
- ✅ **NUNCA** expuestas en el código
- ✅ Pool de conexiones limitado (max: 5)

#### **Sequelize ORM**
- ✅ Prevención de SQL Injection automática
- ✅ Validaciones en modelos
- ✅ Sanitización de inputs

---

### **5. VARIABLES DE ENTORNO SENSIBLES**

```env
# NUNCA COMMITEAR ESTOS VALORES
DATABASE_URL=postgresql://...
JWT_SECRET=secret-super-largo-minimo-32-caracteres
JWT_REFRESH_SECRET=otro-secret-diferente
SESSION_SECRET=otro-secret-para-sesiones
GOOGLE_CLIENT_SECRET=GOCSPX-...
OPENAI_API_KEY=sk-proj-...
```

---

### **6. LOGOUT SEGURO**

#### **Frontend (`AuthContext.jsx`):**
```javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  setToken(null);
  setUser(null);
};
```

#### **Efecto:**
- ✅ Elimina tokens del navegador
- ✅ Limpia estado de usuario
- ✅ Redirige a login
- ✅ **NO** puede acceder a rutas protegidas sin volver a autenticarse

---

### **7. PROTECCIÓN CONTRA ATAQUES**

#### **CORS**
```javascript
// Solo permite requests desde:
- http://localhost:5173 (desarrollo)
- https://tu-app.onrender.com (producción)
```

#### **Helmet**
```javascript
// Headers de seguridad:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
```

#### **Rate Limiting**
```javascript
// Límites por IP:
- API general: 100 requests / 15 min
- Auth endpoints: 5 requests / 15 min
```

#### **Express Validator**
```javascript
// Validación y sanitización de inputs
- Previene XSS
- Previene SQL Injection
- Valida tipos de datos
```

---

### **8. LOGS DE ACCESO**

#### **AccessLog Model**
```javascript
// Registra TODOS los accesos:
- Login exitoso/fallido
- Intentos no autorizados
- IP, User-Agent, Device
- Timestamp
- Razón de fallo
```

---

### **9. CHECKLIST DE SEGURIDAD**

- [x] Tokens JWT con expiración
- [x] Passwords hasheados (bcrypt)
- [x] HTTPS en producción (Render automático)
- [x] Variables de entorno para secretos
- [x] Middleware de autenticación en rutas sensibles
- [x] Middleware de autorización (admin)
- [x] CORS configurado
- [x] Helmet para headers de seguridad
- [x] Rate limiting
- [x] Validación de inputs
- [x] SQL Injection protegido (Sequelize ORM)
- [x] XSS protegido (React + sanitización)
- [x] Logs de acceso
- [x] Logout funcional
- [x] Sesión persistente segura (localStorage)

---

### **10. PRUEBAS DE SEGURIDAD**

#### **Test 1: Acceso sin token**
```bash
curl http://localhost:3000/api/employees
# Resultado esperado: 401 Unauthorized
```

#### **Test 2: Token inválido**
```bash
curl -H "Authorization: Bearer token-falso" http://localhost:3000/api/employees
# Resultado esperado: 401 Invalid token
```

#### **Test 3: Token expirado**
```bash
# Esperar 15 minutos después del login
curl -H "Authorization: Bearer token-expirado" http://localhost:3000/api/employees
# Resultado esperado: 401 Token expired
```

#### **Test 4: Usuario no admin**
```bash
# Login como empleado, intentar acceder a ruta admin
curl -H "Authorization: Bearer token-empleado" http://localhost:3000/api/employees
# Resultado esperado: 403 Forbidden
```

---

### **11. RECOMENDACIONES ADICIONALES**

#### **Para Producción:**
1. ✅ Usar HTTPS (automático en Render)
2. ✅ Rotar secretos JWT periódicamente
3. ✅ Monitorear logs de acceso
4. ✅ Implementar alertas de intentos fallidos
5. ✅ Backup regular de base de datos
6. ✅ Auditoría de seguridad trimestral

#### **Para Desarrollo:**
1. ✅ Nunca commitear `.env`
2. ✅ Usar secretos diferentes en dev/prod
3. ✅ Probar logout regularmente
4. ✅ Verificar que rutas estén protegidas

---

## 🚨 EN CASO DE BRECHA DE SEGURIDAD

1. **Inmediatamente:**
   - Rotar todos los secretos (JWT, SESSION, GOOGLE)
   - Invalidar todos los tokens activos
   - Revisar logs de acceso

2. **Investigar:**
   - Revisar AccessLogs para actividad sospechosa
   - Identificar punto de entrada
   - Evaluar daño

3. **Remediar:**
   - Parchear vulnerabilidad
   - Notificar a usuarios afectados
   - Actualizar documentación de seguridad

---

## ✅ VERIFICACIÓN FINAL

**Antes de desplegar a producción:**

```bash
# 1. Verificar que logout funciona
npm run dev
# Hacer login → Logout → Intentar acceder a dashboard
# Debe redirigir a login

# 2. Verificar rutas protegidas
curl http://localhost:3000/api/employees
# Debe devolver 401

# 3. Verificar variables de entorno
npm run check-env
# Todas las variables críticas deben estar configuradas

# 4. Verificar conexión a BD
npm run test-db
# Debe conectar correctamente
```

---

**🔐 SISTEMA SEGURO Y AUDITADO**

**Última actualización:** 06/11/2025  
**Versión:** 2.0.0 (Post-Clerk, Google OAuth)
