import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Usar DATABASE_URL o DEMO_DATABASE_URL como fallback
const databaseUrl = process.env.DATABASE_URL || process.env.DEMO_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL no está configurada en .env');
  process.exit(1);
}

console.log('📊 Conectando a la base de datos...');

const sequelize = new Sequelize(databaseUrl, {
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
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

export { sequelize, testConnection };
export default sequelize;
