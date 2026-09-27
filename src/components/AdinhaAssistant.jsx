import React, { useState, useRef, useEffect } from 'react';

// Importações diretas de assets do Vite
// Adinha em diferentes estados
import adinhaDefault from '../assets/imgs/adinhafrente.png';
import adinhaThinking from '../assets/imgs/adinhaideia.png';
import adinhaTalking from '../assets/imgs/adinhaexplicando.png';
import adinhaHappy from '../assets/imgs/adinhaexpressaofeliz.png';
import adinhaConfused from '../assets/imgs/adinhaexpressaoconfusa.png';

// Logo e ícone
import adaLogoMain from '../assets/imgs/Ada Lovelace.png';
import adaLogoIco from '../assets/imgs/Ada Lovelace.ico';

/**
 * Componente AdinhaAssistant
 * 
 * Assistente virtual baseado em Ada Lovelace (Adinha) que integra com:
 * - ZIOS: Motor de processamento de linguagem natural
 * - Heimdall: Middleware de autenticação e segurança
 * - TAS: Sistema de busca vetorial
 * - IRIS: Análise de dados do Censo
 * 
 * @component
 * @returns {JSX.Element} Widget flutuante do chat da Adinha
 */
export const AdinhaAssistant = () => {
  // ============ ESTADO ============
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'adinha',
      text: 'Olá! Sou a Adinha, sua assistente baseada em Ada Lovelace. Como posso ajudar você no Censo CEEP hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | thinking | talking | error
  const [messageCount, setMessageCount] = useState(1);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  // ============ EFEITOS ============
  
  // Auto-scroll quando há novas mensagens
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus no input quando o chat abre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ============ FUNÇÕES AUXILIARES ============

  /**
   * Retorna a imagem da Adinha baseada no estado atual
   * @returns {string} Caminho da imagem
   */
  const getAdinhaAvatar = () => {
    switch (status) {
      case 'thinking':
        return adinhaThinking; // Pensando/Consultando ZIOS
      case 'talking':
        return adinhaTalking; // Explicando resposta
      case 'error':
        return adinhaConfused; // Confusa (erro)
      default:
        return adinhaDefault; // Estado padrão
    }
  };

  /**
   * Envia mensagem para o backend (Heimdall → ZIOS)
   * @param {string} userText - Texto da pergunta do usuário
   */
  const handleSendMessage = async () => {
    if (!input.trim() || status === 'thinking') return;

    const userText = input.trim();
    const userMessageId = messageCount + 1;

    // Adiciona mensagem do usuário ao chat
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        sender: 'user',
        text: userText,
        timestamp: new Date()
      }
    ]);

    setInput('');
    setMessageCount(userMessageId);
    setStatus('thinking');

    try {
      // ============ CHAMADA PARA PENTAIA (HEIMDALL → ZIOS) ============
      // 
      // Fluxo:
      // 1. Requisição chega ao Heimdall (middleware/gatekeeper)
      // 2. Heimdall autentica via Supabase/JWT
      // 3. Heimdall roteia para ZIOS (/api/v1/zios/chat)
      // 4. ZIOS processa o prompt com contexto do Censo CEEP
      // 5. ZIOS pode consultar TAS (busca vetorial) para contexto adicional
      // 6. Resposta volta através de Heimdall para o frontend
      //
      const response = await fetch('/api/v1/zios/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Comentado: adicionar token JWT do Supabase quando autenticado
          // 'Authorization': `Bearer ${supabaseToken}`
        },
        body: JSON.stringify({
          prompt: userText,
          agent: 'zios',
          context: 'censoceeps_tutoria',
          user_id: 'anonymous', // TODO: substituir por user_id real do Supabase
          session_id: sessionStorage.getItem('session_id') || 'new_session',
          conversation_history: messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extrai a resposta do ZIOS (pode vir em diferentes formatos)
      const adinhaReply = data.reply || data.response || data.message || 
        'Processado com sucesso! Estou consultando os dados do Censo.';

      setStatus('talking');
      const adinhaMessageId = userMessageId + 1;

      setMessages((prev) => [
        ...prev,
        {
          id: adinhaMessageId,
          sender: 'adinha',
          text: adinhaReply,
          timestamp: new Date(),
          metadata: {
            source: data.source || 'zios',
            confidence: data.confidence || null
          }
        }
      ]);

      setMessageCount(adinhaMessageId);

    } catch (error) {
      console.error('❌ Erro na integração PentaIA (Heimdall/ZIOS):', error);
      
      setStatus('error');
      const errorMessageId = messageCount + 2;

      setMessages((prev) => [
        ...prev,
        {
          id: errorMessageId,
          sender: 'adinha',
          text: `Ops! Ocorreu um erro ao conectar aos serviços da PentaIA. 
          
Detalhes: ${error.message}

Tente novamente em instantes ou verifique a conexão com o servidor Heimdall.`,
          timestamp: new Date(),
          isError: true
        }
      ]);

      setMessageCount(errorMessageId);

    } finally {
      // Retorna ao estado idle após exibir resposta
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  /**
   * Handler para tecla Enter no input
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ============ RENDER ============

  return (
    <aside 
      aria-label="Assistente Virtual Adinha - Censo CEEP" 
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
    >
      {/* ========== JANELA MODAL DO CHAT ========== */}
      {isOpen && (
        <div
          style={{
            width: '360px',
            height: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.16)',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '16px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          {/* ===== CABEÇALHO ===== */}
          <div
            style={{
              backgroundColor: '#0f172a',
              backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #1e293b'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={getAdinhaAvatar()}
                alt="Avatar Adinha"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #94a3b8',
                  flexShrink: 0
                }}
              />
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '700' }}>
                  Adinha
                </h4>
                <span style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🚀 PentaIA (ZIOS)
                  {status === 'thinking' && ' • Consultando...'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fechar chat"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s ease',
                ':hover': { color: '#ffffff' }
              }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              ✕
            </button>
          </div>

          {/* ===== CORPO DAS MENSAGENS ===== */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#64748b',
                fontSize: '13px',
                padding: '20px',
                fontStyle: 'italic'
              }}>
                Nenhuma mensagem ainda. Comece a conversa!
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeIn 0.3s ease-out'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' 
                      ? '14px 14px 4px 14px'
                      : '14px 14px 14px 4px',
                    backgroundColor: msg.sender === 'user'
                      ? '#2563eb'
                      : msg.isError
                      ? '#fee2e2'
                      : '#ffffff',
                    color: msg.sender === 'user'
                      ? '#ffffff'
                      : msg.isError
                      ? '#991b1b'
                      : '#1e293b',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    boxShadow: msg.sender === 'user'
                      ? 'none'
                      : '0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: msg.sender === 'user'
                      ? 'none'
                      : msg.isError
                      ? '1px solid #fca5a5'
                      : '1px solid #e2e8f0'
                  }}
                >
                  {msg.text}
                  {msg.metadata?.source && (
                    <div style={{
                      fontSize: '10px',
                      color: msg.sender === 'user' ? '#e0e7ff' : '#94a3b8',
                      marginTop: '6px',
                      opacity: 0.7
                    }}>
                      Fonte: {msg.metadata.source}
                      {msg.metadata.confidence && ` (${(msg.metadata.confidence * 100).toFixed(0)}%)`}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {status === 'thinking' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#64748b',
                fontStyle: 'italic',
                padding: '12px',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  animation: 'pulse 1.5s infinite'
                }} />
                Adinha está consultando o ZIOS...
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* ===== INPUT E ENVIO ===== */}
          <div
            style={{
              padding: '14px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte à Adinha..."
              disabled={status === 'thinking'}
              aria-label="Campo de input para enviar mensagem"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                backgroundColor: status === 'thinking' ? '#f1f5f9' : '#ffffff',
                cursor: status === 'thinking' ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={status === 'thinking' || !input.trim()}
              aria-label="Enviar mensagem"
              style={{
                padding: '10px 16px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: (status === 'thinking' || !input.trim()) ? 'not-allowed' : 'pointer',
                opacity: (status === 'thinking' || !input.trim()) ? 0.6 : 1,
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (status !== 'thinking' && input.trim()) {
                  e.target.style.backgroundColor = '#1d4ed8';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2563eb';
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      {/* ========== BOTÃO FLUTUANTE / AVATAR ========== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Fechar chat com Adinha' : 'Abrir chat com Adinha'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          outline: 'none',
          transition: 'transform 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <img
          src={getAdinhaAvatar()}
          alt={isOpen ? 'Adinha (chat aberto)' : 'Adinha (clique para abrir chat)'}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
            border: '3px solid #ffffff',
            objectFit: 'cover',
            transition: 'box-shadow 0.2s ease'
          }}
        />
        {/* Badge de notificação (quando há novas mensagens) */}
        {!isOpen && messages.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '24px',
              height: '24px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              border: '2px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#ffffff',
              animation: 'pulse 2s infinite'
            }}
          >
            {messages.filter(m => m.sender === 'adinha').length}
          </div>
        )}
      </button>

      {/* ========== ESTILOS GLOBAIS (KEYFRAMES) ========== */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </aside>
  );
};

export default AdinhaAssistant;