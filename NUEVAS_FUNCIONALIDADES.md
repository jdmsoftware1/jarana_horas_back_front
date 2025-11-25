# 🎉 Nuevas Funcionalidades - Sistema de Registro Horario Jarana

## 📋 Resumen de Cambios

Se han implementado mejoras significativas en el sistema, incluyendo un nuevo diseño de menú lateral estilo Koko, calendario para empleados, y sistema de categorías de ausencias personalizables.

---

## ✨ Funcionalidades Nuevas

### 1. 🎨 **Nuevo Menú Lateral (Sidebar)**

#### Características:
- **Diseño minimalista** con iconos y tooltips
- **Colapsable** para maximizar espacio de trabajo
- **Tooltips informativos** al pasar el ratón sobre los iconos
- **Separado por roles**: Menú diferente para Admin y Empleados
- **Transiciones suaves** y animaciones modernas

#### Ubicación:
- **Admin**: Panel de administración (`/admin-dashboard`)
- **Empleado**: Portal del empleado (`/employee-portal`)

#### Iconos del Menú Admin:
- 📊 Dashboard
- 👥 Empleados
- ⏰ Horarios
- 📄 Registros
- 📅 Ausencias
- 📈 Informes
- ⚙️ Configuración

---

### 2. 📅 **Calendario del Empleado**

#### Características:
- **Vista mensual** con navegación entre meses
- **Visualización de festivos** españoles (2024-2025)
- **Visualización de vacaciones aprobadas**
- **Visualización de ausencias** con categorías personalizadas
- **Colores diferenciados** por tipo de evento
- **Leyenda visual** para fácil identificación

#### Acceso:
- Ruta: `/employee-calendar`
- Menú lateral del empleado: Icono de calendario

#### Colores:
- 🔴 **Rojo**: Festivos nacionales
- 🔵 **Azul**: Vacaciones/Ausencias
- 🟡 **Amarillo**: Día actual

---

### 3. 🏷️ **Sistema de Categorías de Ausencias Personalizables**

#### Características:
- **Categorías predefinidas**:
  - 🏖️ Vacaciones
  - 🏥 Baja médica
  - 👤 Asunto personal
  - 👶 Baja maternal
  - 👨‍👶 Baja paternal
  - 🛏️ Reposo 48h
  - 🎁 Día libre empresa
  - 📋 Otro

- **Personalización completa**:
  - Nombre y código único
  - Color personalizado (hexadecimal)
  - Icono (emoji)
  - Requiere aprobación (sí/no)
  - Es pagado (sí/no/variable)
  - Máximo días por año
  - Estado activo/inactivo
  - Orden de visualización

#### Gestión:
- **Ubicación**: Admin Dashboard → Tab "Categorías Ausencias"
- **Operaciones**:
  - ➕ Crear nueva categoría
  - ✏️ Editar categoría existente
  - 🗑️ Eliminar categoría (solo no-sistema)
  - 🔄 Inicializar categorías por defecto

#### Restricciones:
- Las categorías del sistema (🔒) no se pueden eliminar
- No se puede eliminar una categoría si está siendo usada
- Los códigos deben ser únicos

---

## 🔧 Cambios Técnicos

### Backend

#### Nuevos Modelos:
```javascript
// src/models/AbsenceCategory.js
- id (UUID)
- name (String)
- code (String, único)
- description (Text)
- color (String, hex)
- icon (String, emoji)
- requiresApproval (Boolean)
- isPaid (Boolean, nullable)
- maxDaysPerYear (Integer, nullable)
- isActive (Boolean)
- sortOrder (Integer)
- isSystem (Boolean)
```

#### Nuevas Rutas API:
```
GET    /api/absence-categories          - Obtener categorías activas
GET    /api/absence-categories/all      - Obtener todas (admin)
GET    /api/absence-categories/:id      - Obtener una categoría
POST   /api/absence-categories          - Crear categoría (admin)
PUT    /api/absence-categories/:id      - Actualizar categoría (admin)
DELETE /api/absence-categories/:id      - Eliminar categoría (admin)
POST   /api/absence-categories/initialize-defaults - Inicializar por defecto
```

#### Modificaciones en Vacation:
- Nuevo campo: `categoryId` (UUID, nullable)
- Relación: `belongsTo AbsenceCategory`
- Campo `type` ahora es nullable (legacy)

