import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, PieChart as PieIcon, BarChart2, TrendingUp, Laptop, AlertCircle, Home, Compass } from 'lucide-react';

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalAmostras, setTotalAmostras] = useState(0);
  const [stats, setStats] = useState({
    genero: {} as Record<string, number>,
    raca: {} as Record<string, number>,
    vinculo: {} as Record<string, number>,
    internet: {} as Record<string, number>,
    evasao: {} as Record<string, number>,
    moradia: {} as Record<string, number>,
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Usando a tabela correta 'entrevistas' e as colunas reais do banco
      const { data, error } = await supabase
        .from('entrevistas')
        .select('genero, cor_raca, vinculo, acesso_internet, risco_evasao, local_moradia');
      
      if (error) throw error;

      if (data) {
        setTotalAmostras(data.length);

        const newStats = {
          genero: {} as Record<string, number>,
          raca: {} as Record<string, number>,
          vinculo: {} as Record<string, number>,
          internet: {} as Record<string, number>,
          evasao: {} as Record<string, number>,
          moradia: {} as Record<string, number>,
        };

        data.forEach((row) => {
          if (row.genero) newStats.genero[row.genero] = (newStats.genero[row.genero] || 0) + 1;
          if (row.cor_raca) newStats.raca[row.cor_raca] = (newStats.raca[row.cor_raca] || 0) + 1;
          if (row.vinculo) newStats.vinculo[row.vinculo] = (newStats.vinculo[row.vinculo] || 0) + 1;
          if (row.acesso_internet) newStats.internet[row.acesso_internet] = (newStats.internet[row.acesso_internet] || 0) + 1;
          if (row.risco_evasao) newStats.evasao[row.risco_evasao] = (newStats.evasao[row.risco_evasao] || 0) + 1;
          if (row.local_moradia) newStats.moradia[row.local_moradia] = (newStats.moradia[row.local_moradia] || 0) + 1;
        });

        // Ordena os resultados para gráficos mais bonitos
        const sortObj = (obj: Record<string, number>) => Object.fromEntries(Object.entries(obj).sort(([,a],[,b]) => b - a));

        setStats({
          genero: sortObj(newStats.genero),
          raca: sortObj(newStats.raca),
          vinculo: sortObj(newStats.vinculo),
          internet: sortObj(newStats.internet),
          evasao: sortObj(newStats.evasao),
          moradia: sortObj(newStats.moradia),
        });
      }
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = (label: string, count: number, total: number, colorClass: string) => {
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
    return (
      <div key={label} className="space-y-1.5 group">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span className="truncate pr-2">{label}</span>
          <span className="shrink-0">{count} ({pct}%)</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass} group-hover:brightness-110`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold animate-pulse">Carregando métricas do banco...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 🚀 CABEÇALHO DO DASHBOARD */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <TrendingUp className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-black mb-2">Painel Analítico de Inteligência</h2>
          <p className="text-blue-100 text-sm font-medium leading-relaxed">
            Métricas ao vivo processadas diretamente do banco de dados do Censo CEEP. 
            Todos os gráficos são atualizados automaticamente com base nas entrevistas cadastradas.
          </p>
        </div>
      </div>

      {/* 📊 CARDS DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase">
              Geral
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total de Entrevistas
          </span>
          <strong className="text-3xl font-black text-slate-800">{totalAmostras}</strong>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <PieIcon className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Categorias de Gênero
          </span>
          <strong className="text-3xl font-black text-slate-800">
            {Object.keys(stats.genero).length}
          </strong>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Tipos de Risco (Evasão)
          </span>
          <strong className="text-3xl font-black text-slate-800">
            {Object.keys(stats.evasao).length > 0 ? Object.keys(stats.evasao).length - 1 : 0}
          </strong>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Origens Raciais (IBGE)
          </span>
          <strong className="text-3xl font-black text-slate-800">
            {Object.keys(stats.raca).length}
          </strong>
        </div>
      </div>

      {/* 📈 GRÁFICOS DETALHADOS (2 COLUNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* IDENTIDADE E RAÇA */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 text-base flex items-center gap-2 pb-4 border-b border-slate-50">
            <BarChart2 className="w-5 h-5 text-indigo-600" /> Cor ou Raça Declarada
          </h3>
          <div className="space-y-4">
            {Object.keys(stats.raca).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Sem dados suficientes.</p>
            ) : (
              Object.entries(stats.raca).map(([key, count]) => renderProgressBar(key, count, totalAmostras, 'bg-indigo-500'))
            )}
          </div>
        </div>

        {/* GÊNERO */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 text-base flex items-center gap-2 pb-4 border-b border-slate-50">
            <BarChart2 className="w-5 h-5 text-fuchsia-600" /> Identidade de Gênero
          </h3>
          <div className="space-y-4">
            {Object.keys(stats.genero).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Sem dados suficientes.</p>
            ) : (
              Object.entries(stats.genero).map(([key, count]) => renderProgressBar(key, count, totalAmostras, 'bg-fuchsia-500'))
            )}
          </div>
        </div>

        {/* VÍNCULO COM A INSTITUIÇÃO */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 text-base flex items-center gap-2 pb-4 border-b border-slate-50">
            <Users className="w-5 h-5 text-blue-600" /> Vínculo Institucional
          </h3>
          <div className="space-y-4">
            {Object.keys(stats.vinculo).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Sem dados suficientes.</p>
            ) : (
              Object.entries(stats.vinculo).map(([key, count]) => renderProgressBar(key, count, totalAmostras, 'bg-blue-500'))
            )}
          </div>
        </div>

        {/* LOCAL DE MORADIA */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 text-base flex items-center gap-2 pb-4 border-b border-slate-50">
            <Home className="w-5 h-5 text-emerald-600" /> Localização Geográfica
          </h3>
          <div className="space-y-4">
            {Object.keys(stats.moradia).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Sem dados suficientes.</p>
            ) : (
              Object.entries(stats.moradia).map(([key, count]) => renderProgressBar(key, count, totalAmostras, 'bg-emerald-500'))
            )}
          </div>
        </div>

        {/* INCLUSÃO DIGITAL */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 text-base flex items-center gap-2 pb-4 border-b border-slate-50">
            <Laptop className="w-5 h-5 text-cyan-600" /> Inclusão Digital (Acesso)
          </h3>
          <div className="space-y-4">
            {Object.keys(stats.internet).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Sem dados suficientes.</p>
            ) : (
              Object.entries(stats.internet).map(([key, count]) => renderProgressBar(key, count, totalAmostras, 'bg-cyan-500'))
            )}
          </div>
        </div>

        {/* RISCO DE EVASÃO ESCOLAR */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-black text-slate-800 text-base flex items-center gap-2 pb-4 border-b border-slate-50">
            <AlertCircle className="w-5 h-5 text-rose-600" /> Indicativo de Risco de Evasão
          </h3>
          <div className="space-y-4">
            {Object.keys(stats.evasao).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Sem dados suficientes.</p>
            ) : (
              Object.entries(stats.evasao).map(([key, count]) => renderProgressBar(key, count, totalAmostras, 'bg-rose-500'))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}