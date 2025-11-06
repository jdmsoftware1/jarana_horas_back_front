import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import EmployeePortal from '../pages/EmployeePortal';

// Mock fetch
global.fetch = vi.fn();

const MockedEmployeePortal = () => (
  <BrowserRouter>
    <EmployeePortal />
  </BrowserRouter>
);

describe('EmployeePortal', () => {
  const mockEmployee = {
    id: '1',
    name: 'Test Employee',
    employeeCode: 'TEST001'
  };

  const mockRecords = [
    {
      id: '1',
      type: 'checkin',
      timestamp: '2024-10-29T08:00:00Z',
      device: 'web'
    },
    {
      id: '2',
      type: 'checkout',
      timestamp: '2024-10-29T17:00:00Z',
      device: 'web'
    }
  ];

  const mockVacations = [
    {
      id: '1',
      startDate: '2024-12-01',
      endDate: '2024-12-05',
      type: 'vacation',
      status: 'pending',
      reason: 'Test vacation',
      createdAt: '2024-10-29T10:00:00Z'
    }
  ];

  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders authentication form initially', () => {
    render(<MockedEmployeePortal />);
    
    expect(screen.getByText('Portal del Empleado')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Código de empleado')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Código TOTP')).toBeInTheDocument();
  });

  test('authenticates employee successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ employee: mockEmployee })
    });

    render(<MockedEmployeePortal />);
    
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /acceder/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'TEST001' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText('Bienvenido, Test Employee')).toBeInTheDocument();
    });
  });

  test('displays dashboard after authentication', async () => {
    // Mock authentication
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ employee: mockEmployee })
    });

    // Mock dashboard data
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecords
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVacations
      });

    render(<MockedEmployeePortal />);
    
    // Authenticate
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /acceder/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'TEST001' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Mis Fichajes')).toBeInTheDocument();
      expect(screen.getByText('Mis Vacaciones')).toBeInTheDocument();
      expect(screen.getByText('Reportes')).toBeInTheDocument();
    });
  });

  test('navigates between tabs', async () => {
    // Mock authentication
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ employee: mockEmployee })
    });

    // Mock data for different tabs
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecords
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVacations
      });

    render(<MockedEmployeePortal />);
    
    // Authenticate first
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /acceder/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'TEST001' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Navigate to Records tab
    const recordsTab = screen.getByText('Mis Fichajes');
    fireEvent.click(recordsTab);

    // Mock records data
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecords
    });

    await waitFor(() => {
      expect(screen.getByText('Mis Fichajes')).toBeInTheDocument();
    });
  });

  test('displays records in Mis Fichajes tab', async () => {
    // Mock authentication
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ employee: mockEmployee })
    });

    render(<MockedEmployeePortal />);
    
    // Authenticate
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /acceder/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'TEST001' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Navigate to Records tab
    const recordsTab = screen.getByText('Mis Fichajes');
    fireEvent.click(recordsTab);

    // Mock records data
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecords
    });

    await waitFor(() => {
      expect(screen.getByText('Entrada')).toBeInTheDocument();
      expect(screen.getByText('Salida')).toBeInTheDocument();
    });
  });

  test('creates vacation request', async () => {
    // Mock authentication
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ employee: mockEmployee })
    });

    render(<MockedEmployeePortal />);
    
    // Authenticate
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /acceder/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'TEST001' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Navigate to Vacations tab
    const vacationsTab = screen.getByText('Mis Vacaciones');
    fireEvent.click(vacationsTab);

    // Mock vacations data
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    await waitFor(() => {
      expect(screen.getByText('Nueva Solicitud')).toBeInTheDocument();
    });

    // Click new vacation button
    const newVacationButton = screen.getByText('Nueva Solicitud');
    fireEvent.click(newVacationButton);

    await waitFor(() => {
      expect(screen.getByText('Nueva Solicitud de Vacaciones')).toBeInTheDocument();
    });

    // Fill vacation form
    const startDateInput = screen.getByLabelText('Fecha de Inicio');
    const endDateInput = screen.getByLabelText('Fecha de Fin');
    
    fireEvent.change(startDateInput, { target: { value: '2024-12-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-12-05' } });

    // Mock vacation creation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: '1',
        startDate: '2024-12-01',
        endDate: '2024-12-05',
        status: 'pending'
      })
    });

    const submitButton = screen.getByText('Enviar Solicitud');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/vacations'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  test('displays reports with statistics', async () => {
    // Mock authentication
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ employee: mockEmployee })
    });

    render(<MockedEmployeePortal />);
    
    // Authenticate
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /acceder/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'TEST001' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Navigate to Reports tab
    const reportsTab = screen.getByText('Reportes');
    fireEvent.click(reportsTab);

    // Mock reports data
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecords
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVacations
      });

    await waitFor(() => {
      expect(screen.getByText('Mis Reportes')).toBeInTheDocument();
      expect(screen.getByText('Días Trabajados')).toBeInTheDocument();
      expect(screen.getByText('Horas Totales')).toBeInTheDocument();
    });
  });
});
