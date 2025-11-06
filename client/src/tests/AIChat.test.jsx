import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AIChat from '../components/AIChat';

// Mock fetch
global.fetch = vi.fn();

describe('AIChat', () => {
  const mockEmployee = {
    id: '1',
    name: 'Test Employee',
    employeeCode: 'TEST001'
  };

  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders chat interface correctly', () => {
    render(<AIChat employee={mockEmployee} />);
    
    expect(screen.getByText('Asistente IA Jarana')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Escribe tu mensaje...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  test('sends message and receives response', async () => {
    const mockResponse = {
      response: 'Hola, ¿en qué puedo ayudarte?',
      type: 'chat_response',
      timestamp: new Date().toISOString()
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(<AIChat employee={mockEmployee} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: 'Hola' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Hola, ¿en qué puedo ayudarte?')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ai/chat'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hola',
          userId: mockEmployee.id,
          userRole: 'employee'
        })
      })
    );
  });

  test('handles vacation request creation', async () => {
    const mockVacationResponse = {
      response: '✅ He creado tu solicitud de vacaciones del 01/12/2024 al 05/12/2024.',
      type: 'vacation_created',
      vacationId: 'vacation-123',
      timestamp: new Date().toISOString()
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVacationResponse
    });

    render(<AIChat employee={mockEmployee} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: 'Quiero vacaciones del 1 al 5 de diciembre' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/He creado tu solicitud de vacaciones/)).toBeInTheDocument();
    });
  });

  test('handles hours query', async () => {
    const mockHoursResponse = {
      response: 'Esta semana has trabajado aproximadamente 40 horas en 5 días.',
      type: 'hours_summary',
      data: { hours: 40, days: 5 },
      timestamp: new Date().toISOString()
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHoursResponse
    });

    render(<AIChat employee={mockEmployee} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: '¿Cuántas horas trabajé esta semana?' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Esta semana has trabajado aproximadamente 40 horas/)).toBeInTheDocument();
    });
  });

  test('handles punctuality analysis', async () => {
    const mockPunctualityResponse = {
      response: 'Análisis de puntualidad este mes:\n\n📊 Estadísticas:\n- Total entradas: 20\n- Llegadas tarde: 2\n- Puntuación de puntualidad: 90%',
      type: 'punctuality_analysis',
      data: { lateCount: 2, score: 90 },
      timestamp: new Date().toISOString()
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPunctualityResponse
    });

    render(<AIChat employee={mockEmployee} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: '¿Cómo está mi puntualidad?' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Análisis de puntualidad este mes/)).toBeInTheDocument();
    });
  });

  test('displays loading state while processing', async () => {
    // Mock a delayed response
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ response: 'Response', type: 'chat_response' })
        }), 100)
      )
    );

    render(<AIChat employee={mockEmployee} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    // Should show loading state
    expect(screen.getByText('Escribiendo...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Escribiendo...')).not.toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<AIChat employee={mockEmployee} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/Error al procesar tu mensaje/)).toBeInTheDocument();
    });
  });

  test('clears input after sending message', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Response', type: 'chat_response' })
    });

    render(<AIChat employee={mockEmployee} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  test('allows sending message with Enter key', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Response', type: 'chat_response' })
    });

    render(<AIChat employee={mockEmployee} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test('displays message history', async () => {
    const responses = [
      { response: 'First response', type: 'chat_response' },
      { response: 'Second response', type: 'chat_response' }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => responses[0]
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => responses[1]
      });

    render(<AIChat employee={mockEmployee} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    // Send first message
    fireEvent.change(input, { target: { value: 'First message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('First response')).toBeInTheDocument();
    });

    // Send second message
    fireEvent.change(input, { target: { value: 'Second message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Second response')).toBeInTheDocument();
    });

    // Both messages should be visible
    expect(screen.getByText('First response')).toBeInTheDocument();
    expect(screen.getByText('Second response')).toBeInTheDocument();
  });

  test('scrolls to bottom when new message arrives', async () => {
    const mockScrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = mockScrollIntoView;

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'Response', type: 'chat_response' })
    });

    render(<AIChat employee={mockEmployee} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByRole('button', { name: /enviar/i });

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalled();
    });
  });
});
