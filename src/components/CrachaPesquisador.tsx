import React from 'react';
import { UserCircle, ShieldCheck } from 'lucide-react';

interface CrachaPesquisadorProps {
  nome: string;
  avatarUrl?: string;
  turma: string;
}

export const CrachaPesquisador: React.FC<CrachaPesquisadorProps> = ({ nome, avatarUrl, turma }) => {
  return (
    <div className="w-full max-w-sm mx-auto mt-6 overflow-hidden rounded-2xl bg-gradient-to-b from-blue-600 to-indigo-800 text-white shadow-2xl relative">
      <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
        <ShieldCheck size={100} />
      </div>
      
      <div className="p-4 text-center border-b border-white/20 bg-black/10">
        <h3 className="font-black tracking-widest uppercase text-xs text-blue-100">
          Pesquisador Censitário
        </h3>
        <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-300 mt-1">
          Oficial Ada Lovelace
        </p>
      </div>
      
      <div className="p-6 flex flex-col items-center">
        <div className="w-28 h-28 rounded-full border-4 border-white/30 p-1 bg-white shadow-inner z-10 relative">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={nome} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
              <UserCircle size={64} />
            </div>
          )}
          
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1.5 border-2 border-white shadow-lg">
            <ShieldCheck size={16} className="text-white" />
          </div>
        </div>
        
        <div className="mt-5 text-center z-10">
          <h2 className="text-xl font-bold">{nome}</h2>
          <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md">
            {turma}
          </span>
        </div>
      </div>
      
      <div className="py-2 bg-black/20 text-center text-[9px] uppercase tracking-widest text-white/60">
        Comunidade Escolar CEEP Seabra
      </div>
    </div>
  );
};
