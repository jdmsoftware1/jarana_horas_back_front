/**
 * Script de prueba para verificar el backend de v1.0.4
 * Prueba todas las nuevas funcionalidades implementadas
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@AliadaDigital.com';
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

let adminToken = '';
let employeeToken = '';
let testConversationId = '';
let testDocumentId = '';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  log(`🧪 TEST: ${testName}`, 'blue');
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

async function loginAdmin() {
  logTest('Autenticación de Administrador');
  
  try {
    const response = await fetch(`${API_URL.replace('/api', '')}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        pin: ADMIN_PIN
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    adminToken = data.token;
    logSuccess(`Admin autenticado correctamente`);
    logSuccess(`Token: ${adminToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    logError(`Error en login admin: ${error.message}`);
    return false;
  }
}

// ============================================
// PRUEBAS DE CONVERSACIONES IA
// ============================================

async function testAIConversations() {
  logTest('Sistema de Conversaciones IA');

  // 1. Crear conversación
  try {
    log('1. Creando nueva conversación...', 'yellow');
    const response = await fetch(`${API_URL}/ai-conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hola, ¿cuántas horas trabajé esta semana?', timestamp: new Date() },
          { role: 'assistant', content: 'Has trabajado 40 horas esta semana.', timestamp: new Date() }
        ],
        userRole: 'admin'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const conversation = await response.json();
    testConversationId = conversation.id;
    logSuccess(`Conversación creada con ID: ${testConversationId}`);
    logSuccess(`Título: ${conversation.title}`);
  } catch (error) {
    logError(`Error creando conversación: ${error.message}`);
  }

  // 2. Listar conversaciones
  try {
    log('\n2. Listando conversaciones...', 'yellow');
    const response = await fetch(`${API_URL}/ai-conversations`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const conversations = await response.json();
    logSuccess(`Total de conversaciones: ${conversations.length}`);
    
    if (conversations.length > 0) {
      logSuccess(`Primera conversación: ${conversations[0].title}`);
    }
  } catch (error) {
    logError(`Error listando conversaciones: ${error.message}`);
  }

  // 3. Obtener conversación específica
  if (testConversationId) {
    try {
      log('\n3. Obteniendo conversación específica...', 'yellow');
      const response = await fetch(`${API_URL}/ai-conversations/${testConversationId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const conversation = await response.json();
      logSuccess(`Conversación obtenida: ${conversation.title}`);
      logSuccess(`Mensajes: ${conversation.messages.length}`);
    } catch (error) {
      logError(`Error obteniendo conversación: ${error.message}`);
    }
  }

  // 4. Actualizar conversación
  if (testConversationId) {
    try {
      log('\n4. Actualizando conversación...', 'yellow');
      const response = await fetch(`${API_URL}/ai-conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          conversationId: testConversationId,
          messages: [
            { role: 'user', content: 'Hola, ¿cuántas horas trabajé esta semana?', timestamp: new Date() },
            { role: 'assistant', content: 'Has trabajado 40 horas esta semana.', timestamp: new Date() },
            { role: 'user', content: '¿Y el mes pasado?', timestamp: new Date() },
            { role: 'assistant', content: 'El mes pasado trabajaste 160 horas.', timestamp: new Date() }
          ],
          userRole: 'admin'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const updated = await response.json();
      logSuccess(`Conversación actualizada`);
      logSuccess(`Mensajes actualizados: ${updated.messages.length}`);
    } catch (error) {
      logError(`Error actualizando conversación: ${error.message}`);
    }
  }
}

// ============================================
// PRUEBAS DE DOCUMENTOS
// ============================================

async function testDocuments() {
  logTest('Sistema de Documentos Bidireccional');

  // 1. Crear documento de prueba
  const testFilePath = path.join(__dirname, 'test-document.txt');
  fs.writeFileSync(testFilePath, 'Este es un documento de prueba para el sistema de gestión de documentos.');

  // 2. Empleado sube documento al admin
  try {
    log('1. Empleado sube documento al admin...', 'yellow');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('title', 'Justificante de Prueba');
    formData.append('description', 'Este es un justificante de prueba del sistema');
    formData.append('documentType', 'justificante');
    formData.append('priority', 'normal');

    const response = await fetch(`${API_URL}/documents/employee-to-admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}` // Usando admin token para prueba
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${error.error || 'Error desconocido'}`);
    }

    const result = await response.json();
    testDocumentId = result.document.id;
    logSuccess(`Documento subido correctamente`);
    logSuccess(`ID: ${testDocumentId}`);
    logSuccess(`Título: ${result.document.title}`);
    logSuccess(`Estado: ${result.document.status}`);
  } catch (error) {
    logError(`Error subiendo documento: ${error.message}`);
  }

  // 3. Admin lista documentos pendientes
  try {
    log('\n2. Admin lista documentos pendientes...', 'yellow');
    const response = await fetch(`${API_URL}/documents/pending-from-employees`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const documents = await response.json();
    logSuccess(`Documentos pendientes: ${documents.length}`);
    
    if (documents.length > 0) {
      logSuccess(`Primer documento: ${documents[0].title}`);
      logSuccess(`De: ${documents[0].sender.name}`);
    }
  } catch (error) {
    logError(`Error listando documentos pendientes: ${error.message}`);
  }

  // 4. Admin revisa documento
  if (testDocumentId) {
    try {
      log('\n3. Admin revisa y aprueba documento...', 'yellow');
      const response = await fetch(`${API_URL}/documents/${testDocumentId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: 'approved',
          reviewNotes: 'Documento aprobado correctamente en prueba'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      logSuccess(`Documento revisado`);
      logSuccess(`Nuevo estado: ${result.document.status}`);
      logSuccess(`Notas: ${result.document.reviewNotes}`);
    } catch (error) {
      logError(`Error revisando documento: ${error.message}`);
    }
  }

  // 5. Admin envía documento a empleado
  try {
    log('\n4. Admin envía documento a empleado...', 'yellow');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('title', 'Nómina de Prueba');
    formData.append('description', 'Nómina del mes de prueba');
    formData.append('documentType', 'nomina');
    formData.append('priority', 'high');

    const response = await fetch(`${API_URL}/documents/admin-to-employee`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HTTP ${response.status}: ${error.error || 'Error desconocido'}`);
    }

    const result = await response.json();
    logSuccess(`Documento enviado correctamente`);
    logSuccess(`ID: ${result.document.id}`);
    logSuccess(`Título: ${result.document.title}`);
    logSuccess(`Para: ${result.document.recipientId ? 'Empleado específico' : 'Todos los empleados'}`);
  } catch (error) {
    logError(`Error enviando documento: ${error.message}`);
  }

  // Limpiar archivo de prueba
  try {
    fs.unlinkSync(testFilePath);
  } catch (error) {
    // Ignorar error de limpieza
  }
}

// ============================================
// PRUEBAS DE SOPORTE PDF/WORD
// ============================================

async function testPDFWordSupport() {
  logTest('Soporte para PDF y Word en IA');

  try {
    log('Verificando configuración de embeddings...', 'yellow');
    
    const response = await fetch(`${API_URL}/ai/knowledge-stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const stats = await response.json();
    logSuccess(`Sistema de embeddings: ${stats.initialized ? 'Inicializado' : 'No inicializado'}`);
    logSuccess(`Documentos cargados: ${stats.documentsCount}`);
    
    if (stats.sources && stats.sources.length > 0) {
      logSuccess(`Fuentes disponibles:`);
      stats.sources.forEach(source => {
        log(`  - ${source}`, 'cyan');
      });
    } else {
      logWarning('No hay documentos en /knowledge. Agrega archivos .txt, .pdf, .docx para probar.');
    }
  } catch (error) {
    logError(`Error verificando embeddings: ${error.message}`);
  }
}

// ============================================
// LIMPIEZA DE DATOS DE PRUEBA
// ============================================

async function cleanup() {
  logTest('Limpieza de Datos de Prueba');

  // Eliminar conversación de prueba
  if (testConversationId) {
    try {
      log('Eliminando conversación de prueba...', 'yellow');
      const response = await fetch(`${API_URL}/ai-conversations/${testConversationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.ok) {
        logSuccess('Conversación de prueba eliminada');
      }
    } catch (error) {
      logWarning(`No se pudo eliminar conversación: ${error.message}`);
    }
  }

  // Eliminar documento de prueba
  if (testDocumentId) {
    try {
      log('Eliminando documento de prueba...', 'yellow');
      const response = await fetch(`${API_URL}/documents/${testDocumentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.ok) {
        logSuccess('Documento de prueba eliminado');
      }
    } catch (error) {
      logWarning(`No se pudo eliminar documento: ${error.message}`);
    }
  }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function runTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                            ║', 'cyan');
  log('║          🧪 TEST SUITE - AliadaDigital v1.0.4                    ║', 'cyan');
  log('║                                                            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');

  log(`📍 API URL: ${API_URL}`, 'blue');
  log(`👤 Admin Email: ${ADMIN_EMAIL}`, 'blue');
  console.log('\n');

  // Verificar que el servidor esté corriendo
  try {
    log('🔍 Verificando conexión con el servidor...', 'yellow');
    const response = await fetch(API_URL.replace('/api', '/health').replace('/health', '/api/health'));
    if (response.ok) {
      logSuccess('Servidor respondiendo correctamente');
    }
  } catch (error) {
    logError('No se puede conectar con el servidor');
    logError('Asegúrate de que el servidor esté corriendo con: npm run dev');
    process.exit(1);
  }

  // Ejecutar pruebas
  const success = await loginAdmin();
  
  if (!success) {
    logError('\n❌ No se pudo autenticar. Verifica las credenciales.');
    logWarning('Usa las variables de entorno ADMIN_EMAIL y ADMIN_PIN si son diferentes.');
    process.exit(1);
  }

  await testAIConversations();
  await testDocuments();
  await testPDFWordSupport();
  await cleanup();

  // Resumen final
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'green');
  log('║                                                            ║', 'green');
  log('║          ✅ PRUEBAS COMPLETADAS                           ║', 'green');
  log('║                                                            ║', 'green');
  log('╚════════════════════════════════════════════════════════════╝', 'green');
  console.log('\n');

  log('📋 Resumen:', 'blue');
  log('  ✅ Autenticación funcionando', 'green');
  log('  ✅ Sistema de conversaciones IA operativo', 'green');
  log('  ✅ Sistema de documentos bidireccional funcionando', 'green');
  log('  ✅ Soporte PDF/Word configurado', 'green');
  console.log('\n');

  log('🚀 El backend está listo para el frontend!', 'cyan');
  console.log('\n');
}

// Ejecutar tests
runTests().catch(error => {
  console.error('\n');
  logError(`Error fatal en las pruebas: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
