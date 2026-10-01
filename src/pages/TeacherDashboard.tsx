import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Trash2, ShieldCheck, UserCheck } from 'lucide-react';

export function TeacherDashboard() {
  const [coletas, setColetas] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchColetasComEntrevistador();
  }, []);

  const fetchColetasComEntrevistador = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('censo_coletas')
        .select(`
          *,
          pessoas:entrevistador_id (
            nome_completo,
            turma_ou_cargo,
            papel
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setColetas(data || []);
    } catch (err) {
      console.error('Erro ao carregar dados do censo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta coleta do Censo?')) return;
    const { error } = await supabase.from('censo_coletas').delete().eq('id', id);
    if (!error) {
      setColetas((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const filteredColetas = coletas.filter((c) => {
    const termo = search.toLowerCase();
    const nomeEntrevistado = c.nome?.toLowerCase() || '';
    const turmaEntrevistado = c.turma?.toLowerCase() || '';
    const nomeEntrevistador = c.pessoas?.nome_completo?.toLowerCase() || '';
    
    return (
      nomeEntrevistado.includes(termo) ||
      turmaEntrevistado.includes(termo) ||
      nomeEntrevistador.includes(termo)
    );
  });

  const renderTableContent = () => {
    if (loading) {
      return (
        <div className="p-8 text-center text-slate-400 font-bold animate-pulse">
          Carregando coletas consolidadas...
        </div>
      );
    }

    if (filteredColetas.length === 0) {
      return (
        <div className="p-8 text-center text-slate-400 font-medium">
          Nenhuma coleta encontrada.
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
            <th className="p-3 font-bold">Entrevistador(a) / Aluno(a)</th>
            <th className="p-3 font-bold">Gênero / Raça</th>
            <th className="p-3 font-bold text-center">Ações</th>
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
              <td className="p-3 text-slate-700">
                <div className="flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>{item.pessoas?.nome_completo || 'Não identificado'}</span>
                </div>
              </td>
              <td className="p-3 text-slate-600 text-xs">
                {item.genero} / {item.raca}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Excluir Coleta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
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
          <h1 className="agora-page-title">Painel Docente & Auditoria</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Auditoria completa de formulários e controle de campo das equipes de estudantes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Acesso Docente / Admin
          </span>
        </div>
      </div>

      <div className="agora-card space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por entrevistado, turma ou aluno(a) entrevistador(a)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total de Registros: <strong className="text-blue-600 text-sm">{filteredColetas.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          {renderTableContent()}
        </div>
      </div>
    </div>
  );
}