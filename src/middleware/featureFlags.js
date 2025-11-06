/**
 * Middleware para verificar feature flags
 */

// Verificar si las utilidades de IA están habilitadas
export const checkAIUtils = (req, res, next) => {
  const aiUtilsEnabled = process.env.ENABLE_AI_UTILS === 'true';
  
  if (!aiUtilsEnabled) {
    return res.status(403).json({
      error: 'AI utilities are disabled',
      message: 'Las utilidades de IA están deshabilitadas. Contacte al administrador.'
    });
  }
  
  next();
};

// Verificar si el chat de IA está habilitado
export const checkAIChat = (req, res, next) => {
  const aiChatEnabled = process.env.ENABLE_AI_CHAT === 'true';
  
  if (!aiChatEnabled) {
    return res.status(403).json({
      error: 'AI chat is disabled',
      message: 'El chat de IA está deshabilitado. Contacte al administrador.'
    });
  }
  
  next();
};

// Verificar si 2FA está habilitado
export const check2FA = (req, res, next) => {
  const twoFAEnabled = process.env.ENABLE_2FA === 'true';
  
  if (!twoFAEnabled) {
    return res.status(403).json({
      error: '2FA is disabled',
      message: 'La autenticación de dos factores está deshabilitada.'
    });
  }
  
  next();
};

// Verificar si Google Auth está habilitado
export const checkGoogleAuth = (req, res, next) => {
  const googleAuthEnabled = process.env.ENABLE_GOOGLE_AUTH === 'true';
  
  if (!googleAuthEnabled) {
    return res.status(403).json({
      error: 'Google Auth is disabled',
      message: 'La autenticación con Google está deshabilitada.'
    });
  }
  
  next();
};
