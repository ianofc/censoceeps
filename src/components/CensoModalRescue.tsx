import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { tasOfflineSync } from '../utils/tasOfflineSync';

interface CensoModalRescueProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSync: () => Promise<void>;
  readonly onDraftsUpdated: (count: number) => void;
}

export const CensoModalRescue: React.FC<CensoModalRescueProps> = ({
  isOpen,
  onClose,
  onSync,
  onDraftsUpdated,
}) => {
  const [rescueJsonInput, setRescueJsonInput] = useState<string>('');
  const [rescueSuccessMsg, setRescueSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const json = tasOfflineSync.exportDraftsAsJson();
    void navigator.clipboard.writeText(json);
    setRescueSuccessMsg('Backup copiado para a área de transferência com sucesso!');
  };

  const handleImportJson = () => {
    const imported = tasOfflineSync.importDraftsFromJson(rescueJsonInput.trim());
    if (imported > 0) {
      onDraftsUpdated(tasOfflineSync.getDrafts().length);
      setRescueSuccessMsg(`${imported} ficha(s) restaurada(s) no aparelho com sucesso!`);
      setRescueJsonInput('');
      void onSync();
    } else {
      setRescueSuccessMsg('Erro: formato de JSON inválido ou vazio.');
    }
  };

  const handleClose = () => {
    setRescueSuccessMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
              💾
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Central de Resgate & Backup Offline</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Proteção contra perda de dados em aparelhos da escola</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold bg-transparent border-0 cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fichas salvas neste aparelho:</span>
              <span className="text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                {tasOfflineSync.getDrafts().length} fichas
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Se você estiver usando um Chromebook ou tablet compartilhado da escola, copie o backup em JSON abaixo para garantir que seus dados nunca se percam!
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-0 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                📋 Copiar Backup (JSON)
              </button>
              <button
                type="button"
                onClick={() => void onSync()}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border-0 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Subir Agora
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="rescue-json-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Restaurar / Importar Fichas de outro aparelho:
            </label>
            <textarea
              id="rescue-json-input"
              rows={3}
              placeholder="Cole aqui o JSON exportado de outro dispositivo (ex: do Chromebook da escola)..."
              value={rescueJsonInput}
              onChange={(e) => setRescueJsonInput(e.target.value)}
              className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              disabled={!rescueJsonInput.trim()}
              onClick={handleImportJson}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold rounded-xl border-0 cursor-pointer"
            >
              📥 Importar e Sincronizar Fichas
            </button>
          </div>

          {rescueSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 text-center animate-in fade-in">
              {rescueSuccessMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
