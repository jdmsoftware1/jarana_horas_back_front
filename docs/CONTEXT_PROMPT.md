# 🎯 CONTEXT PROMPT - Sistema de Registro Horario JARANA

## 📋 INFORMACIÓN DEL PROYECTO

**Nombre**: Sistema de Registro Horario JARANA  
**Tipo**: Aplicación web full-stack para gestión de recursos humanos  
**Estado**: Completamente funcional con IA integrada  
**Versión**: 1.0.2  

---

## 🏗️ ARQUITECTURA TÉCNICA

### **Backend (Node.js + Express)**
- **Puerto**: 3000
- **Base de datos**: PostgreSQL con Sequelize ORM
- **Autenticación**: TOTP (Time-based One-Time Password)
- **IA**: OpenAI GPT-4 integrada
- **API REST**: Endpoints completos para todas las funcionalidades

### **Frontend (React + Vite)**
- **Puerto**: 5173
- **Framework**: React 18 con hooks
- **Estilos**: TailwindCSS + componentes personalizados
- **Iconos**: Lucide React
- **Routing**: React Router DOM
- **Estado**: Context API + useState/useEffect

### **Estructura de Carpetas**
```
registro_horario/
├── app/
│   ├── back/                 # Backend Node.js
│   │   ├── src/
│   │   │   ├── models/       # Modelos Sequelize
│   │   │   ├── routes/       # Rutas API
│   │   │   ├── services/     # Servicios (IA, etc.)
│   │   │   ├── middleware/   # Middlewares
│   │   │   └── config/       # Configuración DB
│   │   └── tests/            # Tests backend
│   └── front/                # Frontend React
│       ├── src/
│       │   ├── pages/        # Páginas principales
│       │   ├── components/   # Componentes reutilizables
│       │   ├── contexts/     # Context API
│       │   ├── utils/        # Utilidades
│       │   └── tests/        # Tests frontend
│       └── public/           # Assets estáticos
```

---

## 🎯 FUNCIONALIDADES PRINCIPALES

### **1. 🔐 Sistema de Autenticación**
- **TOTP**: Códigos de 6 dígitos que cambian cada 30 segundos
- **QR Codes**: Generación automática para apps autenticadoras
- **Códigos de empleado**: Identificadores únicos (ej: EMP001)
- **Estados**: Empleados activos/inactivos

### **2. ⏰ Fichaje de Entrada/Salida**
- **Kiosk Web**: Interfaz simple para fichar (`/employee-kiosk`)
- **Validaciones**: Previene doble entrada o salida sin entrada
- **Dispositivos**: Tracking del dispositivo usado
- **Mensajes**: Confirmación por 5 segundos tras fichar
- **Auto-limpieza**: Formulario se limpia automáticamente

### **3. 👤 Portal del Empleado**
- **Dashboard Personal**: Estado actual, horas trabajadas, vacaciones
- **Mis Fichajes**: Historial completo con filtros y paginación
- **Mis Vacaciones**: Crear solicitudes y ver estado
- **Reportes**: Análisis de productividad y puntualidad
- **Chat IA**: Asistente inteligente integrado

### **4. 🛠️ Dashboard Administrativo**
- **Gestión de Empleados**: CRUD completo + QR codes
- **Visualización de Registros**: Todos los fichajes del sistema
- **Gestión de Vacaciones**: Aprobar/rechazar solicitudes
- **Control del Sistema**: Activar/desactivar fichaje global
- **Último Fichaje**: Muestra el último registro de cada empleado

### **5. 🤖 Asistente IA (JARANA AI)**
- **Consultas Inteligentes**: Horas trabajadas, puntualidad, estado
- **Creación de Vacaciones**: Procesamiento de lenguaje natural
- **Análisis de Datos**: Estadísticas personalizadas
- **Recomendaciones**: Consejos basados en patrones de trabajo
- **Contexto Completo**: Acceso a toda la información del empleado

---

## 🗄️ MODELOS DE BASE DE DATOS

