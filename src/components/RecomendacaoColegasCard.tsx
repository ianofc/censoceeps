import React, { useState } from 'react';
import { Users, Send, UserPlus, Sparkles, MessageSquare, ChevronRight, Share2, Check, AlertCircle } from 'lucide-react';
import { TASRecomendacaoColega, sugerirColegasParaEntrevistar, TASUserProfile } from '../utils/tasRecommendationAlgorithm';
import catalogoAlunosLocal from '../data/alunos_turmas.json';

interface RecomendacaoColegasCardProps {
  user: TASUserProfile;
  entrevistadosExistentes: Map<string, string>;
  onIniciarEntrevistaColega: (colega: { nome: string; turma?: string; serie?: string; turno?: string }) => void;
}

export function RecomendacaoColegasCard({
  user,
  entrevistadosExistentes,
  onIniciarEntrevistaColega,
}: RecomendacaoColegasCardProps) {
  const [copiadoIdx, setCopiadoIdx] = useState<number | null>(null);

  const sugestoes = sugerirColegasParaEntrevistar(
    catalogoAlunosLocal as any[],
    entrevistadosExistentes,
    user,
    3
  );

  if (sugestoes.length === 0) return null;

  const handleCompartilharWhatsApp = (colega: TASRecomendacaoColega, idx: number) => {
    const texto = encodeURIComponent(
      `Olá ${colega.nome.split(' ')[0]}! Tudo bem? Aqui é ${user.nomeCompleto.split(' ')[0]} do CEEP Seabra. Estou aplicando o Censo Escolar — Projeto Ada Lovelace. Posso fazer algumas perguntinhas rápidas com você hoje no intervalo? É super rápido e muito importante para nossa escola! 🚀📊`
    );
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
    setCopiadoIdx(idx);
    setTimeout(() => setCopiadoIdx(null), 3000);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/5 via-purple-900/5 to-blue-900/5 dark:from-slate-900 dark:to-slate-850 border border-indigo-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/60 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Indicação de Colegas para Entrevista
              </h3>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Algoritmo TAS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Táticas de rede escolar: entreviste pessoas da sua sala e aumente o impacto da pesquisa!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {sugestoes.map((colega, idx) => (
          <div
            key={colega.nome}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between gap-3 hover:shadow-md transition"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                <span>{colega.icone} {colega.motivo}</span>
                <span className="text-[10px] text-emerald-600 font-extrabold uppercase">Livre</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase leading-snug line-clamp-1">
                {colega.nome}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {colega.turma} • {colega.turno}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() =>
                  onIniciarEntrevistaColega({
                    nome: colega.nome,
                    turma: colega.turma,
                    serie: colega.serie,
                    turno: colega.turno,
                  })
                }
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Entrevistar</span>
              </button>

              <button
                type="button"
                onClick={() => handleCompartilharWhatsApp(colega, idx)}
                title="Convidar colega no WhatsApp"
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl transition border-0 cursor-pointer"
              >
                {copiadoIdx === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
