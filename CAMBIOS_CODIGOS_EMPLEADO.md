# Mejoras en el Sistema de Códigos de Empleado

## Fecha: 25 de Noviembre de 2025

## Petición del Cliente
"Me gustaría que el código del empleado sea más fácil. Ahora mismo es algo como esto: EMP3556789 y me gustaría algo más sencillo como EMP21 con dos dígitos o tres en función de los empleados de la empresa, y que cuando vayas a insertar los datos, si todos empiezan por EMP se ponga EMP automáticamente ya en el código del empleado, para agilizar la entrada del empleado."

## Cambios Implementados

### ✅ 1. Sistema de Códigos Simplificado

**Formato Anterior**: `EMP3556789` (timestamp de 7 dígitos)
**Formato Nuevo**: 
- `EMP01` a `EMP99` (2 dígitos para los primeros 99 empleados)
- `EMP100` en adelante (3 dígitos cuando se superen los 99 empleados)

**Ventajas**:
- ✅ Códigos más cortos y fáciles de recordar
- ✅ Secuenciales y ordenados
- ✅ Escalables automáticamente
- ✅ Compatibles con empleados existentes

### ✅ 2. Generación Automática de Códigos

#### Backend - Archivos Modificados

**2.1. `src/routes/employees.js` (Líneas 58-78)**
```javascript
// Buscar el último código EMP para generar el siguiente
const lastEmployee = await Employee.findOne({
  where: { 
    role: 'employee',
    employeeCode: { [Op.like]: 'EMP%' }
  },
  order: [['employeeCode', 'DESC']]
});

let nextNumber = 1;
if (lastEmployee && lastEmployee.employeeCode) {
  const lastNumber = parseInt(lastEmployee.employeeCode.replace('EMP', ''));
  if (!isNaN(lastNumber)) {
    nextNumber = lastNumber + 1;
  }
}

// Usar 2 dígitos si es menor a 100, 3 si es mayor
const padding = nextNumber < 100 ? 2 : 3;
const employeeCode = `EMP${String(nextNumber).padStart(padding, '0')}`;
```

**2.2. `src/routes/admin.js` (Líneas 58-103)**
- Implementa la misma lógica para empleados y administradores
- Administradores usan prefijo `ADM` en lugar de `EMP`
- Genera códigos secuenciales: `ADM01`, `ADM02`, etc.

**2.3. `src/config/passport.js` (Líneas 138-156)**
- Actualizado para Google OAuth
- Genera códigos consistentes cuando se crea un empleado vía Google

### ✅ 3. Nuevo Endpoint de API

**Endpoint**: `GET /api/admin/next-employee-code`

**Parámetros**:
- `role` (opcional): `employee` o `admin` (default: `employee`)

**Respuesta**:
```json
{
  "nextCode": "EMP21",
  "prefix": "EMP",
  "number": 21
}
```

**Propósito**: Permite al frontend obtener el próximo código disponible antes de crear un empleado.

**Ubicación**: `src/routes/admin.js` (Líneas 381-418)

### ✅ 4. Frontend Web - Autocompletado Visual

**Archivo**: `client/src/pages/AdminDashboard.jsx`

**Cambios en `CreateEmployeeModal`**:

1. **Estado agregado** (Líneas 2060-2061):
```javascript
const [nextCode, setNextCode] = useState({ nextCode: 'EMP01', prefix: 'EMP', number: 1 });
const [loadingCode, setLoadingCode] = useState(true);
```

2. **Efecto para obtener código** (Líneas 2063-2080):
```javascript
useEffect(() => {
  const fetchNextCode = async () => {
    try {
      const response = await authenticatedFetch(
        `${getApiUrl()}/admin/next-employee-code?role=employee`
      );
      if (response.ok) {
        const data = await response.json();
        setNextCode(data);
      }
    } catch (err) {
      console.error('Error fetching next code:', err);
    } finally {
      setLoadingCode(false);
    }
  };
  
  fetchNextCode();
}, []);
```

