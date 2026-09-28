import React, { useEffect, useState } from 'react';
import { InterviewData } from '../types/interview';

export const PublicDisplay: React.FC = () => {
  const [data, setData] = useState<InterviewData[]>([]);

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/interview')
        .then((res) => res.json())
        .then((d) => setData(d));
    };
    fetchData();
    const interval = setInterval(fetchData, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, []);

  const total = data.length;
  const negros = data.filter((d) => d.cor_raca === 'Preta' || d.cor_raca === 'Parda').length;
  const preconceito = data.filter((d) => d.sofreu_preconceito === 'Sim').length;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col justify-between">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-blue-400">CENSO CEEP - INICIAÇÃO CIENTÍFICA</h1>
        <p className="text-xl text-slate-300 mt-2">Projeto Ada Lovelace: Diversidade, Gênero e Etnia</p>
      </header>

      <div className="grid grid-cols-3 gap-8 my-auto max-w-5xl mx-auto w-full">
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center">
          <p className="text-slate-400 text-lg uppercase font-semibold">Respostas Coletadas</p>
          <p className="text-6xl font-black text-white mt-4">{total}</p>
        </div>

        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center">
          <p className="text-slate-400 text-lg uppercase font-semibold">População Negra</p>
          <p className="text-6xl font-black text-emerald-400 mt-4">
            {total > 0 ? Math.round((negros / total) * 100) : 0}%
          </p>
        </div>

        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center">
          <p className="text-slate-400 text-lg uppercase font-semibold">Relataram Preconceito</p>
          <p className="text-6xl font-black text-rose-500 mt-4">
            {total > 0 ? Math.round((preconceito / total) * 100) : 0}%
          </p>
        </div>
      </div>

      <footer className="text-center text-slate-500">
        Atualizado automaticamente • Centro Estadual de Educação Profissional de Seabra
      </footer>
    </div>
  );
};