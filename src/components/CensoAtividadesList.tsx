import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { User, Users, RefreshCw, Search, CheckCircle } from 'lucide-react';

export interface CensoItem {
  id: string;
  entrevistador_id?: string;
  user_id?: string;
  interviewer_name?: string;
  nome_participante: string;
  contato_whatsapp?: string;
  genero?: string;
  vinculo: string;
  serie?: string;
  turma?: string;
  grupo_escolar?: string;
  turno?: string;
  cidade_natal?: string;
  local_moradia?: string;
  cor_raca?: string;
  origem_familia?: string;
  sofreu_preconceito?: string;
  relato_preconceito?: string;
  relato_sofreu?: string;
  presenciou_preconceito?: string;
  relato_presenciou?: string;
  created_at: string;
  synced?: boolean;
  entrevistador?: {
    nome_completo: string;
  };
}

const normalizeStr = (s?: string) =>
  (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface CensoAtividadesListProps {
  readonly fetchingData: boolean;
  readonly minhasEntrevistas: CensoItem[];
  readonly atividadesRecentes: CensoItem[];
  readonly userProfileName?: string;
  readonly onRefresh: () => void;
}

export const CensoAtividadesList: React.FC<CensoAtividadesListProps> = ({
  fetchingData,
  minhasEntrevistas,
  atividadesRecentes,
  userProfileName,
  onRefresh,
}) => {
  const [abaAtividades, setAbaAtividades] = useState<'minhas' | 'escola'>('minhas');
  const [buscaMinhas, setBuscaMinhas] = useState('');

  const listaExibida = useMemo(() => {
    if (abaAtividades !== 'minhas') {
      return atividadesRecentes;
    }
    const q = normalizeStr(buscaMinhas.trim());
    if (!q) return minhasEntrevistas;
    return minhasEntrevistas.filter((item) => (
      normalizeStr(item.nome_participante).includes(q) ||
      normalizeStr(item.grupo_escolar).includes(q) ||
      normalizeStr(item.turma).includes(q)
    ));
  }, [abaAtividades, atividadesRecentes, buscaMinhas, minhasEntrevistas]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setAbaAtividades('minhas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer border-0 ${
              abaAtividades === 'minhas'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Minhas Entrevistas ({minhasEntrevistas.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setAbaAtividades('escola')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer border-0 ${
              abaAtividades === 'escola'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Últimas da Escola</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border-0 cursor-pointer transition"
            title="Atualizar lista de entrevistas"
          >
            <RefreshCw className={`w-4 h-4 ${fetchingData ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/dashboard"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            Ver Painel Completo →
          </Link>
        </div>
      </div>

      {abaAtividades === 'minhas' && minhasEntrevistas.length > 3 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar nas suas entrevistas realizadas..."
            value={buscaMinhas}
            onChange={(e) => setBuscaMinhas(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {fetchingData && minhasEntrevistas.length === 0 && atividadesRecentes.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 animate-pulse font-semibold">Carregando registros...</div>
      ) : listaExibida.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400 font-semibold">
          {abaAtividades === 'minhas'
            ? 'Nenhuma entrevista encontrada. Clique em "+ Nova Ficha de Coleta" acima para registrar!'
            : 'Nenhuma ficha registrada ainda.'}
        </div>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {listaExibida.map((item, idx) => (
            <div key={item.id || idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl font-black text-xs min-w-[36px] text-center">
                  {abaAtividades === 'minhas' ? `#${listaExibida.length - idx}` : <CheckCircle className="w-4 h-4 mx-auto" />}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <span className="uppercase">{(item.nome_participante || '').toUpperCase()}</span>
                    {item.id?.toString().startsWith('local-') ? (
                      <span className="text-[10px] bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-md font-semibold">Pendente Nuvem</span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md font-semibold">Salva</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Turma/Setor: {item.grupo_escolar || item.turma || 'Não informada'} • Entrevistador(a): {item.interviewer_name || userProfileName || 'Você'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recente'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
