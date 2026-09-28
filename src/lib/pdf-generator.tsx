import { InterviewData } from '../types/interview';

export const generateSchoolConsolidatedReport = (data: InterviewData[]) => {
  const total = data.length;
  const negros = data.filter((d) => d.cor_raca === 'Preta' || d.cor_raca === 'Parda').length;
  const sofreramPreconceito = data.filter((d) => d.sofreu_preconceito === 'Sim').length;

  const relatorioTexto = `
====================================================================
           RELATÓRIO CONSOLIDADO DE INICIAÇÃO CIENTÍFICA
                     CENSO CEEP / ADA LOVELACE
====================================================================

1. PANORAMA GERAL
--------------------------------------------------------------------
Total de Entrevistados: ${total}
População Negra (Pretos e Pardos - IBGE): ${negros} (${total > 0 ? ((negros/total)*100).toFixed(2) : 0}%)
Relatos de Experiência com Preconceito: ${sofreramPreconceito} (${total > 0 ? ((sofreramPreconceito/total)*100).toFixed(2) : 0}%)

2. AMBIENTES DE CONVERSA SOBRE RAÇA/GÊNERO
--------------------------------------------------------------------
${data.reduce((acc, curr) => {
  curr.ambientes_conversa?.forEach(amb => {
    acc[amb] = (acc[amb] || 0) + 1;
  });
  return acc;
}, {} as Record<string, number>)}

3. RELATOS QUALITATIVOS REGISTRADOS
--------------------------------------------------------------------
${data
  .filter(d => d.relato_preconceito)
  .map((d, i) => `[Relato #${i+1}] - Grupo:${d.grupo_escolar} | Raça: ${d.cor_raca}\n"${d.relato_preconceito}"\n`)
  .join('\n')}
  `;

  // Gera o download do arquivo em formato TXT/Relatório
  const blob = new Blob([relatorioTexto], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Relatorio_Censo_CEEP_${new Date().toISOString().slice(0,10)}.txt`;
  link.click();
};