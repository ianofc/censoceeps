import { describe, it, expect } from 'vitest';
import {
  HeimdallSecurityService,
  TasRankingService,
  IrisScannerService,
  ZiosPedagogicCopilot,
  MercurioDataHub
} from './index';

describe('Ecossistema PentaIA - Testes dos Serviços', () => {
  describe('HEIMDALL - Segurança e Mascaramento', () => {
    it('deve mascarar CPF corretamente', () => {
      const masked = HeimdallSecurityService.maskCPF('12345678901');
      expect(masked).toBe('123.***.***-01');
    });

    it('deve mascarar telefone corretamente', () => {
      const masked = HeimdallSecurityService.maskPhone('75999887766');
      expect(masked).toBe('(75) 9****-7766');
    });

    it('deve mascarar email mantendo provedor', () => {
      const masked = HeimdallSecurityService.maskEmail('estudante@ceep.ba.gov.br');
      expect(masked).toBe('e***e@ceep.ba.gov.br');
    });

    it('deve sanitizar tags script para evitar injeções', () => {
      const clean = HeimdallSecurityService.sanitizeInput('<script>alert("xss")</script>Texto Seguro');
      expect(clean).toBe('Texto Seguro');
    });
  });

  describe('TAS - Thalamus e SARA', () => {
    it('deve calcular prioridade de busca ativa ordenando por maior urgência', () => {
      const esperados = { '1º DS': 40, '2º ADM': 35, '3º AGRO': 30 };
      const coletados = { '1º DS': 10, '2º ADM': 30, '3º AGRO': 12 };

      const prioridades = TasRankingService.calcularPrioridadesBuscaAtiva(esperados, coletados);

      expect(prioridades[0].turma).toBe('1º DS');
      expect(prioridades[0].indiceUrgencia).toBe('critica');
      expect(prioridades[prioridades.length - 1].turma).toBe('2º ADM');
    });

    it('deve identificar possíveis duplicidades de formulários', () => {
      const fichas = [
        { id: '1', student_name: 'Carlos Silva', class_name: '1º DS' },
        { id: '2', student_name: 'Carlos Silva', class_name: '1º DS' }
      ];

      const conflitos = TasRankingService.detectarConflitos(fichas);
      expect(conflitos.some(c => c.tipo === 'duplicidade_nome')).toBe(true);
    });
  });

  describe('IRIS - Tendências e Momentum', () => {
    it('deve classificar velocidade e projeção de metas', () => {
      const momentum = IrisScannerService.calcularMomentum(150, 500, 30);
      expect(momentum.taxaVelocidadeDiaria).toBe(10);
      expect(momentum.statusRitmo).toBe('estavel');
      expect(momentum.diasEstimadosParaConclusao).toBe(35);
      expect(momentum.projecaoMetaAlcancavel).toBe(false);
    });

    it('deve mapear tendências de transporte e internet', () => {
      const fichas = [
        { internet: 'não', commute_time: 'mais de 1h', trabalha: 'sim' },
        { internet: 'não', commute_time: '15 min', trabalha: 'não' }
      ];

      const tend = IrisScannerService.extrairTendencias(fichas);
      expect(tend.percentualSemInternet).toBe(100);
      expect(tend.percentualTransporteLongo).toBe(50);
      expect(tend.percentualAlunosTrabalhadores).toBe(50);
      expect(tend.alertasPrincipais.length).toBeGreaterThan(0);
    });
  });

  describe('ZIOS - Copiloto Pedagógico', () => {
    it('deve gerar súmula com orientações para a coordenação', () => {
      const sumula = ZiosPedagogicCopilot.gerarSumulaTurma('2º DS', 30, {
        percentualSemInternet: 40,
        percentualTransporteLongo: 35,
        percentualTrabalhadores: 25
      });

      expect(sumula.pontosAtencao.length).toBe(3);
      expect(sumula.orientacoesPedagogicas.length).toBe(3);
    });

    it('deve alertar sobre relatos de risco de evasão', () => {
      const obs = [
        { id: '1', texto: 'Estou pensando em desistir por falta de transporte' }
      ];

      const alertas = ZiosPedagogicCopilot.triagemRespostasAbertas(obs);
      expect(alertas.length).toBe(1);
      expect(alertas[0].categoria).toBe('risco_evasao');
    });
  });

  describe('MERCÚRIO - Hub de Dados', () => {
    it('deve empacotar o payload unificado e disponibilizar cache', () => {
      const payload = MercurioDataHub.montarPayload({
        prioridades: [],
        conflitos: [],
        momentum: {
          taxaVelocidadeDiaria: 5,
          statusRitmo: 'estavel',
          diasEstimadosParaConclusao: 10,
          projecaoMetaAlcancavel: true
        },
        tendencias: {
          percentualSemInternet: 10,
          percentualTransporteLongo: 15,
          percentualAlunosTrabalhadores: 5,
          alertasPrincipais: []
        },
        alertas: [],
        totalSumulas: 3
      });

      expect(payload.timestamp).toBeDefined();
      expect(MercurioDataHub.getCachedPayload()).not.toBeNull();

      MercurioDataHub.invalidarCache();
      expect(MercurioDataHub.getCachedPayload()).toBeNull();
    });
  });
});
