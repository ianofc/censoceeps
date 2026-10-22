import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, nameKey } from '../lib/supabaseClient';
import { tasOfflineSync, initBackgroundSync } from '../utils/tasOfflineSync';
import { useUserSession } from '../hooks/useUserSession';
import { UserAvatar } from '../components/UserAvatar';
import { ClipboardList, Plus, CheckCircle, Award, Users, Heart, RefreshCw, Search, User, AlertCircle } from 'lucide-react';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { CelebrationScreen } from '../components/CelebrationScreen';
import { RecomendacaoColegasCard } from '../components/RecomendacaoColegasCard';
import { CensoOfflineBanner } from '../components/CensoOfflineBanner';
import { CensoMeta20Card } from '../components/CensoMeta20Card';
import { CensoModalRescue } from '../components/CensoModalRescue';
import { CensoModalColeta, RegistroEntrevistado } from '../components/CensoModalColeta';
import listaAlunos from '../data/alunos.json';

const normalizeStr = (s?: string) =>
  (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface CensoItem {
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

function parsePendingQueue(profile: any): { pending: CensoItem[]; myPending: CensoItem[] } {
  const rawPending: any[] = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
  const pending: CensoItem[] = rawPending.map((item: any) => {
    const r = item.data || item;
    return {
      ...r,
      id: item.id || r.id || `local-${Date.now()}`,
      interviewer_name: r.interviewer_name || profile?.nomeCompleto || 'Você (Offline)',
      grupo_escolar: r.turma ? (r.serie ? `${r.serie} - ${r.turma}` : r.turma) : (r.grupo_escolar || 'Comunidade Escolar'),
      created_at: r.created_at || item.timestamp || new Date().toISOString(),
    };
  });

  const myPending = pending.filter((p) => {
    if (!profile?.id) return true;
    return (
      p.entrevistador_id === profile.id ||
      p.user_id === profile.id ||
      p.entrevistador_id === 'offline-user' ||
      !p.entrevistador_id
    );
  });

  return { pending, myPending };
}

function buildEntrevistadosMaps(todasEntrevistas: any[], pending: CensoItem[]) {
  const mapEntrevistados = new Map<string, string>();
  (todasEntrevistas || []).forEach((row: any) => {
    if (row.nome_participante) {
      const intName = row.entrevistador?.nome_completo || 'outro entrevistador';
      mapEntrevistados.set(nameKey(row.nome_participante), intName);
    }
  });
  pending.forEach((raw: any) => {
    if (raw.nome_participante) {
      mapEntrevistados.set(nameKey(raw.nome_participante), raw.interviewer_name || 'você (salvo offline)');
    }
  });

  const registros: RegistroEntrevistado[] = [
    ...(todasEntrevistas || []).map((row: any) => ({
      nome: row.nome_participante || '',
      entrevistador: row.entrevistador?.nome_completo || 'outro entrevistador',
      vinculo: row.vinculo,
      serie: row.serie,
      turma: row.turma,
    })),
    ...pending.map((raw: any) => ({
      nome: raw.nome_participante || '',
      entrevistador: raw.interviewer_name || 'você (salvo offline)',
      vinculo: raw.vinculo,
      serie: raw.serie,
      turma: raw.turma,
    })),
  ].filter((r) => r.nome);

  return { mapEntrevistados, registros };
}

function buildMinhasEntrevistas(todasEntrevistas: any[], myPending: CensoItem[], profile: any): CensoItem[] {
  if (!profile?.id) return [];

  const minhasOnline: CensoItem[] = (todasEntrevistas || [])
    .filter((r: any) => r.entrevistador_id === profile.id)
    .map((r: any) => ({
      ...r,
      interviewer_name: r.entrevistador?.nome_completo || profile.nomeCompleto || 'Você',
      grupo_escolar: r.turma ? (r.serie ? `${r.serie} - ${r.turma}` : r.turma) : 'Comunidade Escolar',
    }));

  try {
    localStorage.setItem(`censo_my_interviews_cache_${profile.id}`, JSON.stringify(minhasOnline));
  } catch {
    // ignora
  }

  const onlineNames = new Set(minhasOnline.map((m) => normalizeStr(m.nome_participante)));
  const myPendingUnique = myPending.filter((p) => !onlineNames.has(normalizeStr(p.nome_participante)));
  const myPendingReversed = [...myPendingUnique].reverse();
  return [...myPendingReversed, ...minhasOnline];
}

function restoreOfflineState(profile: any, pending: CensoItem[], myPending: CensoItem[]) {
  const mapEntrevistados = new Map<string, string>();
  pending.forEach((raw: any) => {
    if (raw.nome_participante) {
      mapEntrevistados.set(nameKey(raw.nome_participante), raw.interviewer_name || 'você (salvo offline)');
    }
  });

  let cachedMinhas: CensoItem[] = [];
  if (profile?.id) {
    try {
      const cachedStr = localStorage.getItem(`censo_my_interviews_cache_${profile.id}`);
      if (cachedStr) {
        cachedMinhas = JSON.parse(cachedStr);
        cachedMinhas.forEach((c) => {
          if (c.nome_participante) {
            mapEntrevistados.set(nameKey(c.nome_participante), c.interviewer_name || profile.nomeCompleto || 'você');
          }
        });
      }
    } catch {
      // ignora
    }
  }

  const cachedNames = new Set(cachedMinhas.map((m) => normalizeStr(m.nome_participante)));
  const myPendingUnique = myPending.filter((p) => !cachedNames.has(normalizeStr(p.nome_participante)));
  const myPendingOfflineReversed = [...myPendingUnique].reverse();
  const combinadasOffline = [...myPendingOfflineReversed, ...cachedMinhas];

  const registros: RegistroEntrevistado[] = [...pending, ...cachedMinhas]
    .filter((r: any) => r.nome_participante)
    .map((r: any) => ({
      nome: r.nome_participante,
      entrevistador: r.interviewer_name || 'você',
      vinculo: r.vinculo,
      serie: r.serie,
      turma: r.turma,
    }));

  return { mapEntrevistados, combinadasOffline, registros };
}

export function Home() {
  const { profile } = useUserSession();

  const [showModalColeta, setShowModalColeta] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [showRescueModal, setShowRescueModal] = useState<boolean>(false);
  const [prefillColega, setPrefillColega] = useState<{ nome: string; turma?: string; serie?: string; turno?: string } | null>(null);

  const [likesCount, setLikesCount] = useState(0);

  const [myFichas, setMyFichas] = useState(0);
  const [minhasEntrevistas, setMinhasEntrevistas] = useState<CensoItem[]>([]);
  const [abaAtividades, setAbaAtividades] = useState<'minhas' | 'escola'>('minhas');
  const [buscaMinhas, setBuscaMinhas] = useState('');

  const [stats, setStats] = useState({
    totalColetas: 0,
    totalPessoas: 0,
    totalTurmas: 0,
  });
  const [atividadesRecentes, setAtividadesRecentes] = useState<CensoItem[]>([]);
  const [entrevistadosExistentes, setEntrevistadosExistentes] = useState<Map<string, string>>(new Map());
  const [registrosEntrevistados, setRegistrosEntrevistados] = useState<RegistroEntrevistado[]>([]);
  const [listaSugerida, setListaSugerida] = useState<string[]>(listaAlunos);

  const fetchDashboardData = useCallback(async () => {
    const { pending, myPending } = parsePendingQueue(profile);
    setPendingSyncCount(pending.length);

    try {
      const queries: PromiseLike<any>[] = [
        supabase.from('entrevistas').select('*', { count: 'exact', head: true }),
        supabase.from('pessoas').select('*', { count: 'exact', head: true }),
        supabase.from('entrevistas').select('*, entrevistador:pessoas(nome_completo)').order('created_at', { ascending: false }).limit(10),
        supabase.from('entrevistas').select('id, nome_participante, serie, turma, vinculo, genero, cor_raca, created_at, entrevistador_id, entrevistador:pessoas(nome_completo)').order('created_at', { ascending: false }),
        supabase.from('pessoas').select('nome_completo, papel'),
      ];

      const [
        { count: total, error: errTotal },
        { count: pessoasCount },
        { data: recentes },
        { data: todasEntrevistas, error: errTodas },
        { data: pessoasDb },
      ] = await Promise.all(queries);

      if (errTotal || errTodas) {
        throw errTotal || errTodas;
      }

      const { mapEntrevistados, registros } = buildEntrevistadosMaps(todasEntrevistas, pending);
      setEntrevistadosExistentes(mapEntrevistados);
      setRegistrosEntrevistados(registros);

      if (profile?.id) {
        const combinadasMinhas = buildMinhasEntrevistas(todasEntrevistas, myPending, profile);
        setMinhasEntrevistas(combinadasMinhas);
        setMyFichas(combinadasMinhas.length);
      }

      if (pessoasDb && pessoasDb.length > 0) {
        const nomesPessoas = pessoasDb.map((p: any) => (p.nome_completo || '').trim().toUpperCase()).filter(Boolean);
        const combinada = Array.from(new Set([...listaAlunos.map((a: string) => a.trim().toUpperCase()), ...nomesPessoas]));
        setListaSugerida(combinada);
      }

      const turmasUnicas = new Set(
        (todasEntrevistas || [])
          .map((r: any) => `${r.serie || ''} - ${r.turma || ''}`.trim())
          .filter((t: string) => t && t !== '-')
      );

      setStats({
        totalColetas: (total || 0) + pending.length,
        totalPessoas: pessoasCount || 0,
        totalTurmas: turmasUnicas.size,
      });

      const serverData = (recentes || []).map((r: any) => ({
        ...r,
        interviewer_name: r.entrevistador?.nome_completo || 'Pesquisador(a)',
        grupo_escolar: r.turma ? (r.serie ? `${r.serie} - ${r.turma}` : r.turma) : 'Comunidade Escolar',
      }));
      setAtividadesRecentes([...[...pending].reverse(), ...serverData].slice(0, 10));
    } catch (err) {
      console.warn('Modo Offline ativado / Erro de conexão com Supabase:', err);
      const { mapEntrevistados, combinadasOffline, registros } = restoreOfflineState(profile, pending, myPending);

      setMinhasEntrevistas(combinadasOffline);
      if (combinadasOffline.length > 0) {
        setMyFichas(combinadasOffline.length);
      }

      setEntrevistadosExistentes(mapEntrevistados);
      setRegistrosEntrevistados(registros);
      setAtividadesRecentes(combinadasOffline.length > 0 ? combinadasOffline.slice(0, 10) : [...pending].reverse());
      setStats((prev) => ({
        ...prev,
        totalColetas: Math.max(prev.totalColetas, combinadasOffline.length, pending.length),
      }));
    } finally {
      setFetchingData(false);
    }
  }, [profile?.id, profile?.nomeCompleto]);

  const syncPendingData = useCallback(async () => {
    try {
      const res = await tasOfflineSync.syncOfflineData(profile?.id);
      setPendingSyncCount(res.remainingCount);
      if (res.syncedCount > 0) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Erro ao sincronizar fila offline:', err);
    }
  }, [profile?.id, fetchDashboardData]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncPendingData();
    };
    const handleOffline = () => setIsOnline(false);
    const handleSyncComplete = () => {
      void fetchDashboardData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('censo-sync-complete', handleSyncComplete);

    void fetchDashboardData();

    // Ativa sincronização em segundo plano periódica a cada 25s
    const unsubBgSync = initBackgroundSync(profile?.id);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('censo-sync-complete', handleSyncComplete);
      unsubBgSync();
    };
  }, [fetchDashboardData, syncPendingData, profile?.id]);

  // Carrega likes recebidos
  useEffect(() => {
    if (!profile.id) return;
    void supabase
      .from('pessoa_likes')
      .select('*', { count: 'exact', head: true })
      .eq('liked_id', profile.id)
      .then(({ count: lkCount }) => {
        if (typeof lkCount === 'number') setLikesCount(lkCount);
      }, console.error);
  }, [profile.id]);

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

  const papelLow = (profile?.papel || '').toLowerCase();
  const isAdminOrTeacher =
    papelLow === 'gestor' ||
    papelLow === 'admin' ||
    papelLow === 'professor';

  const primeiroNome = (profile?.nomeCompleto || '').split(' ')[0] || 'Pesquisador(a)';
  const papelLabel = isAdminOrTeacher ? 'Professor(a) / Gestão' : 'Aluno(a) Pesquisador(a)';

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500 pb-16 px-4 sm:px-6">
      <div className="w-full max-w-6xl space-y-6">

        <CensoOfflineBanner
          isOnline={isOnline}
          pendingSyncCount={pendingSyncCount}
          onOpenRescue={() => setShowRescueModal(true)}
          onSyncNow={() => void syncPendingData()}
        />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <UserAvatar genero={profile?.genero} name={profile?.nomeCompleto} className="w-20 h-20 shadow-md border-2 border-white dark:border-slate-800" />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-3.5 py-1 rounded-full border border-blue-100 dark:border-blue-800 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" /> {papelLabel} • CEEP Seabra
                </span>
                <span className="text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500" /> {likesCount} {likesCount === 1 ? 'coração' : 'corações'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Bem-vindo(a), {primeiroNome}! ✨
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                {profile?.turmaOuCargo || papelLabel} • CEEP Seabra · Região da Chapada Diamantina
              </p>
            </div>
          </div>

          {isAdminOrTeacher ? (
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                to="/auditoria"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2 text-xs transition cursor-pointer border-0 no-underline"
              >
                <ClipboardList className="w-4 h-4" /> Painel Docente & Auditoria
              </Link>
              <Link
                to="/dashboard"
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-4 py-3 rounded-2xl flex items-center gap-2 text-xs transition cursor-pointer border-0 no-underline"
              >
                Todas as Coletas
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowModalColeta(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2 text-xs transition cursor-pointer border-0 shrink-0"
            >
              <Plus className="w-4 h-4" /> Nova Ficha de Coleta
            </button>
          )}
        </div>

        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-4 sm:px-6 flex items-center justify-between gap-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">
                {isAdminOrTeacher ? 'Painel de Acompanhamento Docente' : 'Atenção: Pesquisa em Andamento'}
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                {isAdminOrTeacher
                  ? 'Docentes atuam como mentores(as) e podem ser entrevistados(as) pelos estudantes. As coletas são conduzidas exclusivamente pelos alunos pesquisadores.'
                  : 'Continue realizando as entrevistas de campo com rigor metodológico na comunidade escolar do CEEP Seabra.'}
              </p>
            </div>
          </div>
        </div>

        {/* Recomendação Inteligente de Colegas para Entrevistar (TAS) */}
        {!isAdminOrTeacher && (
          <RecomendacaoColegasCard
            user={{
              id: profile?.id || '',
              nomeCompleto: profile?.nomeCompleto || '',
              papel: profile?.papel || '',
              turmaOuCargo: profile?.turmaOuCargo || '1º ADM CM',
              totalFichas: myFichas,
            }}
            entrevistadosExistentes={entrevistadosExistentes}
            onIniciarEntrevistaColega={(colega) => {
              setPrefillColega(colega);
              setShowModalColeta(true);
            }}
          />
        )}

        {/* Gamificação / Conquista - Apenas para alunos entrevistadores */}
        {!isAdminOrTeacher && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <CelebrationScreen
              interviewCount={myFichas}
              targetCount={20}
              studentName={primeiroNome}
              userId={profile?.id}
            />
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              {isAdminOrTeacher ? 'Consolidado Geral do Censo CEEP' : 'Seu Mês em Números (Censo CEEP)'}
            </h3>
            <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md">
              Tempo Real & Offline Ready
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total de Fichas</span>
              <strong className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.totalColetas}</strong>
            </div>
            {isAdminOrTeacher ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Comunidade Escolar</span>
                <strong className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.totalPessoas || '—'}</strong>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Minhas Fichas</span>
                <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{myFichas}</strong>
              </div>
            )}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Turmas Atendidas</span>
              <strong className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.totalTurmas || '—'}</strong>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pesquisadores</span>
              <strong className="text-2xl font-black text-teal-600 dark:text-teal-400">{stats.totalPessoas || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Card de Gamificação & Jornada: Meta 20 Entrevistas */}
        {!isAdminOrTeacher && (
          <CensoMeta20Card myFichas={myFichas} />
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Distribuições Científicas por Gênero e Raça
            </h3>
          </div>
          <AnalyticsDashboard />
        </div>

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
                onClick={() => void fetchDashboardData()}
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
                        Turma/Setor: {item.grupo_escolar || item.turma || 'Não informada'} • Entrevistador(a): {item.interviewer_name || profile?.nomeCompleto || 'Você'}
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

      </div>

      <CensoModalColeta
        isOpen={showModalColeta}
        onClose={() => {
          setShowModalColeta(false);
          setPrefillColega(null);
        }}
        onSuccess={() => void fetchDashboardData()}
        profile={profile}
        myFichas={myFichas}
        setMyFichas={setMyFichas}
        entrevistadosExistentes={entrevistadosExistentes}
        registrosEntrevistados={registrosEntrevistados}
        setRegistrosEntrevistados={setRegistrosEntrevistados}
        listaSugerida={listaSugerida}
        isOnline={isOnline}
        setPendingSyncCount={setPendingSyncCount}
        prefillColega={prefillColega}
        onClearPrefillColega={() => setPrefillColega(null)}
      />

      <CensoModalRescue
        isOpen={showRescueModal}
        onClose={() => setShowRescueModal(false)}
        onSync={syncPendingData}
        onDraftsUpdated={(count) => setPendingSyncCount(count)}
      />

    </div>
  );
}

export default Home;