### Frontend

#### Nuevos Componentes:
```
client/src/components/
├── SidebarMenu.jsx              - Menú lateral con iconos
├── Layout.jsx                   - Wrapper con sidebar
├── EmployeeCalendar.jsx         - Calendario visual
└── AbsenceCategoryManager.jsx   - Gestor de categorías

client/src/pages/employee/
└── CalendarPage.jsx             - Página del calendario
```

#### Componentes Modificados:
- `AdminDashboard.jsx` - Integrado con nuevo Layout y sidebar
- `VacationsContent` - Muestra categorías en lugar de tipos legacy
- `App.jsx` - Nueva ruta `/employee-calendar`

---

## 🚀 Cómo Usar

### Para Administradores:

1. **Inicializar Categorías** (primera vez):
   ```
   Admin Dashboard → Categorías Ausencias → "Inicializar por defecto"
   ```

2. **Crear Nueva Categoría**:
   - Click en "Nueva Categoría"
   - Rellenar formulario:
     - Nombre: ej. "Permiso de paternidad extendido"
     - Código: ej. "PATERNITY_EXT"
     - Color: Seleccionar del picker
     - Icono: Emoji (ej. 👨‍👶)
     - Configurar opciones
   - Guardar

3. **Gestionar Ausencias**:
   - Las ausencias ahora muestran el icono y color de su categoría
   - Filtrar y aprobar/rechazar como antes

### Para Empleados:

1. **Ver Calendario**:
   - Acceder desde el menú lateral (icono 📅)
   - O directamente: `/employee-calendar`
   - Navegar entre meses con las flechas
   - Ver festivos y ausencias aprobadas

2. **Solicitar Ausencia**:
   - Seleccionar categoría del desplegable
   - Las categorías muestran su icono y color
   - Completar fechas y motivo

---

## 🎨 Diseño y UX

### Paleta de Colores:
- **Sidebar**: Fondo oscuro (`brand-dark`)
- **Hover**: Efectos sutiles con transiciones
- **Activo**: Resaltado con `brand-light`
- **Tooltips**: Fondo oscuro con borde

### Animaciones:
- Transiciones suaves (300ms)
- Hover con scale en iconos
- Fade in/out en tooltips
- Slide en sidebar collapse

### Responsive:
- Sidebar se adapta a pantallas pequeñas
- Calendario responsive con grid
- Tooltips se posicionan automáticamente

---

## 📝 Notas de Migración

### Base de Datos:
El sistema ejecutará automáticamente `sequelize.sync({ alter: true })` que:
- Creará la tabla `absence_categories`
- Agregará el campo `category_id` a `vacations`
- Mantendrá el campo `type` por compatibilidad

### Datos Existentes:
- Las ausencias existentes seguirán funcionando con el campo `type`
- Se recomienda migrar gradualmente a categorías
- Las categorías por defecto mapean a los tipos legacy

### Compatibilidad:
- ✅ Totalmente compatible con datos existentes
- ✅ No requiere migración de datos
- ✅ Funciona con y sin categorías

---

## 🐛 Troubleshooting

### El sidebar no aparece:
- Verificar que el componente use `<Layout isAdmin={true/false}>`
- Revisar consola del navegador

### Las categorías no se cargan:
- Ejecutar "Inicializar por defecto" en el admin
- Verificar que el backend esté corriendo
- Revisar logs del servidor

### El calendario no muestra ausencias:
- Verificar que las ausencias estén aprobadas
- Revisar que el `employeeId` sea correcto
- Comprobar la respuesta de la API en Network tab

---

## 🔮 Futuras Mejoras

- [ ] Exportar calendario a PDF/iCal
- [ ] Notificaciones de ausencias aprobadas
- [ ] Estadísticas de uso de categorías
- [ ] Integración con calendario de Google
- [ ] Festivos personalizables por región
- [ ] Vista anual del calendario
- [ ] Solicitar ausencia desde el calendario (click en día)

---

## 📞 Soporte

Para cualquier duda o problema:
1. Revisar este documento
2. Consultar logs del servidor
3. Revisar consola del navegador
4. Contactar al equipo de desarrollo

---

**Versión**: 2.0.0  
**Fecha**: Noviembre 2024  
**Desarrollado por**: Equipo Jarana
