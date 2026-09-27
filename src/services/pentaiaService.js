const DEFAULT_API_BASE = '/api';

/**
 * Serviço PentaIA (ZIOS / Heimdall)
 *
 * Centraliza as integrações com o backend que processa prompt e respostas do
 * assistente Adinha no Censo CEEP.
 *
 * Fluxo esperado:
 * 1. Frontend envia mensagem para /api/v1/zios/chat
 * 2. Heimdall valida autenticação e autorização
 * 3. ZIOS processa prompt / contexto / histórico
 * 4. Resposta é devolvida em JSON para o cliente
 */

const getBaseUrl = () => {
  const envUrl = import.meta?.env?.VITE_PENTAIA_API_URL;
  return envUrl || DEFAULT_API_BASE;
};

const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Suporta autenticação via localStorage/sessionStorage
  const token =
    localStorage.getItem('supabase_access_token') ||
    sessionStorage.getItem('supabase_access_token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Extrai a resposta principal do backend, aceitando diferentes formatos.
 */
const extractReply = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return 'Não foi possível obter a resposta da PentaIA.';
  }

  return (
    payload.reply ||
    payload.response ||
    payload.message ||
    payload.data?.reply ||
    payload.data?.response ||
    'Processado com sucesso!'
  );
};

/**
 * Modo de desenvolvimento assistido: quando a API estiver indisponível,
 * retorna uma resposta simulada útil para manter o fluxo do chat funcional.
 */
const mockReply = (prompt) => {
  const normalizedPrompt = String(prompt || '').trim();

  if (!normalizedPrompt) {
    return 'Posso ajudar com dúvidas sobre o Censo CEEP. Como posso auxiliar você hoje?';
  }

  return `Olá! A Adinha está simulando uma resposta para: "${normalizedPrompt}". No ambiente real, esta mensagem seria processada pelo ZIOS via Heimdall e retornada com contexto do Censo CEEP.`;
};

export const pentaiaService = {
  /**
   * Envia uma mensagem para o backend do ZIOS.
   */
  async sendMessage({
    prompt,
    agent = 'zios',
    context = 'censoceeps_tutoria',
    history = [],
    userId = 'anonymous',
    sessionId = sessionStorage.getItem('session_id') || 'new_session'
  }) {
    const payload = {
      prompt,
      agent,
      context,
      user_id: userId,
      session_id: sessionId,
      conversation_history: history.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }))
    };

    const baseUrl = getBaseUrl();
    const endpoint = `${baseUrl}/v1/zios/chat`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ok: true,
        data,
        reply: extractReply(data),
        source: data?.source || 'zios'
      };
    } catch (error) {
      // Em desenvolvimento, permite continuar sem quebrar a UI
      const shouldMock = import.meta?.env?.VITE_PENTAIA_MOCK_MODE === 'true';

      if (shouldMock) {
        return {
          ok: true,
          mocked: true,
          data: { reply: mockReply(prompt), source: 'mock' },
          reply: mockReply(prompt),
          source: 'mock'
        };
      }

      console.error('❌ Erro na integração PentaIA:', error);
      return {
        ok: false,
        error: error.message,
        reply: 'Ops! Ocorreu um erro ao conectar aos serviços da PentaIA. Tente novamente em instantes.',
        source: 'error'
      };
    }
  },

  /**
   * Verifica disponibilidade do backend da PentaIA.
   */
  async healthCheck() {
    const baseUrl = getBaseUrl();
    const endpoint = `${baseUrl}/health`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Health check falhou: ${response.status}`);
      }

      return { ok: true, data: await response.json() };
    } catch (error) {
      console.warn('⚠️ Health check da PentaIA indisponível:', error.message);
      return { ok: false, error: error.message };
    }
  }
};

export default pentaiaService;
