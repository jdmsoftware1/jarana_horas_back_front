import express from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import passport from 'passport';
import { Employee } from '../models/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Login with employee code and PIN
router.post('/login', async (req, res) => {
  try {
    const { employeeCode, pin } = req.body;

    if (!employeeCode || !pin) {
      return res.status(400).json({ error: 'Employee code and PIN are required' });
    }

    const employee = await Employee.findOne({ 
      where: { employeeCode, isActive: true } 
    });

    if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPin = await employee.validatePin(pin);
    if (!isValidPin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        employeeId: employee.id,
        role: employee.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        employeeCode: employee.employeeCode,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Login with TOTP (Google Authenticator)
router.post('/login/totp', async (req, res) => {
  try {
    const { employeeCode, totpCode } = req.body;

    if (!employeeCode || !totpCode) {
      return res.status(400).json({ error: 'Employee code and TOTP code are required' });
    }

    const employee = await Employee.findOne({ 
      where: { employeeCode, isActive: true } 
    });

    if (!employee || !employee.totpSecret) {
      return res.status(401).json({ error: 'Invalid credentials or TOTP not configured' });
    }

    const verified = speakeasy.totp.verify({
      secret: employee.totpSecret,
      encoding: 'base32',
      token: totpCode,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid TOTP code' });
    }

    const token = jwt.sign(
      { 
        employeeId: employee.id,
        role: employee.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        employeeCode: employee.employeeCode,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('TOTP login error:', error);
    res.status(500).json({ error: 'Server error during TOTP login' });
  }
});

// Verify token
router.get('/verify', authMiddleware, (req, res) => {
  res.json({
    valid: true,
    employee: {
      id: req.employee.id,
      name: req.employee.name,
      email: req.employee.email,
      employeeCode: req.employee.employeeCode,
      role: req.employee.role
    }
  });
});

// Refresh token
router.post('/refresh', authMiddleware, (req, res) => {
  const token = jwt.sign(
    { 
      employeeId: req.employee.id,
      role: req.employee.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token });
});

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

// Iniciar autenticación con Google
router.get('/google', (req, res, next) => {
  // Guardar si viene de móvil en el state (codificado en Base64 para preservarlo)
  const isMobile = req.query.mobile === 'true';
  const mobileRedirectUri = req.query.redirect_uri || null;
  
  const stateData = JSON.stringify({ 
    source: isMobile ? 'mobile' : 'web', 
    redirectUri: mobileRedirectUri,
    timestamp: Date.now() 
  });
  const state = Buffer.from(stateData).toString('base64');
  
  console.log('🔐 Iniciando OAuth - mobile:', isMobile, 'redirectUri:', mobileRedirectUri);
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false,
    state: state
  })(req, res, next);
});

// Callback de Google OAuth
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin-login?error=auth_failed`
  }),
  (req, res) => {
    try {
      // req.user viene de passport (configurado en config/passport.js)
      const { employee, accessToken, refreshToken } = req.user;
      
      // Decodificar el state de OAuth para saber si viene de móvil
      let isMobile = false;
      let mobileRedirectUri = null;
      const stateFromQuery = req.query.state;
      
      if (stateFromQuery) {
        try {
          const stateData = JSON.parse(Buffer.from(stateFromQuery, 'base64').toString('utf8'));
          isMobile = stateData.source === 'mobile';
          mobileRedirectUri = stateData.redirectUri;
          console.log('🔐 Callback OAuth - decoded state:', stateData, 'isMobile:', isMobile);
        } catch (e) {
          // Fallback: si el state es simplemente 'mobile' o 'web'
          isMobile = stateFromQuery === 'mobile';
          console.log('🔐 Callback OAuth - raw state:', stateFromQuery, 'isMobile:', isMobile);
        }
      }
      
      if (isMobile && mobileRedirectUri) {
        // Redirigir directamente a la URL de Expo que envió la app
        const redirectWithToken = `${mobileRedirectUri}?token=${accessToken}`;
        console.log('📱 Redirigiendo a app móvil:', redirectWithToken);
        res.redirect(redirectWithToken);
      } else if (isMobile) {
        // Fallback: página HTML con deep links
        const customSchemeLink = `registrohorario://auth/callback?token=${accessToken}`;
        console.log('📱 Enviando página de redirección móvil (fallback)');
        
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Abriendo app...</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                background: linear-gradient(135deg, #8B7355 0%, #6B5744 50%, #4A3C2F 100%);
                color: white;
                text-align: center;
                padding: 20px;
              }
              .spinner { 
                width: 50px; 
                height: 50px; 
                border: 4px solid rgba(255,255,255,0.3); 
                border-top-color: white; 
                border-radius: 50%; 
                animation: spin 1s linear infinite; 
                margin-bottom: 20px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              h1 { font-size: 24px; margin-bottom: 10px; }
              p { opacity: 0.9; margin-bottom: 20px; }
              .btn {
                background: white;
                color: #4A3C2F;
                padding: 15px 30px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                display: inline-block;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h1>¡Autenticación exitosa!</h1>
            <p>Abriendo la aplicación...</p>
            <a href="${customSchemeLink}" class="btn">Abrir App</a>
            <script>
              // Intentar abrir con el scheme personalizado
              window.location.href = "${customSchemeLink}";
              
              // Si después de 2 segundos seguimos aquí, mostrar mensaje
              setTimeout(function() {
                document.querySelector('p').textContent = 'Si la app no se abre, pulsa el botón de abajo.';
              }, 2000);
            </script>
          </body>
          </html>
        `);
      } else {
        // Redirigir al frontend web con los tokens
        const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`;
        res.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('❌ Error en callback de Google:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/admin-login?error=callback_error`);
    }
  }
);

export default router;
