# 🚀 Deploy Check - Sistema JARANA

## ✅ **Archivos de Configuración:**

### **Vercel Configuration:**
- `app/vercel.json` ✅ - Configurado para backend + frontend
- `app/back/package.json` ✅ - Scripts: start, build
- `app/front/package.json` ✅ - Scripts: start, build
- `app/.gitignore` ✅ - Excluye .env files

### **Backend Configuration:**
- `app/back/src/index.js` ✅ - Con endpoints /api/health y /api/debug
- `app/back/.env.example` ✅ - Template de variables
- CORS configurado para Vercel ✅

### **Frontend Configuration:**
- `app/front/src/utils/api.js` ✅ - API_BASE_URL = '/api'
- Vite configurado ✅
- React Router configurado ✅

## 🎯 **Pasos para Deploy:**

### **1. Subir a GitHub:**
```bash
git add .
git commit -m "Ready for Vercel deployment - Complete JARANA system"
git push origin main
```

### **2. Configurar en Vercel:**
- **Import Project** → Tu repositorio
- **Root Directory**: `app`
- **Framework**: Other
- **Variables de Entorno**:
  ```
  NODE_ENV=production
  DATABASE_URL=postgresql://neondb_owner:npg_fautDoN2b0Fs@ep-lively-fire-ag1y35pn-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  JWT_SECRET=tu-jwt-secret-super-seguro-aqui
  OPENAI_API_KEY=sk-tu-clave-openai-aqui
  ```

### **3. URLs de Prueba:**
```
Backend API: https://tu-proyecto.vercel.app/api/debug
Frontend: https://tu-proyecto.vercel.app/
Portal Empleado: https://tu-proyecto.vercel.app/employee-portal
Kiosk: https://tu-proyecto.vercel.app/employee-kiosk
Admin: https://tu-proyecto.vercel.app/admin
```

## 🔧 **Troubleshooting:**

### **Si Backend da 500:**
- Revisar Variables de Entorno
- Verificar DATABASE_URL
- Revisar Function Logs en Vercel

### **Si Frontend da 404:**
- Verificar que build de Vite fue exitoso
- Revisar rutas en vercel.json
- Verificar que React Router está configurado

### **Si CORS Error:**
- Backend ya está configurado para *.vercel.app
- Verificar que frontend usa '/api' como base URL

## 🎉 **Deploy Ready!**

Todo está configurado correctamente para el deploy de prueba.
