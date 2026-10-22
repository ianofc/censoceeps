import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface CensoOfflineBannerProps {
  readonly isOnline: boolean;
  readonly pendingSyncCount: number;
  readonly onOpenRescue: () => void;
  readonly onSyncNow: () => void;
}

export const CensoOfflineBanner: React.FC<CensoOfflineBannerProps> = ({
  isOnline,
  pendingSyncCount,
  onOpenRescue,
  onSyncNow,
}) => {
  return (
    <>
      {!isOnline && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 shrink-0" />
            <p className="text-xs font-bold">
              Você está offline. As fichas preenchidas serão salvas no aparelho e enviadas automaticamente ao retornar a rede.
            </p>
          </div>
          {pendingSyncCount > 0 && (
            <span className="text-[11px] bg-rose-500 text-white px-2.5 py-1 rounded-full font-bold">
              {pendingSyncCount} pendente(s)
            </span>
          )}
        </div>
      )}

      {pendingSyncCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-slate-800 dark:text-slate-200 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-black">
                {pendingSyncCount} {pendingSyncCount === 1 ? 'ficha gravada' : 'fichas gravadas'} com segurança no aparelho aguardando nuvem
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dados 100% seguros contra desligamento ou conexão de 1 bit.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenRescue}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl font-bold border-0 cursor-pointer transition-colors"
            >
              💾 Backup / Resgate
            </button>
            <button
              type="button"
              onClick={onSyncNow}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl font-black border-0 cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Subir Agora
            </button>
          </div>
        </div>
      )}
    </>
  );
};
