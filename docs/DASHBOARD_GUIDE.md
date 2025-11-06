# 📊 Guía Completa del Dashboard - Sistema Jarana

Esta guía explica cómo usar todas las funcionalidades del **Dashboard de Supervisor**, accesible solo después de autenticarse con Clerk.

## 🎯 Acceso al Dashboard

### 🔐 **Requisitos Previos**
1. **Cuenta de Clerk** configurada
2. **Sistema activado** (login diario)
3. **Rol de supervisor** asignado

### 🚀 **Cómo Acceder**
1. **Ir a la aplicación** → Página principal
2. **Clic en "Activar Sistema"** (si no está activo)
3. **Login con Clerk** → Email + Password
4. **Sistema se activa** → Volver a página principal
5. **Clic en "Dashboard Supervisor"** → Acceso completo

## 🏗️ Estructura del Dashboard

### 📱 **Header Principal**
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 Jarana Admin                    Juan Pérez | 2h 30m      │
│ Panel de Administración            [Desactivar] [Salir]     │
└─────────────────────────────────────────────────────────────┘
```

#### **Información Mostrada**
- **Logo y título** de la aplicación
- **Nombre del supervisor** logueado
- **Duración de sesión** activa
- **Botón desactivar sistema** (rojo)
- **Botón salir** (logout de Clerk)

### 🗂️ **Pestañas de Navegación**
- 📊 **Dashboard** - Estadísticas generales
- 👥 **Empleados** - Gestión de personal
- 📋 **Registros** - Historial de fichajes
- ⚙️ **Configuración** - Ajustes del sistema

## 📊 Pestaña Dashboard

### 📈 **Estadísticas Principales**

#### **Tarjetas de Métricas**
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ 👥 Total        │ 🕐 Fichajes     │ ⏱️ Horas        │ ✅ Empleados    │
│ Empleados       │ Hoy             │ Trabajadas      │ Activos         │
│ 24 (+2)         │ 18 (+5)         │ 142h (+12h)     │ 22 (0)          │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### **Detalles de Métricas**
- **Total Empleados**: Número total + cambio respecto ayer
- **Fichajes Hoy**: Entradas/salidas del día actual
- **Horas Trabajadas**: Suma total del día + diferencia
- **Empleados Activos**: Empleados que han fichado hoy

### 📋 **Actividad Reciente**

#### **Lista en Tiempo Real**
```
🟢 Juan Pérez fichó entrada          Hace 5 min
🔴 María García fichó salida         Hace 12 min
🟢 Carlos López fichó entrada        Hace 18 min
🔴 Ana Martín fichó salida          Hace 25 min
🟢 Pedro Ruiz fichó entrada         Hace 32 min
```

#### **Información Mostrada**
- **Indicador visual**: 🟢 Entrada / 🔴 Salida
- **Nombre del empleado**
- **Tipo de acción**: Entrada o salida
- **Tiempo relativo**: "Hace X minutos"

### 📊 **Gráficos y Analytics** (Futuro)
- **Gráfico de barras**: Fichajes por día de la semana
- **Gráfico circular**: Distribución de horas por empleado
- **Timeline**: Actividad del día en tiempo real

## 👥 Pestaña Empleados

### 🎯 **Funcionalidades Principales**

#### **Header de Sección**
```
👥 Gestión de Empleados                    [+ Nuevo Empleado]
```

### 📋 **Tabla de Empleados**

#### **Columnas de la Tabla**
| Empleado | Código | Estado | Último Fichaje | Acciones |
|----------|--------|--------|----------------|----------|
| 👤 Juan Pérez<br>juan@empresa.com | EMP001 | ✅ Activo | Entrada - 09:15 | 📱 🖊️ |

#### **Información por Empleado**
- **Avatar**: Iniciales del nombre
- **Nombre completo** y email
- **Código único** (EMP001, EMP002...)
- **Estado**: Activo/Inactivo con indicador visual
- **Último fichaje**: Tipo y hora
- **Acciones**: QR code y editar

### ➕ **Crear Nuevo Empleado**

#### **Formulario de Creación**
```
┌─────────────────────────────────────────────────────────────┐
│ ➕ Crear Nuevo Empleado                                     │
├─────────────────────────────────────────────────────────────┤
│ Nombre completo: [________________]                         │
│ Email:          [________________]                         │
│ Código:         [EMP___] (auto-generado)                  │
│ Estado:         [✅ Activo] [❌ Inactivo]                   │
│                                                             │
│ [Cancelar]                              [Crear Empleado]   │
└─────────────────────────────────────────────────────────────┘
```

#### **Proceso de Creación**
1. **Rellenar formulario** con datos básicos
2. **Código auto-generado** (EMP001, EMP002...)
3. **Google Authenticator** se configura automáticamente
4. **QR code generado** para escanear
5. **Empleado creado** y listo para fichar

### 📱 **Gestión de QR Codes**

#### **Generar QR Code**
1. **Clic en icono QR** (📱) del empleado
2. **Modal se abre** con QR code
3. **Empleado escanea** con Google Authenticator
4. **Códigos TOTP** generados cada 30 segundos

#### **Regenerar QR Code**
- **Si empleado pierde acceso** a Google Authenticator
- **Clic en "Regenerar"** → Nuevo QR code
- **Empleado debe escanear** el nuevo código

### ✏️ **Editar Empleado**

#### **Campos Editables**
- **Nombre completo**
- **Email**
- **Estado** (Activo/Inactivo)
- **Código** (solo admin)

#### **Acciones Disponibles**
- **Guardar cambios**
- **Regenerar TOTP**
- **Eliminar empleado** (con confirmación)

## 📋 Pestaña Registros

### 🎯 **Vista General**

#### **Header de Sección**
```
📋 Registros de Fichajes              [🔍 Filtrar] [📥 Exportar]
```

### 📊 **Tabla de Registros**

#### **Columnas Completas**
| Empleado | Tipo | Fecha y Hora | Duración | Notas |
|----------|------|--------------|----------|-------|
| Juan Pérez (EMP001) | 🟢 Entrada | 27/10/2025 09:15:32 | - | Llegada puntual |
| Juan Pérez (EMP001) | 🔴 Salida | 27/10/2025 17:30:45 | 8h 15m | Día completo |

#### **Información Detallada**
- **Empleado**: Nombre y código
- **Tipo**: Entrada (🟢) o Salida (🔴)
- **Timestamp**: Fecha y hora exacta
- **Duración**: Tiempo trabajado (solo en salidas)
- **Notas**: Comentarios del empleado

### 🔍 **Sistema de Filtros**

#### **Filtros Disponibles**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Filtros Avanzados                                       │
├─────────────────────────────────────────────────────────────┤
│ Empleado:    [Todos ▼]                                     │
│ Fecha desde: [27/10/2025]                                  │
│ Fecha hasta: [27/10/2025]                                  │
│ Tipo:        [Todos ▼] [Entrada] [Salida]                  │
│                                                             │
│ [Limpiar]                                    [Aplicar]     │
└─────────────────────────────────────────────────────────────┘
```

