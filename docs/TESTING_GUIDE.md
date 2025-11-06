# 🧪 Guía de Testing - Sistema JARANA

## 📋 Índice
1. [Información General](#información-general)
2. [Configuración de Testing](#configuración-de-testing)
3. [Tests Backend](#tests-backend)
4. [Tests Frontend](#tests-frontend)
5. [Ejecutar Tests](#ejecutar-tests)
6. [Cobertura de Código](#cobertura-de-código)
7. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Información General

El sistema JARANA incluye una **batería completa de tests** que cubre:
- ✅ **Backend**: API endpoints, servicios, modelos
- ✅ **Frontend**: Componentes, páginas, interacciones
- ✅ **IA**: Funcionalidades del asistente inteligente
- ✅ **Integración**: Flujos completos de usuario

### 🛠️ Tecnologías de Testing

#### **Backend**
- **Jest**: Framework de testing principal
- **Supertest**: Testing de APIs HTTP
- **Sequelize**: Mocks de base de datos
- **Speakeasy**: Mocks de TOTP

#### **Frontend**
- **Vitest**: Framework de testing moderno
- **Testing Library**: Testing de componentes React
- **jsdom**: Entorno DOM simulado
- **MSW**: Mock Service Worker (opcional)

---

## ⚙️ Configuración de Testing

### **Backend Setup**
```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
    '!src/models/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
```

### **Frontend Setup**
```javascript
// vite.config.js
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    css: true
  }
});
```

---

## 🔧 Tests Backend

### **Estructura de Tests Backend**
```
app/back/tests/
├── setup.js              # Configuración global
├── auth.test.js          # Tests de autenticación
├── employees.test.js     # Tests de empleados
├── records.test.js       # Tests de registros
├── vacations.test.js     # Tests de vacaciones
└── ai.test.js           # Tests de IA
```

### **Ejemplos de Tests Backend**

#### **Test de Autenticación**
```javascript
describe('Authentication Tests', () => {
  test('should authenticate employee with valid credentials', async () => {
    const response = await request(app)
      .post('/api/kiosk/auth')
      .send({
        employeeCode: 'TEST001',
        totpCode: '123456'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.employeeCode).toBe('TEST001');
  });

  test('should reject invalid employee code', async () => {
    const response = await request(app)
      .post('/api/kiosk/auth')
      .send({
        employeeCode: 'INVALID',
        totpCode: '123456'
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});
```

#### **Test de Registros**
```javascript
describe('Records Tests', () => {
  test('should create checkin record', async () => {
    const response = await request(app)
      .post('/api/kiosk/checkin')
      .send({
        employeeId: testEmployee.id,
        device: 'test'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('record');
    expect(response.body.record.type).toBe('checkin');
  });

  test('should prevent double checkin', async () => {
    const response = await request(app)
      .post('/api/kiosk/checkin')
      .send({
        employeeId: testEmployee.id,
        device: 'test'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});
```

#### **Test de IA**
```javascript
describe('AI Service Tests', () => {
  test('should detect vacation requests', () => {
    expect(AIService.detectVacationRequest('Quiero vacaciones del 1 al 5')).toBe(true);
    expect(AIService.detectVacationRequest('Hola, ¿cómo estás?')).toBe(false);
  });

  test('should get employee insights', async () => {
    const insights = await AIService.getEmployeeInsights(testEmployee.id, 'horas esta semana');
    
    expect(insights).toHaveProperty('response');
    expect(insights).toHaveProperty('type');
    expect(insights.type).toBe('hours_summary');
  });
});
```

---

## ⚛️ Tests Frontend

### **Estructura de Tests Frontend**
```
app/front/src/tests/
├── setup.js                    # Configuración global
├── EmployeeKioskPage.test.jsx  # Tests del kiosk
├── EmployeePortal.test.jsx     # Tests del portal
├── AdminDashboard.test.jsx     # Tests del dashboard
└── AIChat.test.jsx            # Tests del chat IA
```

### **Ejemplos de Tests Frontend**

#### **Test de Componente Kiosk**
```javascript
describe('EmployeeKioskPage', () => {
  test('renders kiosk page correctly', () => {
    render(<MockedEmployeeKioskPage />);
    
    expect(screen.getByText('Sistema de Fichaje')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Código de empleado')).toBeInTheDocument();
  });

  test('handles employee authentication', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ employee: mockEmployee })
    });

    render(<MockedEmployeeKioskPage />);
    
    fireEvent.change(screen.getByPlaceholderText('Código de empleado'), 
      { target: { value: 'TEST001' } });
    fireEvent.click(screen.getByRole('button', { name: /autenticar/i }));

    await waitFor(() => {
      expect(screen.getByText('Test Employee')).toBeInTheDocument();
    });
  });
});
```

#### **Test de Portal del Empleado**
```javascript
describe('EmployeePortal', () => {
  test('navigates between tabs', async () => {
    render(<MockedEmployeePortal />);
    
    // Authenticate first
    await authenticateUser();

    // Navigate to Records tab
    fireEvent.click(screen.getByText('Mis Fichajes'));

    await waitFor(() => {
      expect(screen.getByText('Mis Fichajes')).toBeInTheDocument();
    });
  });

  test('creates vacation request', async () => {
    render(<MockedEmployeePortal />);
    
    await authenticateUser();
    
    // Navigate to vacations and create request
    fireEvent.click(screen.getByText('Mis Vacaciones'));
    fireEvent.click(screen.getByText('Nueva Solicitud'));
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Fecha de Inicio'), 
      { target: { value: '2024-12-01' } });
    fireEvent.click(screen.getByText('Enviar Solicitud'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/vacations'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
```

#### **Test de Chat IA**
```javascript
describe('AIChat', () => {
  test('sends message and receives response', async () => {
    const mockResponse = {
      response: 'Hola, ¿en qué puedo ayudarte?',
      type: 'chat_response'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(<AIChat employee={mockEmployee} />);
    
    fireEvent.change(screen.getByPlaceholderText('Escribe tu mensaje...'), 
      { target: { value: 'Hola' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText('Hola, ¿en qué puedo ayudarte?')).toBeInTheDocument();
    });
  });

  test('handles vacation request creation', async () => {
    const mockVacationResponse = {
      response: '✅ He creado tu solicitud de vacaciones',
      type: 'vacation_created',
      vacationId: 'vacation-123'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVacationResponse
    });

    render(<AIChat employee={mockEmployee} />);
    
    fireEvent.change(screen.getByPlaceholderText('Escribe tu mensaje...'), 
      { target: { value: 'Quiero vacaciones del 1 al 5 de diciembre' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/He creado tu solicitud de vacaciones/)).toBeInTheDocument();
    });
  });
});
```

---

## 🚀 Ejecutar Tests

### **Backend Tests**
```bash
# Navegar al directorio backend
cd app/back

# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar un test específico
npm test -- auth.test.js

# Ejecutar tests en modo verbose
npm test -- --verbose
```

### **Frontend Tests**
```bash
# Navegar al directorio frontend
cd app/front

# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar un test específico
npm test -- EmployeeKioskPage.test.jsx

# Ejecutar tests con UI
npm run test:ui
```

### **Scripts de Package.json**

#### **Backend**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

#### **Frontend**
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 📊 Cobertura de Código

### **Objetivos de Cobertura**
- **Líneas**: > 80%
- **Funciones**: > 85%
- **Ramas**: > 75%
- **Declaraciones**: > 80%

### **Reportes de Cobertura**

#### **Backend Coverage**
```bash
npm run test:coverage

# Genera reportes en:
# - coverage/lcov-report/index.html (HTML)
# - coverage/lcov.info (LCOV)
# - Terminal output
```

#### **Frontend Coverage**
```bash
npm run test:coverage

# Genera reportes en:
# - coverage/index.html (HTML)
# - Terminal output
```

### **Archivos Excluidos de Cobertura**
- **Backend**: `src/index.js`, `src/config/**`, `src/models/index.js`
- **Frontend**: `src/main.jsx`, `src/vite-env.d.ts`, `**/*.config.js`

---

## 📋 Cobertura Actual

### **Backend Tests**
| Módulo | Tests | Cobertura |
|--------|-------|-----------|
| **Autenticación** | 4 tests | 95% |
| **Empleados** | 8 tests | 90% |
| **Registros** | 6 tests | 88% |
| **Vacaciones** | 5 tests | 85% |
| **IA Service** | 7 tests | 82% |

### **Frontend Tests**
| Componente | Tests | Cobertura |
|------------|-------|-----------|
| **EmployeeKioskPage** | 6 tests | 85% |
| **EmployeePortal** | 8 tests | 80% |
| **AdminDashboard** | 10 tests | 78% |
| **AIChat** | 12 tests | 90% |

---

## 🎯 Mejores Prácticas

### **Estructura de Tests**
```javascript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks, clear state
  });

  // Happy path tests
  test('should handle normal flow', () => {
    // Test implementation
  });

  // Error cases
  test('should handle errors gracefully', () => {
    // Test error scenarios
  });

  // Edge cases
  test('should handle edge cases', () => {
    // Test boundary conditions
  });
});
```

### **Naming Conventions**
- **Descriptive names**: `should authenticate employee with valid credentials`
- **Behavior focused**: What the test verifies, not implementation details
- **Consistent format**: `should [expected behavior] when [condition]`

### **Mock Strategies**

#### **API Mocks**
```javascript
// Mock fetch globally
global.fetch = vi.fn();

// Mock specific responses
fetch.mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'mock data' })
});
```

#### **Component Mocks**
```javascript
// Mock external dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));
```

### **Test Data Management**
```javascript
// Use factories for test data
const createMockEmployee = (overrides = {}) => ({
  id: 'uuid',
  name: 'Test Employee',
  employeeCode: 'TEST001',
  isActive: true,
  ...overrides
});

// Reuse common test utilities
const authenticateUser = async () => {
  // Common authentication flow
};
```

### **Async Testing**
```javascript
// Always use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});

// Use proper async/await
test('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

### **Cleanup**
```javascript
// Always cleanup after tests
afterEach(() => {
  cleanup(); // React Testing Library
  vi.clearAllMocks(); // Vitest
});

afterAll(async () => {
  await sequelize.close(); // Database connections
});
```

---

## 🔍 Debugging Tests

### **Common Issues**

#### **Tests Timeout**
```javascript
// Increase timeout for slow operations
test('slow operation', async () => {
  // Test implementation
}, 10000); // 10 second timeout
```

#### **Mock Not Working**
```javascript
// Ensure mocks are cleared between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Check mock calls
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
expect(mockFunction).toHaveBeenCalledTimes(1);
```

#### **DOM Not Updated**
```javascript
// Use waitFor for DOM updates
await waitFor(() => {
  expect(screen.getByText('Updated text')).toBeInTheDocument();
});

// Use act for state updates
await act(async () => {
  fireEvent.click(button);
});
```

### **Debug Commands**
```bash
# Run tests with debug output
npm test -- --verbose

# Run single test with logs
npm test -- --testNamePattern="specific test" --verbose

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 📈 Continuous Integration

### **GitHub Actions Example**
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install Backend Dependencies
        run: cd app/back && npm ci
        
      - name: Run Backend Tests
        run: cd app/back && npm run test:ci
        
      - name: Install Frontend Dependencies
        run: cd app/front && npm ci
        
      - name: Run Frontend Tests
        run: cd app/front && npm run test:coverage
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v1
```

---

**🎉 ¡Con esta guía tienes todo lo necesario para ejecutar y mantener los tests del sistema JARANA!**
