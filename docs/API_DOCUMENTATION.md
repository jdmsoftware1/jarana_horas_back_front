# 🔌 API Documentation - Sistema JARANA

## 📋 Índice
1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Endpoints de Empleados](#endpoints-de-empleados)
4. [Endpoints de Registros](#endpoints-de-registros)
5. [Endpoints de Vacaciones](#endpoints-de-vacaciones)
6. [Endpoints de IA](#endpoints-de-ia)
7. [Endpoints del Sistema](#endpoints-del-sistema)
8. [Modelos de Datos](#modelos-de-datos)
9. [Códigos de Error](#códigos-de-error)

---

## 🌐 Información General

**Base URL**: `http://localhost:3000/api`  
**Formato**: JSON  
**Autenticación**: TOTP para empleados, sin auth para algunas rutas públicas  
**Versión**: 1.0  

### Headers Requeridos
```http
Content-Type: application/json
```

---

## 🔐 Autenticación

### POST `/kiosk/auth`
Autentica un empleado usando código y TOTP.

**Request Body:**
```json
{
  "employeeCode": "EMP001",
  "totpCode": "123456"
}
```

**Response 200:**
```json
{
  "employee": {
    "id": "uuid",
    "name": "Juan Pérez",
    "employeeCode": "EMP001",
    "email": "juan@empresa.com",
    "isActive": true
  },
  "message": "Autenticación exitosa"
}
```

**Response 404:**
```json
{
  "error": "Empleado no encontrado"
}
```

**Response 401:**
```json
{
  "error": "Código TOTP inválido"
}
```

**Response 403:**
```json
{
  "error": "Empleado inactivo"
}
```

---

## 👥 Endpoints de Empleados

### GET `/employees`
Obtiene lista de todos los empleados.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Juan Pérez",
    "email": "juan@empresa.com",
    "employeeCode": "EMP001",
    "isActive": true,
    "role": "employee",
    "createdAt": "2024-10-29T10:00:00Z",
    "updatedAt": "2024-10-29T10:00:00Z"
  }
]
```

### GET `/employees/:id`
Obtiene un empleado específico.

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Juan Pérez",
  "email": "juan@empresa.com",
  "employeeCode": "EMP001",
  "isActive": true,
  "role": "employee",
  "qrCodeUrl": "data:image/png;base64,..."
}
```

### POST `/employees`
Crea un nuevo empleado.

**Request Body:**
```json
{
  "name": "María García",
  "email": "maria@empresa.com",
  "employeeCode": "EMP002",
  "role": "employee"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "María García",
  "email": "maria@empresa.com",
  "employeeCode": "EMP002",
  "isActive": true,
  "qrCodeUrl": "data:image/png;base64,....."
}
```

### PUT `/employees/:id`
Actualiza un empleado existente.

**Request Body:**
```json
{
  "name": "María García López",
  "email": "maria.garcia@empresa.com",
  "isActive": false
}
```

### POST `/employees/:id/regenerate-totp`
Regenera el secreto TOTP y QR code de un empleado.

**Response 200:**
```json
{
  "qrCode": "data:image/png;base64,.....",
  "secret": "JBSWY3DPEHPK3PXP"
}
```

---

## ⏰ Endpoints de Registros

### POST `/kiosk/checkin`
Registra entrada de un empleado.

**Request Body:**
```json
{
  "employeeId": "uuid",
  "device": "web",
  "location": "Oficina Principal",
  "notes": "Entrada normal"
}
```

**Response 201:**
```json
{
  "record": {
    "id": "uuid",
    "employeeId": "uuid",
    "type": "checkin",
    "timestamp": "2024-10-29T08:00:00Z",
    "device": "web"
  },
  "message": "Entrada registrada correctamente"
}
```

### POST `/kiosk/checkout`
Registra salida de un empleado.

**Request Body:**
```json
{
  "employeeId": "uuid",
  "device": "web",
  "notes": "Salida normal"
}
```

**Response 201:**
```json
{
  "record": {
    "id": "uuid",
    "employeeId": "uuid",
    "type": "checkout",
    "timestamp": "2024-10-29T17:00:00Z",
    "device": "web"
  },
  "message": "Salida registrada correctamente"
}
```

### GET `/records/employee/:employeeId`
Obtiene registros de un empleado específico.

**Query Parameters:**
- `limit` (opcional): Número máximo de registros (default: 50)
- `offset` (opcional): Número de registros a saltar (default: 0)

**Response 200:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "type": "checkin",
    "timestamp": "2024-10-29T08:00:00Z",
    "device": "web",
    "location": "Oficina Principal",
    "notes": "Entrada normal",
    "employee": {
      "id": "uuid",
      "name": "Juan Pérez",
      "employeeCode": "EMP001"
    }
  }
]
```

### GET `/records/all`
Obtiene todos los registros del sistema (para administradores).

**Query Parameters:**
- `employeeId` (opcional): Filtrar por empleado
- `startDate` (opcional): Fecha de inicio (YYYY-MM-DD)
- `endDate` (opcional): Fecha de fin (YYYY-MM-DD)
- `type` (opcional): Tipo de registro (checkin/checkout)
- `limit` (opcional): Límite de registros (default: 100)
- `offset` (opcional): Offset para paginación (default: 0)

**Response 200:**
```json
{
  "records": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "type": "checkin",
      "timestamp": "2024-10-29T08:00:00Z",
      "device": "web",
      "employee": {
        "id": "uuid",
        "name": "Juan Pérez",
        "employeeCode": "EMP001"
      }
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

### GET `/records/debug/all`
Endpoint de debug para verificar registros en la base de datos.

**Response 200:**
```json
{
  "totalRecords": 25,
  "totalEmployees": 5,
  "records": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "employeeName": "Juan Pérez",
      "type": "checkin",
      "timestamp": "2024-10-29T08:00:00Z",
      "device": "web"
    }
  ],
  "employees": [
    {
      "id": "uuid",
      "name": "Juan Pérez",
      "employeeCode": "EMP001"
    }
  ]
}
```

---

## 🏖️ Endpoints de Vacaciones

### POST `/vacations`
Crea una nueva solicitud de vacaciones.

**Request Body:**
```json
{
  "employeeId": "uuid",
  "startDate": "2024-12-01",
  "endDate": "2024-12-05",
  "type": "vacation",
  "reason": "Vacaciones familiares"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "employeeId": "uuid",
  "startDate": "2024-12-01",
  "endDate": "2024-12-05",
  "type": "vacation",
  "status": "pending",
  "reason": "Vacaciones familiares",
  "createdAt": "2024-10-29T10:00:00Z"
}
```

### GET `/vacations/employee/:employeeId`
Obtiene vacaciones de un empleado específico.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "startDate": "2024-12-01",
    "endDate": "2024-12-05",
    "type": "vacation",
    "status": "pending",
    "reason": "Vacaciones familiares",
    "notes": null,
    "approverId": null,
    "createdAt": "2024-10-29T10:00:00Z",
    "updatedAt": "2024-10-29T10:00:00Z"
  }
]
```

### GET `/vacations`
Obtiene todas las solicitudes de vacaciones (para administradores).

**Query Parameters:**
- `status` (opcional): Filtrar por estado (pending/approved/rejected)
- `employeeId` (opcional): Filtrar por empleado

**Response 200:**
```json
[
  {
    "id": "uuid",
    "startDate": "2024-12-01",
    "endDate": "2024-12-05",
    "type": "vacation",
    "status": "pending",
    "reason": "Vacaciones familiares",
    "employee": {
      "id": "uuid",
      "name": "Juan Pérez",
      "employeeCode": "EMP001"
    },
    "approver": null
  }
]
```

### PUT `/vacations/:id/approve`
Aprueba una solicitud de vacaciones.

**Request Body:**
```json
{
  "approverId": "uuid",
  "notes": "Aprobado sin observaciones"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "approved",
  "approverId": "uuid",
  "notes": "Aprobado sin observaciones",
  "updatedAt": "2024-10-29T15:00:00Z"
}
```

### PUT `/vacations/:id/reject`
Rechaza una solicitud de vacaciones.

**Request Body:**
```json
{
  "approverId": "uuid",
  "notes": "Fechas no disponibles"
}
```

---

## 🤖 Endpoints de IA

### POST `/ai/chat`
Envía un mensaje al asistente IA.

**Request Body:**
```json
{
  "message": "¿Cuántas horas trabajé esta semana?",
  "userId": "uuid",
  "userRole": "employee"
}
```

**Response 200 (Respuesta general):**
```json
{
  "response": "Esta semana has trabajado aproximadamente 40 horas en 5 días.",
  "type": "chat_response",
  "timestamp": "2024-10-29T15:00:00Z",
  "userId": "uuid",
  "userRole": "employee"
}
```

**Response 200 (Creación de vacaciones):**
```json
{
  "response": "✅ He creado tu solicitud de vacaciones del 01/12/2024 al 05/12/2024. La solicitud está pendiente de aprobación.",
  "type": "vacation_created",
  "vacationId": "uuid",
  "timestamp": "2024-10-29T15:00:00Z"
}
```

**Response 200 (Consulta específica):**
```json
{
  "response": "Esta semana has trabajado aproximadamente 32 horas en 4 días.",
  "type": "hours_summary",
  "data": {
    "hours": 32,
    "days": 4
  },
  "timestamp": "2024-10-29T15:00:00Z"
}
```

### POST `/ai/employee-query/:employeeId`
Realiza consultas específicas de datos del empleado.

**Request Body:**
```json
{
  "query": "mi puntualidad este mes"
}
```

**Response 200:**
```json
{
  "response": "Análisis de puntualidad este mes:\n\n📊 Estadísticas:\n- Total entradas: 20\n- Llegadas tarde: 2\n- Puntuación de puntualidad: 90%",
  "type": "punctuality_analysis",
  "data": {
    "lateCount": 2,
    "score": 90
  }
}
```

### GET `/ai/insights/:employeeId`
Obtiene análisis de patrones de trabajo.

**Query Parameters:**
- `days` (opcional): Número de días a analizar (default: 30)

**Response 200:**
```json
{
  "employeeId": "uuid",
  "period": 30,
  "totalRecords": 60,
  "workDays": 30,
  "averageHoursPerDay": 8.2,
  "punctualityScore": 85.5,
  "lateArrivals": 3,
  "earlyDepartures": 1,
  "patterns": {
    "mostActiveDay": "Tuesday",
    "averageArrivalTime": "08:45",
    "averageDepartureTime": "17:15"
  },
  "recommendations": [
    "Intenta llegar 10 minutos antes para mejorar tu puntualidad",
    "Tu productividad es excelente, sigue así"
  ]
}
```

---

## ⚙️ Endpoints del Sistema

### GET `/system/status`
Obtiene el estado actual del sistema.

**Response 200:**
```json
{
  "isActive": true,
  "activatedAt": "2024-10-29T08:00:00Z",
  "activatedBy": "admin@empresa.com",
  "totalEmployees": 25,
  "activeEmployees": 23,
  "todayRecords": 45
}
```

### POST `/system/activate`
Activa el sistema de fichaje.

**Request Body:**
```json
{
  "activatedBy": "admin@empresa.com"
}
```

### POST `/system/deactivate`
Desactiva el sistema de fichaje.

**Request Body:**
```json
{
  "deactivatedBy": "admin@empresa.com"
}
```

---

## 📊 Modelos de Datos

### Employee
```typescript
interface Employee {
  id: string;                    // UUID
  name: string;                  // Nombre completo
  email: string;                 // Email único
  employeeCode: string;          // Código único (ej: EMP001)
  totpSecret: string;            // Secreto TOTP
  qrCodeUrl: string;            // URL del QR code
  isActive: boolean;            // Estado activo/inactivo
  role: 'employee' | 'supervisor' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

### Record
```typescript
interface Record {
  id: string;                    // UUID
  employeeId: string;            // FK a Employee
  type: 'checkin' | 'checkout'; // Tipo de registro
  timestamp: Date;               // Fecha y hora del registro
  device: string;                // Dispositivo usado
  location?: string;             // Ubicación (opcional)
  notes?: string;                // Notas adicionales
  createdAt: Date;
  updatedAt: Date;
}
```

### Vacation
```typescript
interface Vacation {
  id: string;                    // UUID
  employeeId: string;            // FK a Employee
  startDate: Date;               // Fecha de inicio
  endDate: Date;                 // Fecha de fin
  type: 'vacation' | 'sick_leave' | 'personal' | 'maternity' | 'paternity' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;               // Motivo de la solicitud
  notes?: string;                // Notas del aprobador
  approverId?: string;           // FK a Employee (quien aprueba)
  createdAt: Date;
  updatedAt: Date;
}
```

### Schedule
```typescript
interface Schedule {
  id: string;                    // UUID
  employeeId: string;            // FK a Employee
  dayOfWeek: number;             // 0-6 (Domingo-Sábado)
  isWorkingDay: boolean;         // Si es día laboral
  startTime: string;             // Hora de inicio (HH:MM)
  endTime: string;               // Hora de fin (HH:MM)
  breakStartTime?: string;       // Inicio descanso
  breakEndTime?: string;         // Fin descanso
  notes?: string;                // Notas adicionales
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ❌ Códigos de Error

### 400 - Bad Request
```json
{
  "error": "Datos de entrada inválidos",
  "details": "El campo 'employeeCode' es requerido"
}
```

### 401 - Unauthorized
```json
{
  "error": "Código TOTP inválido",
  "message": "El código ha expirado o es incorrecto"
}
```

### 403 - Forbidden
```json
{
  "error": "Empleado inactivo",
  "message": "Contacta con tu supervisor para activar tu cuenta"
}
```

### 404 - Not Found
```json
{
  "error": "Empleado no encontrado",
  "message": "No existe un empleado con ese código"
}
```

### 409 - Conflict
```json
{
  "error": "Ya tienes una entrada activa",
  "message": "Debes fichar salida antes de volver a entrar"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Error interno del servidor",
  "message": "Contacta con el administrador del sistema"
}
```

---

## 📝 Ejemplos de Uso

### Flujo Completo de Fichaje
```javascript
// 1. Autenticar empleado
const authResponse = await fetch('/api/kiosk/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeCode: 'EMP001',
    totpCode: '123456'
  })
});

const { employee } = await authResponse.json();

// 2. Fichar entrada
const checkinResponse = await fetch('/api/kiosk/checkin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: employee.id,
    device: 'web'
  })
});
```

### Consulta IA
```javascript
const aiResponse = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '¿Cuántas horas trabajé esta semana?',
    userId: employee.id,
    userRole: 'employee'
  })
});

const aiData = await aiResponse.json();
console.log(aiData.response); // "Esta semana has trabajado..."
```

### Crear Solicitud de Vacaciones
```javascript
const vacationResponse = await fetch('/api/vacations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: employee.id,
    startDate: '2024-12-01',
    endDate: '2024-12-05',
    type: 'vacation',
    reason: 'Vacaciones navideñas'
  })
});
```

---

**📚 Esta documentación cubre todos los endpoints disponibles en la API de JARANA v1.0**
