import { useState, useEffect, useCallback } from 'react';
import { supabase, nameKey } from '../lib/supabaseClient';
import { tasOfflineSync, initBackgroundSync } from '../utils/tasOfflineSync';
import { RegistroEntrevistado } from '../components/CensoModalColeta';
import { CensoItem } from '../components/CensoAtividadesList';
import listaAlunos from '../data/alunos.json';

const normalizeStr = (s?: string) =>
  (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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

export function useHomeDashboard(profile: any) {
  const [fetchingData, setFetchingData] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [likesCount, setLikesCount] = useState(0);

  const [myFichas, setMyFichas] = useState(0);
  const [minhasEntrevistas, setMinhasEntrevistas] = useState<CensoItem[]>([]);

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

    const unsubBgSync = initBackgroundSync(profile?.id);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('censo-sync-complete', handleSyncComplete);
      unsubBgSync();
    };
  }, [fetchDashboardData, syncPendingData, profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    void supabase
      .from('pessoa_likes')
      .select('*', { count: 'exact', head: true })
      .eq('liked_id', profile.id)
      .then(({ count: lkCount }) => {
        if (typeof lkCount === 'number') setLikesCount(lkCount);
      }, console.error);
  }, [profile?.id]);

  return {
    fetchingData,
    isOnline,
    pendingSyncCount,
    setPendingSyncCount,
    likesCount,
    myFichas,
    setMyFichas,
    minhasEntrevistas,
    stats,
    atividadesRecentes,
    entrevistadosExistentes,
    registrosEntrevistados,
    setRegistrosEntrevistados,
    listaSugerida,
    fetchDashboardData,
    syncPendingData,
  };
}
