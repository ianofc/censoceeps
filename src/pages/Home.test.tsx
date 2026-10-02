import { describe, it, expect, vi } from 'vitest';

// Exemplo da Sequência Algorítmica de Validação (Vitest)
// Em um cenário real, essas lógicas estariam isoladas em funções de domínio (Clean Architecture).

function validarFicha(ficha: any) {
  if (!ficha.nome_participante || ficha.nome_participante.trim() === '') {
    return { valido: false, erro: 'Preencha o nome do participante.' };
  }
  if (!ficha.vinculo) {
    return { valido: false, erro: 'Vínculo obrigatório.' };
  }
  return { valido: true, erro: null };
}

function salvarFicha(ficha: any, isOnline: boolean) {
  const validacao = validarFicha(ficha);
  if (!validacao.valido) return validacao;

  if (!isOnline) {
    // Simula salvar no localStorage
    return { valido: true, erro: null, sucesso: true, mensagem: 'Salva localmente com segurança no dispositivo (Modo Offline).' };
  }

  // Simula enviar para API/Supabase
  return { valido: true, erro: null, sucesso: true, mensagem: 'Dados sincronizados com a nuvem.' };
}

describe('Sequência Algorítmica: Submissão de Ficha de Coleta', () => {
  it('Passo 2: Deve falhar se o nome do participante estiver vazio', () => {
    const fichaInvalida = { nome_participante: '', vinculo: 'ESTUDANTE_REGULAR' };
    const resultado = salvarFicha(fichaInvalida, true);
    
    expect(resultado.valido).toBe(false);
    expect(resultado.erro).toBe('Preencha o nome do participante.');
  });

  it('Passo 3 (Online): Deve simular envio com sucesso para nuvem', () => {
    const fichaValida = { nome_participante: 'Ada Lovelace', vinculo: 'ESTUDANTE_REGULAR' };
    const resultado = salvarFicha(fichaValida, true);
    
    expect(resultado.sucesso).toBe(true);
    expect(resultado.mensagem).toContain('nuvem');
  });

  it('Passo 3 (Offline): Deve simular salvamento no localStorage', () => {
    const fichaValida = { nome_participante: 'Alan Turing', vinculo: 'ESTUDANTE_REGULAR' };
    const resultado = salvarFicha(fichaValida, false);
    
    expect(resultado.sucesso).toBe(true);
    expect(resultado.mensagem).toContain('localmente');
  });
});
