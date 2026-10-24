import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Users,
  PieChart as PieIcon,
  BarChart2,
  TrendingUp,
  Laptop,
  AlertCircle,
  Home,
  Compass,
  Layers,
  Grid
} from 'lucide-react';

const DONUT_COLORS = [
  '#6366f1',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#f43f5e',
  '#64748b'
];

// ─── 1. Gráfico de Rosca / Donut (Pizza) ──────────────────────────────────────
function DonutChart({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = Object.entries(data);
  if (entries.length === 0 || total === 0) {
    return <p className="text-xs text-slate-400 font-medium py-4">Sem dados suficientes.</p>;
  }

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-3 animate-in fade-in">
      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
          {entries.map(([label, count], idx) => {
            const pct = count / total;
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedOffset * circumference;
            accumulatedOffset += pct;
            const color = DONUT_COLORS[idx % DONUT_COLORS.length];
            return (
              <circle
                key={label}
                cx="60"
                cy="60"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth="18"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out hover:opacity-80"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amostra</span>
          <span className="text-xl font-black text-slate-800">{total}</span>
        </div>
      </div>
      <div className="flex-1 w-full space-y-2">
        {entries.map(([label, count], idx) => {
          const color = DONUT_COLORS[idx % DONUT_COLORS.length];
          const pct = ((count / total) * 100).toFixed(1);
          return (
            <div key={label} className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="truncate">{label}</span>
              </div>
              <span className="shrink-0 text-slate-500 font-medium">
                {count} <span className="text-slate-400">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 2. Gráfico de Colunas Verticais ──────────────────────────────────────────
function VerticalColumnChart({
  data,
  total,
  color = '#6366f1'
}: {
  data: Record<string, number>;
  total: number;
  color?: string;
}) {
  const entries = Object.entries(data);
  if (entries.length === 0 || total === 0) {
    return <p className="text-xs text-slate-400 font-medium py-4">Sem dados suficientes.</p>;
  }
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="pt-4 pb-2 animate-in fade-in">
      <div className="flex items-end justify-between gap-2 h-44 px-2 border-b border-slate-100">
        {entries.map(([label, count], idx) => {
          const heightPct = Math.max(12, Math.round((count / max) * 100));
          const pct = ((count / total) * 100).toFixed(1);
          const barColor = DONUT_COLORS[idx % DONUT_COLORS.length] || color;
          return (
            <div key={label} className="flex-1 flex flex-col items-center h-full justify-end group">
              <span className="text-[10px] font-bold text-slate-500 mb-1 opacity-80 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {count}
              </span>
              <div
                className="w-full max-w-[42px] rounded-t-xl transition-all duration-700 ease-out group-hover:brightness-110 shadow-sm"
                style={{
                  height: `${heightPct}%`,
                  background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}CC 100%)`
                }}
              />
              <span className="text-[9px] font-extrabold text-slate-400 mt-1">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between gap-2 px-1 mt-2">
        {entries.map(([label]) => (
          <div key={label} className="flex-1 text-center">
            <span className="text-[10px] font-bold text-slate-600 block truncate" title={label}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 3. Pictograma de População Escolar ────────────────────────────────────────
function PictogramChart({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = Object.entries(data);
  if (entries.length === 0 || total === 0) {
    return <p className="text-xs text-slate-400 font-medium py-4">Sem dados suficientes.</p>;
  }

  // 40 figuras no total: cada uma representa 2.5% da amostra
  const totalIcons = 40;
  const icons: { color: string; label: string }[] = [];

  entries.forEach(([label, count], idx) => {
    const iconCount = Math.round((count / total) * totalIcons);
    const color = DONUT_COLORS[idx % DONUT_COLORS.length];
    for (let i = 0; i < iconCount; i++) {
      if (icons.length < totalIcons) {
        icons.push({ color, label });
      }
    }
  });

  while (icons.length < totalIcons && entries.length > 0) {
    icons.push({ color: DONUT_COLORS[0], label: entries[0][0] });
  }

  return (
    <div className="space-y-4 py-2 animate-in fade-in">
      <div className="grid grid-cols-10 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
        {icons.map((item, i) => (
          <div key={i} className="flex items-center justify-center p-1" title={item.label}>
            <Users className="w-5 h-5 transition-transform hover:scale-125" style={{ color: item.color }} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-bold border-t border-slate-50 pt-3">
        <div className="flex flex-wrap gap-4">
          {entries.map(([label, count], idx) => {
            const color = DONUT_COLORS[idx % DONUT_COLORS.length];
            const pct = ((count / total) * 100).toFixed(1);
            return (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                {label}: <strong>{count}</strong> ({pct}%)
              </span>
            );
          })}
        </div>
        <span className="text-[10px] text-slate-400 italic">1 ícone = 2,5% da amostra</span>
      </div>
    </div>
  );
}

// ─── 4. Gráfico de Linha e Área Suave (Evolução Temporal) ──────────────────────
function SplineAreaChart({ rawData }: { rawData: any[] }) {
  if (rawData.length === 0) return null;

  const dateMap: Record<string, number> = {};
  rawData.forEach(row => {
    const d = row.created_at ? new Date(row.created_at) : new Date();
    const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    dateMap[key] = (dateMap[key] || 0) + 1;
  });

  const entries = Object.entries(dateMap).slice(-8);
  if (entries.length < 2) return null;

  const max = Math.max(...entries.map(([, v]) => v), 1);
  const width = 500;
  const height = 120;
  const padding = 24;

  const points = entries.map(([, count], idx) => {
    const x = padding + (idx / (entries.length - 1)) * (width - 2 * padding);
    const y = height - padding - (count / max) * (height - 2 * padding);
    return { x, y, count };
  });

  const pathD = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = a[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp2x = cp1x;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
        <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" /> Ritmo de Coleta ao Longo do Tempo (Gráfico de Área Suave)
        </h3>
        <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-wider">
          Ao Vivo
        </span>
      </div>
      <div className="w-full overflow-x-auto pt-2">
        <svg viewBox={`0 0 ${width} ${height + 25}`} className="w-full h-40">
          <defs>
            <linearGradient id="splineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#splineAreaGrad)" />
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#6366f1" strokeWidth="3" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="900" fill="#4338ca">
                {p.count}
              </text>
              <text x={p.x} y={height + 16} textAnchor="middle" fontSize="9" fontWeight="700" fill="#94a3b8">
                {entries[i][0]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── 5. Gráfico de Dispersão / Bolhas (Cruzamento de Fatores) ─────────────────
function ScatterPlotChart({ rawData }: { rawData: any[] }) {
  if (rawData.length === 0) return null;

  const matrix: Record<string, Record<string, number>> = {};
  rawData.forEach(row => {
    const tempo = row.tempo_deslocamento || 'Não inf.';
    const evasao = row.risco_evasao || 'Não inf.';
    if (!matrix[tempo]) matrix[tempo] = {};
    matrix[tempo][evasao] = (matrix[tempo][evasao] || 0) + 1;
  });

  const tempos = Object.keys(matrix).slice(0, 5);
  const evasoes = ['Não, nunca pensei', 'Dificuldade de Transporte', 'Necessidade de Trabalhar', 'Desmotivação / Outro'];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
        <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-600" /> Matriz de Dispersão: Tempo de Deslocamento vs. Risco de Evasão
        </h3>
        <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-wider">
          Cruzamento Analítico
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="text-left py-2.5 font-bold">Tempo de Deslocamento</th>
              {evasoes.map(e => (
                <th key={e} className="text-center py-2.5 font-bold px-2">{e}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tempos.map(tempo => (
              <tr key={tempo} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="py-3 font-bold text-slate-700">{tempo}</td>
                {evasoes.map(evasao => {
                  const count = matrix[tempo]?.[evasao] || 0;
                  const size = Math.min(34, Math.max(16, count * 5.5));
                  return (
                    <td key={evasao} className="text-center py-3 px-2">
                      {count > 0 ? (
                        <div
                          className="inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-black shadow-sm"
                          style={{ width: size, height: size, fontSize: size > 22 ? 11 : 9 }}
                        >
                          {count}
                        </div>
                      ) : (
                        <span className="text-slate-200">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400 italic text-right">
        * O tamanho da bolha reflete a concentração de estudantes naquele cruzamento.
      </p>
    </div>
  );
}

// ─── 6. Barra Horizontal Tradicional ──────────────────────────────────────────
function renderProgressBar(label: string, count: number, total: number, colorClass: string) {
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
}

// ─── Componente Principal AnalyticsDashboard ──────────────────────────────────
export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalAmostras, setTotalAmostras] = useState(0);
  const [viewModes, setViewModes] = useState<Record<string, 'donut' | 'column' | 'bar' | 'pictogram'>>({
    raca: 'column',
    genero: 'donut',
    vinculo: 'donut',
    moradia: 'pictogram',
    internet: 'bar',
    evasao: 'bar',
    moraCom: 'bar',
    raizSocial: 'bar',
  });

  const [stats, setStats] = useState({
    genero: {} as Record<string, number>,
    raca: {} as Record<string, number>,
    vinculo: {} as Record<string, number>,
    internet: {} as Record<string, number>,
    evasao: {} as Record<string, number>,
    moradia: {} as Record<string, number>,
    moraCom: {} as Record<string, number>,
    raizSocial: {} as Record<string, number>,
  });

  const [rawData, setRawData] = useState<any[]>([]);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('entrevistas')
        .select('*');

      if (error) throw error;

      if (data) {
        setTotalAmostras(data.length);
        setRawData(data);

        const newStats = {
          genero: {} as Record<string, number>,
          raca: {} as Record<string, number>,
          vinculo: {} as Record<string, number>,
          internet: {} as Record<string, number>,
          evasao: {} as Record<string, number>,
          moradia: {} as Record<string, number>,
          moraCom: {} as Record<string, number>,
          raizSocial: {} as Record<string, number>,
        };

        data.forEach((row) => {
          // Unificação estrita de gênero: apenas Masculino e Feminino (erros de digitação unificados)
          if (row.genero) {
            const gLow = String(row.genero).toLowerCase().trim();
            if (gLow.includes('fem') || gLow.includes('mulher')) {
              newStats.genero['Feminino'] = (newStats.genero['Feminino'] || 0) + 1;
            } else if (gLow.includes('masc') || gLow.includes('homem') || gLow.includes('máscara')) {
              newStats.genero['Masculino'] = (newStats.genero['Masculino'] || 0) + 1;
            }
          }
          if (row.cor_raca) newStats.raca[row.cor_raca] = (newStats.raca[row.cor_raca] || 0) + 1;
          if (row.vinculo) newStats.vinculo[row.vinculo] = (newStats.vinculo[row.vinculo] || 0) + 1;
          if (row.acesso_internet) newStats.internet[row.acesso_internet] = (newStats.internet[row.acesso_internet] || 0) + 1;
          if (row.risco_evasao) newStats.evasao[row.risco_evasao] = (newStats.evasao[row.risco_evasao] || 0) + 1;
          const moradia = row.local_moradia || row.localizacao_moradia;
          if (moradia) newStats.moradia[moradia] = (newStats.moradia[moradia] || 0) + 1;
          if (row.mora_com) newStats.moraCom[row.mora_com] = (newStats.moraCom[row.mora_com] || 0) + 1;
          if (row.cor_raca_influencia) newStats.raizSocial[row.cor_raca_influencia] = (newStats.raizSocial[row.cor_raca_influencia] || 0) + 1;
        });

        const sortObj = (obj: Record<string, number>) =>
          Object.fromEntries(Object.entries(obj).sort(([, a], [, b]) => b - a));

        setStats({
          genero: sortObj(newStats.genero),
          raca: sortObj(newStats.raca),
          vinculo: sortObj(newStats.vinculo),
          internet: sortObj(newStats.internet),
          evasao: sortObj(newStats.evasao),
          moradia: sortObj(newStats.moradia),
          moraCom: sortObj(newStats.moraCom),
          raizSocial: sortObj(newStats.raizSocial),
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (rawData.length === 0) return;

    const headers = Object.keys(rawData[0]);
    const csvContent = [
      headers.join(','),
      ...rawData.map(row =>
        headers.map(header => {
          let cell = row[header];
          if (cell === null || cell === undefined) cell = '';
          if (header === 'nome_participante' && cell) cell = String(cell).trim().toUpperCase();
          if (Array.isArray(cell)) cell = cell.join('; ');
          const strCell = String(cell);
          if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n') || strCell.includes('\r')) {
            return `"${strCell.replace(/"/g, '""')}"`;
          }
          return strCell;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Censo_CEEP_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const setCardMode = (card: string, mode: 'donut' | 'column' | 'bar' | 'pictogram') => {
    setViewModes(prev => ({ ...prev, [card]: mode }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold animate-pulse">Carregando métricas e gráficos diversificados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🚀 BANNER HERO COM BOTÃO DE EXPORTAÇÃO */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <TrendingUp className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-black mb-2">Painel Analítico de Inteligência Científica</h2>
          <p className="text-blue-100 text-sm font-medium leading-relaxed">
            Visualizações ricas e diversificadas (rosca, colunas, pictogramas, dispersão e área) processadas em tempo real a partir das entrevistas cadastradas.
          </p>
        </div>

        <div className="relative z-10">
          <button
            type="button"
            onClick={exportToCSV}
            disabled={rawData.length === 0}
            className="flex items-center justify-center gap-2 bg-white text-indigo-700 font-black py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all w-full md:w-auto disabled:opacity-50 disabled:pointer-events-none cursor-pointer border-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar CSV
          </button>
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
              Amostra Total
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
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full uppercase">
              Diversidade
            </span>
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
            <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-full uppercase">
              Atenção
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Fatores de Risco (Evasão)
          </span>
          <strong className="text-3xl font-black text-slate-800">
            {Object.keys(stats.evasao).filter((k) => k !== 'Não, nunca pensei').length}
          </strong>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-full uppercase">
              Etnias
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Origens Raciais (IBGE)
          </span>
          <strong className="text-3xl font-black text-slate-800">
            {Object.keys(stats.raca).length}
          </strong>
        </div>
      </div>

      {/* 📈 LINHA DO TEMPO (SPLINE AREA CHART) */}
      <SplineAreaChart rawData={rawData} />

      {/* 📊 GRÁFICOS DETALHADOS EM GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. COR OU RAÇA (Com seletor Colunas / Rosca / Barras) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 flex-wrap gap-2">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" /> Cor ou Raça Declarada (IBGE)
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCardMode('raca', 'column')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.raca === 'column' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                Colunas 📊
              </button>
              <button
                type="button"
                onClick={() => setCardMode('raca', 'donut')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.raca === 'donut' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                Rosca 🍩
              </button>
              <button
                type="button"
                onClick={() => setCardMode('raca', 'bar')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.raca === 'bar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                Barras 📑
              </button>
            </div>
          </div>
          {viewModes.raca === 'column' && <VerticalColumnChart data={stats.raca} total={totalAmostras} color="#6366f1" />}
          {viewModes.raca === 'donut' && <DonutChart data={stats.raca} total={totalAmostras} />}
          {viewModes.raca === 'bar' && (
            <div className="space-y-4 py-2">
              {Object.entries(stats.raca).map(([key, count]) =>
                renderProgressBar(key, count, totalAmostras, 'bg-indigo-500')
              )}
            </div>
          )}
        </div>

        {/* 2. IDENTIDADE DE GÊNERO (Com seletor Rosca / Colunas / Barras) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 flex-wrap gap-2">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-fuchsia-600" /> Identidade de Gênero
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCardMode('genero', 'donut')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.genero === 'donut' ? 'bg-white text-fuchsia-600 shadow-sm' : 'text-slate-500'}`}
              >
                Rosca 🍩
              </button>
              <button
                type="button"
                onClick={() => setCardMode('genero', 'column')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.genero === 'column' ? 'bg-white text-fuchsia-600 shadow-sm' : 'text-slate-500'}`}
              >
                Colunas 📊
              </button>
              <button
                type="button"
                onClick={() => setCardMode('genero', 'bar')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.genero === 'bar' ? 'bg-white text-fuchsia-600 shadow-sm' : 'text-slate-500'}`}
              >
                Barras 📑
              </button>
            </div>
          </div>
          {viewModes.genero === 'donut' && <DonutChart data={stats.genero} total={totalAmostras} />}
          {viewModes.genero === 'column' && <VerticalColumnChart data={stats.genero} total={totalAmostras} color="#d946ef" />}
          {viewModes.genero === 'bar' && (
            <div className="space-y-4 py-2">
              {Object.entries(stats.genero).map(([key, count]) =>
                renderProgressBar(key, count, totalAmostras, 'bg-fuchsia-500')
              )}
            </div>
          )}
        </div>

        {/* 3. LOCALIZAÇÃO GEOGRÁFICA (Com Pictograma / Rosca / Barras) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 flex-wrap gap-2">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-600" /> Localização Geográfica (Sede x Povoados)
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCardMode('moradia', 'pictogram')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.moradia === 'pictogram' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
              >
                Pictograma 🏘️
              </button>
              <button
                type="button"
                onClick={() => setCardMode('moradia', 'donut')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.moradia === 'donut' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
              >
                Rosca 🍩
              </button>
              <button
                type="button"
                onClick={() => setCardMode('moradia', 'bar')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.moradia === 'bar' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
              >
                Barras 📑
              </button>
            </div>
          </div>
          {viewModes.moradia === 'pictogram' && <PictogramChart data={stats.moradia} total={totalAmostras} />}
          {viewModes.moradia === 'donut' && <DonutChart data={stats.moradia} total={totalAmostras} />}
          {viewModes.moradia === 'bar' && (
            <div className="space-y-4 py-2">
              {Object.entries(stats.moradia).map(([key, count]) =>
                renderProgressBar(key, count, totalAmostras, 'bg-emerald-500')
              )}
            </div>
          )}
        </div>

        {/* 4. VÍNCULO INSTITUCIONAL (Rosca / Colunas) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 flex-wrap gap-2">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Vínculo Institucional
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCardMode('vinculo', 'donut')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.vinculo === 'donut' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                Rosca 🍩
              </button>
              <button
                type="button"
                onClick={() => setCardMode('vinculo', 'column')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border-0 cursor-pointer ${viewModes.vinculo === 'column' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                Colunas 📊
              </button>
            </div>
          </div>
          {viewModes.vinculo === 'donut' && <DonutChart data={stats.vinculo} total={totalAmostras} />}
          {viewModes.vinculo === 'column' && <VerticalColumnChart data={stats.vinculo} total={totalAmostras} color="#3b82f6" />}
        </div>

        {/* 5. INCLUSÃO DIGITAL */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <Laptop className="w-5 h-5 text-cyan-600" /> Inclusão Digital (Computador & Celular)
            </h3>
            <span className="text-[10px] font-black bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full uppercase">
              Acesso
            </span>
          </div>
          <div className="space-y-4 py-2">
            {Object.keys(stats.internet).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Sem dados suficientes.</p>
            ) : (
              Object.entries(stats.internet).map(([key, count]) =>
                renderProgressBar(key, count, totalAmostras, 'bg-cyan-500')
              )
            )}
          </div>
        </div>

        {/* 6. RISCO DE EVASÃO ESCOLAR */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600" /> Risco de Evasão Escolar (por motivos)
            </h3>
            <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full uppercase">
              Permanência
            </span>
          </div>
          <div className="space-y-4 py-2">
            {Object.keys(stats.evasao).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Sem dados suficientes.</p>
            ) : (
              Object.entries(stats.evasao).map(([key, count]) =>
                renderProgressBar(key, count, totalAmostras, 'bg-rose-500')
              )
            )}
          </div>
        </div>

        {/* 7. COM QUEM MORA */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" /> Arranjo Familiar (Com Quem Mora)
            </h3>
            <span className="text-[10px] font-black bg-orange-50 text-orange-600 px-3 py-1 rounded-full uppercase">
              Família
            </span>
          </div>
          <div className="space-y-4 py-2">
            {Object.keys(stats.moraCom).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Sem dados suficientes.</p>
            ) : (
              Object.entries(stats.moraCom).map(([key, count]) =>
                renderProgressBar(key, count, totalAmostras, 'bg-orange-500')
              )
            )}
          </div>
        </div>

        {/* 8. A RAIZ SOCIAL INFLUENCIA NO BRASIL? */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-600" /> A Raiz Social Influencia no Brasil?
            </h3>
            <span className="text-[10px] font-black bg-purple-50 text-purple-600 px-3 py-1 rounded-full uppercase">
              Opinião
            </span>
          </div>
          <div className="space-y-4 py-2">
            {Object.keys(stats.raizSocial).length === 0 ? (
              <p className="text-xs text-slate-400 font-medium">Sem dados suficientes.</p>
            ) : (
              Object.entries(stats.raizSocial).map(([key, count]) =>
                renderProgressBar(key, count, totalAmostras, 'bg-purple-500')
              )
            )}
          </div>
        </div>

      </div>

      {/* 🧭 ANÁLISE DE DISPERSÃO BI-DIMENSIONAL (SCATTER PLOT) */}
      <ScatterPlotChart rawData={rawData} />
    </div>
  );
}

export default AnalyticsDashboard;