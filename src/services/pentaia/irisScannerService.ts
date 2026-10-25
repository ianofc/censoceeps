/**
 * IRIS — Scanner de Tendências e Percepção em Tempo Real
 * 
 * Responsabilidades:
 * 1. Monitoramento dinâmico de cobertura e velocidade de preenchimento (momentum)
 * 2. Mapeamento de tendências transversais (transporte, conectividade, evasão)
 * 3. Projeção temporal de conclusão do Censo
 */

export interface MetricasMomentum {
  taxaVelocidadeDiaria: number; // submissões por dia (média móvel recente)
  statusRitmo: 'acelerado' | 'estavel' | 'lento' | 'estagnado';
  diasEstimadosParaConclusao: number | null;
  projecaoMetaAlcancavel: boolean;
}

export interface TendenciasDemograficas {
  percentualSemInternet: number;
  percentualTransporteLongo: number; // mais de 1 hora de trajeto
  percentualAlunosTrabalhadores: number;
  alertasPrincipais: string[];
}

export class IrisScannerService {
  /**
   * Calcula o momentum e velocidade de submissão do censo
   */
  public static calcularMomentum(
    totalSubmissoes: number,
    metaTotal: number,
    submissoesUltimos3Dias: number
  ): MetricasMomentum {
    const velocidadeDiaria = Math.round((submissoesUltimos3Dias / 3) * 10) / 10;
    const faltantes = Math.max(0, metaTotal - totalSubmissoes);

    let statusRitmo: 'acelerado' | 'estavel' | 'lento' | 'estagnado' = 'estavel';
    if (velocidadeDiaria === 0) {
      statusRitmo = 'estagnado';
    } else if (velocidadeDiaria < 5) {
      statusRitmo = 'lento';
    } else if (velocidadeDiaria > 20) {
      statusRitmo = 'acelerado';
    }

    let diasEstimados: number | null = null;
    let projecaoAlcancavel = false;

    if (velocidadeDiaria > 0) {
      diasEstimados = Math.ceil(faltantes / velocidadeDiaria);
      projecaoAlcancavel = diasEstimados <= 30; // janela de 30 dias de campanha
    }

    return {
      taxaVelocidadeDiaria: velocidadeDiaria,
      statusRitmo,
      diasEstimadosParaConclusao: diasEstimados,
      projecaoMetaAlcancavel: projecaoAlcancavel
    };
  }

  /**
   * Agrupa tendências demográficas emergentes com base nos formulários respondidos
   */
  public static extrairTendencias(fichas: Array<Record<string, any>>): TendenciasDemograficas {
    if (!fichas || fichas.length === 0) {
      return {
        percentualSemInternet: 0,
        percentualTransporteLongo: 0,
        percentualAlunosTrabalhadores: 0,
        alertasPrincipais: []
      };
    }

    const total = fichas.length;
    let semInternetCount = 0;
    let transporteLongoCount = 0;
    let trabalhaCount = 0;

    fichas.forEach(f => {
      // Indicador de internet
      const net = String(f.has_internet ?? f.internet ?? '').toLowerCase();
      if (net === 'não' || net === 'nao' || net === 'false') semInternetCount++;

      // Indicador de transporte
      const tempo = String(f.transporte_tempo ?? f.commute_time ?? '').toLowerCase();
      if (tempo.includes('mais de 1h') || tempo.includes('2h') || tempo.includes('longo') || tempo.includes('> 1h')) {
        transporteLongoCount++;
      }

      // Aluno trabalhador
      const trab = String(f.is_working ?? f.trabalha ?? '').toLowerCase();
      if (trab === 'sim' || trab === 'true') trabalhaCount++;
    });

    const pInternet = Math.round((semInternetCount / total) * 100);
    const pTransporte = Math.round((transporteLongoCount / total) * 100);
    const pTrabalho = Math.round((trabalhaCount / total) * 100);

    const alertas: string[] = [];
    if (pTransporte >= 30) {
      alertas.push(`Atenção: ${pTransporte}% dos alunos relatam deslocamento superior a 1 hora até o CEEP.`);
    }
    if (pInternet >= 25) {
      alertas.push(`Inclusão Digital: ${pInternet}% dos estudantes não possuem conectividade estável domiciliar.`);
    }
    if (pTrabalho >= 20) {
      alertas.push(`Perfil Trabalhador: ${pTrabalho}% dos estudantes conciliam estudos com jornada de trabalho.`);
    }

    return {
      percentualSemInternet: pInternet,
      percentualTransporteLongo: pTransporte,
      percentualAlunosTrabalhadores: pTrabalho,
      alertasPrincipais: alertas
    };
  }
}
