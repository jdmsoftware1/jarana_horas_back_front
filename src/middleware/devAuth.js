/**
 * Middleware de autenticación para desarrollo
 * Solo activo cuando NODE_ENV=development
 * Permite saltear autenticación para pruebas
 */

const devAuthMiddleware = (req, res, next) => {
  // Solo activo en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return next();
  }

  // Si ya tiene autenticación válida, continuar normalmente
  if (req.user || req.headers.authorization) {
    return next();
  }

  // En desarrollo, crear un usuario mock si no hay autenticación
  console.log('🔧 DEV MODE: Usando usuario mock para desarrollo');
  
  req.user = {
    employeeId: 'dev-user-123',
    role: 'admin', // Cambiar a 'employee' si quieres probar como empleado
    email: 'dev@test.com',
    name: 'Usuario Dev',
    employeeCode: 'DEV001'
  };

  next();
};

module.exports = devAuthMiddleware;
