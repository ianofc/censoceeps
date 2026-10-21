import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeName, isValidUuid, formatEntrevistaPayload } from '../lib/supabaseClient';
import { tasOfflineSync } from '../utils/tasOfflineSync';
import * as supabaseClientModule from '../lib/supabaseClient';

describe('Utilitários do Censo CEEP — supabaseClient', () => {
  describe('normalizeName', () => {
    it('deve remover acentos, converter para minúsculas e limpar espaços extras', () => {
      expect(normalizeName('  JOÃO DA CONCEIÇÃO  ')).toBe('joao da conceicao');
      expect(normalizeName('Ágata Élodie')).toBe('agata elodie');
    });

    it('deve remover prefixos escolares comuns (Professor, Profa., Aluno, Tia, etc.)', () => {
      expect(normalizeName('Professor Carlos Silva')).toBe('carlos silva');
      expect(normalizeName('Profa. Maria Helena')).toBe('maria helena');
      expect(normalizeName('Estudante Ada Lovelace')).toBe('ada lovelace');
      expect(normalizeName('Tia Joana')).toBe('joana');
    });

    it('deve retornar string vazia quando receber undefined ou vazio', () => {
      expect(normalizeName(undefined)).toBe('');
      expect(normalizeName('   ')).toBe('');
    });
  });

  describe('isValidUuid', () => {
    it('deve validar UUIDs v4 reais como verdadeiros', () => {
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUuid('  123e4567-e89b-12d3-a456-426614174000  ')).toBe(true);
    });

    it('deve rejeitar IDs locais, offline-user, strings vazias ou nulos', () => {
      expect(isValidUuid('offline-user')).toBe(false);
      expect(isValidUuid('local-1710000000-abcde')).toBe(false);
      expect(isValidUuid('')).toBe(false);
      expect(isValidUuid(null)).toBe(false);
      expect(isValidUuid(undefined)).toBe(false);
    });
  });

  describe('formatEntrevistaPayload', () => {
    it('deve sanitizar e formatar os campos obrigatórios com valores padrão seguros', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const raw = {
        entrevistador_id: 'offline-user',
        nome_participante: '  ada lovelace  ',
        contato_whatsapp: ' 75999999999 ',
        vinculo: 'ESTUDANTE_TECNICO',
        serie: ' 2º Ano ',
        turma: ' Informática A ',
        relato_sofreu: ' Relato de teste ',
      };

      const formatted = formatEntrevistaPayload(raw, validUuid);

      expect(formatted.entrevistador_id).toBe(validUuid);
      expect(formatted.nome_participante).toBe('ADA LOVELACE');
      expect(formatted.contato_whatsapp).toBe('75999999999');
      expect(formatted.vinculo).toBe('ESTUDANTE_TECNICO');
      expect(formatted.serie).toBe('2º Ano');
      expect(formatted.turma).toBe('Informática A');
      expect(formatted.relato_preconceito).toBe('Relato de teste');
      expect(formatted.cidade_natal).toBe('Seabra');
      expect(formatted.local_moradia).toBe('Sede de Seabra');
    });

    it('deve definir entrevistador_id como null caso nenhum UUID válido seja fornecido', () => {
      const formatted = formatEntrevistaPayload({
        entrevistador_id: 'local-123',
        nome_participante: 'Alan Turing',
      });

      expect(formatted.entrevistador_id).toBeNull();
      expect(formatted.nome_participante).toBe('ALAN TURING');
    });
  });
});

describe('Sincronização Offline — tasOfflineSync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('saveDraftOffline: deve salvar ficha no localStorage e evitar duplicidade do mesmo participante', () => {
    tasOfflineSync.saveDraftOffline({
      nome_participante: 'Ada Lovelace',
      vinculo: 'ESTUDANTE_REGULAR',
      turma: 'Info A',
    });

    let drafts = tasOfflineSync.getDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].nome_participante).toBe('ADA LOVELACE');
    const firstId = drafts[0].id;

    // Salva novamente a mesma pessoa com acento/caixa diferente para testar deduplicação
    tasOfflineSync.saveDraftOffline({
      nome_participante: '  ádà lovelace ',
      vinculo: 'ESTUDANTE_TECNICO',
      turma: 'Info B',
    });

    drafts = tasOfflineSync.getDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0].id).toBe(firstId);
    expect(drafts[0].turma).toBe('Info B');
  });

  it('syncOfflineData: deve sincronizar fichas pendentes e limpar a fila em caso de sucesso', async () => {
    const spySalvar = vi
      .spyOn(supabaseClientModule, 'salvarEntrevistaResiliente')
      .mockResolvedValue({ data: [{ id: '1' }], error: null });

    tasOfflineSync.saveDraftOffline({
      nome_participante: 'Katherine Johnson',
      vinculo: 'ESTUDANTE_REGULAR',
    });

    const result = await tasOfflineSync.syncOfflineData('550e8400-e29b-41d4-a716-446655440000');

    expect(spySalvar).toHaveBeenCalledTimes(1);
    expect(result.syncedCount).toBe(1);
    expect(result.remainingCount).toBe(0);
    expect(tasOfflineSync.getDrafts()).toHaveLength(0);
  });

  it('syncOfflineData: deve manter na fila fichas que falharem na sincronização', async () => {
    vi.spyOn(supabaseClientModule, 'salvarEntrevistaResiliente').mockResolvedValue({
      data: null,
      error: new Error('Falha de rede simulada'),
    });

    tasOfflineSync.saveDraftOffline({
      nome_participante: 'Grace Hopper',
      vinculo: 'PROFESSOR',
    });

    const result = await tasOfflineSync.syncOfflineData('550e8400-e29b-41d4-a716-446655440000');

    expect(result.syncedCount).toBe(0);
    expect(result.remainingCount).toBe(1);
    expect(tasOfflineSync.getDrafts()).toHaveLength(1);
  });
});
