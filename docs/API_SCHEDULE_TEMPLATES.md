# 📋 API de Plantillas de Horarios - JARANA

## 🎯 Descripción General

El sistema de plantillas de horarios permite crear horarios reutilizables que pueden ser aplicados a múltiples empleados, solucionando el problema de gestionar horarios para empresas con muchos empleados que comparten los mismos horarios.

## 📊 Modelos de Datos

### ScheduleTemplate
```javascript
{
  id: UUID,
  name: String (único),
  description: String (opcional),
  isActive: Boolean,
  createdBy: UUID (referencia a Employee),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### ScheduleTemplateDay
```javascript
{
  id: UUID,
  templateId: UUID (referencia a ScheduleTemplate),
  dayOfWeek: Integer (0-6, 0=Domingo),
  startTime: Time,
  endTime: Time,
  breakStartTime: Time (opcional),
  breakEndTime: Time (opcional),
  isWorkingDay: Boolean,
  notes: String (opcional),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## 🛣️ Endpoints de la API

### 1. Obtener todas las plantillas
```http
GET /api/schedule-templates
```

**Respuesta exitosa (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Horario Oficina Estándar",
      "description": "Lunes a viernes 9-17h",
      "isActive": true,
      "createdBy": "uuid",
      "templateDays": [
        {
          "id": "uuid",
          "dayOfWeek": 1,
          "startTime": "09:00",
          "endTime": "17:00",
          "breakStartTime": "13:00",
          "breakEndTime": "14:00",
          "isWorkingDay": true,
          "notes": "Lunes laborable"
        }
      ],
      "creator": {
        "id": "uuid",
        "name": "Admin Usuario",
        "employeeCode": "ADM001"
      }
    }
  ]
}
```

### 2. Obtener solo plantillas activas
```http
GET /api/schedule-templates/active
```

**Respuesta:** Igual que el endpoint anterior, pero solo plantillas con `isActive: true`

### 3. Obtener plantilla específica
```http
GET /api/schedule-templates/:id
```

**Respuesta exitosa (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Horario Oficina Estándar",
    "description": "Lunes a viernes 9-17h",
    "isActive": true,
    "templateDays": [...],
    "creator": {...}
  }
}
```

### 4. Crear nueva plantilla
```http
POST /api/schedule-templates
```

**Cuerpo de la petición:**
```json
{
  "name": "Horario Turno Mañana",
  "description": "Turno de mañana para producción",
  "createdBy": "uuid-del-empleado-creador",
  "templateDays": [
    {
      "dayOfWeek": 1,
      "startTime": "06:00",
      "endTime": "14:00",
      "breakStartTime": "09:00",
      "breakEndTime": "09:30",
      "isWorkingDay": true,
      "notes": "Turno mañana lunes"
    },
    {
      "dayOfWeek": 2,
      "startTime": "06:00",
      "endTime": "14:00",
      "breakStartTime": "09:00",
      "breakEndTime": "09:30",
      "isWorkingDay": true,
      "notes": "Turno mañana martes"
    }
  ]
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Schedule template created successfully",
  "data": {
    "id": "uuid-generado",
    "name": "Horario Turno Mañana",
    "templateDays": [...],
    "creator": {...}
  }
}
```

### 5. Actualizar plantilla
```http
PUT /api/schedule-templates/:id
```

**Cuerpo de la petición:**
```json
{
  "name": "Nuevo nombre (opcional)",
  "description": "Nueva descripción (opcional)",
  "templateDays": [
    // Array completo de días actualizados (opcional)
  ]
}
```

### 6. Activar/Desactivar plantilla
```http
PATCH /api/schedule-templates/:id/toggle-active
```

**Respuesta exitosa (200):**
```json
{
  "message": "Template activated successfully",
  "data": {
    "id": "uuid",
    "isActive": true
  }
}
```

### 7. Eliminar plantilla
```http
DELETE /api/schedule-templates/:id
```

**Respuesta exitosa (200):**
```json
{
  "message": "Template deleted successfully"
}
```

**Error si está en uso (400):**
```json
{
  "error": "Cannot delete template. It is being used by 5 schedule(s)"
}
```

## 🔄 Aplicación de Plantillas

### 8. Aplicar plantilla a un empleado
```http
POST /api/schedules/employee/:employeeId/apply-template
```

**Cuerpo de la petición:**
```json
{
  "templateId": "uuid-de-la-plantilla"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Template \"Horario Oficina\" applied successfully to Juan Pérez",
  "schedules": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "templateId": "uuid",
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00"
    }
  ],
  "template": {
    "id": "uuid",
    "name": "Horario Oficina"
  }
}
```

### 9. Aplicar plantilla a múltiples empleados
```http
POST /api/schedules/apply-template-bulk
```

**Cuerpo de la petición:**
```json
{
  "templateId": "uuid-de-la-plantilla",
  "employeeIds": [
    "uuid-empleado-1",
    "uuid-empleado-2",
    "uuid-empleado-3"
  ]
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Template \"Horario Oficina\" applied to 3 employees successfully",
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  },
  "results": [
    {
      "employeeId": "uuid-1",
      "employeeName": "Juan Pérez",
      "success": true,
      "schedulesCreated": 5
    },
    {
      "employeeId": "uuid-2",
      "employeeName": "María García",
      "success": true,
      "schedulesCreated": 5
    }
  ],
  "template": {
    "id": "uuid",
    "name": "Horario Oficina"
  }
}
```

## 🔍 Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| 400 | Datos de entrada inválidos |
| 404 | Plantilla o empleado no encontrado |
| 409 | Nombre de plantilla ya existe |
| 500 | Error interno del servidor |

## 💡 Casos de Uso Típicos

### Caso 1: Empresa con horario estándar
```javascript
// 1. Crear plantilla "Oficina Estándar"
POST /api/schedule-templates
{
  name: "Oficina Estándar",
  description: "Lunes a viernes 9-17h con descanso",
  templateDays: [/* lunes a viernes 9-17 */]
}

// 2. Aplicar a 50 empleados de oficina
POST /api/schedules/apply-template-bulk
{
  templateId: "uuid-oficina-estandar",
  employeeIds: [/* 50 IDs de empleados */]
}
```

### Caso 2: Turnos de producción
```javascript
// 1. Crear plantillas para cada turno
POST /api/schedule-templates // "Turno Mañana 6-14h"
POST /api/schedule-templates // "Turno Tarde 14-22h"
POST /api/schedule-templates // "Turno Noche 22-6h"

// 2. Aplicar según asignación de empleados
POST /api/schedules/apply-template-bulk // 20 empleados turno mañana
POST /api/schedules/apply-template-bulk // 15 empleados turno tarde
POST /api/schedules/apply-template-bulk // 10 empleados turno noche
```

## 🧪 Testing

Para probar las APIs:

```bash
# Ejecutar tests automatizados
node scripts/test-schedule-templates.js

# Verificar backend
node scripts/test-backend-startup.js
```

## 🔗 Relaciones con otros módulos

- **Empleados**: Las plantillas son creadas por empleados y aplicadas a empleados
- **Horarios**: Los horarios individuales pueden referenciar una plantilla
- **Reportes**: Los reportes pueden mostrar qué empleados usan cada plantilla
- **Vacaciones**: Las plantillas no afectan las vacaciones aprobadas

---

**📅 Fecha de creación**: Noviembre 2024  
**🔄 Última actualización**: Noviembre 2024  
**👨‍💻 Desarrollado para**: Sistema JARANA v1.0.0