#### **Opciones de Filtrado**
- **Por empleado**: Dropdown con todos los empleados
- **Por rango de fechas**: Desde/hasta
- **Por tipo**: Entradas, salidas o ambos
- **Búsqueda de texto**: En notas y nombres

### 📥 **Exportación de Datos**

#### **Formatos Disponibles**
- **CSV**: Para Excel y hojas de cálculo
- **PDF**: Reporte formateado
- **JSON**: Para integraciones técnicas

#### **Datos Exportados**
```csv
Empleado,Código,Tipo,Fecha,Hora,Duración,Notas
Juan Pérez,EMP001,Entrada,27/10/2025,09:15:32,-,Llegada puntual
Juan Pérez,EMP001,Salida,27/10/2025,17:30:45,8h 15m,Día completo
```

### 📊 **Analytics de Registros**

#### **Métricas Calculadas**
- **Horas totales** por empleado
- **Promedio de llegada** y salida
- **Días trabajados** en el período
- **Horas extra** detectadas

## ⚙️ Pestaña Configuración

### 🎯 **Configuración General**

#### **Datos de la Empresa**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ Configuración General                                    │
├─────────────────────────────────────────────────────────────┤
│ Nombre de la Empresa: [Jarana                    ]         │
│ Email de contacto:    [admin@jarana.com          ]         │
│ Teléfono:            [+34 xxx xxx xxx            ]         │
│                                                             │
│ Horario de Trabajo:                                         │
│ Entrada: [09:00] Salida: [17:00]                           │
│ Descanso: [13:00] a [14:00]                                │
└─────────────────────────────────────────────────────────────┘
```

### 🔒 **Configuración de Seguridad**

#### **Opciones de Autenticación**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔒 Configuración de Seguridad                              │
├─────────────────────────────────────────────────────────────┤
│ ✅ Requerir Google Authenticator                           │
│ ❌ Verificación de ubicación                               │
│ ✅ Logout automático (24h)                                │
│ ❌ Permitir fichajes fuera de horario                      │
│                                                             │
│ Tiempo de sesión: [24 horas ▼]                            │
│ Intentos de login: [3 intentos ▼]                         │
└─────────────────────────────────────────────────────────────┘
```

