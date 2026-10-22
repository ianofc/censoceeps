import React, { useState, useMemo } from 'react';
import { Search, Share2, Check, X, Award, ExternalLink } from 'lucide-react';
import catalogoAlunosLocal from '../data/alunos_turmas.json';
import { registrarMetricaAB } from '../utils/abTesting';

interface IndicarAmigosModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly minhaTurma?: string;
  readonly meuNome?: string;
}

export function IndicarAmigosModal({ isOpen, onClose, minhaTurma = '1º ADM CM', meuNome = 'Colega' }: Readonly<IndicarAmigosModalProps>) {
  const [busca, setBusca] = useState('');
  const [indicados, setIndicados] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const colegasFiltrados = useMemo(() => {
    const todos = catalogoAlunosLocal as any[];
    const termo = busca.trim().toLowerCase();

    return todos.filter((aluno) => {
      const nome = (aluno.nome_completo || '').toLowerCase();
      const turma = (aluno.turma || aluno.turma_codigo || '').toLowerCase();
      const matchTurma = minhaTurma ? turma.includes(minhaTurma.toLowerCase()) : true;

      if (!termo) {
        // Prioriza mesma turma
        return matchTurma;
      }
      return nome.includes(termo) || turma.includes(termo);
    }).slice(0, 15);
  }, [busca, minhaTurma]);

  if (!isOpen) return null;

  const handleIndicar = (nomeAluno: string) => {
    registrarMetricaAB('cta_coleta_engajamento', 'indicacao_amigo');

    const primeiroNome = nomeAluno.split(' ')[0];
    const meuPrimeiroNome = meuNome.split(' ')[0];

    const texto = encodeURIComponent(
      `E aí, ${primeiroNome}! 👋 Aqui é ${meuPrimeiroNome}. Estou te indicando para responder o Censo Escolar CEEP Seabra — Projeto Científico Ada Lovelace!\n\n` +
      `Sua participação leva menos de 2 minutos e é essencial para nossa turma bater a meta de 100%! 🚀📊\n\n` +
      `Acesse agora pelo link: https://censoceeps.netlify.app/coleta`
    );

    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');

    setIndicados((prev) => new Set([...prev, nomeAluno]));
    setToastMsg(`+30 XP no Ranking! Convite enviado para ${primeiroNome} 🚀`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCompartilharGeral = () => {
    registrarMetricaAB('cta_coleta_engajamento', 'indicacao_amigo');
    const meuPrimeiroNome = meuNome.split(' ')[0];

    const texto = encodeURIComponent(
      `Olá, pessoal! 👋 Sou ${meuPrimeiroNome}. Convido todos os colegas do CEEP Seabra a participarem do Censo Escolar — Projeto Científico Ada Lovelace!\n\n` +
      `Responda o formulário oficial em menos de 2 minutos e fortaleça a ciência na nossa escola:\n` +
      `👉 https://censoceeps.netlify.app/coleta`
    );

    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
    setToastMsg(`+50 XP no Ranking! Link compartilhado com a rede escolar 🎉`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition border-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🚀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">Indicar Amigos no Censo</h3>
                <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  +30 XP cada
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                Tática de Crescimento Social: desafie sua turma a alcançar 100% de respostas!
              </p>
            </div>
          </div>
        </div>

        {/* Toast Notifier */}
        {toastMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in slide-in-from-top-2">
            <Award className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Botão de convite em massa no WhatsApp */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wide text-emerald-900 dark:text-emerald-200">
                Compartilhar no Grupo da Sala
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Envie o convite oficial do Censo direto no WhatsApp da sua turma
              </p>
            </div>
            <button
              type="button"
              onClick={handleCompartilharGeral}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 shrink-0 cursor-pointer border-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Convidar Sala</span>
            </button>
          </div>

          {/* Busca de Colega Específico */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar colega pelo nome ou turma..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Lista de Colegas Recomendados */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              {busca ? 'Resultados da Pesquisa' : `Colegas Sugeridos (${minhaTurma})`}
            </span>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto pr-1">
              {colegasFiltrados.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Nenhum colega encontrado com esse nome.</p>
              ) : (
                colegasFiltrados.map((colega: any) => {
                  const jaIndicado = indicados.has(colega.nome_completo);
                  return (
                    <div key={colega.nome_completo} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate uppercase">
                          {colega.nome_completo}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {colega.turma || colega.turma_codigo} · {colega.turno || 'Matutino'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleIndicar(colega.nome_completo)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer border-0 ${
                          jaIndicado
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        }`}
                      >
                        {jaIndicado ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Indicado</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Indicar</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 font-medium">
          <span>{indicados.size} amigo(s) indicado(s)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition border-0 cursor-pointer"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
}
