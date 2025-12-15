import express from 'express';
import neonPool from '../config/neonDb.js';

const router = express.Router();

// GET /api/tenant?email=user@example.com
// Obtiene la configuración del tenant basada en el email del usuario
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    
    console.log('🔍 Buscando tenant para email:', email);
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await neonPool.query(
      'SELECT email, role, enterprise_name, api_url FROM tenants WHERE email = $1',
      [email.toLowerCase()]
    );
    
    console.log('📋 Resultado query:', result.rows);

    if (result.rows.length === 0) {
      // Si no existe el usuario, devolver configuración por defecto
      return res.json({
        found: false,
        config: {
          enterpriseName: 'AliadaDigital',
          apiUrl: process.env.DEFAULT_API_URL || 'https://jarana-horas-back.onrender.com/api',
          theme: 'aliadaDigital',
          role: 'employee'
        }
      });
    }

    const tenant = result.rows[0];
    res.json({
      found: true,
      config: {
        email: tenant.email,
        role: tenant.role,
        enterpriseName: tenant.enterprise_name,
        apiUrl: tenant.api_url,
        theme: 'aliadaDigital'
      }
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Error fetching tenant configuration' });
  }
});

// POST /api/tenant - Crear o actualizar tenant (solo admin)
router.post('/', async (req, res) => {
  try {
    const { email, role, enterpriseName, apiUrl, theme } = req.body;

    if (!email || !enterpriseName || !apiUrl) {
      return res.status(400).json({ error: 'email, enterpriseName and apiUrl are required' });
    }

    const result = await neonPool.query(
      `INSERT INTO tenants (email, role, enterprise_name, api_url, theme)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) 
       DO UPDATE SET role = $2, enterprise_name = $3, api_url = $4, theme = $5
       RETURNING *`,
      [email.toLowerCase(), role || 'employee', enterpriseName, apiUrl, theme || 'aliadaDigital']
    );

    res.json({
      success: true,
      tenant: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating/updating tenant:', error);
    res.status(500).json({ error: 'Error creating/updating tenant' });
  }
});

// GET /api/tenant/all - Listar todos los tenants (solo admin)
router.get('/all', async (req, res) => {
  try {
    const result = await neonPool.query(
      'SELECT email, role, enterprise_name, api_url, theme, created_at FROM tenants ORDER BY created_at DESC'
    );

    res.json({
      tenants: result.rows
    });
  } catch (error) {
    console.error('Error listing tenants:', error);
    res.status(500).json({ error: 'Error listing tenants' });
  }
});

export default router;
