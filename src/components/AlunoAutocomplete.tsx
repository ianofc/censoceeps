import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import catalogoAlunosLocal from '../data/alunos_turmas.json';

export interface AlunoSelecionadoInfo {
  nome: string;
  turma?: string;
  serie?: string;
  turno?: string;
}

interface AlunoAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectAluno: (info: AlunoSelecionadoInfo) => void;
  entrevistadosExistentes: Map<string, string>;
  meuNome?: string;
  disabled?: boolean;
}

const normalizar = (s?: string) =>
  (s || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function AlunoAutocomplete({
  value,
  onChange,
  onSelectAluno,
  entrevistadosExistentes,
  meuNome,
  disabled = false,
}: AlunoAutocompleteProps) {
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [autoFilled, setAutoFilled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtra sugestões conforme o usuário digita
  useEffect(() => {
    const termo = normalizar(value);
    if (!termo || termo.length < 2) {
      setSugestoes([]);
      setIsOpen(false);
      return;
    }

    const matches = (catalogoAlunosLocal as any[]).filter((aluno) => {
      const nomeNorm = normalizar(aluno.nome_completo);
      const turmaNorm = normalizar(aluno.turma || aluno.turma_codigo);
      return nomeNorm.includes(termo) || turmaNorm.includes(termo);
    });

    setSugestoes(matches.slice(0, 8));
    setIsOpen(matches.length > 0);
    setHighlightedIndex(-1);
  }, [value]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (aluno: any) => {
    const nomeNorm = normalizar(aluno.nome_completo);
    const nomeMeuNorm = normalizar(meuNome);

    if (nomeMeuNorm && nomeNorm === nomeMeuNorm) {
      return; // Auto-entrevista bloqueada
    }

    onChange(aluno.nome_completo);
    onSelectAluno({
      nome: aluno.nome_completo,
      turma: aluno.turma || aluno.turma_codigo,
      serie: aluno.serie,
      turno: aluno.turno,
    });
    setAutoFilled(true);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || sugestoes.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < sugestoes.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : sugestoes.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(sugestoes[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const valorNorm = normalizar(value);
  const isAutoEntrevista = meuNome && valorNorm === normalizar(meuNome);
  const quemEntrevistou = entrevistadosExistentes.get(valorNorm);
  const jaEntrevistado = Boolean(quemEntrevistou);

  return (
    <div ref={containerRef} className="relative w-full space-y-1">
      <div className="relative">
        <input
          id="modal-nome"
          type="text"
          required
          disabled={disabled}
          autoComplete="off"
          placeholder="DIGITE O NOME COMPLETO..."
          value={value}
          onChange={(e) => {
            setAutoFilled(false);
            onChange(e.target.value.toUpperCase());
          }}
          onFocus={() => {
            if (sugestoes.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full p-3.5 pl-10 pr-10 bg-white dark:bg-slate-800 border rounded-2xl text-sm font-semibold outline-none transition-all uppercase shadow-sm ${
            isAutoEntrevista || jaEntrevistado
              ? 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-200 text-rose-900 dark:text-rose-100'
              : autoFilled
              ? 'border-emerald-400 dark:border-emerald-600 focus:ring-2 focus:ring-emerald-200 text-slate-900 dark:text-white'
              : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 dark:text-white'
          }`}
        />

        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-4 pointer-events-none" />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setAutoFilled(false);
            }}
            className="absolute right-3 top-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent border-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selo de Auto-Preenchimento Ativo */}
      {autoFilled && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>⚡ Dados de Série, Turma e Turno preenchidos automaticamente!</span>
        </div>
      )}

      {/* Menu Suspenso de Sugestões Inteligentes */}
      {isOpen && sugestoes.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
          <div className="p-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-[10px] font-bold uppercase text-slate-500 px-3">
            <span>Sugestões da Escola ({sugestoes.length})</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Clique para auto-preencher</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
            {sugestoes.map((item, idx) => {
              const itemNomeNorm = normalizar(item.nome_completo);
              const foiEntrevistado = entrevistadosExistentes.has(itemNomeNorm);
              const entrevistadorNome = entrevistadosExistentes.get(itemNomeNorm);
              const isSelected = highlightedIndex === idx;

              return (
                <button
                  key={`${item.nome_completo}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  disabled={foiEntrevistado}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full p-3 text-left transition flex items-center justify-between gap-3 border-0 cursor-pointer ${
                    foiEntrevistado
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 opacity-70 cursor-not-allowed'
                      : isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase truncate">
                      {item.nome_completo}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{item.turma || item.turma_codigo}</span>
                      {item.serie && <span>• {item.serie}</span>}
                      {item.turno && <span>• {item.turno}</span>}
                    </p>
                  </div>

                  <div className="shrink-0">
                    {foiEntrevistado ? (
                      <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Já coletado ({entrevistadorNome?.split(' ')[0]})
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Disponível
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
