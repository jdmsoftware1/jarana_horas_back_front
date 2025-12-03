/**
 * Configuración centralizada de variables de entorno
 * Todas las configuraciones de la aplicación se gestionan aquí
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validar que las variables requeridas existan
 */
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SESSION_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Variables de entorno faltantes:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

// Validar longitud de secretos
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  JWT_SECRET debería tener al menos 32 caracteres');
}

if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
  console.warn('⚠️  SESSION_SECRET debería tener al menos 32 caracteres');
}

/**
 * Configuración de la empresa (Multi-tenant)
 */
export const companyConfig = {
  name: process.env.COMPANY_NAME || 'AliadaDigital',
  logoUrl: process.env.COMPANY_LOGO_URL || '/assets/logo.png',
  colors: {
    primary: process.env.PRIMARY_COLOR || '#8B7355',
    secondary: process.env.SECONDARY_COLOR || '#D4C4B0',
    accent: process.env.ACCENT_COLOR || '#4D5B36'
  }
};

/**
 * Configuración de base de datos
 */
export const databaseConfig = {
  url: process.env.DATABASE_URL || process.env.DEMO_DATABASE_URL,
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

/**
 * Configuración de autenticación
 */
export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  session: {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
  },
  authorizedEmails: process.env.AUTHORIZED_EMAILS 
    ? process.env.AUTHORIZED_EMAILS.split(',').map(email => email.trim())
    : [],
  authorizedDomain: process.env.AUTHORIZED_DOMAIN || null
};

/**
 * Configuración de OpenAI
 */
export const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  enabled: process.env.ENABLE_AI_CHAT === 'true'
};

/**
 * Configuración del servidor
 */
export const serverConfig = {
  port: parseInt(process.env.PORT) || 3000,
  env: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
};

/**
 * Configuración de CORS
 */
export const corsConfig = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:5173'
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

/**
 * Configuración de rate limiting
 */
export const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  login: {
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10
  }
};

/**
 * Configuración de logging
 */
export const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  sentryDsn: process.env.SENTRY_DSN || null
};

/**
 * Features flags
 */
export const features = {
  aiChat: process.env.ENABLE_AI_CHAT !== 'false',
  twoFactor: process.env.ENABLE_2FA !== 'false',
  googleAuth: process.env.ENABLE_GOOGLE_AUTH !== 'false',
  accessLogs: process.env.ENABLE_ACCESS_LOGS !== 'false'
};

/**
 * Exportar toda la configuración
 */
export default {
  company: companyConfig,
  database: databaseConfig,
  auth: authConfig,
  openai: openaiConfig,
  server: serverConfig,
  cors: corsConfig,
  rateLimit: rateLimitConfig,
  log: logConfig,
  features
};

/**
 * Mostrar configuración al iniciar (solo en desarrollo)
 */
if (process.env.NODE_ENV === 'development') {
  console.log('\n📋 Configuración cargada:');
  console.log(`   Empresa: ${companyConfig.name}`);
  console.log(`   Puerto: ${serverConfig.port}`);
  console.log(`   Entorno: ${serverConfig.env}`);
  console.log(`   Base de datos: ${databaseConfig.url ? '✅ Configurada' : '❌ No configurada'}`);
  console.log(`   Google OAuth: ${authConfig.google.clientID ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   OpenAI: ${openaiConfig.apiKey ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   Features:`);
  console.log(`      - AI Chat: ${features.aiChat ? '✅' : '❌'}`);
  console.log(`      - 2FA: ${features.twoFactor ? '✅' : '❌'}`);
  console.log(`      - Google Auth: ${features.googleAuth ? '✅' : '❌'}`);
  console.log(`      - Access Logs: ${features.accessLogs ? '✅' : '❌'}`);
  console.log('');
}
