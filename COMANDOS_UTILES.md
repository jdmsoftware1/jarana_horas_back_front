# 🛠️ COMANDOS ÚTILES

## 📦 GIT & GITHUB

### Inicializar y subir a GitHub:
```bash
# Inicializar repo
git init

# Añadir todos los archivos
git add .

# Commit inicial
git commit -m "Initial commit - Ready for Render deploy"

# Conectar con GitHub (crea el repo primero en github.com)
git remote add origin https://github.com/tu-usuario/tu-repo.git

# Subir a main
git branch -M main
git push -u origin main
```

### Actualizar después de cambios:
```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

### Verificar estado:
```bash
git status
git log --oneline -5
```

---

## 🔐 GENERAR SECRETS

### JWT_SECRET y SESSION_SECRET:
```bash
# Generar un secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# O en Node REPL
node
> require('crypto').randomBytes(32).toString('hex')
```

### Generar múltiples:
```bash
# Generar 2 secrets diferentes
node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex')); console.log('SESSION_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🗄️ BASE DE DATOS

### Conectar a PostgreSQL de Render:
```bash
# Usar las credenciales de Render
psql postgresql://user:password@host:5432/database
```

### Comandos útiles en psql:
```sql
-- Listar tablas
\dt

-- Ver estructura de tabla
\d employees

-- Ver datos
SELECT * FROM employees LIMIT 5;

-- Salir
\q
```

---

## 🧪 TESTING

### Probar Backend:
```bash
# Health check
curl https://tu-backend.onrender.com/api/health

# Con formato bonito
curl https://tu-backend.onrender.com/api/health | json_pp
```

### Probar endpoints:
```bash
# GET
curl https://tu-backend.onrender.com/api/employees

# POST (ejemplo)
curl -X POST https://tu-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 📊 LOGS EN RENDER

### Ver logs en tiempo real:
```bash
# No hay comando directo, usa el dashboard de Render
# Render Dashboard → Tu servicio → Logs
```

### Descargar logs:
```bash
# Desde el dashboard de Render
# Logs → Download logs
```

---

## 🔄 DEPLOY MANUAL

### Forzar redeploy:
```bash
# Opción 1: Desde Render Dashboard
# Tu servicio → Manual Deploy → Deploy latest commit

# Opción 2: Push vacío a GitHub
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

---

## 🧹 LIMPIEZA

### Limpiar node_modules:
```bash
# Backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd client
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Limpiar build:
```bash
# Frontend
cd client
rm -rf dist
npm run build
cd ..
```

---

## 🐛 DEBUG

### Ver variables de entorno (local):
```bash
# Backend
node -e "require('dotenv').config(); console.log(process.env)"

# O crear script temporal
node
> require('dotenv').config()
> console.log(process.env.DATABASE_URL)
```

### Probar conexión a BD:
```bash
npm run test-db
```

### Verificar versión de Node:
```bash
node --version
npm --version
```

---

## 📦 NPM

### Actualizar dependencias:
```bash
# Ver outdated
npm outdated

# Actualizar
npm update

# Actualizar a última versión
npm install package@latest
```

### Instalar dependencias:
```bash
# Backend
npm install

# Frontend
cd client && npm install

# Ambos
npm run postinstall
```

---

## 🔍 VERIFICACIÓN

### Verificar que .env no está en Git:
```bash
git ls-files | grep .env
# No debería mostrar nada
```

### Ver archivos ignorados:
```bash
git status --ignored
```

### Verificar build del frontend:
```bash
cd client
npm run build
ls -la dist/
cd ..
```

---

## 🌐 URLS ÚTILES

### Render:
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs

### Google Cloud:
- Console: https://console.cloud.google.com
- OAuth: https://console.cloud.google.com/apis/credentials

### PostgreSQL:
- Docs: https://www.postgresql.org/docs/

---

## 🚀 DESARROLLO LOCAL

### Iniciar todo:
```bash
npm run dev
```

### Solo backend:
```bash
npm run dev:server
```

### Solo frontend:
```bash
npm run dev:client
# o
cd client && npm run dev
```

---

## 📝 SCRIPTS PERSONALIZADOS

### Crear script de backup:
```bash
# crear scripts/backup-db.sh
#!/bin/bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Crear script de restore:
```bash
# crear scripts/restore-db.sh
#!/bin/bash
psql $DATABASE_URL < $1
```

---

## 🎯 COMANDOS RÁPIDOS

### Deploy completo:
```bash
git add . && git commit -m "Update" && git push origin main
```

### Ver logs del backend local:
```bash
npm run dev:server 2>&1 | tee logs.txt
```

### Generar secrets y copiar:
```bash
# Windows
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | clip

# Mac
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | pbcopy

# Linux
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | xclip
```

---

## 🔧 TROUBLESHOOTING

### Puerto ocupado:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Limpiar cache de npm:
```bash
npm cache clean --force
```

### Reinstalar todo:
```bash
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
npm install
cd client && npm install
```

---

## 📚 RECURSOS

### Documentación:
- Node.js: https://nodejs.org/docs
- Express: https://expressjs.com
- React: https://react.dev
- Vite: https://vitejs.dev
- Sequelize: https://sequelize.org
- Render: https://render.com/docs

### Herramientas:
- Postman: https://www.postman.com
- TablePlus: https://tableplus.com
- pgAdmin: https://www.pgadmin.org

---

¡Guarda este archivo para referencia rápida! 🚀
