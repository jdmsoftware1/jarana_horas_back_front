# Cambios en el Sistema de IA - Permisos por Rol

## Fecha: 25 de Noviembre de 2025

## Petición del Cliente
"La IA en administrador debería ser más abierta a responder lo que preguntemos del software y empleados etc. Para los empleados que sea personal solo con sus datos claro."

## Cambios Implementados

### 1. Modificación del Endpoint de Chat (`src/routes/ai.js`)
- **Cambio**: El endpoint `/api/ai/chat` ahora recibe y procesa el parámetro `userRole`
- **Impacto**: Permite diferenciar entre usuarios administradores y empleados
- **Línea modificada**: Línea 92 - Se agregó `userRole` a los parámetros extraídos del body

### 2. Actualización del Servicio de IA (`src/services/enhancedAIService.js`)

#### 2.1 Método `chat()`
- **Cambio**: Ahora acepta `userRole` como parámetro
- **Firma anterior**: `async chat(message, userId = null, conversationHistory = [])`
- **Firma nueva**: `async chat(message, userId = null, userRole = 'employee', conversationHistory = [])`
- **Línea**: 28

#### 2.2 Método `getDatabaseContext()`
- **Cambio**: Implementa restricciones basadas en rol
- **Firma anterior**: `async getDatabaseContext(message, conversationHistory = [])`
- **Firma nueva**: `async getDatabaseContext(message, conversationHistory = [], userRole = 'employee', userId = null)`
- **Línea**: 90

**Restricciones implementadas**:
- **Administradores** (`admin` o `supervisor`):
  - Acceso completo a información de todos los empleados
  - Pueden ver estadísticas globales
  - Acceso a datos de retrasos, vacaciones y horarios de todo el equipo
  
- **Empleados** (`employee`):
  - Solo pueden acceder a su propia información
  - No pueden ver datos de otros empleados
  - Restricción automática si intentan consultar información de otros

#### 2.3 Método `getScheduleContext()`
- **Cambio**: Filtra horarios según el rol del usuario
- **Firma anterior**: `async getScheduleContext(message, messageLower, employeeFromHistory = null)`
- **Firma nueva**: `async getScheduleContext(message, messageLower, employeeFromHistory = null, userRole = 'employee', userId = null)`
- **Línea**: 575

**Lógica implementada**:
```javascript
// Administradores: ven todos los empleados
if (userRole === 'admin' || userRole === 'supervisor') {
  employees = await Employee.findAll({ where: { isActive: true } });
}
// Empleados: solo ven su información
else if (userId) {
  const employee = await Employee.findByPk(userId);
  employees = employee ? [employee] : [];
}
```

#### 2.4 Método `getHoursContext()`
- **Cambio**: Filtra horas trabajadas según el rol del usuario
- **Firma anterior**: `async getHoursContext(message, messageLower, employeeFromHistory = null)`
- **Firma nueva**: `async getHoursContext(message, messageLower, employeeFromHistory = null, userRole = 'employee', userId = null)`
- **Línea**: 341

**Restricción adicional**:
```javascript
// Para empleados, forzar que solo vean su propia información
if (userRole === 'employee' && userId && specificEmployee && specificEmployee.id !== userId) {
  specificEmployee = employees[0]; // Forzar a su propio empleado
}
```

#### 2.5 Método `generateResponse()`
- **Cambio**: Genera prompts del sistema diferentes según el rol
- **Firma anterior**: `async generateResponse(message, context, conversationHistory = [])`
- **Firma nueva**: `async generateResponse(message, context, conversationHistory = [], userRole = 'employee')`
- **Línea**: 279

### 3. Prompts del Sistema Diferenciados

#### 3.1 Prompt para Administradores
**Características**:
- ✅ Acceso completo a toda la información del sistema
- ✅ Análisis y estadísticas de todos los empleados
- ✅ Comparativas entre empleados
- ✅ Insights y recomendaciones basadas en datos
- ✅ Explicaciones sobre funcionalidades del sistema
- ✅ Ayuda en toma de decisiones administrativas
- ✅ Sin restricciones de información

**Capacidades incluidas**:
- 👥 Información de todos los empleados
- 📊 Análisis y estadísticas completas
- ⏰ Registros de entrada/salida de cualquier empleado
- 📅 Horarios asignados de todo el equipo
- 🏖️ Vacaciones y ausencias globales
- 📈 Horas trabajadas de todos los empleados
- 🔍 Reportes personalizados
- ⚠️ Alertas y anomalías del sistema