### 📱 **Configuración del Kiosk**

#### **Opciones de Interfaz**
```
┌─────────────────────────────────────────────────────────────┐
│ 📱 Configuración del Kiosk                                 │
├─────────────────────────────────────────────────────────────┤
│ ✅ Mostrar reloj en tiempo real                            │
│ ✅ Feedback sonoro en fichajes                             │
│ ✅ Auto-limpieza después de fichar                         │
│ ❌ Permitir notas en fichajes                              │
│                                                             │
│ Tiempo de auto-limpieza: [3 segundos ▼]                   │
│ Tamaño de fuente: [Grande ▼]                              │
└─────────────────────────────────────────────────────────────┘
```

### 💾 **Guardar Configuración**

#### **Botón de Guardado**
```
[Guardar Cambios]
```

#### **Confirmación**
- **Mensaje de éxito**: "Configuración guardada correctamente"
- **Aplicación inmediata**: Cambios activos al instante
- **Persistencia**: Guardado en base de datos

## 🔧 Funcionalidades Avanzadas

### 🔄 **Control del Sistema**

#### **Desactivar Sistema**
1. **Botón rojo** en header: "Desactivar Sistema"
2. **Confirmación**: "¿Estás seguro? Los empleados no podrán fichar"
3. **Desactivación**: Kiosk se bloquea inmediatamente
4. **Notificación**: Sistema desactivado hasta mañana

#### **Información de Sesión**
- **Duración activa**: Tiempo desde activación
- **Supervisor actual**: Nombre del usuario logueado
- **Empleados activos**: Cuántos han fichado hoy

### 📊 **Reportes Automáticos**

#### **Reporte Diario**
- **Generación automática** al final del día
- **Resumen de fichajes** del día
- **Horas trabajadas** por empleado
- **Incidencias** detectadas

#### **Reporte Semanal**
- **Resumen de la semana**
- **Comparativa** con semana anterior
- **Tendencias** de asistencia
- **Recomendaciones** automáticas

## 🚨 Troubleshooting

### **Problema: No puedo acceder al dashboard**

#### **Verificaciones**
1. **¿Estás logueado con Clerk?**
   - Verificar en esquina superior derecha
   - Si no, hacer login de nuevo

2. **¿El sistema está activo?**
   - Verificar en página principal
   - Si no, activar sistema primero

3. **¿Tienes permisos?**
   - Solo supervisores pueden acceder
   - Verificar rol en Clerk

### **Problema: Los datos no se actualizan**

#### **Soluciones**
1. **Refrescar página** (F5)
2. **Limpiar cache** del navegador
3. **Verificar conexión** a internet
4. **Comprobar backend** está funcionando

### **Problema: No puedo crear empleados**

#### **Verificaciones**
1. **Campos obligatorios** completados
2. **Email único** (no duplicado)
3. **Código único** (auto-generado)
4. **Conexión a base de datos** activa

### **Problema: QR codes no funcionan**

#### **Soluciones**
1. **Regenerar QR code** desde dashboard
2. **Verificar Google Authenticator** instalado
3. **Sincronizar tiempo** del dispositivo
4. **Probar con otro empleado**

## 📚 Consejos de Uso

### 💡 **Mejores Prácticas**

#### **Gestión Diaria**
1. **Activar sistema** al llegar por la mañana
2. **Revisar actividad** durante el día
3. **Exportar datos** al final del día
4. **Desactivar sistema** al irse

#### **Gestión de Empleados**
1. **Crear empleados** antes de que empiecen
2. **Generar QR codes** y entregarlos
3. **Probar fichajes** antes del primer día
4. **Mantener datos actualizados**

#### **Análisis de Datos**
1. **Revisar reportes** semanalmente
2. **Identificar patrones** de asistencia
3. **Detectar incidencias** temprano
4. **Tomar decisiones** basadas en datos

### 🎯 **Atajos de Teclado**

- **Ctrl + 1**: Ir a Dashboard
- **Ctrl + 2**: Ir a Empleados
- **Ctrl + 3**: Ir a Registros
- **Ctrl + 4**: Ir a Configuración
- **Ctrl + N**: Nuevo empleado
- **Ctrl + E**: Exportar datos

---

**¿Necesitas más ayuda?** Consulta la documentación de autenticación o contacta con soporte técnico.
