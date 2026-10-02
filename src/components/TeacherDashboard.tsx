import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { tasPdfGenerator } from '../utils/tasPdfGenerator';
import { DownloadCloud } from 'lucide-react';
import { useUserSession } from '../hooks/useUserSession';

export const TeacherDashboard: React.FC = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useUserSession();

  useEffect(() => {
    supabase.from('entrevistas').select('*')
      .then(({ data }) => {
        setInterviews(data || []);
        setLoading(false);
      });
  }, []);

  const handleGeneratePDF = () => {
    tasPdfGenerator.generateCensoReport(interviews, profile?.nomeCompleto || "Gestor de Dados", "CEEP Seabra - Bahia");
  };

  if (loading) return <div className="p-6 text-center">Carregando painel de acompanhamento e inicializando TAS...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">Acompanhamento e Auditoria</h1>
          <p className="text-slate-500 font-medium text-sm">Visão geral dos registros realizados no censo escolar.</p>
        </div>
        <button
          onClick={handleGeneratePDF}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
        >
          <DownloadCloud className="w-5 h-5" />
          Gerar Relatório (TAS)
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3">Data/Hora</th>
              <th className="p-3">Vínculo</th>
              <th className="p-3">Turma/Setor</th>
              <th className="p-3">Cor/Raça</th>
              <th className="p-3">Sofrera Preconceito?</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((item) => (
              <tr key={item.id || Math.random()} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm">{item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '-'}</td>
                <td className="p-3">{item.vinculo}</td>
                <td className="p-3">{item.grupo_escolar}</td>
                <td className="p-3 font-medium">{item.cor_raca}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${item.sofreu_preconceito === 'Sim' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {item.sofreu_preconceito}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};