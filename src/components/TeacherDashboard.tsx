import React, { useEffect, useState } from 'react';
import { InterviewData } from '../types/interview';

export const TeacherDashboard: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/interview')
      .then((res) => res.json())
      .then((data) => {
        setInterviews(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 text-center">Carregando painel de acompanhamento...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-2">Acompanhamento de Coletas — Iniciação Científica</h1>
      <p className="text-gray-600 mb-6">Visão geral dos registros realizados no censo escolar.</p>

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