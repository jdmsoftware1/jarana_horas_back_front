# 📅 API de Horarios Semanales - JARANA

## 🎯 Descripción General

El sistema de horarios semanales permite planificar horarios flexibles por semanas específicas del año, solucionando el problema de empresas que necesitan horarios diferentes cada semana. Incluye excepciones diarias y un sistema inteligente de resolución de prioridades.

## 📊 Modelos de Datos

### WeeklySchedule
```javascript
{
  id: UUID,
  employeeId: UUID (referencia a Employee),
  year: Integer (2024-2030),
  weekNumber: Integer (1-53),
  templateId: UUID (referencia a ScheduleTemplate, opcional),
  startDate: Date (inicio de semana),
  endDate: Date (fin de semana),
  isActive: Boolean,
  notes: String (opcional),
  createdBy: UUID (referencia a Employee),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### DailyScheduleException
```javascript
{
  id: UUID,
  employeeId: UUID (referencia a Employee),
  date: Date,
  exceptionType: Enum (custom_hours, day_off, holiday, vacation, sick_leave, special_event),
  startTime: Time (opcional),
  endTime: Time (opcional),
  breakStartTime: Time (opcional),
  breakEndTime: Time (opcional),
  isWorkingDay: Boolean,
  reason: String (opcional),
  notes: String (opcional),
  approvedBy: UUID (referencia a Employee, opcional),
  approvedAt: DateTime (opcional),
  isActive: Boolean,
  createdBy: UUID (referencia a Employee),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## 🛣️ Endpoints de la API

## 📅 Weekly Schedules (`/api/weekly-schedules`)

### 1. Obtener horarios anuales de empleado
```http
GET /api/weekly-schedules/employee/:employeeId/year/:year
```

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "year": 2024,
      "weekNumber": 10,
      "startDate": "2024-03-04",
      "endDate": "2024-03-10",
      "template": {
        "id": "uuid",
        "name": "Horario Oficina",
        "templateDays": [...]
      },
      "creator": {
        "id": "uuid",
        "name": "Admin User",
        "employeeCode": "ADM001"
      },
      "notes": "Semana especial"
    }
  ]
}
```

### 2. Obtener horario de semana específica
```http
GET /api/weekly-schedules/employee/:employeeId/week/:year/:weekNumber
```

**Respuesta exitosa (200):**
```json
{
  "data": {
    "weeklySchedule": {
      "id": "uuid",
      "weekNumber": 10,
      "year": 2024,
      "template": {...}
    },
    "dailyExceptions": [
      {
        "id": "uuid",
        "date": "2024-03-05",
        "exceptionType": "custom_hours",
        "startTime": "10:00",
        "endTime": "18:00"
      }
    ],
    "weekDates": {
      "startDate": "2024-03-04",
      "endDate": "2024-03-10"
    }
  }
}
```

### 3. Crear/actualizar horario semanal
```http
POST /api/weekly-schedules/employee/:employeeId
```

**Cuerpo de la petición:**
```json
{
  "year": 2024,
  "weekNumber": 15,
  "templateId": "uuid-de-plantilla",
  "notes": "Semana con horario especial",
  "createdBy": "uuid-del-creador"
}
```

### 4. Crear múltiples horarios semanales
```http
POST /api/weekly-schedules/employee/:employeeId/bulk
```

**Cuerpo de la petición:**
```json
{
  "year": 2024,
  "weeks": [
    {
      "weekNumber": 10,
      "templateId": "uuid",
      "notes": "Semana 10"
    },
    {
      "weekNumber": 11,
      "templateId": "uuid",
      "notes": "Semana 11"
    }
  ],
  "createdBy": "uuid"
}
```

### 5. Copiar plantilla a múltiples semanas
```http
POST /api/weekly-schedules/employee/:employeeId/copy-template
```

**Cuerpo de la petición:**
```json
{
  "templateId": "uuid",
  "year": 2024,
  "weekNumbers": [10, 11, 12, 13, 14],
  "createdBy": "uuid"
}
```

### 6. Obtener calendario anual
```http
GET /api/weekly-schedules/employee/:employeeId/calendar/:year
```

**Respuesta exitosa (200):**
```json
{
  "data": {
    "employee": {
      "id": "uuid",
      "name": "Juan Pérez",
      "employeeCode": "EMP001"
    },
    "year": 2024,
    "weeklySchedules": [...],
    "dailyExceptions": [...],
    "stats": {
      "totalWeeks": 52,
      "scheduledWeeks": 45,
      "unscheduledWeeks": 7,
      "dailyExceptions": 12,
      "templatesUsed": 3
    }
  }
}
```

## 📝 Daily Exceptions (`/api/daily-exceptions`)

### 7. Obtener excepciones de empleado
```http
GET /api/daily-exceptions/employee/:employeeId?startDate=2024-01-01&endDate=2024-12-31
GET /api/daily-exceptions/employee/:employeeId?month=3&year=2024
```

### 8. Crear excepción diaria
```http
POST /api/daily-exceptions
```

**Cuerpo de la petición:**
```json
{
  "employeeId": "uuid",
  "date": "2024-03-15",
  "exceptionType": "custom_hours",
  "startTime": "10:00",
  "endTime": "18:00",
  "breakStartTime": "14:00",
  "breakEndTime": "15:00",
  "isWorkingDay": true,
  "reason": "Cita médica por la mañana",
  "notes": "Horario ajustado",
  "createdBy": "uuid"
}
```

### 9. Aprobar excepción
```http
PATCH /api/daily-exceptions/:id/approve
```

**Cuerpo de la petición:**
```json
{
  "approvedBy": "uuid-del-supervisor"
}
```

### 10. Crear excepciones masivas
```http
POST /api/daily-exceptions/bulk
```

**Cuerpo de la petición:**
```json
{
  "exceptions": [
    {
      "employeeId": "uuid1",
      "date": "2024-12-25",
      "exceptionType": "holiday",
      "reason": "Navidad",
      "notes": "Día festivo nacional"
    },
    {
      "employeeId": "uuid2",
      "date": "2024-12-25",
      "exceptionType": "holiday",
      "reason": "Navidad"
    }
  ],
  "createdBy": "uuid"
}
```

## 🚀 Advanced Scheduling (`/api/advanced-scheduling`)

### 11. Obtener horario efectivo para fecha
```http
GET /api/advanced-scheduling/employee/:employeeId/effective-schedule/:date
```

**Respuesta exitosa (200):**
```json
{
  "data": {
    "employee": {...},
    "date": "2024-03-15",
    "effectiveSchedule": {
      "type": "daily_exception",
      "source": "daily_exception",
      "isWorkingDay": true,
      "startTime": "10:00",
      "endTime": "18:00",
      "breakStartTime": "14:00",
      "breakEndTime": "15:00",
      "notes": "Horario ajustado por cita médica",
      "reason": "Cita médica"
    }
  }
}
```

### 12. Planificar año completo
```http
POST /api/advanced-scheduling/employee/:employeeId/planify-year
```

**Cuerpo de la petición:**
```json
{
  "year": 2024,
  "templateId": "uuid",
  "createdBy": "uuid",
  "options": {
    "skipExistingWeeks": true,
    "specificWeeks": [10, 11, 12, 13, 14],
    "excludeWeeks": [52],
    "notes": "Planificación Q1 2024"
  }
}
```

### 13. Crear días festivos masivos
```http
POST /api/advanced-scheduling/holidays/bulk-create
```

**Cuerpo de la petición:**
```json
{
  "employeeIds": ["uuid1", "uuid2", "uuid3"],
  "holidays": [
    {
      "date": "2024-12-25",
      "reason": "Navidad",
      "notes": "Día festivo nacional"
    },
    {
      "date": "2024-01-01",
      "reason": "Año Nuevo",
      "notes": "Día festivo nacional"
    }
  ],
  "createdBy": "uuid"
}
```

### 14. Obtener estadísticas de planificación
```http
GET /api/advanced-scheduling/employee/:employeeId/stats/:year
```

### 15. Validar conflictos de horarios
```http
POST /api/advanced-scheduling/employee/:employeeId/validate-conflicts
```

**Cuerpo de la petición:**
```json
{
  "startDate": "2024-03-01",
  "endDate": "2024-03-31"
}
```

## 🔍 Utilidades

### 16. Información de semana actual
```http
GET /api/advanced-scheduling/utils/current-week
```

### 17. Vista general del año
```http
GET /api/advanced-scheduling/utils/year-overview/:year
```

### 18. Tipos de excepciones
```http
GET /api/daily-exceptions/utils/exception-types
```

**Respuesta:**
```json
{
  "data": [
    {
      "value": "custom_hours",
      "label": "Horario Personalizado",
      "requiresHours": true
    },
    {
      "value": "day_off",
      "label": "Día Libre",
      "requiresHours": false
    },
    {
      "value": "holiday",
      "label": "Día Festivo",
      "requiresHours": false
    }
  ]
}
```

## 🎯 Sistema de Prioridades

El sistema resuelve el horario efectivo con el siguiente orden de prioridad:

1. **🔴 Excepción Diaria** - Máxima prioridad
2. **🟡 Horario Semanal** - Prioridad media
3. **🟢 Horario Regular** - Prioridad baja
4. **⚪ Sin Horario** - No hay horario definido

## 💡 Casos de Uso Típicos

### Caso 1: Empresa con horarios variables por temporada
```javascript
// 1. Planificar temporada alta (semanas 20-30)
POST /api/advanced-scheduling/employee/uuid/planify-year
{
  year: 2024,
  templateId: "template-temporada-alta",
  options: { specificWeeks: [20,21,22,23,24,25,26,27,28,29,30] }
}

