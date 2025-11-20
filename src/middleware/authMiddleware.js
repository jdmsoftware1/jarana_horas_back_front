import jwt from 'jsonwebtoken';
import { Employee } from '../models/index.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // 🔧 MODO DESARROLLO: Permitir requests sin token
    if (!token) {
      // Solo en desarrollo, crear un empleado mock
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 DEV MODE: Request sin token - Usando empleado mock');
        
        // Buscar el primer empleado admin en la BD para usar datos reales
        const mockEmployee = await Employee.findOne({ 
          where: { role: 'admin', isActive: true } 
        });
        
        if (mockEmployee) {
          req.employee = mockEmployee;
          return next();
        }
        
        // Si no hay empleados, crear uno temporal (solo para estructura)
        req.employee = {
          id: 'dev-mock-id',
          name: 'Usuario Dev',
          email: 'dev@test.com',
          role: 'admin',
          employeeCode: 'DEV001',
          isActive: true
        };
        return next();
      }
      
      // En producción, rechazar
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Autenticación normal con token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const employee = await Employee.findByPk(decoded.employeeId);
    if (!employee || !employee.isActive) {
      return res.status(401).json({ error: 'Invalid token or inactive employee.' });
    }

    req.employee = employee;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Server error during authentication.' });
  }
};

export const adminMiddleware = (req, res, next) => {
  // 🔧 MODO DESARROLLO: Permitir acceso admin
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 DEV MODE: Permitiendo acceso admin');
    // Asegurar que el empleado tenga rol admin en dev
    if (req.employee && req.employee.role !== 'admin') {
      req.employee.role = 'admin';
    }
    return next();
  }
  
  // En producción, verificar rol estrictamente
  if (req.employee.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};
