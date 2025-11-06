# 🔧 Setup Temporal para Probar

## 📝 Crear archivo .env

Crea el archivo `app/front/.env` con tu clave de Clerk:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_tu_clave_de_clerk_aqui
VITE_API_URL=http://localhost:3000/api
```

## 🐛 Debug Activado

He añadido logs de debug temporales. Cuando ejecutes la app, verás en la consola del navegador:

1. **Al cargar la página**:
   ```
   HomePage - System Active: false
   HomePage - Supervisor: null
   HomePage - Is Loaded: true
   ```

2. **Al hacer login con Clerk**:
   ```
   SystemContext - isLoaded: true user: [objeto usuario]
   SystemContext - Activating system for user: [nombre]
   🔄 Activating system with data: [datos]
   🟢 Sistema activado por: [nombre]
   🟢 System state updated - Active: true
   ```

3. **Después del login**:
   ```
   HomePage - System Active: true
   HomePage - Supervisor: [datos supervisor]
   ```

## 🔍 Pasos para Debuggear

1. **Abre la consola del navegador** (F12 → Console)
2. **Ve a la app** → Deberías ver logs iniciales
3. **Haz login con Clerk** → Deberías ver logs de activación
4. **Vuelve a la página principal** → Debería mostrar sistema activo

## ❗ Si No Funciona

Si después del login no ves el kiosk de empleados:

1. **Revisa la consola** → ¿Aparecen los logs de activación?
2. **Verifica localStorage** → F12 → Application → Local Storage → ¿Existe `jarana_system_session`?
3. **Comprueba el redirect** → ¿Te redirige a `/` después del login?

## 🔧 Comandos para Probar

```bash
# Instalar dependencias
cd app/front
npm install

# Ejecutar
npm run dev

# Ir a http://localhost:5173
```

Una vez que funcione, podemos quitar los logs de debug.