// 2. Planificar temporada baja (resto del año)
POST /api/advanced-scheduling/employee/uuid/planify-year
{
  year: 2024,
  templateId: "template-temporada-baja",
  options: { excludeWeeks: [20,21,22,23,24,25,26,27,28,29,30] }
}
```

### Caso 2: Gestión de días festivos
```javascript
// 1. Crear días festivos para todos los empleados
POST /api/advanced-scheduling/holidays/bulk-create
{
  employeeIds: ["uuid1", "uuid2", "uuid3"],
  holidays: [
    { date: "2024-12-25", reason: "Navidad" },
    { date: "2024-01-01", reason: "Año Nuevo" }
  ]
}
```

### Caso 3: Horario flexible semanal
```javascript
// 1. Semana normal con plantilla estándar
POST /api/weekly-schedules/employee/uuid
{
  year: 2024,
  weekNumber: 10,
  templateId: "template-estandar"
}

// 2. Excepción para un día específico
POST /api/daily-exceptions
{
  employeeId: "uuid",
  date: "2024-03-15",
  exceptionType: "custom_hours",
  startTime: "10:00",
  endTime: "18:00"
}
```

## 🧪 Testing

Para probar las APIs:

```bash
# Ejecutar tests automatizados
node scripts/test-weekly-schedules.js

# Verificar backend
node scripts/validate-implementation.js
```

## 🔗 Integración con otros módulos

- **Plantillas de Horarios**: Las semanas pueden usar plantillas existentes
- **Empleados**: Todos los horarios están vinculados a empleados
- **Reportes**: Los reportes consideran el horario efectivo
- **Fichajes**: Validación contra horario efectivo
- **Vacaciones**: Las vacaciones pueden crear excepciones automáticas

---

**📅 Fecha de creación**: Noviembre 2024  
**🔄 Última actualización**: Noviembre 2024  
**👨‍💻 Desarrollado para**: Sistema JARANA v1.0.0
