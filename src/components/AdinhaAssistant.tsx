import React, { useState, useRef, useEffect } from 'react';
import './AdinhaAssistant.css';

// Importações com o caminho correto da subpasta 'imgs'
import adinhaDefault from '../assets/imgs/adinhafrente.png';
import adinhaThinking from '../assets/imgs/adinhaexpressaopensativa.png';
import adinhaTalking from '../assets/imgs/adinhaexplicando.png';

interface Message {
  readonly id: string;
  readonly sender: 'adinha' | 'user';
  readonly text: string;
}

interface AdinhaAssistantProps {
  readonly endpointUrl?: string | null;
}

export const AdinhaAssistant: React.FC<AdinhaAssistantProps> = ({ endpointUrl = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<readonly Message[]>([
    {
      id: 'msg-init-1',
      sender: 'adinha',
      text: 'Olá! Sou a Adinha (Zios), sua tutora no Censo CEEP. Como posso te ajudar hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'thinking' | 'talking'>('idle');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const getAdinhaAvatar = () => {
    switch (status) {
      case 'thinking':
        return adinhaThinking;
      case 'talking':
        return adinhaTalking;
      default:
        return adinhaDefault;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || status === 'thinking') return;

    const userText = input.trim();
    const userMsgId = `user-${Date.now()}`;
    
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: userText }]);
    setInput('');
    setStatus('thinking');

    try {
      let replyText = '';

      if (endpointUrl) {
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: userText,
            agent: 'zios',
            context: 'censoceeps_tutoria'
          })
        });

        if (!response.ok) throw new Error('Erro de conexão com o servidor');
        const data = await response.json();
        replyText = data.reply || data.response || 'Processado com sucesso!';
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        replyText = `Recebi sua mensagem sobre "${userText}". O motor ZIOS da PentaIA processará as diretrizes do Censo CEEP assim que o endpoint for conectado.`;
      }

      const adinhaMsgId = `adinha-${Date.now()}`;
      setStatus('talking');
      setMessages((prev) => [...prev, { id: adinhaMsgId, sender: 'adinha', text: replyText }]);
    } catch (error) {
      console.error('Erro na integração com PentaIA:', error);
      const errorMsgId = `error-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: errorMsgId, sender: 'adinha', text: 'Ops! Ocorreu um erro ao consultar os serviços da PentaIA. Tente novamente em instantes.' }
      ]);
    } finally {
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <aside className="adinha-container" aria-label="Assistente Virtual Adinha">
      {isOpen && (
        <div className="adinha-chat-window">
          <div className="adinha-header">
            <div className="adinha-header-info">
              <img src={getAdinhaAvatar()} alt="Adinha" className="adinha-avatar-small" />
              <div className="adinha-title-group">
                <h4>Adinha</h4>
                <span className="adinha-subtitle">Powered by PentaIA (ZIOS)</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="adinha-close-btn" aria-label="Fechar">
              ✕
            </button>
          </div>

          <div className="adinha-messages-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`adinha-message-wrapper ${msg.sender}`}>
                <div className="adinha-bubble">{msg.text}</div>
              </div>
            ))}
            {status === 'thinking' && (
              <div className="adinha-status-indicator">Adinha está consultando o ZIOS...</div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="adinha-footer">
            <input
              type="text"
              className="adinha-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Pergunte à Adinha..."
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={status === 'thinking'}
              className="adinha-send-btn"
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      <button type="button" onClick={() => setIsOpen(!isOpen)} className="adinha-trigger-btn" aria-label="Abrir assistente Adinha">
        <img src={getAdinhaAvatar()} alt="Avatar Adinha" className="adinha-trigger-avatar" />
      </button>
    </aside>
  );
};