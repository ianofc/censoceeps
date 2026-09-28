import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, PieChart as PieIcon, BarChart2, TrendingUp } from 'lucide-react';

export function AnalyticsDashboard() {
  const [totalAmostras, setTotalAmostras] = useState(0);
  const [generoStats, setGeneroStats] = useState<Record<string, number>>({});
  const [racaStats, setRacaStats] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    const { data } = await supabase.from('censo_coletas').select('genero, raca');
    if (data) {
      setTotalAmostras(data.length);

      const genMap: Record<string, number> = {};
      const racaMap: Record<string, number> = {};

      data.forEach((row) => {
        if (row.genero) genMap[row.genero] = (genMap[row.genero] || 0) + 1;
        if (row.raca) racaMap[row.raca] = (racaMap[row.raca] || 0) + 1;
      });

      setGeneroStats(genMap);
      setRacaStats(racaMap);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="agora-card flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL DE ENTREVISTADOS
            </span>
            <strong className="text-2xl font-black text-slate-800">{totalAmostras}</strong>
          </div>
        </div>

        <div className="agora-card flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <PieIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              DIVERSIDADE DE GÊNERO
            </span>
            <strong className="text-2xl font-black text-slate-800">
              {Object.keys(generoStats).length} Categoria(s)
            </strong>
          </div>
        </div>

        <div className="agora-card flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ENGAJAMENTO DA PESQUISA
            </span>
            <strong className="text-2xl font-black text-emerald-600">Ativo / 100%</strong>
          </div>
        </div>
      </div>

      {/* Distribuição percentual em cards Clean */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="agora-card space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" /> Distribuição por Gênero
          </h3>
          <div className="space-y-3">
            {Object.entries(generoStats).map(([key, count]) => {
              const pct = totalAmostras > 0 ? ((count / totalAmostras) * 100).toFixed(1) : '0';
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{key}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="agora-card space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" /> Distribuição por Raça / Cor (IBGE)
          </h3>
          <div className="space-y-3">
            {Object.entries(racaStats).map(([key, count]) => {
              const pct = totalAmostras > 0 ? ((count / totalAmostras) * 100).toFixed(1) : '0';
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{key}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}