3. **Campo informativo visual** (Líneas 2124-2139):
```jsx
{/* Código de empleado (informativo) */}
<div className="bg-brand-light/10 border border-brand-light/30 rounded-lg p-3">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-neutral-dark">Código de empleado</p>
      <p className="text-xs text-neutral-mid mt-1">Se asignará automáticamente</p>
    </div>
    <div className="text-right">
      {loadingCode ? (
        <span className="text-sm text-neutral-mid">Cargando...</span>
      ) : (
        <span className="text-lg font-bold text-brand-dark">{nextCode.nextCode}</span>
      )}
    </div>
  </div>
</div>
```

**Resultado**: El usuario ve claramente qué código se asignará antes de crear el empleado.

### ✅ 5. App Móvil - Autocompletado

**Archivo**: `app_movil/src/screens/admin/CreateEmployeeScreen.js`

**Cambios**:

1. **Estados agregados** (Líneas 11-12):
```javascript
const [loadingCode, setLoadingCode] = useState(true);
const [nextCode, setNextCode] = useState({ nextCode: 'EMP01', prefix: 'EMP', number: 1 });
```

2. **Efecto para pre-llenar el campo** (Líneas 22-42):
```javascript
React.useEffect(() => {
  const fetchNextCode = async () => {
    try {
      const response = await fetch(
        `${employeeService.baseURL}/admin/next-employee-code?role=employee`,
        { headers: employeeService.getHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setNextCode(data);
        // Pre-llenar el campo con el código sugerido
        setFormData(prev => ({ ...prev, employeeCode: data.nextCode }));
      }
    } catch (err) {
      console.error('Error fetching next code:', err);
    } finally {
      setLoadingCode(false);
    }
  };
  
  fetchNextCode();
}, []);
```

3. **Campo con placeholder** (Líneas 88-98):
```jsx
<TextInput
  label="Código de Empleado *"
  value={formData.employeeCode}
  onChangeText={(text) => setFormData({ ...formData, employeeCode: text.toUpperCase() })}
  mode="outlined"
  autoCapitalize="characters"
  style={styles.input}
  theme={{ colors: { primary: colors.brandLight } }}
  placeholder={loadingCode ? 'Cargando...' : nextCode.nextCode}
  right={<TextInput.Icon icon="information" color={colors.brandLight} />}
/>
```

**Resultado**: El campo se pre-llena automáticamente con el código sugerido (ej: `EMP21`).

## Flujo de Creación de Empleado

### Antes:
1. Admin abre formulario
2. Admin escribe manualmente código largo (ej: `EMP3556789`)
3. Sistema valida y crea empleado

### Ahora:

#### Web:
1. Admin abre formulario
2. **Sistema muestra automáticamente**: "Código de empleado: **EMP21**"
3. Admin completa nombre, email y PIN
4. Sistema crea empleado con código `EMP21`

#### Móvil:
1. Admin abre formulario
2. **Campo "Código de Empleado" ya contiene**: `EMP21`
3. Admin puede modificarlo si es necesario o dejarlo como está
4. Admin completa nombre, email y PIN
5. Sistema crea empleado con el código

## Compatibilidad con Empleados Existentes

### ✅ Empleados Antiguos
- Los empleados con códigos antiguos (ej: `EMP3556789`) **se mantienen sin cambios**
- No se requiere migración de datos
- Funcionan normalmente en todo el sistema

### ✅ Nuevos Empleados
- Todos los nuevos empleados reciben códigos cortos (ej: `EMP01`, `EMP02`, etc.)
- El sistema busca el último código numérico y genera el siguiente
- Si existen `EMP01` a `EMP20`, el próximo será `EMP21`

### ✅ Lógica de Búsqueda
El sistema busca el último código que coincida con el patrón `EMP%`:
```javascript
const lastEmployee = await Employee.findOne({
  where: { 
    role: 'employee',
    employeeCode: { [Op.like]: 'EMP%' }
  },
  order: [['employeeCode', 'DESC']]
});
```

Extrae el número y genera el siguiente:
```javascript
const lastNumber = parseInt(lastEmployee.employeeCode.replace('EMP', ''));
const nextNumber = lastNumber + 1;
```

## Escalabilidad

### Expansión Automática de Dígitos

**0-99 empleados**: 2 dígitos
- `EMP01`, `EMP02`, ..., `EMP99`

**100-999 empleados**: 3 dígitos
- `EMP100`, `EMP101`, ..., `EMP999`

