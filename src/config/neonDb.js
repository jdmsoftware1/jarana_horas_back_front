import pkg from 'pg';
const { Pool } = pkg;

// Pool de conexión a Neon para multi-tenant
// Neon siempre requiere SSL
const neonPool = new Pool({
  connectionString: process.env.NEON_TENANT_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection on startup
const testNeonConnection = async () => {
  try {
    const client = await neonPool.connect();
    console.log('✅ Conectado a Neon DB (Multi-tenant)');
    client.release();
  } catch (err) {
    console.error('❌ Error conectando a Neon:', err.message);
  }
};

testNeonConnection();

export default neonPool;
