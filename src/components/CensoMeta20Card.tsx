import React from 'react';
import { Trophy } from 'lucide-react';

interface CensoMeta20CardProps {
  readonly myFichas: number;
}

export const CensoMeta20Card: React.FC<CensoMeta20CardProps> = ({ myFichas }) => {
  const isConcluido = myFichas >= 20;

  return (
    <div
      className={`border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden transition-all duration-300 ${
        isConcluido
          ? 'bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-purple-500/10 border-amber-400 dark:border-amber-500/50 dark:bg-slate-900'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Luz de fundo se meta batida */}
      {isConcluido && (
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span
            className={`p-2.5 rounded-2xl flex items-center justify-center ${
              isConcluido
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            <Trophy className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              Missão Científica: Meta 20 Entrevistas
              {isConcluido && (
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black animate-pulse">
                  CONCLUÍDO!
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Realize 20 coletas com rigor para desbloquear a insígnia máxima da Adinha Campeã!
            </p>
          </div>
        </div>
        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
          <span className="text-2xl font-black text-amber-500">
            {myFichas}<span className="text-xs text-slate-400 font-bold">/20</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {Math.max(0, 20 - myFichas)} restantes
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
          <span>Progresso da Pesquisa de Campo</span>
          <span>{Math.min(100, Math.round((myFichas / 20) * 100))}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isConcluido
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-sm shadow-amber-400/50'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
            style={{ width: `${Math.min(100, (myFichas / 20) * 100)}%` }}
          />
        </div>

        {/* Marcos Intermediários da Adinha */}
        <div className="grid grid-cols-4 gap-2 pt-2 text-center">
          <div
            className={`p-2 rounded-xl text-[10px] font-bold border transition ${
              myFichas >= 5
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>🌱 5: Curiosa</span>
          </div>
          <div
            className={`p-2 rounded-xl text-[10px] font-bold border transition ${
              myFichas >= 10
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>🔍 10: Metade</span>
          </div>
          <div
            className={`p-2 rounded-xl text-[10px] font-bold border transition ${
              myFichas >= 15
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>⚡ 15: Reta Final</span>
          </div>
          <div
            className={`p-2 rounded-xl text-[10px] font-bold border transition ${
              myFichas >= 20
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span>🏆 20: Campeã!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