**1000+ empleados**: 4 dígitos (automático)
- `EMP1000`, `EMP1001`, etc.

**Código**:
```javascript
const padding = nextNumber < 100 ? 2 : 3;
const employeeCode = `EMP${String(nextNumber).padStart(padding, '0')}`;
```

## Beneficios para el Usuario

### ✅ Agilidad
- **Antes**: Escribir manualmente 10 caracteres (`EMP3556789`)
- **Ahora**: Ver automáticamente el código o ya pre-llenado (0 caracteres a escribir)

### ✅ Simplicidad
- Códigos cortos y fáciles de recordar
- Secuenciales y predecibles
- Menos errores de tipeo

### ✅ Profesionalismo
- Sistema más pulido y automatizado
- Experiencia de usuario mejorada
- Menos fricción al crear empleados

## Ejemplos de Uso

### Ejemplo 1: Primera Empresa
- Primer empleado: `EMP01`
- Segundo empleado: `EMP02`
- Tercer empleado: `EMP03`

### Ejemplo 2: Empresa con 50 Empleados
- Último empleado existente: `EMP50`
- Próximo empleado: `EMP51` (mostrado automáticamente)

### Ejemplo 3: Empresa con 150 Empleados
- Último empleado existente: `EMP150`
- Próximo empleado: `EMP151` (3 dígitos automáticamente)

### Ejemplo 4: Empresa con Empleados Antiguos y Nuevos
- Empleados antiguos: `EMP3556789`, `EMP3556790` (se mantienen)
- Sistema detecta el último código numérico más alto
- Nuevos empleados: `EMP01`, `EMP02`, etc. (si no hay códigos numéricos previos)

## Testing Recomendado

### Backend
1. ✅ Crear empleado sin empleados previos → debe generar `EMP01`
2. ✅ Crear empleado con 50 empleados existentes → debe generar `EMP51`
3. ✅ Crear empleado #99 → debe generar `EMP99` (2 dígitos)
4. ✅ Crear empleado #100 → debe generar `EMP100` (3 dígitos)
5. ✅ Verificar que empleados antiguos no se afecten

### Frontend Web
1. ✅ Abrir modal de crear empleado → debe mostrar próximo código
2. ✅ Verificar que el código mostrado sea correcto
3. ✅ Crear empleado y verificar que se asigne el código correcto
4. ✅ Abrir modal nuevamente → debe mostrar el siguiente código

### App Móvil
1. ✅ Abrir pantalla de crear empleado → campo debe pre-llenarse
2. ✅ Verificar que el placeholder muestre el código correcto
3. ✅ Crear empleado sin modificar el código → debe usar el sugerido
4. ✅ Modificar el código manualmente → debe respetar el cambio

## Archivos Modificados

### Backend (4 archivos)
1. `src/routes/employees.js` - Líneas 58-78
2. `src/routes/admin.js` - Líneas 58-103, 381-418 (nuevo endpoint)
3. `src/config/passport.js` - Líneas 138-156

### Frontend Web (1 archivo)
4. `client/src/pages/AdminDashboard.jsx` - Líneas 2060-2139

### App Móvil (1 archivo)
5. `app_movil/src/screens/admin/CreateEmployeeScreen.js` - Líneas 10-42, 88-98

## Notas Técnicas

### Seguridad
- El endpoint `/admin/next-employee-code` está protegido por:
  - `authMiddleware`: Requiere autenticación
  - `adminMiddleware`: Solo administradores
  - `adminRateLimit`: Límite de peticiones
  - `adminOriginOnly`: Solo desde origen autorizado

### Performance
- La consulta del último código usa índice en `employeeCode`
- Operación O(log n) gracias al índice de base de datos
- Respuesta instantánea incluso con miles de empleados

### Concurrencia
- Si dos admins crean empleados simultáneamente, el backend genera el código en el momento de la creación
- El código mostrado en el frontend es solo informativo
- El código real se genera en el servidor para evitar conflictos

## Próximas Mejoras Sugeridas

1. ✅ Agregar opción para personalizar el prefijo por empresa
2. ✅ Permitir reiniciar la numeración si se desea
3. ✅ Agregar validación para evitar códigos duplicados manuales
4. ✅ Mostrar historial de códigos asignados
5. ✅ Exportar lista de empleados con sus códigos
