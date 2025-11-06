import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import EmployeeKioskPage from '../pages/EmployeeKioskPage';
import { SystemProvider } from '../contexts/SystemContext';

// Mock fetch
global.fetch = vi.fn();

const MockedEmployeeKioskPage = () => (
  <BrowserRouter>
    <SystemProvider>
      <EmployeeKioskPage />
    </SystemProvider>
  </BrowserRouter>
);

describe('EmployeeKioskPage', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders kiosk page correctly', () => {
    render(<MockedEmployeeKioskPage />);
    
    expect(screen.getByText('Sistema de Fichaje')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Código de empleado')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Código TOTP')).toBeInTheDocument();
  });

  test('shows authentication form initially', () => {
    render(<MockedEmployeeKioskPage />);
    
    expect(screen.getByText('Autenticación')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /autenticar/i })).toBeInTheDocument();
  });

  test('handles employee authentication', async () => {
    const mockEmployee = {
      id: '1',
      name: 'Test Employee',
      employeeCode: 'TEST001'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ employee: mockEmployee })
    });

    render(<MockedEmployeeKioskPage />);
    
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /autenticar/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'TEST001' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText('Test Employee')).toBeInTheDocument();
    });
  });

  test('handles checkin action', async () => {
    const mockEmployee = {
      id: '1',
      name: 'Test Employee',
      employeeCode: 'TEST001'
    };

    // Mock authentication
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ employee: mockEmployee })
    });

    // Mock checkin
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        record: { id: '1', type: 'checkin' },
        message: 'Entrada registrada correctamente'
      })
    });

    render(<MockedEmployeeKioskPage />);
    
    // First authenticate
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /autenticar/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'TEST001' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText('Test Employee')).toBeInTheDocument();
    });

    // Then checkin
    const checkinButton = screen.getByRole('button', { name: /fichar entrada/i });
    fireEvent.click(checkinButton);

    await waitFor(() => {
      expect(screen.getByText('Entrada registrada correctamente')).toBeInTheDocument();
    });
  });

  test('handles checkout action', async () => {
    const mockEmployee = {
      id: '1',
      name: 'Test Employee',
      employeeCode: 'TEST001'
    };

    // Mock authentication
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ employee: mockEmployee })
    });

    // Mock checkout
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        record: { id: '1', type: 'checkout' },
        message: 'Salida registrada correctamente'
      })
    });

    render(<MockedEmployeeKioskPage />);
    
    // First authenticate
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /autenticar/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'TEST001' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText('Test Employee')).toBeInTheDocument();
    });

    // Then checkout
    const checkoutButton = screen.getByRole('button', { name: /fichar salida/i });
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(screen.getByText('Salida registrada correctamente')).toBeInTheDocument();
    });
  });

  test('displays error messages', async () => {
    fetch.mockRejectedValueOnce(new Error('Authentication failed'));

    render(<MockedEmployeeKioskPage />);
    
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /autenticar/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'INVALID' } });
    fireEvent.change(totpInput, { target: { value: '000000' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('auto-clears success message after 5 seconds', async () => {
    vi.useFakeTimers();

    const mockEmployee = {
      id: '1',
      name: 'Test Employee',
      employeeCode: 'TEST001'
    };

    // Mock authentication and checkin
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ employee: mockEmployee })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          record: { id: '1', type: 'checkin' },
          message: 'Entrada registrada correctamente'
        })
      });

    render(<MockedEmployeeKioskPage />);
    
    // Authenticate and checkin
    const employeeCodeInput = screen.getByPlaceholderText('Código de empleado');
    const totpInput = screen.getByPlaceholderText('Código TOTP');
    const authButton = screen.getByRole('button', { name: /autenticar/i });

    fireEvent.change(employeeCodeInput, { target: { value: 'TEST001' } });
    fireEvent.change(totpInput, { target: { value: '123456' } });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText('Test Employee')).toBeInTheDocument();
    });

    const checkinButton = screen.getByRole('button', { name: /fichar entrada/i });
    fireEvent.click(checkinButton);

    await waitFor(() => {
      expect(screen.getByText('Entrada registrada correctamente')).toBeInTheDocument();
    });

    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000);

    await waitFor(() => {
      expect(screen.queryByText('Entrada registrada correctamente')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });
});
