import { describe, it, expect, beforeEach } from 'vitest';
import { tasStudentPulseService } from './tasStudentPulseService';
import { tasFeedScraperService } from './tasFeedScraperService';
import { calcularScoreTAS, TASUserProfile } from '../utils/tasRecommendationAlgorithm';

describe('Serviços do Feed TAS — Student Pulse e News Ingestion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('tasStudentPulseService', () => {
    it('deve retornar o catálogo de enquetes do CEEP', () => {
      const polls = tasStudentPulseService.getPolls();
      expect(polls.length).toBeGreaterThanOrEqual(4);
      expect(polls.some(p => p.category === 'cursos')).toBe(true);
      expect(polls.some(p => p.category === 'transporte')).toBe(true);
      expect(polls.some(p => p.category === 'merenda')).toBe(true);
    });

    it('deve registrar voto de aluno e calcular porcentagens estatísticas', () => {
      const polls = tasStudentPulseService.getPolls();
      const firstPoll = polls[0];
      const firstOption = firstPoll.options[0];

      const beforeStats = tasStudentPulseService.getPollStats(firstPoll.id);
      const res = tasStudentPulseService.registerVote(firstPoll.id, firstOption.id);

      expect(res.success).toBe(true);
      expect(res.totalPollVotes).toBe(beforeStats.totalVotes + 1);

      const afterStats = tasStudentPulseService.getPollStats(firstPoll.id);
      const pickedOpt = afterStats.options.find(o => o.id === firstOption.id);
      expect(pickedOpt?.isUserPick).toBe(true);
      expect(pickedOpt?.votes).toBe(firstOption.baseVotes + 1);
    });

    it('deve submeter opinião aberta e registrar no cache de escuta ativa', () => {
      const success = tasStudentPulseService.submitOpenOpinion({
        pollId: 'poll_cursos_interesse',
        userName: 'Taylon Willian Santana',
        userRole: 'aluno',
        userTurma: '1º Informática',
        selectedOptionId: 'opt_ia_dev',
        opinionText: 'Gostaria de mais aulas práticas de programação e algoritmos de inteligência artificial.',
        sentiment: 'propositivo'
      });

      expect(success).toBe(true);
      const recent = tasStudentPulseService.getRecentOpinions();
      expect(recent.length).toBe(1);
      expect(recent[0].userName).toBe('Taylon Willian Santana');
      expect(recent[0].sentiment).toBe('propositivo');

      // Verifica se a palavra "programação" e "ia" alimentaram o vetor de interesses do TAS
      const interests: Record<string, number> = JSON.parse(localStorage.getItem('censo_tas_user_interests') || '{}');
      expect(interests['tecnologia']).toBeGreaterThan(0);
    });
  });

  describe('tasFeedScraperService', () => {
    it('deve retornar notícias curadas e converter para posts compatíveis com o Feed', async () => {
      const news = await tasFeedScraperService.getCuratedNews();
      expect(news.length).toBeGreaterThan(0);

      const converted = tasFeedScraperService.convertNewsToFeedPosts(news);
      expect(converted.length).toBe(news.length);
      expect(converted[0].type).toBe('noticia_curada');
      expect(converted[0].is_external_news).toBe(true);
      expect(converted[0].author_name).toBeDefined();
    });
  });

  describe('Algoritmo TAS — Retroalimentação com Interesses', () => {
    it('deve aumentar o score de posts relacionados aos interesses do aluno', () => {
      const user: TASUserProfile = {
        id: 'user-teste-123',
        nomeCompleto: 'Ana Lovelace',
        papel: 'aluno',
        turmaOuCargo: '2º Informática',
        interesses: { tecnologia: 3 }
      };

      const techPost = {
        id: 1,
        user_id: 'autor-1',
        author_name: 'Professor de TI',
        content: 'Oficina de PROGRAMAÇÃO e ALGORITMOS neste sábado no laboratório!',
        type: 'post',
        created_at: new Date().toISOString()
      };

      const regularPost = {
        id: 2,
        user_id: 'autor-2',
        author_name: 'Colega',
        content: 'Bom dia pessoal da escola!',
        type: 'post',
        created_at: new Date().toISOString()
      };

      const scoreTech = calcularScoreTAS(techPost, user);
      const scoreRegular = calcularScoreTAS(regularPost, user);

      expect(scoreTech.score).toBeGreaterThan(scoreRegular.score);
      expect(scoreTech.motivo).toContain('tecnologia');
    });
  });
});
