import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AdminDashboard from '../pages/AdminDashboard';
import { SystemProvider } from '../contexts/SystemContext';

// Mock fetch
global.fetch = vi.fn();

const MockedAdminDashboard = () => (
  <BrowserRouter>
    <SystemProvider>
      <AdminDashboard />
    </SystemProvider>
  </BrowserRouter>
);

describe('AdminDashboard', () => {
  const mockEmployees = [
    {
      id: '1',
      name: 'Test Employee 1',
      email: 'test1@example.com',
      employeeCode: 'TEST001',
      isActive: true,
      lastRecord: {
        id: '1',
        type: 'checkin',
        timestamp: '2024-10-29T08:00:00Z'
      }
    },
    {
      id: '2',
      name: 'Test Employee 2',
      email: 'test2@example.com',
      employeeCode: 'TEST002',
      isActive: false,
      lastRecord: null
    }
  ];

  const mockRecords = [
    {
      id: '1',
      type: 'checkin',
      timestamp: '2024-10-29T08:00:00Z',
      employee: {
        name: 'Test Employee 1',
        employeeCode: 'TEST001'
      }
    },
    {
      id: '2',
      type: 'checkout',
      timestamp: '2024-10-29T17:00:00Z',
      employee: {
        name: 'Test Employee 1',
        employeeCode: 'TEST001'
      }
    }
  ];

  const mockVacations = [
    {
      id: '1',
      startDate: '2024-12-01',
      endDate: '2024-12-05',
      type: 'vacation',
      status: 'pending',
      employee: {
        name: 'Test Employee 1',
        employeeCode: 'TEST001'
      }
    }
  ];

  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders dashboard correctly', () => {
    render(<MockedAdminDashboard />);
    
    expect(screen.getByText('Dashboard Administrativo')).toBeInTheDocument();
    expect(screen.getByText('Empleados')).toBeInTheDocument();
    expect(screen.getByText('Registros')).toBeInTheDocument();
    expect(screen.getByText('Horarios')).toBeInTheDocument();
    expect(screen.getByText('Vacaciones')).toBeInTheDocument();
  });

  test('displays system status controls', () => {
    render(<MockedAdminDashboard />);
    
    expect(screen.getByText('Estado del Sistema')).toBeInTheDocument();
    expect(screen.getByText(/sistema activo/i)).toBeInTheDocument();
  });

  test('shows employees list', async () => {
    // Mock employees data with last records
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployees
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockEmployees[0].lastRecord]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    render(<MockedAdminDashboard />);
    
    // Navigate to employees tab
    const employeesTab = screen.getByText('Empleados');
    fireEvent.click(employeesTab);

    await waitFor(() => {
      expect(screen.getByText('Test Employee 1')).toBeInTheDocument();
      expect(screen.getByText('Test Employee 2')).toBeInTheDocument();
      expect(screen.getByText('TEST001')).toBeInTheDocument();
      expect(screen.getByText('TEST002')).toBeInTheDocument();
    });
  });

  test('displays last record information for employees', async () => {
    // Mock employees with last records
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployees
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockEmployees[0].lastRecord]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

    render(<MockedAdminDashboard />);
    
    const employeesTab = screen.getByText('Empleados');
    fireEvent.click(employeesTab);

    await waitFor(() => {
      expect(screen.getByText('Entrada')).toBeInTheDocument();
      expect(screen.getByText('Sin registros')).toBeInTheDocument();
    });
  });

  test('shows records list', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ records: mockRecords })
    });

    render(<MockedAdminDashboard />);
    
    const recordsTab = screen.getByText('Registros');
    fireEvent.click(recordsTab);

    await waitFor(() => {
      expect(screen.getByText('Test Employee 1')).toBeInTheDocument();
      expect(screen.getByText('Entrada')).toBeInTheDocument();
      expect(screen.getByText('Salida')).toBeInTheDocument();
    });
  });

  test('shows vacations list', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVacations
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployees
      });

    render(<MockedAdminDashboard />);
    
    const vacationsTab = screen.getByText('Vacaciones');
    fireEvent.click(vacationsTab);

    await waitFor(() => {
      expect(screen.getByText('Test Employee 1')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
  });

  test('creates new employee', async () => {
    // Mock employees list
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(<MockedAdminDashboard />);
    
    const employeesTab = screen.getByText('Empleados');
    fireEvent.click(employeesTab);

    await waitFor(() => {
      expect(screen.getByText('Nuevo Empleado')).toBeInTheDocument();
    });

    const newEmployeeButton = screen.getByText('Nuevo Empleado');
    fireEvent.click(newEmployeeButton);

    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Empleado')).toBeInTheDocument();
    });

    // Fill form
    const nameInput = screen.getByLabelText('Nombre Completo');
    const emailInput = screen.getByLabelText('Email');
    const codeInput = screen.getByLabelText('Código de Empleado');

    fireEvent.change(nameInput, { target: { value: 'New Employee' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(codeInput, { target: { value: 'NEW001' } });

    // Mock employee creation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '3',
        name: 'New Employee',
        email: 'new@example.com',
        employeeCode: 'NEW001',
        qrCodeUrl: 'data:image/png;base64,mock'
      })
    });

    const createButton = screen.getByText('Crear Empleado');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/employees'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  test('approves vacation request', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVacations
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployees
      });

    render(<MockedAdminDashboard />);
    
    const vacationsTab = screen.getByText('Vacaciones');
    fireEvent.click(vacationsTab);

    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    // Mock vacation approval
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockVacations[0],
        status: 'approved'
      })
    });

    const approveButton = screen.getByText('Aprobar');
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/approve'),
        expect.objectContaining({
          method: 'PUT'
        })
      );
    });
  });

  test('toggles system status', async () => {
    render(<MockedAdminDashboard />);
    
    const systemToggle = screen.getByRole('button', { name: /desactivar sistema/i });
    
    // Mock system deactivation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isActive: false })
    });

    fireEvent.click(systemToggle);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/system/deactivate'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  test('displays loading states', () => {
    render(<MockedAdminDashboard />);
    
    const employeesTab = screen.getByText('Empleados');
    fireEvent.click(employeesTab);

    // Should show loading spinner initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<MockedAdminDashboard />);
    
    const employeesTab = screen.getByText('Empleados');
    fireEvent.click(employeesTab);

    await waitFor(() => {
      // Should handle error gracefully without crashing
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });
});
