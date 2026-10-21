import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUserSession } from '../hooks/useUserSession';
import { Search, FileText, User, Users, RefreshCw } from 'lucide-react';

export function Dashboard() {
  const { profile: sessionProfile, isTeacher, isAdmin } = useUserSession();
  const [coletas, setColetas] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'minhas' | 'todas'>('minhas');

  const fetchColetas = useCallback(async () => {
    setLoading(true);
    let userId = sessionProfile?.id || '';

    if (!userId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || '';
      } catch {
        // ignora
      }
    }

    // Carrega rascunhos locais pendentes
    const localDrafts = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
    const draftsFormatted = localDrafts.map((d: any) => {
      const raw = d.data || d;
      return {
        id: d.id || raw.id || `local-${Date.now()}`,
        nome_participante: (raw.nome_participante || raw.nome || '').trim().toUpperCase(),
        turma: raw.turma ? (raw.serie ? `${raw.serie} - ${raw.turma}` : raw.turma) : (raw.grupo_escolar || 'Offline'),
        genero: raw.genero || 'Não inf.',
        cor_raca: raw.cor_raca || 'Não inf.',
        created_at: raw.created_at || d.timestamp || new Date().toISOString(),
        isPending: true,
        entrevistador_id: raw.entrevistador_id && raw.entrevistador_id !== 'offline-user' ? raw.entrevistador_id : userId,
      };
    });

    try {
      if (userId) {
        const { data: profile } = await supabase
          .from('pessoas')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          setUserProfile(profile);
        } else if (sessionProfile?.nomeCompleto) {
          setUserProfile({
            id: userId,
            nome_completo: sessionProfile.nomeCompleto,
            papel: sessionProfile.papel,
          });
        }
      }

      let query = supabase
        .from('entrevistas')
        .select('*, entrevistador:pessoas(nome_completo)')
        .order('created_at', { ascending: false });

      if (viewMode === 'minhas' && userId) {
        query = query.eq('entrevistador_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const serverItems = (data || []).map((item: any) => ({
        ...item,
        nome_participante: (item.nome_participante || item.nome || '').trim().toUpperCase(),
        turma: item.turma ? (item.serie ? `${item.serie} - ${item.turma}` : item.turma) : (item.grupo_escolar || 'Comunidade Escolar'),
        isPending: false,
      }));

      if (viewMode === 'minhas' && userId) {
        try {
          localStorage.setItem(`censo_my_interviews_cache_${userId}`, JSON.stringify(serverItems));
        } catch {
          // ignora
        }
      }

      // Combina rascunhos pendentes do usuário com itens do servidor (evitando duplicar pelo nome)
      const serverNames = new Set(serverItems.map((s: any) => (s.nome_participante || '').trim().toLowerCase()));
      const relevantDrafts = (viewMode === 'minhas'
        ? draftsFormatted.filter((d: any) => !userId || d.entrevistador_id === userId)
        : draftsFormatted
      ).filter((d: any) => !serverNames.has((d.nome_participante || '').trim().toLowerCase()));

      setColetas([...relevantDrafts, ...serverItems]);
    } catch (err) {
      console.warn('Erro ao carregar entrevistas no painel (usando cache local):', err);
      if (sessionProfile?.nomeCompleto && !userProfile) {
        setUserProfile({
          id: userId,
          nome_completo: sessionProfile.nomeCompleto,
          papel: sessionProfile.papel,
        });
      }

      let cachedItems: any[] = [];
      if (userId) {
        try {
          const cachedStr = localStorage.getItem(`censo_my_interviews_cache_${userId}`);
          if (cachedStr) {
            cachedItems = JSON.parse(cachedStr).map((item: any) => ({
              ...item,
              turma: item.turma ? (item.serie && !String(item.turma).includes(item.serie) ? `${item.serie} - ${item.turma}` : item.turma) : (item.grupo_escolar || 'Comunidade Escolar'),
              isPending: false,
            }));
          }
        } catch {
          // ignora
        }
      }

      const cachedNames = new Set(cachedItems.map((s: any) => (s.nome_participante || '').trim().toLowerCase()));
      const uniqueDrafts = draftsFormatted.filter((d: any) => !cachedNames.has((d.nome_participante || '').trim().toLowerCase()));
      setColetas([...uniqueDrafts, ...cachedItems]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, sessionProfile?.id, sessionProfile?.nomeCompleto, sessionProfile?.papel]);

  useEffect(() => {
    void fetchColetas();
  }, [fetchColetas]);

  const filteredColetas = coletas.filter((c) => {
    const s = search.toLowerCase();
    const nome = (c.nome_participante || c.nome || '').toLowerCase();
    const turma = (c.turma || '').toLowerCase();
    const entrevistador = (c.entrevistador?.nome_completo || '').toLowerCase();
    return nome.includes(s) || turma.includes(s) || entrevistador.includes(s);
  });

  const isStaff = isTeacher || isAdmin;

  const renderTableContent = () => {
    if (loading) {
      return (
        <div className="p-8 text-center text-slate-400 font-bold animate-pulse">
          Carregando entrevistas...
        </div>
      );
    }

    if (filteredColetas.length === 0) {
      return (
        <div className="p-8 text-center text-slate-500 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-300" />
          <p className="font-medium">
            {viewMode === 'minhas'
              ? 'Você ainda não possui entrevistas registradas com seu usuário.'
              : 'Nenhuma entrevista encontrada no sistema.'}
          </p>
        </div>
      );
    }

    return (
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
            <th className="p-3 font-bold">Data/Hora</th>
            <th className="p-3 font-bold">Entrevistado(a)</th>
            <th className="p-3 font-bold">Turma / Vínculo</th>
            <th className="p-3 font-bold">Gênero</th>
            <th className="p-3 font-bold">Raça Declarada</th>
            {viewMode === 'todas' && <th className="p-3 font-bold">Entrevistador(a)</th>}
            <th className="p-3 font-bold text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredColetas.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="p-3 text-xs text-slate-400">
                {new Date(item.created_at).toLocaleString('pt-BR')}
              </td>
              <td className="p-3 font-bold text-slate-800 uppercase">
                {(item.nome_participante || item.nome || '').toUpperCase()}
              </td>
              <td className="p-3 font-semibold text-slate-600">{item.turma}</td>
              <td className="p-3 text-slate-700">{item.genero || '—'}</td>
              <td className="p-3 text-slate-700">{item.cor_raca || '—'}</td>
              {viewMode === 'todas' && (
                <td className="p-3 text-xs font-bold text-blue-600">
                  {item.entrevistador?.nome_completo || '—'}
                </td>
              )}
              <td className="p-3 text-center">
                {item.isPending ? (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                    Pendente Nuvem
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    Sincronizado
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {viewMode === 'minhas' ? 'Minhas Entrevistas & Coletas' : 'Todas as Entrevistas do Censo'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            {userProfile && (
              <>
                Usuário: <strong className="text-blue-600">{userProfile.nome_completo}</strong> • Papel: {userProfile.papel}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isStaff && (
            <div className="bg-slate-200 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('minhas')}
                className={`px-3 py-1.5 rounded-lg border-0 cursor-pointer transition ${
                  viewMode === 'minhas' ? 'bg-white text-blue-700 shadow-sm' : 'bg-transparent text-slate-600'
                }`}
              >
                <User className="w-3.5 h-3.5 inline mr-1" /> Minhas
              </button>
              <button
                type="button"
                onClick={() => setViewMode('todas')}
                className={`px-3 py-1.5 rounded-lg border-0 cursor-pointer transition ${
                  viewMode === 'todas' ? 'bg-white text-blue-700 shadow-sm' : 'bg-transparent text-slate-600'
                }`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1" /> Todas da Escola
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => void fetchColetas()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border-0 cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por participante, turma ou entrevistador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total Exibido: <strong className="text-blue-600 text-sm">{filteredColetas.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          {renderTableContent()}
        </div>
      </div>
    </div>
  );
}