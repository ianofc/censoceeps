import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, FileText, User } from 'lucide-react';

export function Dashboard() {
  const [coletas, setColetas] = useState<unknown[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchMyColetas();
  }, []);

  const fetchMyColetas = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('pessoas')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      const { data, error } = await supabase
        .from('censo_coletas')
        .select('*')
        .eq('entrevistador_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setColetas(data || []);
    } catch (err) {
      console.error('Erro ao carregar coletas do aluno:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredColetas = coletas.filter(
    (c) =>
      c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.turma?.toLowerCase().includes(search.toLowerCase())
  );

  const renderTableContent = () => {
    if (loading) {
      return (
        <div className="p-8 text-center text-slate-400 font-bold animate-pulse">
          Carregando suas fichas...
        </div>
      );
    }

    if (filteredColetas.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-medium">Você ainda não registrou nenhuma entrevista neste painel.</p>
        </div>
      );
    }

    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
            <th className="p-3 font-bold">Data/Hora</th>
            <th className="p-3 font-bold">Entrevistado(a)</th>
            <th className="p-3 font-bold">Turma</th>
            <th className="p-3 font-bold">Gênero</th>
            <th className="p-3 font-bold">Raça Declarada</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredColetas.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="p-3 text-xs text-slate-400">
                {new Date(item.created_at).toLocaleString('pt-BR')}
              </td>
              <td className="p-3 font-bold text-slate-800">{item.nome}</td>
              <td className="p-3 font-semibold text-slate-600">{item.turma}</td>
              <td className="p-3 text-slate-700">{item.genero}</td>
              <td className="p-3 text-slate-700">{item.raca}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="agora-page-title">Minhas Entrevistas & Coletas</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Painel de controle individual do(a) entrevistador(a)
            {userProfile && <span className="text-blue-600 font-bold ml-1">({userProfile.nome_completo})</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <User className="w-4 h-4" /> Entrevistador(a) Ativo(a)
          </span>
        </div>
      </div>

      <div className="agora-card space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar nas minhas coletas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total Registrado por Mim: <strong className="text-blue-600 text-sm">{filteredColetas.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          {renderTableContent()}
        </div>
      </div>
    </div>
  );
}