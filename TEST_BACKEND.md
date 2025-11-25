# 🧪 Guía de Pruebas del Backend v1.0.4

## 📋 Descripción

Este documento explica cómo ejecutar las pruebas automáticas del backend para verificar que todas las nuevas funcionalidades de la v1.0.4 están funcionando correctamente.

## 🚀 Preparación

### 1. Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias, incluyendo:
- `node-fetch` - Para hacer peticiones HTTP
- `form-data` - Para subir archivos
- `pdf-parse` - Para procesar PDFs
- `mammoth` - Para procesar archivos Word

### 2. Iniciar el Servidor

En una terminal, ejecuta:

```bash
npm run dev
```

Espera a que veas el mensaje:
```
✅ Sistema de embeddings inicializado correctamente
🚀 Server running on port 3000
```

### 3. Verificar Base de Datos

Asegúrate de que la base de datos esté sincronizada:

```bash
npm run db:sync
```

## 🧪 Ejecutar las Pruebas

En una **nueva terminal** (manteniendo el servidor corriendo), ejecuta:

```bash
npm run test-backend
```

### Configuración Personalizada

Si tus credenciales de admin son diferentes, puedes usar variables de entorno:

**Windows (PowerShell):**
```powershell
$env:ADMIN_EMAIL="tu-email@ejemplo.com"; $env:ADMIN_PIN="tu-pin"; npm run test-backend
```

**Linux/Mac:**
```bash
ADMIN_EMAIL="tu-email@ejemplo.com" ADMIN_PIN="tu-pin" npm run test-backend
```

## ✅ Qué Prueba el Script

El script de pruebas verifica:

### 1. **Autenticación**
- ✅ Login de administrador
- ✅ Obtención de token JWT

### 2. **Sistema de Conversaciones IA**
- ✅ Crear nueva conversación
- ✅ Listar todas las conversaciones
- ✅ Obtener conversación específica
- ✅ Actualizar conversación existente
- ✅ Eliminar conversación

### 3. **Sistema de Documentos Bidireccional**
- ✅ Empleado sube documento al admin
- ✅ Admin lista documentos pendientes
- ✅ Admin revisa y aprueba documento
- ✅ Admin envía documento a empleado
- ✅ Verificación de permisos

### 4. **Soporte PDF/Word**
- ✅ Verificar sistema de embeddings
- ✅ Listar documentos cargados
- ✅ Verificar fuentes disponibles

### 5. **Limpieza**
- ✅ Eliminar datos de prueba
- ✅ Limpiar archivos temporales

## 📊 Salida Esperada

Si todo funciona correctamente, verás:

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          🧪 TEST SUITE - JARANA v1.0.4                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

📍 API URL: http://localhost:3000/api
👤 Admin Email: admin@jarana.com

🔍 Verificando conexión con el servidor...
✅ Servidor respondiendo correctamente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST: Autenticación de Administrador
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Admin autenticado correctamente
✅ Token: eyJhbGciOiJIUzI1NiIs...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST: Sistema de Conversaciones IA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Creando nueva conversación...
✅ Conversación creada con ID: abc-123-def
✅ Título: Hola, ¿cuántas horas trabajé...

2. Listando conversaciones...
✅ Total de conversaciones: 1
✅ Primera conversación: Hola, ¿cuántas horas trabajé...

[... más pruebas ...]

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          ✅ PRUEBAS COMPLETADAS                           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

📋 Resumen:
  ✅ Autenticación funcionando
  ✅ Sistema de conversaciones IA operativo
  ✅ Sistema de documentos bidireccional funcionando
  ✅ Soporte PDF/Word configurado

🚀 El backend está listo para el frontend!
```

## ❌ Solución de Problemas

### Error: "No se puede conectar con el servidor"

**Solución:** Asegúrate de que el servidor esté corriendo con `npm run dev`

### Error: "No se pudo autenticar"

**Solución:** Verifica que las credenciales sean correctas:
- Email por defecto: `admin@jarana.com`
- PIN por defecto: `1234`

O usa variables de entorno para especificar otras credenciales.

### Error: "HTTP 500" en alguna prueba

**Solución:** 
1. Revisa los logs del servidor para ver el error específico
2. Verifica que la base de datos esté sincronizada: `npm run db:sync`
3. Asegúrate de que todas las dependencias estén instaladas: `npm install`

### Advertencia: "No hay documentos en /knowledge"

**Esto es normal** si no has agregado documentos para la IA. Para probar el soporte PDF/Word:

1. Crea una carpeta `knowledge` en la raíz del proyecto
2. Agrega archivos `.txt`, `.pdf` o `.docx`
3. Reinicia el servidor

## 📝 Notas Adicionales

- Las pruebas crean datos temporales que se eliminan automáticamente al final
- El script crea un archivo `test-document.txt` que se elimina después de las pruebas
- Los documentos subidos durante las pruebas se guardan en `uploads/documents/`
- Las conversaciones de prueba se eliminan de la base de datos al finalizar

## 🎯 Siguiente Paso

Una vez que todas las pruebas pasen correctamente, puedes proceder a implementar el frontend para el sistema de documentos.

---

**Desarrollado con ❤️ para JARANA**
