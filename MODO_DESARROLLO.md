# 🔧 Modo Desarrollo - Guía Rápida

## 📱 Configuración App Móvil

### 1. Archivo `.env` de la app móvil
Ubicación: `app_movil/.env`

```env
EXPO_PUBLIC_API_URL=http://192.168.31.164:3000
EXPO_PUBLIC_ENVIRONMENT=DEV
EXPO_PUBLIC_DEV_ROLE=admin
```

**Opciones de rol:**
- `EXPO_PUBLIC_DEV_ROLE=admin` → Dashboard de administrador
- `EXPO_PUBLIC_DEV_ROLE=employee` → Dashboard de empleado

### 2. Iniciar la app móvil

```bash
cd app_movil
npx expo start -c
```

Escanea el QR con Expo Go y la app se abrirá directamente en el dashboard (sin login).

---

## 🖥️ Configuración Backend

### 1. Archivo `.env` del backend
Ubicación: `.env` (raíz del proyecto)

**Asegúrate de que tenga:**
```env
NODE_ENV=development
```

### 2. Iniciar el backend

```bash
npm run start
```

**Verás en los logs:**
```
🔧 DEV MODE: Request sin token - Usando empleado mock
🔧 DEV MODE: Permitiendo acceso admin
```

---

## ✅ Verificación

### App Móvil
- ✅ Se abre directamente en el dashboard (sin pantalla de login)
- ✅ Muestra datos del usuario mock
- ✅ Puede hacer requests al backend sin token

### Backend
- ✅ Acepta requests sin token JWT
- ✅ Usa el primer empleado admin de la BD
- ✅ Logs claros de modo desarrollo

---

## 🚀 Modo Producción

### App Móvil
```env
EXPO_PUBLIC_API_URL=https://jarana-horas-back.onrender.com
EXPO_PUBLIC_ENVIRONMENT=PRO
```

### Backend
```env
NODE_ENV=production
```

**En producción:**
- ✅ Requiere autenticación Google OAuth
- ✅ Requiere token JWT en todas las peticiones
- ✅ Verifica roles estrictamente
- ✅ **100% SEGURO**

---

## 🎯 Recursos

- **Logo de la app:** `app_movil/public/images/logo_jarana.jpg`
- **Colores:** Definidos en `app_movil/src/theme/colors.js`
- **API URL Desarrollo:** `http://192.168.31.164:3000`
- **API URL Producción:** `https://jarana-horas-back.onrender.com`

---

## 🐛 Solución de Problemas

### Error 401 en la app
1. Verifica que el backend tenga `NODE_ENV=development`
2. Reinicia el backend completamente
3. Verifica que veas los logs de "DEV MODE" en el backend

### App no saltea el login
1. Verifica que el `.env` de la app tenga `EXPO_PUBLIC_ENVIRONMENT=DEV`
2. Reinicia con `npx expo start -c`
3. Verifica los logs en la terminal de Expo

### Backend rechaza requests
1. Asegúrate de reiniciar el backend después de cambiar el `.env`
2. Verifica que `NODE_ENV=development` esté en el `.env`
3. Mira los logs del backend para confirmar modo desarrollo
