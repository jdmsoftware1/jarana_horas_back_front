import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, History, Trash2, Plus, ChevronLeft } from 'lucide-react';

const getApiUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl}/api`;
};

const AIChat = ({ userId, userRole = 'employee' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: '¡Hola! Soy tu asistente de IA de Jarana. Puedo ayudarte con consultas sobre horarios, vacaciones y registros. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar conversaciones al abrir el chat (solo para admin)
  useEffect(() => {
    if (isOpen && userRole === 'admin') {
      loadConversations();
    }
  }, [isOpen, userRole]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/ai-conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const saveConversation = async () => {
    if (messages.length <= 1) return; // No guardar si solo está el mensaje de bienvenida

    try {
      const token = localStorage.getItem('token');
      const conversationMessages = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp
      }));

      const response = await fetch(`${getApiUrl()}/ai-conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: currentConversationId,
          messages: conversationMessages,
          userRole
        })
      });

      if (response.ok) {
        const savedConversation = await response.json();
        setCurrentConversationId(savedConversation.id);
        await loadConversations();
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/ai-conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const conversation = await response.json();
        const loadedMessages = conversation.messages.map((msg, index) => ({
          id: index + 1,
          type: msg.role === 'user' ? 'user' : 'ai',
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        
        setMessages(loadedMessages);
        setCurrentConversationId(conversationId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/ai-conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadConversations();
        if (currentConversationId === conversationId) {
          startNewConversation();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const deleteAllConversations = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar TODAS las conversaciones? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl()}/ai-conversations`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setConversations([]);
        startNewConversation();
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error deleting all conversations:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: '¡Hola! Soy tu asistente de IA de Jarana. Puedo ayudarte con consultas sobre horarios, vacaciones y registros. ¿En qué puedo ayudarte?',
        timestamp: new Date()
      }
    ]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Construir historial de conversación para el backend
      const conversationHistory = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetch(`${getApiUrl()}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          userId,
          userRole,
          conversationHistory
        })
      });

      const data = await response.json();

      if (response.ok) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.response,
          timestamp: new Date(),
          metadata: data.type === 'vacation_created' ? {
            type: 'vacation_created',
            vacationId: data.vacationId
          } : null
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Guardar conversación automáticamente después de recibir respuesta (solo admin)
        if (userRole === 'admin') {
          setTimeout(() => saveConversation(), 500);
        }
      } else {
        throw new Error(data.error || 'Error en el chat');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSuggestions = () => {
    const suggestions = userRole === 'employee' ? [
      "¿Cuántas horas trabajé esta semana?",
      "¿He fichado entrada hoy?",
      "Quiero solicitar vacaciones del 15 al 20 de enero",
      "¿Cuál es mi horario de mañana?",
      "¿Cuántos días de vacaciones me quedan?"
    ] : [
      "Analiza los patrones de trabajo del último mes",
      "¿Qué empleados han llegado tarde esta semana?",
      "Muestra las anomalías más importantes",
      "¿Hay alguna alerta que deba revisar?",
      "Genera un resumen del rendimiento del equipo"
    ];

    return suggestions;
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-brand-light hover:bg-brand-medium text-brand-cream rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 relative"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
          
          {/* Notification indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">!</span>
          </div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat con IA - Pregunta sobre horarios o solicita vacaciones
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-neutral-mid/20 flex flex-col">
      {/* Header */}
      <div className="bg-brand-light text-brand-cream p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {showHistory && (
            <button
              onClick={() => setShowHistory(false)}
              className="hover:bg-brand-medium rounded-full p-1 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <Bot className="h-5 w-5" />
          <span className="font-medium">
            {showHistory ? 'Historial de Conversaciones' : 'Asistente IA Jarana'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {userRole === 'admin' && !showHistory && (
            <>
              <button
                onClick={startNewConversation}
                className="hover:bg-brand-medium rounded-full p-1 transition-colors"
                title="Nueva conversación"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="hover:bg-brand-medium rounded-full p-1 transition-colors relative"
                title="Ver historial"
              >
                <History className="h-4 w-4" />
                {conversations.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {conversations.length}
                  </span>
                )}
              </button>
            </>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-brand-medium rounded-full p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* History View */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-4">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay conversaciones guardadas</p>
              <button
                onClick={startNewConversation}
                className="mt-4 bg-brand-light text-brand-cream px-4 py-2 rounded-lg hover:bg-brand-medium transition-colors"
              >
                Iniciar nueva conversación
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">{conversations.length} conversaciones</p>
                {conversations.length > 0 && (
                  <button
                    onClick={deleteAllConversations}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Eliminar todas</span>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className="bg-neutral-light hover:bg-brand-light/10 p-3 rounded-lg cursor-pointer transition-colors border border-neutral-mid/20 group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-dark truncate">
                          {conv.title || 'Sin título'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(conv.lastMessageAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 p-1 transition-opacity"
                        title="Eliminar conversación"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-brand-light text-brand-cream'
                  : message.isError
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-neutral-light text-neutral-dark'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.type === 'ai' && (
                  <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                {message.type === 'user' && (
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.metadata?.type === 'vacation_created' && (
                    <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-green-800 text-xs">
                      ✅ Solicitud de vacaciones creada exitosamente
                    </div>
                  )}
                  <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-light text-neutral-dark rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Pensando...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-brand-medium mb-2">Prueba preguntando:</p>
          <div className="flex flex-wrap gap-1">
            {getSuggestions().slice(0, 2).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(suggestion)}
                className="text-xs bg-neutral-light hover:bg-brand-light/10 text-brand-medium hover:text-brand-dark px-2 py-1 rounded transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      {!showHistory && (
        <div className="p-4 border-t border-neutral-mid/20">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="flex-1 resize-none border border-neutral-mid/30 rounded-lg px-3 py-2 text-sm focus:border-brand-light focus:ring-0 focus:outline-none"
              rows="2"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-brand-light hover:bg-brand-medium text-brand-cream rounded-lg p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default AIChat;
