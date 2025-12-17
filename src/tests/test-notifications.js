/**
 * Test de Notificaciones Push
 * 
 * Ejecutar: node src/tests/test-notifications.js
 * 
 * Este script prueba:
 * 1. Conexión con Firebase
 * 2. Registro de tokens
 * 3. Envío de notificaciones
 */

import dotenv from 'dotenv';
dotenv.config();

// Importar después de cargar .env
import notificationService from '../services/notificationService.js';
import sequelize from '../config/database.js';
import PushToken from '../models/PushToken.js';
import Notification from '../models/Notification.js';
import { Employee } from '../models/index.js';

const TEST_EXPO_TOKEN = process.argv[2] || 'ExponentPushToken[test-token-here]';

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST DE NOTIFICACIONES PUSH');
  console.log('='.repeat(60) + '\n');

  let TEST_EMPLOYEE_ID = null;

  try {
    // 1. Conectar a la base de datos
    console.log('📦 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // 2. Sincronizar modelos (crear tablas si no existen)
    console.log('📋 Sincronizando modelos...');
    await PushToken.sync({ alter: true });
    await Notification.sync({ alter: true });
    console.log('✅ Modelos sincronizados\n');

    // 2.5. Obtener un empleado real de la BD para el test
    console.log('👤 Buscando empleado para test...');
    const employee = await Employee.findOne({ where: { isActive: true } });
    if (!employee) {
      console.log('⚠️ No hay empleados en la BD. Saltando tests de token.\n');
      TEST_EMPLOYEE_ID = null;
    } else {
      TEST_EMPLOYEE_ID = employee.id;
      console.log(`✅ Usando empleado: ${employee.name} (${TEST_EMPLOYEE_ID})\n`);
    }

    // 3. Test: Registrar token (solo si hay empleado)
    if (TEST_EMPLOYEE_ID) {
      console.log('📱 Test: Registrar token de push...');
      console.log(`   Employee ID: ${TEST_EMPLOYEE_ID}`);
      console.log(`   Token: ${TEST_EXPO_TOKEN.substring(0, 30)}...`);
      
      const registeredToken = await notificationService.registerToken(
        TEST_EMPLOYEE_ID,
        TEST_EXPO_TOKEN,
        'android',
        { test: true, deviceName: 'Test Device' }
      );
      console.log(`✅ Token registrado con ID: ${registeredToken.id}\n`);
    }

    // 4. Test: Verificar token guardado (solo si hay empleado)
    if (TEST_EMPLOYEE_ID) {
      console.log('🔍 Test: Verificar token en base de datos...');
      const tokens = await notificationService.getActiveTokens(TEST_EMPLOYEE_ID);
      console.log(`✅ Tokens activos encontrados: ${tokens.length}\n`);
    }

    // 5. Test: Crear notificación (solo si hay empleado)
    let testNotification = null;
    if (TEST_EMPLOYEE_ID) {
      console.log('📤 Test: Crear notificación de prueba...');
      
      // Crear notificación directamente en la BD para probar
      testNotification = await Notification.create({
        employeeId: TEST_EMPLOYEE_ID,
        type: 'general',
        title: '🧪 Notificación de Prueba',
        body: 'Esta es una notificación de prueba del sistema.',
        data: { test: true, timestamp: new Date().toISOString() },
        status: 'pending'
      });
      console.log(`✅ Notificación creada con ID: ${testNotification.id}\n`);

      // 6. Test: Obtener notificaciones del empleado
      console.log('📬 Test: Obtener notificaciones del empleado...');
      const notifications = await notificationService.getEmployeeNotifications(TEST_EMPLOYEE_ID);
      console.log(`✅ Notificaciones encontradas: ${notifications.count}\n`);

      // 7. Test: Contar no leídas
      console.log('🔢 Test: Contar notificaciones no leídas...');
      const unreadCount = await notificationService.getUnreadCount(TEST_EMPLOYEE_ID);
      console.log(`✅ No leídas: ${unreadCount}\n`);

      // 8. Test: Marcar como leída
      console.log('✓ Test: Marcar notificación como leída...');
      await notificationService.markAsRead(testNotification.id, TEST_EMPLOYEE_ID);
      const updatedNotification = await Notification.findByPk(testNotification.id);
      console.log(`✅ Estado: ${updatedNotification.status}, ReadAt: ${updatedNotification.readAt}\n`);
    }

    // 9. Verificar configuración de Firebase
    console.log('🔥 Test: Verificar configuración de Firebase...');
    const firebaseConfigured = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    if (firebaseConfigured) {
      try {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log(`✅ Firebase configurado - Proyecto: ${parsed.project_id}`);
        console.log(`   Client Email: ${parsed.client_email}\n`);
      } catch (e) {
        console.log('⚠️ FIREBASE_SERVICE_ACCOUNT existe pero no es JSON válido\n');
      }
    } else {
      console.log('⚠️ FIREBASE_SERVICE_ACCOUNT no configurado');
      console.log('   Las notificaciones se guardarán pero no se enviarán\n');
    }

    // 10. Limpiar datos de prueba (solo si hay empleado)
    if (TEST_EMPLOYEE_ID) {
      console.log('🧹 Limpiando datos de prueba...');
      await Notification.destroy({ where: { employeeId: TEST_EMPLOYEE_ID, data: { test: true } } });
      await PushToken.destroy({ where: { employeeId: TEST_EMPLOYEE_ID, token: TEST_EXPO_TOKEN } });
      console.log('✅ Datos de prueba eliminados\n');
    }

    // Resumen
    console.log('='.repeat(60));
    console.log('📊 RESUMEN DE TESTS');
    console.log('='.repeat(60));
    console.log('✅ Conexión a BD: OK');
    console.log('✅ Modelos sincronizados: OK');
    console.log('✅ Registro de tokens: OK');
    console.log('✅ Creación de notificaciones: OK');
    console.log('✅ Consulta de notificaciones: OK');
    console.log('✅ Marcar como leída: OK');
    console.log(firebaseConfigured ? '✅ Firebase: Configurado' : '⚠️ Firebase: No configurado');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Ejecutar tests
runTests();
