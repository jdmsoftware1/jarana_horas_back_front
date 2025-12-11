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

  // ============================================
  // EXPORT FUNCTIONALITY TESTS
  // ============================================

  describe('Export Functionality', () => {
    const mockTemplates = [
      {
        id: '1',
        name: 'Jornada Completa',
        description: 'Horario estándar 8h',
        weeklyHours: 40,
        isActive: true
      }
    ];

    const mockSchedules = [
      {
        id: '1',
        year: 2024,
        weekNumber: 45,
        employee: { name: 'Test Employee 1', employeeCode: 'TEST001' },
        template: { name: 'Jornada Completa' },
        startDate: '2024-11-04',
        endDate: '2024-11-10'
      }
    ];

    beforeEach(() => {
      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock document.createElement for download link
      const mockLink = {
        href: '',
        setAttribute: vi.fn(),
        click: vi.fn(),
        remove: vi.fn()
      };
      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') return mockLink;
        return document.createElement(tag);
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('renders export button in records section', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployees
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords })
      });

      render(<MockedAdminDashboard />);
      
      const recordsTab = screen.getByText('Registros');
      fireEvent.click(recordsTab);

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });
    });

    test('shows export menu when clicking export button', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployees
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords })
      });

      render(<MockedAdminDashboard />);
      
      const recordsTab = screen.getByText('Registros');
      fireEvent.click(recordsTab);

      await waitFor(() => {
        const exportButton = screen.getByText('Exportar');
        fireEvent.click(exportButton);
      });

      await waitFor(() => {
        expect(screen.getByText('📊 Exportar TODO (CSV)')).toBeInTheDocument();
      });
    });

    test('exports all data to CSV successfully', async () => {
      // Mock initial data load
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployees
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords })
      });

      render(<MockedAdminDashboard />);
      
      const recordsTab = screen.getByText('Registros');
      fireEvent.click(recordsTab);

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });

      // Mock export API calls
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ records: mockRecords }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmployees })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ vacations: mockVacations }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ schedules: mockSchedules }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ templates: mockTemplates }) });

      // Click export button
      const exportButton = screen.getByText('Exportar');
      fireEvent.click(exportButton);

      await waitFor(() => {
        const exportAllOption = screen.getByText('📊 Exportar TODO (CSV)');
        fireEvent.click(exportAllOption);
      });

      await waitFor(() => {
        // Verify that the export function was called
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });

    test('handles export with empty data gracefully', async () => {
      // Mock initial data load
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [] })
      });

      render(<MockedAdminDashboard />);
      
      const recordsTab = screen.getByText('Registros');
      fireEvent.click(recordsTab);

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });

      // Mock export API calls with empty data
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ records: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ vacations: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ schedules: [] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ templates: [] }) });

      // Click export button
      const exportButton = screen.getByText('Exportar');
      fireEvent.click(exportButton);

      await waitFor(() => {
        const exportAllOption = screen.getByText('📊 Exportar TODO (CSV)');
        fireEvent.click(exportAllOption);
      });

      await waitFor(() => {
        // Should still create a blob even with empty data
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });

    test('handles export API errors gracefully', async () => {
      // Mock initial data load
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployees
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords })
      });

      render(<MockedAdminDashboard />);
      
      const recordsTab = screen.getByText('Registros');
      fireEvent.click(recordsTab);

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });

      // Mock export API calls with errors
      fetch
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 });

      // Mock window.alert
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      // Click export button
      const exportButton = screen.getByText('Exportar');
      fireEvent.click(exportButton);

      await waitFor(() => {
        const exportAllOption = screen.getByText('📊 Exportar TODO (CSV)');
        fireEvent.click(exportAllOption);
      });

      // Should handle errors gracefully - still create CSV with empty sections
      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });

      alertMock.mockRestore();
    });

    test('shows loading state during export', async () => {
      // Mock initial data load
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployees
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords })
      });

      render(<MockedAdminDashboard />);
      
      const recordsTab = screen.getByText('Registros');
      fireEvent.click(recordsTab);

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });

      // Mock slow API response
      fetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ records: [] })
      }), 100)));

      // Click export button
      const exportButton = screen.getByText('Exportar');
      fireEvent.click(exportButton);

      await waitFor(() => {
        const exportAllOption = screen.getByText('📊 Exportar TODO (CSV)');
        fireEvent.click(exportAllOption);
      });

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Exportando...')).toBeInTheDocument();
      });
    });

    test('CSV contains correct headers for all sections', async () => {
      let capturedBlob = null;
      global.Blob = vi.fn((content) => {
        capturedBlob = content[0];
        return { size: content[0].length };
      });

      // Mock initial data load
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmployees
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: mockRecords })
      });

      render(<MockedAdminDashboard />);
      
      const recordsTab = screen.getByText('Registros');
      fireEvent.click(recordsTab);

      await waitFor(() => {
        expect(screen.getByText('Exportar')).toBeInTheDocument();
      });

      // Mock export API calls
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ records: mockRecords }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockEmployees })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ vacations: mockVacations }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ schedules: mockSchedules }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ templates: mockTemplates }) });

      // Click export button
      const exportButton = screen.getByText('Exportar');
      fireEvent.click(exportButton);

      await waitFor(() => {
        const exportAllOption = screen.getByText('📊 Exportar TODO (CSV)');
        fireEvent.click(exportAllOption);
      });

      await waitFor(() => {
        expect(capturedBlob).not.toBeNull();
      });

      // Verify CSV sections
      expect(capturedBlob).toContain('=== REGISTROS DE FICHAJES ===');
      expect(capturedBlob).toContain('=== EMPLEADOS ===');
      expect(capturedBlob).toContain('=== VACACIONES Y AUSENCIAS ===');
      expect(capturedBlob).toContain('=== HORARIOS SEMANALES ASIGNADOS ===');
      expect(capturedBlob).toContain('=== PLANTILLAS DE HORARIO ===');
    });
  });
});
