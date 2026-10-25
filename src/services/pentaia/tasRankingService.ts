/**
 * TAS (Thalamus + SARA + Accumbens) — Motor de Ranqueamento e Integridade
 * 
 * Subcomponentes:
 * - Thalamus: Priorização de busca ativa e cálculo de subnotificação por turma
 * - SARA: Detecção de anomalias, duplicidade e conflitos cadastrais
 * - Accumbens: Gamificação, badges e cálculo de engajamento
 */

export interface TurmaPrioridade {
  turma: string;
  totalEsperado: number;
  totalColetado: number;
  taxaAdesao: number; // 0 a 100%
  indiceUrgencia: 'critica' | 'moderada' | 'satisfatoria';
  alunosPendentes: number;
}

export interface ConflitoCadastral {
  tipo: 'duplicidade_nome' | 'horario_inconsistente' | 'sem_turma';
  descricao: string;
  identificador: string;
  severidade: 'alta' | 'media';
}

export class TasRankingService {
  /**
   * THALAMUS: Calcula o índice de prioridade da busca ativa por turma
   */
  public static calcularPrioridadesBuscaAtiva(
    esperadosPorTurma: Record<string, number>,
    coletadosPorTurma: Record<string, number>
  ): TurmaPrioridade[] {
    const turmas = Object.keys(esperadosPorTurma);

    const resultado: TurmaPrioridade[] = turmas.map(turma => {
      const esperado = esperadosPorTurma[turma] || 1;
      const coletado = coletadosPorTurma[turma] || 0;
      const taxaAdesao = Math.min(100, Math.round((coletado / esperado) * 100));
      const pendentes = Math.max(0, esperado - coletado);

      let indiceUrgencia: 'critica' | 'moderada' | 'satisfatoria' = 'satisfatoria';
      if (taxaAdesao < 40) {
        indiceUrgencia = 'critica';
      } else if (taxaAdesao < 70) {
        indiceUrgencia = 'moderada';
      }

      return {
        turma,
        totalEsperado: esperado,
        totalColetado: coletado,
        taxaAdesao,
        indiceUrgencia,
        alunosPendentes: pendentes
      };
    });

    // Ordena do menor índice de adesão para o maior (maior urgência primeiro)
    return resultado.sort((a, b) => a.taxaAdesao - b.taxaAdesao);
  }

  /**
   * SARA: Valida conflitos cadastrais e anomalias em listas de formulários
   */
  public static detectarConflitos(
    fichas: Array<{ id?: string; student_name?: string; class_name?: string; [key: string]: any }>
  ): ConflitoCadastral[] {
    const conflitos: ConflitoCadastral[] = [];
    const nomesMap = new Map<string, number>();

    fichas.forEach(ficha => {
      const nome = ficha.student_name?.trim().toLowerCase();
      if (!nome) {
        conflitos.push({
          tipo: 'duplicidade_nome',
          descricao: `Registro sem identificação de nome válido (ID: ${ficha.id || 'novo'})`,
          identificador: ficha.id || 'desconhecido',
          severidade: 'alta'
        });
        return;
      }

      if (!ficha.class_name) {
        conflitos.push({
          tipo: 'sem_turma',
          descricao: `Aluno ${ficha.student_name} não possui turma associada`,
          identificador: ficha.student_name,
          severidade: 'media'
        });
      }

      const count = (nomesMap.get(nome) || 0) + 1;
      nomesMap.set(nome, count);
      if (count === 2) {
        conflitos.push({
          tipo: 'duplicidade_nome',
          descricao: `Possível registro duplicado detectado para o aluno: ${ficha.student_name}`,
          identificador: ficha.student_name,
          severidade: 'alta'
        });
      }
    });

    return conflitos;
  }
}
