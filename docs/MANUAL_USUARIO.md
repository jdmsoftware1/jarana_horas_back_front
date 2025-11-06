# 📋 Manual de Usuario - Sistema de Registro Horario JARANA

## 🎯 Índice
1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Portal del Empleado](#portal-del-empleado)
4. [Dashboard Administrativo](#dashboard-administrativo)
5. [Asistente IA](#asistente-ia)
6. [Preguntas Frecuentes](#preguntas-frecuentes)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Introducción

**JARANA** es un sistema completo de gestión de registro horario que incluye:
- ✅ **Fichaje de entrada/salida** con autenticación TOTP
- 🏖️ **Gestión de vacaciones** con flujo de aprobación
- 📊 **Reportes y análisis** de productividad
- 🤖 **Asistente IA** para consultas y solicitudes
- 👥 **Portal del empleado** personalizado
- 🛠️ **Dashboard administrativo** completo

---

## 🔐 Acceso al Sistema

### Para Empleados

#### 1. **Página de Fichaje** (`/employee-kiosk`)
- **URL**: `http://localhost:5173/employee-kiosk`
- **Propósito**: Registrar entrada y salida diaria

**Pasos para fichar:**
1. Ingresa tu **código de empleado** (ej: `EMP001`)
2. Ingresa tu **código TOTP** de 6 dígitos (desde tu app autenticadora)
3. Haz clic en **"Autenticar"**
4. Selecciona **"Fichar Entrada"** o **"Fichar Salida"**
5. ✅ Verás un mensaje de confirmación por **5 segundos**

#### 2. **Portal del Empleado** (`/employee-portal`)
- **URL**: `http://localhost:5173/employee-portal`
- **Propósito**: Acceso completo a tu información personal

**Autenticación:**
1. Ingresa tu **código de empleado**
2. Ingresa tu **código TOTP**
3. Haz clic en **"Acceder al Portal"**

### Para Administradores

#### **Dashboard Administrativo** (`/admin`)
- **URL**: `http://localhost:5173/admin`
- **Propósito**: Gestión completa del sistema

---

## 👤 Portal del Empleado

### 🏠 **Dashboard Personal**
Al acceder verás:

#### **📊 Tarjetas de Estado**
- **Estado Hoy**: Si has fichado entrada/salida
- **Horas Semana**: Horas trabajadas esta semana
- **Horas Mes**: Horas trabajadas este mes
- **Vacaciones Pendientes**: Solicitudes sin aprobar

#### **⚡ Acciones Rápidas**
- **Fichar Entrada/Salida**: Acceso directo al kiosk
- **Solicitar Vacaciones**: Crear nueva solicitud
- **Chat con IA**: Consultas y solicitudes inteligentes

### 📋 **Mis Fichajes**
Visualiza todos tus registros de entrada y salida:

#### **🔍 Filtros Disponibles**
- **Todos los registros**: Historial completo
- **Hoy**: Solo registros de hoy
- **Esta semana**: Últimos 7 días
- **Este mes**: Mes actual

#### **📊 Información Mostrada**
- **Fecha y Hora**: Cuándo fichaste
- **Tipo**: Entrada (verde) o Salida (rojo)
- **Dispositivo**: Desde dónde fichaste
- **Notas**: Información adicional

#### **📄 Paginación**
- **10 registros por página**
- **Navegación**: Anterior/Siguiente
- **Contador**: "Mostrando X de Y registros"

### 🏖️ **Mis Vacaciones**

#### **📝 Crear Nueva Solicitud**
1. Haz clic en **"Nueva Solicitud"**
2. Completa el formulario:
   - **Fecha de Inicio**: Primer día de vacaciones
   - **Fecha de Fin**: Último día de vacaciones
   - **Tipo de Ausencia**: Vacaciones, baja médica, personal, etc.
   - **Motivo**: Descripción opcional
3. Haz clic en **"Enviar Solicitud"**

#### **📊 Estados de Solicitudes**
- 🟡 **Pendiente**: Esperando aprobación
- 🟢 **Aprobada**: Confirmada por supervisor
- 🔴 **Rechazada**: No aprobada

#### **📋 Información Mostrada**
- **Período**: Fechas de inicio y fin
- **Tipo**: Tipo de ausencia
- **Días**: Número de días solicitados
- **Estado**: Estado actual con colores
- **Motivo**: Razón de la solicitud

### 📈 **Reportes**

#### **📊 Tarjetas de Resumen**
- **Días Trabajados**: Días con fichajes completos
- **Horas Totales**: Suma de horas trabajadas
- **Llegadas Tarde**: Entradas después de 9:15 AM
- **Días de Vacaciones**: Días de vacaciones aprobados

#### **📈 Métricas de Rendimiento**
- **Promedio horas/día**: Horas promedio por día trabajado
- **Puntuación puntualidad**: Porcentaje de llegadas a tiempo
- **Salidas tempranas**: Salidas antes de 4:45 PM

#### **🎯 Recomendaciones Personalizadas**
El sistema analiza tus patrones y ofrece:
- **Consejos de puntualidad** si llegas tarde frecuentemente
- **Optimización de tiempo** si trabajas pocas horas
- **Felicitaciones** por buen rendimiento
- **Alertas** si faltan datos

#### **📅 Filtros de Período**
- **Última semana**: Últimos 7 días
- **Este mes**: Mes actual
- **Este año**: Año actual

---

## 🛠️ Dashboard Administrativo

### 🏠 **Panel Principal**

#### **🔧 Control del Sistema**
- **Estado del Sistema**: Activo/Inactivo
- **Activar/Desactivar**: Control global del fichaje
- **Estadísticas Generales**: Resumen del sistema

### 👥 **Gestión de Empleados**

#### **📋 Lista de Empleados**
Visualiza todos los empleados con:
- **Información Personal**: Nombre, email, código
- **Estado**: Activo/Inactivo
- **Último Fichaje**: Tipo, fecha y hora del último registro

#### **➕ Crear Nuevo Empleado**
1. Haz clic en **"Nuevo Empleado"**
2. Completa el formulario:
   - **Nombre Completo**: Nombre del empleado
   - **Email**: Correo electrónico
   - **Código de Empleado**: Identificador único
3. Haz clic en **"Crear Empleado"**
4. 📱 Se generará automáticamente el **código QR** para TOTP

#### **🔧 Acciones Disponibles**
- **Ver QR Code**: Mostrar código QR para configurar TOTP
- **Editar**: Modificar información del empleado
- **Regenerar TOTP**: Crear nuevo código QR

### 📊 **Registros**
Visualiza todos los fichajes del sistema:
- **Empleado**: Quién fichó
- **Tipo**: Entrada/Salida
- **Fecha y Hora**: Cuándo ocurrió
- **Dispositivo**: Desde dónde se fichó

### ⏰ **Horarios**
Gestiona los horarios de trabajo:
- **Configuración por empleado**
- **Días laborales**
- **Horarios de entrada/salida**
- **Descansos**

### 🏖️ **Vacaciones**

#### **📋 Lista de Solicitudes**
Visualiza todas las solicitudes con:
- **Empleado**: Quién solicita
- **Período**: Fechas solicitadas
- **Tipo**: Tipo de ausencia
- **Estado**: Pendiente/Aprobada/Rechazada
- **Días**: Número de días

#### **✅ Aprobar/Rechazar Solicitudes**
1. Localiza la solicitud pendiente
2. Haz clic en **"Aprobar"** o **"Rechazar"**
3. Añade **notas** si es necesario
4. Confirma la acción

---

## 🤖 Asistente IA

### 💬 **Acceso al Chat**
El asistente IA está disponible en:
- **Portal del Empleado**: Botón flotante en todas las secciones
- **Dashboard**: Acceso desde acciones rápidas

### 🎯 **Funcionalidades Principales**

#### **📊 Consultas de Datos**
Pregunta sobre:
- *"¿Cuántas horas trabajé esta semana?"*
- *"¿He llegado tarde este mes?"*
- *"¿He fichado entrada hoy?"*
- *"¿Cuál es mi horario de mañana?"*
- *"¿Cuántos días de vacaciones tengo pendientes?"*

#### **🏖️ Solicitudes de Vacaciones**
Crea solicitudes automáticamente:
- *"Quiero vacaciones del 15 al 20 de enero"*
- *"Necesito días libres del 1 al 5 de febrero"*
- *"Solicitar permiso del 10 al 15 de marzo por motivos familiares"*

#### **📈 Análisis de Rendimiento**
Obtén análisis detallados:
- *"¿Cómo está mi puntualidad?"*
- *"Análisis de mi productividad este mes"*
- *"¿Cuándo fue mi última llegada tarde?"*

### 🎨 **Tipos de Respuesta**

#### **📊 Respuestas con Datos**
- **Estadísticas numéricas** con contexto
- **Gráficos visuales** cuando aplique
- **Comparaciones** con períodos anteriores

#### **✅ Confirmaciones de Acciones**
- **Solicitudes creadas** con número de referencia
- **Estados actualizados** con detalles
- **Próximos pasos** recomendados

#### **💡 Recomendaciones**
- **Consejos personalizados** basados en tus datos
- **Alertas importantes** sobre tu rendimiento
- **Sugerencias de mejora** específicas

---

## ❓ Preguntas Frecuentes

### 🔐 **Autenticación**

**P: ¿Qué hago si no tengo el código TOTP?**
R: Contacta con tu administrador para que regenere tu código QR y configures nuevamente tu aplicación autenticadora.

**P: ¿Qué aplicaciones puedo usar para TOTP?**
R: Google Authenticator, Microsoft Authenticator, Authy, o cualquier app compatible con TOTP.

**P: ¿El código TOTP caduca?**
R: Sí, cada código es válido por 30 segundos. Usa el código actual mostrado en tu app.

### 📱 **Fichaje**

**P: ¿Puedo fichar desde mi móvil?**
R: Sí, el sistema es completamente responsive y funciona en cualquier dispositivo.

**P: ¿Qué pasa si olvido fichar salida?**
R: Contacta con tu supervisor para que corrija el registro manualmente.

**P: ¿Puedo fichar múltiples veces al día?**
R: Sí, puedes alternar entre entrada y salida según necesites.

### 🏖️ **Vacaciones**

**P: ¿Cuánto tiempo tarda en aprobarse una solicitud?**
R: Depende de tu supervisor, pero recibirás notificación cuando sea revisada.

**P: ¿Puedo cancelar una solicitud pendiente?**
R: Contacta con tu supervisor para cancelar solicitudes pendientes.

**P: ¿Puedo solicitar vacaciones para fechas pasadas?**
R: No, solo puedes solicitar vacaciones para fechas futuras.

### 🤖 **Asistente IA**

**P: ¿El IA tiene acceso a mis datos personales?**
R: Solo accede a tus datos de trabajo (fichajes, vacaciones, horarios) para ayudarte.

**P: ¿Puedo usar el IA para solicitar vacaciones?**
R: Sí, simplemente describe las fechas que necesitas y el IA creará la solicitud automáticamente.

**P: ¿El IA funciona sin conexión a internet?**
R: No, requiere conexión para procesar las consultas.

---

## 🔧 Solución de Problemas

### 🚨 **Problemas Comunes**

#### **No puedo autenticarme**
1. ✅ Verifica que tu código de empleado sea correcto
2. ✅ Asegúrate de usar el código TOTP actual (no expirado)
3. ✅ Verifica que tu cuenta esté activa
4. ✅ Contacta con el administrador si persiste

#### **No aparecen mis registros**
1. ✅ Verifica que hayas fichado correctamente
2. ✅ Revisa los filtros de fecha aplicados
3. ✅ Actualiza la página
4. ✅ Contacta con soporte técnico

#### **El IA no responde**
1. ✅ Verifica tu conexión a internet
2. ✅ Intenta reformular tu pregunta
3. ✅ Revisa que estés autenticado correctamente
4. ✅ Contacta con el administrador

#### **No puedo crear solicitudes de vacaciones**
1. ✅ Verifica que las fechas sean futuras
2. ✅ Asegúrate de completar todos los campos obligatorios
3. ✅ Verifica que no tengas solicitudes duplicadas
4. ✅ Contacta con tu supervisor

### 📞 **Contacto de Soporte**

Para problemas técnicos o dudas adicionales:
- **Email**: soporte@jarana.com
- **Teléfono**: +34 XXX XXX XXX
- **Horario**: Lunes a Viernes, 9:00 - 18:00

---

## 🎉 **¡Disfruta usando JARANA!**

Este sistema está diseñado para hacer tu gestión horaria más fácil y eficiente. Si tienes sugerencias de mejora, ¡nos encantaría escucharlas!

**Versión del Manual**: 1.0  
**Última Actualización**: Octubre 2024
