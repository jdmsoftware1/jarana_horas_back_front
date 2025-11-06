# 🐘 Configuración de NeonDB - Sistema Jarana

Esta guía te ayudará a configurar **NeonDB** como base de datos para el sistema de registro horario.

## 🚀 Configuración Rápida

### 1. **Crear Cuenta en Neon**
1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto: `jarana-registro-horario`

### 2. **Obtener Cadena de Conexión**
1. En tu dashboard de Neon
2. Ve a **Connection Details**
3. Copia la **Connection String**

### 3. **Configurar Backend**
```bash
# En app/back/.env
DATABASE_URL='postgresql://usuario:password@host:port/database?sslmode=require'
JWT_SECRET='tu-clave-secreta-jwt-muy-segura'
CLERK_SECRET_KEY='sk_test_tu_clave_de_clerk'
```

### 4. **Instalar Dependencias**
```bash
cd app/back
npm install
```

### 5. **Sincronizar Base de Datos**
```bash
# Crear tablas y usuario admin por defecto
npm run db:sync
```

### 6. **Ejecutar Backend**
```bash
npm run dev
```

## 📊 Estructura de Base de Datos

### **Tabla `employees`**
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  employee_code VARCHAR(20) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'employee',
  is_active BOOLEAN DEFAULT true,
  totp_secret VARCHAR(255),
  qr_code_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Tabla `records`**
```sql
CREATE TABLE records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  type VARCHAR(20) NOT NULL, -- 'checkin' or 'checkout'
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  device VARCHAR(100),
  location JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Tabla `schedules`**
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  day_of_week INTEGER NOT NULL, -- 0=Domingo, 6=Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_start_time TIME,
  break_end_time TIME,
  is_working_day BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, day_of_week)
);
```

## 🔧 Configuración Avanzada

### **Variables de Entorno Completas**
```bash
# Database Configuration (NeonDB)
DATABASE_URL='postgresql://usuario:password@ep-example-123456.us-east-1.aws.neon.tech/neondb?sslmode=require'

# JWT Configuration
JWT_SECRET='clave-secreta-muy-larga-y-segura-para-jwt-tokens'

# Clerk Configuration
CLERK_SECRET_KEY='sk_test_abcd1234...'

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URLs
FRONTEND_URL=http://localhost:5173

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Google Authenticator
TOTP_ISSUER='Jarana Sistema Horario'
TOTP_WINDOW=2
```

### **Scripts Disponibles**
```bash
# Desarrollo
npm run dev              # Ejecutar en modo desarrollo
npm run start            # Ejecutar en producción

# Base de datos
npm run db:sync          # Sincronizar modelos (crear tablas)

# Utilidades
npm run test             # Ejecutar tests (si los hay)
```

## 📋 Verificación de Instalación

### **1. Verificar Conexión**
```bash
# Debería mostrar:
✅ Database connection established successfully.
✅ Database models synchronized.
🚀 Server running on port 3000
```

### **2. Verificar Tablas Creadas**
En el dashboard de Neon, deberías ver:
- ✅ `employees` (con usuario admin por defecto)
- ✅ `records` (vacía inicialmente)
- ✅ `schedules` (vacía inicialmente)

### **3. Verificar Usuario Admin**
```bash
# En los logs del servidor:
👤 Creating default admin user...
✅ Default admin created:
   Employee Code: ADM001
   PIN: 1234
   Email: admin@registrohorario.com
```

## 🌐 Deploy en Producción

### **Variables de Entorno en Vercel**
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
CLERK_SECRET_KEY=...
NODE_ENV=production
```

### **Configuración de Neon para Producción**
1. **Upgrade a plan de pago** si necesitas más conexiones
2. **Configurar backups** automáticos
3. **Configurar read replicas** si es necesario

## 🐛 Troubleshooting

### **Error: "Connection refused"**
- Verificar que la URL de conexión sea correcta
- Verificar que Neon esté activo (no en sleep mode)
- Verificar configuración de SSL

### **Error: "Table doesn't exist"**
```bash
# Ejecutar sincronización
npm run db:sync
```

### **Error: "Authentication failed"**
- Verificar usuario y password en DATABASE_URL
- Verificar que el usuario tenga permisos

### **Error: "Too many connections"**
- Verificar configuración de pool en `database.js`
- Considerar upgrade de plan en Neon

## 📊 Monitoreo

### **Dashboard de Neon**
- **Connections**: Número de conexiones activas
- **Queries**: Consultas por segundo
- **Storage**: Uso de almacenamiento
- **Compute**: Uso de CPU

### **Logs del Servidor**
```bash
# Activar logs de SQL en desarrollo
# En database.js:
logging: process.env.NODE_ENV === 'development' ? console.log : false
```

## 🔒 Seguridad

### **Mejores Prácticas**
- ✅ Usar SSL siempre (`sslmode=require`)
- ✅ Rotar credenciales regularmente
- ✅ Usar variables de entorno para secretos
- ✅ Configurar IP allowlist en Neon
- ✅ Monitorear conexiones sospechosas

### **Backup y Recuperación**
- **Backups automáticos**: Configurados en Neon
- **Point-in-time recovery**: Disponible en planes de pago
- **Export manual**: Usar `pg_dump` si es necesario

---

**¿Necesitas ayuda?** Consulta la [documentación de Neon](https://neon.tech/docs) o contacta con el equipo de desarrollo.
