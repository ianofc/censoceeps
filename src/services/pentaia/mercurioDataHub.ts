import { TurmaPrioridade, ConflitoCadastral } from './tasRankingService';
import { MetricasMomentum, TendenciasDemograficas } from './irisScannerService';
import { SumulaPedagogicaTurma, AlertaVulnerabilidade } from './ziosPedagogicCopilot';

/**
 * MERCÚRIO — Hub Unificado de Roteamento e Transporte de Dados
 * 
 * Responsabilidades:
 * 1. Agregação em Payload Único (CensusFeedPayload) para evitar chamadas dispersas
 * 2. Cache em memória para dashboards
 * 3. Orquestração de mensagens de alerta e atualizações instantâneas
 */

export interface CensusFeedPayload {
  timestamp: string;
  tas: {
    prioridadesBuscaAtiva: TurmaPrioridade[];
    conflitosDetectados: ConflitoCadastral[];
  };
  iris: {
    momentum: MetricasMomentum;
    tendencias: TendenciasDemograficas;
  };
  zios: {
    alertasVulnerabilidade: AlertaVulnerabilidade[];
    sumulasDisponiveis: number;
  };
}

export class MercurioDataHub {
  private static cachedPayload: CensusFeedPayload | null = null;
  private static lastFetchTime = 0;
  private static CACHE_TTL_MS = 30000; // 30 segundos de cache

  /**
   * Consolida um payload estruturado para alimentar dashboards sem sobrecarregar a rede
   */
  public static montarPayload(params: {
    prioridades: TurmaPrioridade[];
    conflitos: ConflitoCadastral[];
    momentum: MetricasMomentum;
    tendencias: TendenciasDemograficas;
    alertas: AlertaVulnerabilidade[];
    totalSumulas: number;
  }): CensusFeedPayload {
    const payload: CensusFeedPayload = {
      timestamp: new Date().toISOString(),
      tas: {
        prioridadesBuscaAtiva: params.prioridades,
        conflitosDetectados: params.conflitos
      },
      iris: {
        momentum: params.momentum,
        tendencias: params.tendencias
      },
      zios: {
        alertasVulnerabilidade: params.alertas,
        sumulasDisponiveis: params.totalSumulas
      }
    };

    this.cachedPayload = payload;
    this.lastFetchTime = Date.now();
    return payload;
  }

  /**
   * Obtém o payload atual em cache ou nulo se expirado
   */
  public static getCachedPayload(): CensusFeedPayload | null {
    if (!this.cachedPayload) return null;
    if (Date.now() - this.lastFetchTime > this.CACHE_TTL_MS) {
      return null;
    }
    return this.cachedPayload;
  }

  /**
   * Invalida o cache quando ocorrem novas inserções confirmadas
   */
  public static invalidarCache(): void {
    this.cachedPayload = null;
    this.lastFetchTime = 0;
  }
}
