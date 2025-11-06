# 🏢 JARANA - Sistema de Registro Horario

Sistema completo de gestión de horarios para empresas, desarrollado con React + Node.js + PostgreSQL.

## 🚀 Instalación Automática

### Para usuarios finales:

1. **Descarga** el archivo `instalar-jarana.bat`
2. **Ejecuta** con doble clic
3. **¡Listo!** - Se instala todo automáticamente

### Lo que instala automáticamente:
- ✅ Git (si no está instalado)
- ✅ Node.js v20.10.0 (si no está instalado)
- ✅ Código fuente desde repositorio
- ✅ Todas las dependencias
- ✅ Configuración de archivos .env
- ✅ Acceso directo en escritorio
- ✅ Inicia los servicios automáticamente

## 🎯 URLs del Sistema

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## 📁 Estructura del Proyecto

```
JARANA/
├── app/
│   ├── back/           # Backend API (Node.js + Express)
│   └── front/          # Frontend (React + Vite)
├── docs/               # Documentación completa
├── scripts/            # Scripts de instalación y configuración
├── instalar-jarana.bat # Instalador principal
└── README.md          # Este archivo
```

## 🔧 Configuración Manual

Si necesitas configurar manualmente:

### 1. Clonar repositorio:
```bash
git clone https://github.com/jdmsoftware1/jarana_registro_horario.git
cd jarana_registro_horario
```

### 2. Configurar archivos .env:
```bash
# Ejecutar configurador automático
.\scripts\setup-env.ps1

# O crear manualmente:
# - app/back/.env (configuración del backend)
# - app/front/.env (configuración del frontend)
```

### 3. Instalar dependencias:
```bash
# Backend
cd app/back
npm install

# Frontend
cd ../front
npm install
```

### 4. Iniciar servicios:
```bash
# Backend (terminal 1)
cd app/back
npm run dev

# Frontend (terminal 2)
cd app/front
npm run dev
```

## 🔑 Credenciales Necesarias

Para que el sistema funcione completamente, necesitas configurar:

1. **Base de datos NeonDB**:
   - `DATABASE_URL` en `app/back/.env`

2. **Autenticación Clerk**:
   - `VITE_CLERK_PUBLISHABLE_KEY` en `app/front/.env`

3. **Cloudflare Workers** (opcional):
   - Service Token para API calls

## 📚 Documentación Completa

Ver carpeta `docs/` para documentación detallada:
- Guía de instalación
- Manual de usuario
- Configuración de seguridad
- Guía de desarrollo

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons
- **Backend**: Node.js, Express, PostgreSQL
- **Base de datos**: NeonDB (PostgreSQL en la nube)
- **Autenticación**: Clerk + Cloudflare Access
- **Deployment**: Cloudflare Workers + Pages

## 🎮 Características

- 👥 **Gestión de empleados** completa
- ⏰ **Registro de horarios** con check-in/out
- 📊 **Dashboard administrativo** con métricas
- 📱 **Interfaz responsive** moderna
- 🔒 **Autenticación segura** multi-nivel
- 📈 **Reportes** y análisis de datos
- 🎯 **Kiosk mode** para fichajes

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: soporte@jdmsoftware.com
- **Repositorio**: https://github.com/jdmsoftware1/jarana_registro_horario

---

**© 2024 JDM Software - Sistema JARANA v1.0.0**
