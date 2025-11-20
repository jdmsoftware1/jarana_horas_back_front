import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize, { testConnection } from './config/database.js';
import config from './config/env.js';
import passport from './config/passport.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import recordRoutes from './routes/records.js';
import adminRoutes from './routes/admin.js';
import kioskRoutes from './routes/kiosk.js';
import scheduleRoutes from './routes/schedules.js';
import scheduleTemplateRoutes from './routes/scheduleTemplates.js';
import weeklyScheduleRoutes from './routes/weeklySchedules.js';
import dailyExceptionRoutes from './routes/dailyExceptions.js';
import advancedSchedulingRoutes from './routes/advancedScheduling.js';
import scheduleBreakRoutes from './routes/scheduleBreaks.js';
import advancedBreakRoutes from './routes/advancedBreaks.js';
import vacationRoutes from './routes/vacations.js';
import absenceCategoryRoutes from './routes/absenceCategories.js';
import aiRoutes from './routes/ai.js';
import embeddingService from './services/embeddingService.js';

const app = express();
const PORT = config.server.port;

// Apply CORS FIRST (from centralized config)
app.use(cors(config.cors));

// Session configuration (required for Passport)
app.use(session(config.auth.session));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Helmet with CSP for serving frontend
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com"]
    }
  }
}));

// Rate limiting (from centralized config)
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints (solo para login con PIN/TOTP)
const authLimiter = rateLimit({
  windowMs: config.rateLimit.login.windowMs,
  max: config.rateLimit.login.max,
  message: 'Demasiados intentos de login, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', authLimiter);
// Google OAuth no necesita rate limiting (Google ya lo maneja)

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes); // Google OAuth routes (sin /api)
app.use('/api/auth', authRoutes); // JWT auth routes
app.use('/api/employees', employeeRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/schedule-templates', scheduleTemplateRoutes);
app.use('/api/weekly-schedules', weeklyScheduleRoutes);
app.use('/api/daily-exceptions', dailyExceptionRoutes);
app.use('/api/advanced-scheduling', advancedSchedulingRoutes);
app.use('/api/schedule-breaks', scheduleBreakRoutes);
app.use('/api/advanced-breaks', advancedBreakRoutes);
app.use('/api/vacations', vacationRoutes);
app.use('/api/absence-categories', absenceCategoryRoutes);
app.use('/api/ai', aiRoutes);

// Serve static files from React build (PRODUCTION)
if (config.server.env === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  
  // All non-API routes serve React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'Route not found' });
    }
  });
} else {
  // Development: 404 for API routes only
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });
}

// Error handling middleware
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    // Import models to ensure associations are loaded
    await import('./models/index.js');
    
    // Sync database models
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');
    
    // Initialize embedding service (loads documents from /knowledge)
    await embeddingService.initialize();
    
    // Listen on all network interfaces (0.0.0.0) to allow mobile app connections
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
      console.log(`🚀 ${config.company.name} - Sistema de Registro Horario`);
      console.log('='.repeat(60));
      console.log(`📊 Entorno: ${config.server.env}`);
      console.log(`🌐 Servidor Local: http://localhost:${PORT}`);
      console.log(`📱 Servidor Red: http://192.168.31.164:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`🔐 Google OAuth: ${config.features.googleAuth ? '✅ Habilitado' : '❌ Deshabilitado'}`);
      console.log(`🤖 AI Chat: ${config.features.aiChat ? '✅ Habilitado' : '❌ Deshabilitado'}`);
      console.log(`📝 Access Logs: ${config.features.accessLogs ? '✅ Habilitado' : '❌ Deshabilitado'}`);
      console.log('='.repeat(60) + '\n');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
