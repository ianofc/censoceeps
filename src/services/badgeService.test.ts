import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BADGE_CATALOG, badgeService } from './badgeService';
import { supabase } from '../lib/supabaseClient';

describe('Serviço de Gamificação — badgeService', () => {
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();

    // Mock padrão do supabase.from para isolar testes unitários da rede
    vi.spyOn(supabase, 'from').mockImplementation(() => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      return builder;
    });
  });

  describe('Catálogo de Insígnias (BADGE_CATALOG / getAllBadges)', () => {
    it('deve conter todas as insígnias com metadados obrigatórios íntegros e raridades válidas', () => {
      const allBadges = badgeService.getAllBadges();
      expect(allBadges.length).toBeGreaterThanOrEqual(12);
      expect(allBadges.length).toBe(BADGE_CATALOG.length);

      const validRarities = ['comum', 'raro', 'epico', 'lendario'];
      const validCategories = ['acesso', 'social', 'chat', 'censo', 'exploracao', 'perfil'];
      const ids = new Set<string>();

      for (const badge of allBadges) {
        expect(badge.id).toBeTruthy();
        expect(ids.has(badge.id)).toBe(false);
        ids.add(badge.id);

        expect(badge.name).toBeTruthy();
        expect(badge.description).toBeTruthy();
        expect(badge.icon).toBeTruthy();
        expect(validRarities).toContain(badge.rarity);
        expect(validCategories).toContain(badge.category);
        expect(badge.xpReward).toBeGreaterThan(0);
        expect(badge.criteria).toBeTruthy();
      }
    });

    it('deve retornar as insígnias ordenadas pelo campo order ascendente', () => {
      const allBadges = badgeService.getAllBadges();
      for (let i = 1; i < allBadges.length; i++) {
        expect(allBadges[i].order).toBeGreaterThanOrEqual(allBadges[i - 1].order);
      }
    });
  });

  describe('getUserBadges e unlockBadge', () => {
    it('deve retornar lista vazia quando o usuário ainda não possui insígnias', async () => {
      const badges = await badgeService.getUserBadges(TEST_USER_ID);
      expect(badges).toEqual([]);
    });

    it('deve desbloquear uma insígnia no localStorage, prevenir duplicidade e emitir o evento ceep-badge-unlocked', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      // 1º desbloqueio: deve ter sucesso e disparar evento
      const firstAttempt = await badgeService.unlockBadge(TEST_USER_ID, 'primeiro_acesso');
      expect(firstAttempt.unlocked).toBe(true);
      expect(firstAttempt.badge?.id).toBe('primeiro_acesso');

      const storedBadges = await badgeService.getUserBadges(TEST_USER_ID);
      expect(storedBadges).toHaveLength(1);
      expect(storedBadges[0].badgeId).toBe('primeiro_acesso');

      const unlockedEvents = dispatchSpy.mock.calls.filter(
        (call) => (call[0] as CustomEvent).type === 'ceep-badge-unlocked'
      );
      expect(unlockedEvents).toHaveLength(1);
      expect((unlockedEvents[0][0] as CustomEvent).detail.badge.id).toBe('primeiro_acesso');

      // 2º desbloqueio da mesma insígnia: deve prevenir duplicidade e não emitir novo evento
      const secondAttempt = await badgeService.unlockBadge(TEST_USER_ID, 'primeiro_acesso');
      expect(secondAttempt.unlocked).toBe(false);

      const badgesAfterDuplicate = await badgeService.getUserBadges(TEST_USER_ID);
      expect(badgesAfterDuplicate).toHaveLength(1);
    });

    it('não deve emitir o evento ceep-badge-unlocked quando a opção silent for true', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      const res = await badgeService.unlockBadge(TEST_USER_ID, 'primeira_entrevista', { silent: true });
      expect(res.unlocked).toBe(true);

      const unlockedEvents = dispatchSpy.mock.calls.filter(
        (call) => (call[0] as CustomEvent).type === 'ceep-badge-unlocked'
      );
      expect(unlockedEvents).toHaveLength(0);
    });

    it('deve retornar unlocked: false se o badgeId não existir no catálogo', async () => {
      const res = await badgeService.unlockBadge(TEST_USER_ID, 'badge_inexistente_xyz');
      expect(res.unlocked).toBe(false);
    });
  });

  describe('recordExplorationVisit', () => {
    it('deve desbloquear a insígnia explorador_do_saber somente após visitar tanto jornal quanto biblioteca', async () => {
      // Visita apenas o jornal
      await badgeService.recordExplorationVisit(TEST_USER_ID, 'jornal');
      let badges = await badgeService.getUserBadges(TEST_USER_ID);
      expect(badges.some((b) => b.badgeId === 'explorador_do_saber')).toBe(false);

      // Visita novamente o jornal (ainda falta biblioteca)
      await badgeService.recordExplorationVisit(TEST_USER_ID, 'jornal');
      badges = await badgeService.getUserBadges(TEST_USER_ID);
      expect(badges.some((b) => b.badgeId === 'explorador_do_saber')).toBe(false);

      // Visita a biblioteca -> agora completou ambos os módulos
      await badgeService.recordExplorationVisit(TEST_USER_ID, 'biblioteca');
      badges = await badgeService.getUserBadges(TEST_USER_ID);
      expect(badges.some((b) => b.badgeId === 'explorador_do_saber')).toBe(true);
    });
  });
});
