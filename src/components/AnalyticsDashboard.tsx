import React, { useEffect, useState } from 'react';
import { InterviewData } from '../types/interview';
import { generateSchoolConsolidatedReport } from '../lib/pdf-generator';

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/interview')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  if (loading) return <div className="p-6 text-center">Carregando estatísticas do Censo...</div>;

  const total = data.length;

  // Cálculos Estatísticos para a Iniciação Científica
  const pretos = data.filter((d) => d.cor_raca === 'Preta').length;
  const pardos = data.filter((d) => d.cor_raca === 'Parda').length;
  const populacaoNegra = pretos + pardos;
  const pctNegra = total > 0 ? ((populacaoNegra / total) * 100).toFixed(1) : '0';

  const sofreuPreconceitoSim = data.filter((d) => d.sofreu_preconceito === 'Sim').length;
  const pctPreconceito = total > 0 ? ((sofreuPreconceitoSim / total) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Estatísticas do Censo CEEP</h1>
          <p className="text-gray-600">Pesquisa sobre Gênero, Raça e Pertencimento - Projeto Ada Lovelace</p>
        </div>
        <button
          onClick={() => generateSchoolConsolidatedReport(data)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold"
        >
          Exportar Relatório Geral (PDF)
        </button>
      </div>

      {/* Cards de Métricas Chave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded shadow">
          <h3 className="text-sm font-semibold text-blue-800">Total de Entrevistados</h3>
          <p className="text-3xl font-bold text-blue-900 mt-1">{total}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-4 rounded shadow">
          <h3 className="text-sm font-semibold text-purple-800">População Negra (IBGE: Pretos + Pardos)</h3>
          <p className="text-3xl font-bold text-purple-900 mt-1">{pctNegra}% <span className="text-sm font-normal">({populacaoNegra})</span></p>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 rounded shadow">
          <h3 className="text-sm font-semibold text-red-800">Relataram Sofrer Preconceito</h3>
          <p className="text-3xl font-bold text-red-900 mt-1">{pctPreconceito}% <span className="text-sm font-normal">({sofreuPreconceitoSim})</span></p>
        </div>
      </div>

      {/* Relatos de Preconceito (Anônimos para Análise Científica) */}
      <div className="bg-white p-6 rounded shadow border">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Relatos Qualitativos Registo de Vivências</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {data
            .filter((d) => d.relato_preconceito && d.relato_preconceito.trim() !== '')
            .map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 border-l-4 border-red-500 rounded">
                <p className="text-gray-700 italic">"{item.relato_preconceito}"</p>
                <p className="text-xs text-gray-500 mt-1">
                  Identificação: {item.vinculo} | Turma/Setor: {item.grupo_escolar} | Raça/Cor: {item.cor_raca}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};