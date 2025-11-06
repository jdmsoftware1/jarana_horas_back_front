import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// SIN /api porque api.js ya lo añade
const envContent = 'VITE_API_URL=http://localhost:3000\n';
const envPath = join(__dirname, 'client', '.env');

writeFileSync(envPath, envContent);
console.log('✅ Archivo client/.env actualizado correctamente');
console.log('📝 Contenido:', envContent.trim());
console.log('\n⚠️  IMPORTANTE: Reinicia el frontend (npm run dev) para que cargue el cambio');
