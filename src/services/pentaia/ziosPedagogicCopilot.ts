/**
 * ZIOS — Cérebro e Copiloto Pedagógico
 * 
 * Responsabilidades:
 * 1. Diagnóstico contextual automático de turma para coordenadores e professores
 * 2. Auditoria ética de respostas abertas e relatos de vulnerabilidade
 * 3. Barreiras de segurança ética (sem emissão de diagnósticos clínicos)
 */

export interface SumulaPedagogicaTurma {
  turma: string;
  resumoGeral: string;
  pontosAtencao: string[];
  orientacoesPedagogicas: string[];
}

export interface AlertaVulnerabilidade {
  origem: string; // Ex: ID ou campo de observação
  trecho: string;
  categoria: 'risco_evasao' | 'vulnerabilidade_social' | 'apoio_psicopedagogico';
  recomendacaoEncaminhamento: string;
}

export class ZiosPedagogicCopilot {
  /**
   * Gera uma súmula executiva pedagógica para o professor da turma
   */
  public static gerarSumulaTurma(
    turma: string,
    totalAlunos: number,
    dadosTurma: {
      percentualSemInternet: number;
      percentualTransporteLongo: number;
      percentualTrabalhadores: number;
    }
  ): SumulaPedagogicaTurma {
    const pontosAtencao: string[] = [];
    const orientacoes: string[] = [];

    if (dadosTurma.percentualTransporteLongo >= 30) {
      pontosAtencao.push(`${dadosTurma.percentualTransporteLongo}% dos alunos residem na zona rural ou dependem de transporte com trajeto longo (>1h).`);
      orientacoes.push('Flexibilizar horários de entrega de atividades e prever materiais impressos ou síncronos acessíveis.');
    }

    if (dadosTurma.percentualSemInternet >= 25) {
      pontosAtencao.push(`${dadosTurma.percentualSemInternet}% dos discentes enfrentam barreiras severas de conectividade.`);
      orientacoes.push('Priorizar o uso da sala de informática e do acervo da biblioteca para tarefas extraclasse.');
    }

    if (dadosTurma.percentualTrabalhadores >= 20) {
      pontosAtencao.push(`${dadosTurma.percentualTrabalhadores}% dos estudantes trabalham em paralelo às aulas.`);
      orientacoes.push('Acompanhar frequência e fadiga em períodos avaliativos.');
    }

    if (pontosAtencao.length === 0) {
      pontosAtencao.push('Turma com perfil demográfico equilibrado quanto a transporte e conectividade.');
      orientacoes.push('Manter acompanhamento contínuo e incentivar a participação nas metas coletivas do Censo.');
    }

    const resumoGeral = `A Turma ${turma} conta com ${totalAlunos} estudantes avaliados. O perfil indica relevância para ações pedagógicas integradas focadas em inclusão e permanência escolar.`;

    return {
      turma,
      resumoGeral,
      pontosAtencao,
      orientacoesPedagogicas: orientacoes
    };
  }

  /**
   * Varre campos abertos e observações com filtros éticos rigorosos.
   * Não emite diagnósticos clínicos; apenas triagem pedagógica/social.
   */
  public static triagemRespostasAbertas(observacoes: Array<{ id: string; texto: string }>): AlertaVulnerabilidade[] {
    const alertas: AlertaVulnerabilidade[] = [];

    const padroesEvasao = ['desistir', 'parar de estudar', 'não vou voltar', 'trancar', 'sem dinheiro passagem'];
    const padroesVulnerabilidade = ['fome', 'sem comida', 'dificuldade extrema', 'trabalho infantil', 'doença familiar'];

    observacoes.forEach(obs => {
      const textoLower = (obs.texto || '').toLowerCase();

      // Checa evasão
      if (padroesEvasao.some(p => textoLower.includes(p))) {
        alertas.push({
          origem: obs.id,
          trecho: obs.texto.length > 80 ? obs.texto.substring(0, 80) + '...' : obs.texto,
          categoria: 'risco_evasao',
          recomendacaoEncaminhamento: 'Acolhimento imediato com a coordenação pedagógica para verificar permanência e auxílio transporte.'
        });
      }

      // Checa vulnerabilidade social
      if (padroesVulnerabilidade.some(p => textoLower.includes(p))) {
        alertas.push({
          origem: obs.id,
          trecho: obs.texto.length > 80 ? obs.texto.substring(0, 80) + '...' : obs.texto,
          categoria: 'vulnerabilidade_social',
          recomendacaoEncaminhamento: 'Encaminhamento prioritário ao serviço social e programas de assistência estudantil.'
        });
      }
    });

    return alertas;
  }
}