**Ejemplos de consultas que puede responder**:
- "¿Qué empleados llegaron tarde esta semana?"
- "Muéstrame las estadísticas de horas trabajadas del equipo"
- "¿Quién tiene más horas extra este mes?"
- "Analiza el rendimiento de todos los empleados"
- "¿Cómo funciona el sistema de vacaciones?"
- "Dame un resumen del estado del equipo"
- "¿Qué empleados tienen déficit de horas?"
- "Explícame cómo asignar horarios"

#### 3.2 Prompt para Empleados
**Características**:
- ✅ Acceso solo a información personal
- ✅ Consultas sobre sus propios registros
- ✅ Información sobre su horario y vacaciones
- ✅ Ayuda general sobre el uso del sistema
- ❌ Sin acceso a datos de otros empleados
- ❌ Sin acceso a estadísticas generales del equipo

**Capacidades incluidas**:
- 👤 Su información personal
- ⏰ Sus registros de entrada/salida
- 📅 Su horario asignado
- 🏖️ Sus vacaciones y solicitudes
- 📊 Sus horas trabajadas
- ❓ Ayuda general del sistema

**Ejemplos de consultas que puede responder**:
- "¿Cuántas horas trabajé esta semana?"
- "¿He fichado entrada hoy?"
- "¿Cuál es mi horario de mañana?"
- "¿Cuántos días de vacaciones me quedan?"
- "Quiero solicitar vacaciones del 15 al 20 de enero"
- "¿Tengo horas extra este mes?"
- "¿Cómo solicito vacaciones?"

## Flujo de Datos

```
Cliente (Frontend)
    ↓ (envia: message, userId, userRole, conversationHistory)
Endpoint /api/ai/chat
    ↓
enhancedAIService.chat()
    ↓
getDatabaseContext() ← Filtra datos según userRole
    ↓
generateResponse() ← Genera prompt según userRole
    ↓
OpenAI GPT-4o-mini
    ↓
Respuesta al Cliente
```

## Seguridad y Privacidad

### Medidas Implementadas:
1. **Validación de Rol**: Cada método verifica el rol antes de proporcionar datos
2. **Filtrado Automático**: Los empleados no pueden acceder a datos de otros aunque lo soliciten
3. **Forzado de Contexto**: Si un empleado intenta consultar sobre otro, se redirige automáticamente a su propia información
4. **Prompts Restrictivos**: El prompt del sistema para empleados les indica claramente sus limitaciones

### Roles Soportados:
- `admin`: Acceso completo
- `supervisor`: Acceso completo (igual que admin)
- `employee`: Acceso restringido a información personal

## Compatibilidad

### Frontend:
El componente `AIChat.jsx` ya envía el parámetro `userRole`:
- En `AdminDashboard.jsx`: `<AIChat userId={user?.id} userRole="admin" />`
- En `EmployeePortal.jsx`: `<AIChat userId={employee.id} userRole="employee" />`

### Backend:
- ✅ Compatible con versiones anteriores (userRole tiene valor por defecto 'employee')
- ✅ No requiere cambios en la base de datos
- ✅ No afecta a otros servicios de IA (AIService.js sigue funcionando independientemente)

## Pruebas Recomendadas

### Como Administrador:
1. Preguntar por información de múltiples empleados
2. Solicitar estadísticas generales
3. Pedir análisis comparativos
4. Consultar sobre funcionamiento del sistema

### Como Empleado:
1. Preguntar por información personal
2. Intentar consultar datos de otros empleados (debe ser bloqueado)
3. Solicitar estadísticas personales
4. Pedir ayuda sobre el uso del sistema

## Notas Adicionales

- El modelo utilizado es `gpt-4o-mini` para optimizar costos
- El historial de conversación se limita a los últimos 5 mensajes
- La temperatura está configurada en 0.7 para respuestas balanceadas
- El límite de tokens por respuesta es 1500

## Archivos Modificados

1. `src/routes/ai.js` - Línea 92
2. `src/services/enhancedAIService.js` - Líneas 28, 45, 51, 90, 123, 131, 138-157, 279-361, 341-366, 437-454, 575-613

## Próximos Pasos Sugeridos

1. ✅ Implementar logs de auditoría para consultas de administradores
2. ✅ Agregar métricas de uso de la IA por rol
3. ✅ Considerar agregar más roles intermedios (ej: "team_leader")
4. ✅ Implementar rate limiting diferenciado por rol
5. ✅ Agregar tests unitarios para verificar restricciones de permisos
