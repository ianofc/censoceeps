import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Tv2, Award, Landmark } from 'lucide-react';

export function PublicDisplay() {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchTotal = async () => {
      const { count } = await supabase.from('censo_coletas').select('*', { count: 'exact', head: true });
      setTotal(count || 0);
    };

    fetchTotal();
    const interval = setInterval(fetchTotal, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[85vh] bg-white rounded-3xl p-8 border border-slate-200 shadow-lg flex flex-col justify-between animate-in fade-in duration-500">
      <header className="flex justify-between items-center border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">CEEP SEABRA</h1>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              PROJEÇÃO AO VIVO — CENSO CEEP
            </p>
          </div>
        </div>

        <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          Transmissão Ativa
        </span>
      </header>

      <main className="my-auto text-center space-y-4 py-12">
        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block">
          Amostras Coletadas em Tempo Real
        </span>
        <strong className="text-8xl font-black text-blue-600 tracking-tight block">
          {total}
        </strong>
        <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto">
          Formulários registrados pela equipe do Projeto Ada Lovelace
        </p>
      </main>

      <footer className="border-t border-slate-100 pt-6 flex justify-between items-center text-xs text-slate-400 font-medium">
        <span>Pesquisa de Campo: Gênero, Raça e Pertencimento</span>
        <span>IO OS — Censo CEEP</span>
      </footer>
    </div>
  );
}