### **Employee (Empleados)**
```javascript
{
  id: UUID (PK),
  name: String,
  email: String (unique),
  employeeCode: String (unique),
  totpSecret: String,
  qrCodeUrl: String,
  isActive: Boolean,
  role: String (employee/supervisor/admin),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### **Record (Registros de Fichaje)**
```javascript
{
  id: UUID (PK),
  employeeId: UUID (FK),
  type: Enum (checkin/checkout),
  timestamp: DateTime,
  device: String,
  location: String,
  notes: String,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### **Vacation (Vacaciones)**
```javascript
{
  id: UUID (PK),
  employeeId: UUID (FK),
  startDate: Date,
  endDate: Date,
  type: Enum (vacation/sick_leave/personal/other),
  status: Enum (pending/approved/rejected),
  reason: String,
  notes: String,
  approverId: UUID (FK),
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### **Schedule (Horarios)**
```javascript
{
  id: UUID (PK),
  employeeId: UUID (FK),
  dayOfWeek: Integer (0-6),
  isWorkingDay: Boolean,
  startTime: Time,
  endTime: Time,
  breakStartTime: Time,
  breakEndTime: Time,
  notes: String,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

## 🛣️ RUTAS PRINCIPALES

### **Frontend Routes**
- `/` - Página principal
- `/employee-kiosk` - Kiosk de fichaje
- `/employee-portal` - Portal del empleado
- `/admin` - Dashboard administrativo

### **API Endpoints**
- `POST /api/kiosk/auth` - Autenticación empleado
- `POST /api/kiosk/checkin` - Fichar entrada
- `POST /api/kiosk/checkout` - Fichar salida
- `GET /api/records/employee/:id` - Registros por empleado
- `POST /api/vacations` - Crear solicitud vacaciones
- `GET /api/vacations/employee/:id` - Vacaciones por empleado
- `POST /api/ai/chat` - Chat con IA
- `POST /api/ai/employee-query/:id` - Consultas específicas IA
- `GET /api/employees` - Lista empleados
- `POST /api/employees` - Crear empleado

---

## 🤖 CAPACIDADES DE IA

### **Detección Automática**
- **Solicitudes de vacaciones**: Palabras clave como "vacaciones", "días libres"
- **Consultas específicas**: "horas", "puntualidad", "fichado", etc.
- **Extracción de fechas**: Procesamiento de lenguaje natural para fechas

### **Funciones Inteligentes**
```javascript
// Ejemplos de consultas que la IA puede resolver:
- "¿Cuántas horas trabajé esta semana?" → getWeeklyHours()
- "¿He llegado tarde este mes?" → getLateArrivals()
- "¿He fichado entrada hoy?" → getTodayStatus()
- "¿Cuál es mi horario de mañana?" → getTomorrowSchedule()
- "Quiero vacaciones del 15 al 20 de enero" → handleVacationRequest()
```

### **Análisis de Datos**
- **Puntualidad**: Cálculo basado en llegadas después de 9:15 AM
- **Productividad**: Horas trabajadas vs. esperadas
- **Patrones**: Detección de anomalías en comportamiento
- **Recomendaciones**: Consejos personalizados

---

## 🎨 DISEÑO Y UX

### **Tema de Colores**
```css
brand-light: #D4A574    /* Dorado claro */
brand-medium: #B8956A   /* Dorado medio */
brand-dark: #8B7355     /* Dorado oscuro */
brand-cream: #F5F1E8    /* Crema */
brand-accent: #E8B86D   /* Acento dorado */
neutral-light: #F8F9FA  /* Gris claro */
neutral-mid: #6C757D    /* Gris medio */
neutral-dark: #212529   /* Gris oscuro */
```

### **Componentes Clave**
- **LoadingSpinner**: Indicador de carga consistente
- **AIChat**: Chat flotante con IA
- **Footer**: Información del sistema
- **SystemContext**: Estado global del sistema

### **Responsive Design**
- **Mobile-first**: Diseño optimizado para móviles
- **Breakpoints**: sm, md, lg, xl de TailwindCSS
- **Touch-friendly**: Botones y elementos táctiles grandes

---

## 🧪 TESTING

### **Backend Tests (Jest)**
- **Autenticación**: Validación TOTP y códigos empleado
- **Registros**: Creación y validación de fichajes
- **Vacaciones**: CRUD completo de solicitudes
- **IA**: Funciones de análisis y chat
- **Empleados**: Gestión completa

### **Frontend Tests (Vitest + Testing Library)**
- **Componentes**: Renderizado y interacciones
- **Páginas**: Flujos completos de usuario
- **IA Chat**: Envío de mensajes y respuestas
- **Formularios**: Validaciones y envíos
- **Navegación**: Routing y estados

---

## 🔧 CONFIGURACIÓN DE DESARROLLO

### **Variables de Entorno Backend**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/jarana_db
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key (opcional)
```

### **Variables de Entorno Frontend**
```env
VITE_API_URL=http://localhost:3000/api
```

### **Scripts Disponibles**
```bash
# Backend
npm run dev          # Desarrollo con nodemon
npm run start        # Producción
npm test            # Ejecutar tests
npm run test:watch  # Tests en modo watch

# Frontend
npm run dev         # Desarrollo con Vite
npm run build       # Build para producción
npm run preview     # Preview del build
npm test           # Ejecutar tests con Vitest
```

---

## 🚀 CARACTERÍSTICAS DESTACADAS

### **✨ Innovaciones Técnicas**
- **IA Contextual**: Acceso completo a datos del empleado para respuestas precisas
- **TOTP Seguro**: Autenticación de dos factores sin SMS
- **Tiempo Real**: Actualizaciones inmediatas en dashboard
- **Responsive Total**: Funciona perfectamente en cualquier dispositivo
- **Auto-limpieza**: Formularios se limpian automáticamente para siguiente usuario

### **🎯 UX Excepcional**
- **Mensajes Claros**: Feedback inmediato en todas las acciones
- **Navegación Intuitiva**: Tabs y menús fáciles de usar
- **Estados Visuales**: Colores y iconos consistentes
- **Carga Progresiva**: Spinners y estados de carga
- **Errores Amigables**: Mensajes de error comprensibles

### **📊 Análisis Avanzado**
- **Métricas Personalizadas**: Cada empleado ve sus propias estadísticas
- **Recomendaciones IA**: Consejos basados en patrones reales
- **Filtros Inteligentes**: Múltiples formas de ver los datos
- **Exportación**: Datos listos para exportar (futuro)

---

## 🎯 CASOS DE USO PRINCIPALES

### **Empleado Típico**
1. **Llega al trabajo** → Abre `/employee-kiosk` → Ficha entrada
2. **Durante el día** → Usa `/employee-portal` → Consulta horas con IA
3. **Necesita vacaciones** → Chat IA: "Quiero vacaciones del 15 al 20"
4. **Fin del día** → Ficha salida → Ve mensaje 5 segundos

### **Supervisor/Admin**
1. **Revisa equipo** → `/admin` → Ve últimos fichajes de todos
2. **Nueva solicitud** → Sección vacaciones → Aprueba/rechaza
3. **Nuevo empleado** → Crear empleado → Genera QR automático
4. **Problema técnico** → Desactiva sistema temporalmente

### **Consultas IA Comunes**
- *"¿Cuántas horas llevo esta semana?"* → Respuesta con datos reales
- *"¿He llegado tarde este mes?"* → Análisis de puntualidad
- *"Necesito 3 días libres en diciembre"* → Crea solicitud automática
- *"¿Cuál es mi horario de mañana?"* → Consulta schedule configurado

---

## 🔮 ROADMAP FUTURO

### **Próximas Funcionalidades**
- **Notificaciones Push**: Alertas en tiempo real
- **Geolocalización**: Fichaje por ubicación
- **Reportes PDF**: Exportación de datos
- **API Mobile**: App nativa iOS/Android
- **Integración Calendar**: Sincronización con Google/Outlook
- **Dashboard Analytics**: Métricas avanzadas para RRHH

### **Mejoras IA**
- **Predicciones**: Análisis predictivo de ausencias
- **Chatbot Multiidioma**: Soporte para múltiples idiomas
- **Reconocimiento Voz**: Comandos por voz
- **Análisis Sentimiento**: Detección de satisfacción laboral

---

## 💡 TIPS PARA DESARROLLADORES

### **Debugging**
- **Logs Backend**: Console.log en servicios críticos
- **Logs Frontend**: Console.log en componentes principales
- **Network Tab**: Verificar llamadas API
- **React DevTools**: Inspeccionar estado de componentes

### **Extensibilidad**
- **Nuevos Endpoints**: Seguir patrón existente en `/routes`
- **Nuevos Modelos**: Usar Sequelize con relaciones
- **Nuevos Componentes**: TailwindCSS + Lucide icons
- **Nueva IA**: Extender `AIService` con nuevos métodos

### **Performance**
- **Paginación**: Implementada en registros y vacaciones
- **Lazy Loading**: Componentes se cargan bajo demanda
- **Memoización**: useCallback/useMemo donde necesario
- **Optimistic Updates**: UI se actualiza antes de confirmación

---

## 📝 HISTORIAL DE ACTUALIZACIONES

### **Versión 1.0.2** (04/11/2025)

#### **🆕 Nuevas Funcionalidades**

**1. Sistema de Horarios Semanales**
- ✅ Nueva pestaña "Horarios Semanales" en AdminDashboard
- ✅ Asignación de diferentes plantillas de horarios por semana
- ✅ Aplicación de plantillas a múltiples semanas consecutivas
- ✅ Cálculo automático de rangos semanales (Lunes-Domingo)
- ✅ Gestión individual por empleado con tabla detallada
- ✅ Integración completa con sistema de plantillas existente

**2. Horarios Personalizados por Semana**
- ✅ Creación de horarios únicos sin plantilla predefinida
- ✅ Configuración individual de cada día de la semana
- ✅ Gestión completa de pausas/descansos personalizadas
- ✅ Generación automática de plantilla temporal
- ✅ Soporte para múltiples pausas con configuración detallada

**3. Integración de Vacaciones en Horarios**
- ✅ Detección automática de vacaciones en horarios semanales
- ✅ Visualización de semanas de vacaciones en tabla
- ✅ Indicadores visuales (fondo amarillo, emoji 🏖️)
- ✅ Mostrar vacaciones sin horario asignado
- ✅ Cálculo de solapamiento de vacaciones con semanas

**4. Vista Semanal Mejorada**
- ✅ Sistema de prioridades inteligente (Vacaciones > Horario Semanal > Horario Base)
- ✅ Recarga automática al cambiar de semana
- ✅ Visualización de plantillas aplicadas con badge
- ✅ Detección de vacaciones por fecha exacta
- ✅ Soporte para horarios diferentes cada semana

**5. Modal de Gestión de Plantillas**
- ✅ Modal completo integrado en Horarios Semanales
- ✅ Crear, editar y eliminar plantillas sin salir de la página
- ✅ Configuración de horarios por día
- ✅ Gestión de pausas por plantilla
- ✅ Actualización automática de lista tras cambios

#### **🐛 Correcciones de Errores**

**1. Vista Semanal - Templates**
- ✅ Arreglado problema con plantillas diferentes no mostrando correctamente
- ✅ Validación robusta de `templateDays` antes de buscar días
- ✅ Manejo correcto de días no encontrados en plantilla

**2. Informe de Cumplimiento**
- ✅ Detección correcta de entradas tardías (ej: 14:43 vs 14:00)
- ✅ Función `formatTime` robusta con formato consistente HH:MM
- ✅ Detección de salidas tardías (después de hora esperada)
- ✅ Cálculo preciso de diferencias de tiempo

**3. Horarios Semanales**
- ✅ Arreglado "Invalid Date" en rango de fechas
- ✅ Soporte para ambos formatos: `weekStart/weekEnd` y `startDate/endDate`
- ✅ Error al aplicar plantilla a una sola semana (faltaba `createdBy`)

**4. Modal de Horarios del Empleado**
- ✅ Mostrar plantilla aplicada o "Sin plantilla aplicada"
- ✅ Visualización mejorada de múltiples pausas
- ✅ Eliminados campos obsoletos de descanso único
- ✅ Badges informativos (Pagada, Obligatoria, Flexible)

#### **🔧 Mejoras Técnicas**

**Backend**
- ✅ Nuevos endpoints para horarios semanales:
  - `GET /api/weekly-schedules/employee/:employeeId`
  - `POST /api/weekly-schedules`
  - `DELETE /api/weekly-schedules/:id`
- ✅ Validación de campos requeridos (`createdBy`)
- ✅ Manejo de errores mejorado con mensajes descriptivos

**Frontend**
- ✅ Componente `WeeklySchedulesContent` completamente nuevo
- ✅ Estados para gestión de horarios semanales y vacaciones
- ✅ Funciones de cálculo de semanas (ISO week number)
- ✅ Sistema de delays anti-rate-limit (50-100ms)
- ✅ Integración con `TemplatesModal` existente

#### **📊 Modelos y Datos**

**WeeklySchedule (uso mejorado)**
```javascript
{
  employeeId: UUID,
  year: Integer,
  weekNumber: Integer,
  templateId: UUID (opcional),
  startDate: Date,
  endDate: Date,
  notes: String,
  createdBy: UUID
}
```

**Prioridad de Horarios**
```
1. 🏖️ Vacaciones (máxima prioridad)
2. 📋 Horario Semanal (si existe)
3. 📅 Horario Base (fallback)
```

#### **🎨 Mejoras de UI/UX**

- ✅ Tabla de horarios semanales con columnas: Semana, Año, Rango, Tipo/Plantilla, Estado, Acciones
- ✅ Badges de color para diferenciar: Plantilla (azul), Personalizado (verde), Vacaciones (amarillo)
- ✅ Modal de horario personalizado con sección de pausas completa
- ✅ Botón "Gestionar Plantillas" con icono de configuración
- ✅ Vista semanal con indicadores de plantilla aplicada

#### **📝 Documentación**

- ✅ Actualizado CONTEXT_PROMPT.md con nuevas funcionalidades
- ✅ Documentación de endpoints de horarios semanales
- ✅ Ejemplos de uso y flujos de trabajo
- ✅ Historial de versiones

---

### **Versión 1.0.2** - 05/11/2025 ✨ ACTUAL

#### **🧠 Sistema de IA con Embeddings y RAG**
- **embeddingService.js**: Gestión de embeddings con OpenAI (text-embedding-3-small)
- **enhancedAIService.js**: Servicio mejorado con RAG (Retrieval Augmented Generation)
- Vector store en memoria para búsqueda semántica
- Combinación inteligente de documentos + consultas SQL en tiempo real
- Respuestas contextualizadas con rutas específicas

**Nuevos Endpoints:**
- POST /api/ai/chat - Chat mejorado con embeddings + BD
- POST /api/ai/reload-knowledge - Recargar base de conocimiento
- GET /api/ai/knowledge-stats - Estadísticas del sistema
- POST /api/ai/upload-document - Subir documento .txt
- GET /api/ai/view-document/:filename - Ver documento
- DELETE /api/ai/delete-document/:filename - Eliminar documento
- GET /api/ai/custom-instructions - Obtener instrucciones
- POST /api/ai/custom-instructions - Guardar instrucciones

#### **📚 Gestión de Conocimiento en AdminDashboard**
- Nueva pestaña "Gestión IA" (🧠)
- Upload de documentos .txt con drag & drop
- Visor de documentos en modal
- Eliminar documentos con botón de papelera (🗑️)
- Editor de instrucciones personalizadas
- Estadísticas en tiempo real
- Recarga de base de conocimiento

**Componente:** AIKnowledgeContent (400+ líneas)

#### **📖 Base de Conocimiento Inicial**
- sistema_jarana.txt (81 líneas) - Descripción general
- guia_uso_sistema.txt (450+ líneas) - Instrucciones paso a paso
- preguntas_frecuentes.txt (400+ líneas) - FAQ con rutas específicas
- README.md - Guía completa de embeddings

**Carpeta:** app/back/knowledge/

#### **🔧 Correcciones de Bugs**
- ✅ Error de enum en Records (entry → checkin)
- ✅ Error de clerkUserId en AI Chat
- ✅ Mensajes de error mejorados (español, amigables)
- ✅ Manejo de errores de conexión y BD

#### **🎨 Mejoras de UX**
- Diseño moderno en sección de IA
- Confirmación antes de eliminar documentos
- Animaciones de carga
- Feedback visual inmediato
- Alertas en dashboard

**Dependencias Añadidas:**
- multer@^1.4.5-lts.1 - Upload de archivos

**Archivos Nuevos:** 7 (servicios + documentos)
**Archivos Modificados:** 6 (AdminDashboard, routes, etc.)
**Líneas Añadidas:** ~2,800+ (código + documentación)

---

### **Versión 1.0.1** (Anterior)
- Sistema base de fichaje y gestión de empleados
- Integración con IA (JARANA AI)
- Portal del empleado y dashboard administrativo
- Sistema de plantillas de horarios
- Gestión de vacaciones
- Múltiples pausas por horario

### **Versión 1.0.0** (Inicial)
- Lanzamiento inicial del sistema
- Autenticación TOTP
- Fichaje de entrada/salida
- Dashboard básico

---

**📚 Documentación Completa:**
- CHANGELOG_v1.0.2.txt - Novedades para usuarios
- docs/UPDATES.md - Historial técnico completo
- docs/CONTEXT_PROMPT.md - Este archivo

---

**🎉 ¡Este contexto te permitirá entender y trabajar con JARANA de manera efectiva!**

**Designed by JDMSoftware - v1.0.2**
