/**
 * Configuración de Passport.js con Google OAuth 2.0
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { authConfig } from './env.js';
import { Employee } from '../models/Employee.js';
import AccessLog from '../models/AccessLog.js';

/**
 * Verificar si un email está autorizado
 */
function isEmailAuthorized(email) {
  // Si hay emails específicos autorizados
  if (authConfig.authorizedEmails && authConfig.authorizedEmails.length > 0) {
    return authConfig.authorizedEmails.includes(email);
  }
  
  // Si hay un dominio autorizado
  if (authConfig.authorizedDomain) {
    return email.endsWith(authConfig.authorizedDomain);
  }
  
  // Si no hay restricciones, permitir todos
  return true;
}

/**
 * Configurar estrategia de Google OAuth
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: authConfig.google.clientID,
      clientSecret: authConfig.google.clientSecret,
      callbackURL: authConfig.google.callbackURL,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;
        const photo = profile.photos[0]?.value;
        
        // Verificar si el email está autorizado
        if (!isEmailAuthorized(email)) {
          // Registrar intento no autorizado
          await AccessLog.logAccess({
            email,
            accessType: 'unauthorized_attempt',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            success: false,
            failureReason: 'Email no autorizado',
            metadata: {
              googleId,
              name
            }
          });
          
          return done(null, false, { 
            message: 'Tu email no está autorizado para acceder a este sistema. Contacta al administrador.' 
          });
        }
        
        // Buscar empleado por email o googleId
        let employee = await Employee.findOne({
          where: {
            [Employee.sequelize.Sequelize.Op.or]: [
              { email },
              { googleId }
            ]
          }
        });
        
        if (employee) {
          // Actualizar información de Google si cambió
          if (!employee.googleId || employee.googleId !== googleId) {
            employee.googleId = googleId;
          }
          
          if (!employee.email || employee.email !== email) {
            employee.email = email;
          }
          
          if (photo && (!employee.profilePhoto || employee.profilePhoto !== photo)) {
            employee.profilePhoto = photo;
          }
          
          await employee.save();
          
          // Registrar acceso exitoso
          await AccessLog.logAccess({
            employeeId: employee.id,
            email,
            accessType: 'google_login',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            success: true,
            metadata: {
              googleId,
              name
            }
          });
          
          // Generar tokens JWT
          const jwtAccessToken = jwt.sign(
            { 
              employeeId: employee.id,
              role: employee.role,
              email: employee.email
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
          );
          
          const jwtRefreshToken = jwt.sign(
            { 
              employeeId: employee.id
            },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
          );
          
          return done(null, {
            employee,
            accessToken: jwtAccessToken,
            refreshToken: jwtRefreshToken
          });
        } else {
          // Si no existe el empleado, crear uno nuevo (solo si está autorizado)
          // NOTA: Puedes cambiar esto para que NO cree automáticamente
          // y requiera que un admin cree el empleado primero
          
          // Generar un employeeCode único
          const lastEmployee = await Employee.findOne({
            where: { 
              employeeCode: { [Op.like]: 'EMP%' }
            },
            order: [['employeeCode', 'DESC']]
          });
          
          let nextNumber = 1;
          if (lastEmployee && lastEmployee.employeeCode) {
            const lastNumber = parseInt(lastEmployee.employeeCode.replace('EMP', ''));
            if (!isNaN(lastNumber)) {
              nextNumber = lastNumber + 1;
            }
          }
          
          // Usar 2 dígitos si es menor a 100, 3 si es mayor
          const padding = nextNumber < 100 ? 2 : 3;
          const newCode = `EMP${String(nextNumber).padStart(padding, '0')}`;
          
          // Crear nuevo empleado con rol admin (Google OAuth solo para admins)
          employee = await Employee.create({
            employeeCode: newCode,
            name,
            email,
            googleId,
            profilePhoto: photo,
            role: 'admin', // Google OAuth solo para admins
            isActive: true,
            authMethod: 'google'
          });
          
          // Registrar acceso exitoso
          await AccessLog.logAccess({
            employeeId: employee.id,
            email,
            accessType: 'google_login',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            success: true,
            metadata: {
              googleId,
              name,
              newAccount: true
            }
          });
          
          // Generar tokens JWT
          const jwtAccessToken = jwt.sign(
            { 
              employeeId: employee.id,
              role: employee.role,
              email: employee.email
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
          );
          
          const jwtRefreshToken = jwt.sign(
            { 
              employeeId: employee.id
            },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
          );
          
          return done(null, {
            employee,
            accessToken: jwtAccessToken,
            refreshToken: jwtRefreshToken
          });
        }
      } catch (error) {
        console.error('Error en Google OAuth:', error);
        
        // Registrar error
        await AccessLog.logAccess({
          email: profile?.emails?.[0]?.value,
          accessType: 'google_login',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          success: false,
          failureReason: error.message,
          metadata: {
            error: error.stack
          }
        });
        
        return done(error);
      }
    }
  )
);

/**
 * Serializar usuario en la sesión
 */
passport.serializeUser((employee, done) => {
  done(null, employee.id);
});

/**
 * Deserializar usuario de la sesión
 */
passport.deserializeUser(async (id, done) => {
  try {
    const employee = await Employee.findByPk(id);
    done(null, employee);
  } catch (error) {
    done(error);
  }
});

export default passport;
