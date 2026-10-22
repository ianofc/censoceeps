import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase, salvarEntrevistaResiliente, nameKey, nameWords, isSimilarName } from '../lib/supabaseClient';
import { tasOfflineSync, withTimeout, initBackgroundSync } from '../utils/tasOfflineSync';
import { useUserSession } from '../hooks/useUserSession';
import { UserAvatar } from '../components/UserAvatar';
import { ClipboardList, Send, AlertCircle, Loader2, Plus, CheckCircle, Award, Users, Heart, WifiOff, RefreshCw, Trophy, Sparkles, Target, Search, User } from 'lucide-react';
import { AdinhaMascote } from '../components/AdinhaMascote';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { CelebrationScreen } from '../components/CelebrationScreen';
import { badgeService } from '../services/badgeService';
import { RecomendacaoColegasCard } from '../components/RecomendacaoColegasCard';
import listaAlunos from '../data/alunos.json';
import catalogoAlunosLocal from '../data/alunos_turmas.json';

interface AlunoCatalogoInfo {
  nome_completo: string;
  nome_normalizado: string;
  turma_codigo: string;
  turma_origem?: string | null;
  serie?: string | null;
  turma?: string | null;
  turno?: string | null;
}

const CATALOGO_ALUNOS_MAP = new Map<string, AlunoCatalogoInfo>(
  (catalogoAlunosLocal as AlunoCatalogoInfo[]).map((item) => [
    (item.nome_completo || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    item,
  ])
);

const normalizeStr = (s?: string) =>
  (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

interface RegistroEntrevistado {
  nome: string;
  entrevistador: string;
  vinculo?: string;
  serie?: string;
  turma?: string;
}

const descreverRegistro = (r: RegistroEntrevistado) =>
  [r.vinculo, r.serie, r.turma].filter(Boolean).join(' · ');

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

export function Home() {
  const { profile } = useUserSession(); 
  
  const [showModalColeta, setShowModalColeta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [success, setSuccess] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [showRescueModal, setShowRescueModal] = useState<boolean>(false);
  const [rescueJsonInput, setRescueJsonInput] = useState<string>('');
  const [rescueSuccessMsg, setRescueSuccessMsg] = useState<string | null>(null);
  
  const [likesCount, setLikesCount] = useState(0);

  const [myFichas, setMyFichas] = useState(0);
  const [minhasEntrevistas, setMinhasEntrevistas] = useState<CensoItem[]>([]);
  const [abaAtividades, setAbaAtividades] = useState<'minhas' | 'escola'>('minhas');
  const [buscaMinhas, setBuscaMinhas] = useState('');

  const [stats, setStats] = useState({
    totalColetas: 0,
    totalPessoas: 0,
    totalTurmas: 0
  });
  const [atividadesRecentes, setAtividadesRecentes] = useState<CensoItem[]>([]);
  const [entrevistadosExistentes, setEntrevistadosExistentes] = useState<Map<string, string>>(new Map());
  // Lista completa (nome + cargo/turma) usada para avisar sobre nomes parecidos/abreviados
  const [registrosEntrevistados, setRegistrosEntrevistados] = useState<RegistroEntrevistado[]>([]);
  const [homonimoConfirmado, setHomonimoConfirmado] = useState(false);
  const [listaSugerida, setListaSugerida] = useState<string[]>(listaAlunos);
  const [alunoAutopreenchido, setAlunoAutopreenchido] = useState<AlunoCatalogoInfo | null>(null);

  const [nomeParticipante, setNomeParticipante] = useState('');
  const [contatoWhatsapp, setContatoWhatsapp] = useState('');
  const [genero, setGenero] = useState('');
  const [vinculo, setVinculo] = useState('ESTUDANTE_REGULAR');
  const [serie, setSerie] = useState('');
  const [turma, setTurma] = useState('');
  const [turno, setTurno] = useState('Matutino');
  const [moraCom, setMoraCom] = useState('');
  const [cidadeNatal, setCidadeNatal] = useState('Seabra');
  const [localizacaoMoradia, setLocalizacaoMoradia] = useState('Sede de Seabra');
  const [detalheLocalizacao, setDetalheLocalizacao] = useState('');
  const [tempoDeslocamento, setTempoDeslocamento] = useState('');
  const [acessoInternet, setAcessoInternet] = useState('');
  const [corRaca, setCorRaca] = useState('Parda');
  const [origemFamilia, setOrigemFamilia] = useState('Mista / Diversa');
  const [povoIndigena, setPovoIndigena] = useState('');
  const [conheceAncestralidade, setConheceAncestralidade] = useState('Não conheço');
  const [jaConversouSobre, setJaConversouSobre] = useState('Nunca');
  const [ambientesConversa, setAmbientesConversa] = useState<string[]>([]);
  const [corRacaInfluencia, setCorRacaInfluencia] = useState('Sim');
  const [espacosInfluencia, setEspacosInfluencia] = useState<string[]>([]);
  const [riscoEvasao, setRiscoEvasao] = useState('Não, nunca pensei');
  const [sofreuPreconceito, setSofreuPreconceito] = useState('Não');
  const [locaisOcorrencia, setLocaisOcorrencia] = useState<string[]>([]);
  const [formasOcorrencia, setFormasOcorrencia] = useState<string[]>([]);
  const [relatoSofreu, setRelatoSofreu] = useState('');
  const [presenciouPreconceito, setPresenciouPreconceito] = useState('Não');
  const [relatoPresenciou, setRelatoPresenciou] = useState('');

  // Nome com menos de 3 palavras significativas provavelmente está abreviado
  const nomeIncompleto = nameWords(nomeParticipante).length < 3;
  const nomeSemSobrenome = nomeParticipante.trim() !== '' && nameWords(nomeParticipante).length < 2;

  // Entrevistas já existentes com nome parecido (abreviado/estendido) — exige confirmação de homônimo
  const similares = useMemo(() => {
    if (nameWords(nomeParticipante).length < 2) return [];
    const vistos = new Set<string>();
    return registrosEntrevistados.filter((r) => {
      if (!isSimilarName(r.nome, nomeParticipante)) return false;
      const k = nameKey(r.nome);
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
  }, [registrosEntrevistados, nomeParticipante]);

  const toggleItemLista = (lista: string[], setLista: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (lista.includes(item)) {
      setLista(lista.filter((i) => i !== item));
    } else {
      setLista([...lista, item]);
    }
  };

  const fetchDashboardData = useCallback(async () => {
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
    setPendingSyncCount(pending.length);

    const myPending = pending.filter((p) => {
      if (!profile?.id) return true;
      return (
        p.entrevistador_id === profile.id ||
        p.user_id === profile.id ||
        p.entrevistador_id === 'offline-user' ||
        !p.entrevistador_id
      );
    });

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
        { data: pessoasDb }
      ] = await Promise.all(queries);

      if (errTotal || errTodas) {
        throw errTotal || errTodas;
      }

      // Popula mapa de pessoas já entrevistadas
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
      setEntrevistadosExistentes(mapEntrevistados);

      setRegistrosEntrevistados([
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
      ].filter((r) => r.nome));

      // Filtra as entrevistas feitas pelo próprio usuário logado
      if (profile?.id) {
        const minhasOnline: CensoItem[] = (todasEntrevistas || [])
          .filter((r: any) => r.entrevistador_id === profile.id)
          .map((r: any) => ({
            ...r,
            interviewer_name: r.entrevistador?.nome_completo || profile.nomeCompleto || 'Você',
            grupo_escolar: r.turma ? (r.serie ? `${r.serie} - ${r.turma}` : r.turma) : 'Comunidade Escolar',
          }));

        // Salva no cache local para continuar visível mesmo se a internet cair depois
        try {
          localStorage.setItem(`censo_my_interviews_cache_${profile.id}`, JSON.stringify(minhasOnline));
        } catch {
          // ignora
        }

        // Deduplica entre pendentes locais e online pelo nome normalizado
        const onlineNames = new Set(minhasOnline.map((m) => normalizeStr(m.nome_participante)));
        const myPendingUnique = myPending.filter((p) => !onlineNames.has(normalizeStr(p.nome_participante)));
        const myPendingReversed = [...myPendingUnique].reverse();
        const combinadasMinhas = [...myPendingReversed, ...minhasOnline];

        setMinhasEntrevistas(combinadasMinhas);
        setMyFichas(combinadasMinhas.length);
      }

      // Atualiza lista sugerida incluindo alunos e professores/servidores (sempre em MAIÚSCULO)
      if (pessoasDb && pessoasDb.length > 0) {
        const nomesPessoas = pessoasDb.map((p: any) => (p.nome_completo || '').trim().toUpperCase()).filter(Boolean);
        const combinada = Array.from(new Set([...listaAlunos.map((a: string) => a.trim().toUpperCase()), ...nomesPessoas]));
        setListaSugerida(combinada);
      }

      // Contagem de turmas distintas
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
        grupo_escolar: r.turma ? (r.serie ? `${r.serie} - ${r.turma}` : r.turma) : 'Comunidade Escolar'
      }));
      const reversedPending = [...pending].reverse();
      setAtividadesRecentes([...reversedPending, ...serverData].slice(0, 10));
    } catch (err) {
      console.warn("Modo Offline ativado / Erro de conexão com Supabase:", err);
      const mapEntrevistados = new Map<string, string>();
      pending.forEach((raw: any) => {
        if (raw.nome_participante) {
          mapEntrevistados.set(nameKey(raw.nome_participante), raw.interviewer_name || 'você (salvo offline)');
        }
      });

      // Restaura as entrevistas do aluno do cache local para não sumirem quando a internet cair!
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

      setMinhasEntrevistas(combinadasOffline);
      if (combinadasOffline.length > 0) {
        setMyFichas(combinadasOffline.length);
      }

      setEntrevistadosExistentes(mapEntrevistados);
      setRegistrosEntrevistados(
        [...pending, ...cachedMinhas]
          .filter((r: any) => r.nome_participante)
          .map((r: any) => ({
            nome: r.nome_participante,
            entrevistador: r.interviewer_name || 'você',
            vinculo: r.vinculo,
            serie: r.serie,
            turma: r.turma,
          }))
      );
      setAtividadesRecentes(combinadasOffline.length > 0 ? combinadasOffline.slice(0, 10) : [...pending].reverse());
      setStats(prev => ({
        ...prev,
        totalColetas: Math.max(prev.totalColetas, combinadasOffline.length, pending.length)
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
      console.error("Erro ao sincronizar fila offline:", err);
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

  // Load likes received
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // 1. O entrevistador não pode entrevistar a si mesmo
    if (
      profile?.nomeCompleto &&
      normalizeStr(nomeParticipante) === normalizeStr(profile.nomeCompleto)
    ) {
      setErrorMsg('O(A) entrevistador(a) não pode entrevistar a si mesmo(a). Por favor, informe o nome do participante entrevistado.');
      setLoading(false);
      return;
    }

    // 2. Não permitir duplicidade de participante no censo (checa memória local primeiro)
    const jaFeito = entrevistadosExistentes.get(nameKey(nomeParticipante));
    if (jaFeito) {
      setErrorMsg(`O(A) participante "${nomeParticipante.trim()}" já foi entrevistado(a) anteriormente (por ${jaFeito}). Cada pessoa só pode ser entrevistada uma única vez.`);
      setLoading(false);
      return;
    }

    // 3. Nome precisa ter ao menos nome e sobrenome
    if (nomeSemSobrenome) {
      setErrorMsg('Informe o nome completo do(a) participante (nome e sobrenomes).');
      setLoading(false);
      return;
    }

    // 4. Nome parecido com entrevista existente exige confirmação de homônimo
    if (similares.length > 0 && !homonimoConfirmado) {
      setErrorMsg(`Já existe entrevista com nome parecido (${similares[0].nome}). Confira se não é a mesma pessoa ou marque que é outra pessoa.`);
      setLoading(false);
      return;
    }

    // 5. Checa duplicidade online no Supabase para garantir concorrência (com timeout de 4s para conexões lentas)
    try {
      const primeiraPalavra = nomeParticipante.trim().split(/\s+/)[0] || '';
      const dupCheckResult = await withTimeout<any>(
        supabase
          .from('entrevistas')
          .select('id, nome_participante, vinculo, serie, turma, entrevistador:pessoas(nome_completo)')
          .ilike('nome_participante', `${primeiraPalavra}%`)
          .limit(200),
        4000
      );
      const candidatos = dupCheckResult?.data || [];

      const alvo = nameKey(nomeParticipante);
      const existingInterview = (candidatos || []).find((r: any) => nameKey(r.nome_participante) === alvo);
      if (existingInterview) {
        const intName = (existingInterview as any).entrevistador?.nome_completo;
        const responsavelStr = intName ? `por ${intName}` : 'no sistema';
        setErrorMsg(`O(A) participante "${nomeParticipante.trim()}" já foi entrevistado(a) anteriormente (${responsavelStr}). Para manter os dados estatísticos íntegros, cada pessoa só pode ser entrevistada uma vez.`);
        setLoading(false);
        return;
      }

      const similarOnline = (candidatos || []).find((r: any) => isSimilarName(r.nome_participante, nomeParticipante));
      if (similarOnline && !homonimoConfirmado) {
        setRegistrosEntrevistados((prev) => [
          ...prev,
          {
            nome: similarOnline.nome_participante,
            entrevistador: (similarOnline as any).entrevistador?.nome_completo || 'outro entrevistador',
            vinculo: similarOnline.vinculo,
            serie: similarOnline.serie,
            turma: similarOnline.turma,
          },
        ]);
        setErrorMsg(`Já existe entrevista com nome parecido (${similarOnline.nome_participante}). Confira se não é a mesma pessoa ou marque que é outra pessoa.`);
        setLoading(false);
        return;
      }
    } catch (checkErr) {
      console.warn('Não foi possível checar duplicidade online, prosseguindo com verificação local:', checkErr);
    }

    const isDocenteOuServidor = vinculo === 'PROFESSOR' || vinculo === 'FUNCIONARIO' || vinculo === 'GESTAO';
    const rawFicha = {
      id: `local-${Date.now()}`,
      entrevistador_id: profile?.id || null,
      interviewer_name: profile?.nomeCompleto || 'Pesquisador(a)',
      nome_participante: nomeParticipante.trim().toUpperCase(),
      contato_whatsapp: contatoWhatsapp,
      genero,
      vinculo,
      serie: isDocenteOuServidor ? (serie || (vinculo === 'PROFESSOR' ? 'Corpo Docente' : vinculo === 'GESTAO' ? 'Gestão' : 'Servidor(a)')) : serie,
      turma: isDocenteOuServidor ? (turma || (vinculo === 'PROFESSOR' ? 'Docente' : vinculo === 'GESTAO' ? 'Coordenação' : 'Funcionário')) : turma,
      turno: turno || 'Matutino',
      mora_com: moraCom || null,
      cidade_natal: cidadeNatal,
      local_moradia: localizacaoMoradia,
      detalhe_localizacao: localizacaoMoradia !== 'Sede de Seabra' ? (detalheLocalizacao.trim() || null) : null,
      tempo_deslocamento: tempoDeslocamento || null,
      acesso_internet: acessoInternet || null,
      cor_raca: corRaca,
      origem_familia: origemFamilia,
      povo_indigena: (corRaca === 'Indígena' || origemFamilia === 'Predominantemente Indígena') ? (povoIndigena.trim() || null) : null,
      conhece_ancestralidade: conheceAncestralidade || null,
      ja_conversou_sobre: jaConversouSobre || null,
      ambientes_conversa: ambientesConversa,
      cor_raca_influencia: corRacaInfluencia || null,
      espacos_influencia: espacosInfluencia,
      risco_evasao: riscoEvasao || null,
      sofreu_preconceito: sofreuPreconceito,
      locais_ocorrencia: sofreuPreconceito === 'Sim' ? locaisOcorrencia : [],
      formas_ocorrencia: sofreuPreconceito === 'Sim' ? formasOcorrencia : [],
      relato_preconceito: relatoSofreu || relatoPresenciou || null,
      created_at: new Date().toISOString(),
      synced: false
    };

    const novoTotal = myFichas + 1;
    setMyFichas(novoTotal);

    // Desbloqueia insígnias de progresso científico se aplicável
    if (profile?.id) {
      if (novoTotal >= 1) void badgeService.unlockBadge(profile.id, 'primeira_entrevista');
      if (novoTotal >= 5) void badgeService.unlockBadge(profile.id, 'meta_5_entrevistas');
      if (novoTotal >= 10) void badgeService.unlockBadge(profile.id, 'meta_10_entrevistas');
      if (novoTotal >= 20) void badgeService.unlockBadge(profile.id, 'adinha_campea_meta_20');
    }

    // 1. SALVAMENTO ANTECIPADO E IMEDIATO NO DISPOSITIVO (OFFLINE-FIRST)
    // Garante que mesmo com 1 bit de rede, queda de bateria ou fechamento da aba, os dados NUNCA se percam.
    tasOfflineSync.saveDraftOffline(rawFicha);
    const existingQueue: any[] = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
    setPendingSyncCount(existingQueue.length);

    try {
      if (!navigator.onLine) {
        throw new Error("Dispositivo offline. Ficha retida com segurança localmente.");
      }

      // Timeout de 7s para evitar travamento em conexões de 1 bit / WiFi instável da escola
      const res = await withTimeout(salvarEntrevistaResiliente(rawFicha, profile?.id), 7000);
      if (res.error) throw res.error;

      // Sucesso na nuvem: remove da fila pendente local
      tasOfflineSync.removeDraft(rawFicha.id);
      const afterQueue: any[] = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
      setPendingSyncCount(afterQueue.length);

      setSavedOffline(false);
      setSuccess(true);
      resetForm();
      void fetchDashboardData();
    } catch (err) {
      console.warn('Ficha gravada com 100% de segurança no aparelho (aguardando envio para a nuvem):', err);
      setSavedOffline(true);
      setSuccess(true);
      setErrorMsg("Conexão instável ou offline: Ficha gravada com 100% de segurança no aparelho! Sincronizará automaticamente assim que houver sinal.");
      resetForm();
      void fetchDashboardData();
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(false);
        setShowModalColeta(false);
        if (novoTotal >= 20) {
          // Dispara celebração da Adinha Campeã com confetes e fanfare!
          window.dispatchEvent(new CustomEvent('abrir-celebracao-meta-20', { detail: { count: novoTotal } }));
        }
      }, novoTotal >= 20 ? 800 : 2000);
    }
  };

  const resetForm = () => {
    setNomeParticipante('');
    setHomonimoConfirmado(false);
    setContatoWhatsapp('');
    setGenero('');
    setSerie('');
    setTurma('');
    setTurno('Matutino');
    setMoraCom('');
    setCidadeNatal('Seabra');
    setLocalizacaoMoradia('Sede de Seabra');
    setDetalheLocalizacao('');
    setTempoDeslocamento('');
    setAcessoInternet('');
    setCorRaca('Parda');
    setOrigemFamilia('Mista / Diversa');
    setPovoIndigena('');
    setConheceAncestralidade('Não conheço');
    setJaConversouSobre('Nunca');
    setAmbientesConversa([]);
    setCorRacaInfluencia('Sim');
    setEspacosInfluencia([]);
    setRiscoEvasao('Não, nunca pensei');
    setSofreuPreconceito('Não');
    setLocaisOcorrencia([]);
    setFormasOcorrencia([]);
    setRelatoSofreu('');
    setPresenciouPreconceito('Não');
    setRelatoPresenciou('');
  };



  const papelLow = (profile?.papel || '').toLowerCase();
  const isAdminOrTeacher =
    papelLow === 'gestor' ||
    papelLow === 'admin' ||
    papelLow === 'professor' ||
    false;




  const primeiroNome = (profile?.nomeCompleto || '').split(' ')[0] || 'Pesquisador(a)';
  const papelLabel = isAdminOrTeacher ? 'Professor(a) / Gestão' : 'Aluno(a) Pesquisador(a)';

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500 pb-16 px-4 sm:px-6">
      <div className="w-full max-w-6xl space-y-6">

        {!isOnline && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 shrink-0" />
              <p className="text-xs font-bold">Você está offline. As fichas preenchidas serão salvas no aparelho e enviadas automaticamente ao retornar a rede.</p>
            </div>
            {pendingSyncCount > 0 && (
              <span className="text-[11px] bg-rose-500 text-white px-2.5 py-1 rounded-full font-bold">
                {pendingSyncCount} pendente(s)
              </span>
            )}
          </div>
        )}

        {/* Banner de Sincronização e Resgate de Dados */}
        {pendingSyncCount > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-slate-800 dark:text-slate-200 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-black">
                  {pendingSyncCount} {pendingSyncCount === 1 ? 'ficha gravada' : 'fichas gravadas'} com segurança no aparelho aguardando nuvem
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dados 100% seguros contra desligamento ou conexão de 1 bit.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowRescueModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl font-bold border-0 cursor-pointer transition-colors"
              >
                💾 Backup / Resgate
              </button>
              <button 
                type="button" 
                onClick={() => void syncPendingData()}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl font-black border-0 cursor-pointer shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Subir Agora
              </button>
            </div>
          </div>
        )}

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
              setNomeParticipante(colega.nome.toUpperCase());
              if (colega.turma) setTurma(colega.turma);
              if (colega.serie) setSerie(colega.serie);
              if (colega.turno) setTurno(colega.turno);
              const ehTec = (colega.serie || '').toLowerCase().includes('técnico');
              setVinculo(ehTec ? 'ESTUDANTE_TECNICO' : 'ESTUDANTE_REGULAR');
              setAlunoAutopreenchido({
                nome_completo: colega.nome,
                nome_normalizado: normalizeStr(colega.nome),
                turma_codigo: colega.turma || '',
                turma: colega.turma,
                serie: colega.serie,
                turno: colega.turno,
              });
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

        {/* Card de Gamificação & Jornada: Meta 20 Entrevistas (Apenas para Alunos Entrevistadores) */}
        {!isAdminOrTeacher && (
          <div className={`border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden transition-all duration-300 ${
            myFichas >= 20 
              ? 'bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-purple-500/10 border-amber-400 dark:border-amber-500/50 dark:bg-slate-900' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}>
            {/* Luz de fundo se meta batida */}
            {myFichas >= 20 && (
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className={`p-2.5 rounded-2xl flex items-center justify-center ${
                  myFichas >= 20 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                    : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                }`}>
                  <Trophy className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    Missão Científica: Meta 20 Entrevistas
                    {myFichas >= 20 && (
                      <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black animate-pulse">
                        CONCLUÍDO!
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {myFichas >= 20 
                      ? 'Você completou a meta oficial de campo do Censo Ada Lovelace!' 
                      : `Realize 20 coletas para desbloquear o Certificado Oficial e a Adinha Campeã.`}
                  </p>
                </div>
              </div>

              {myFichas >= 20 ? (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('abrir-celebracao-meta-20', { detail: { count: myFichas } }))}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer border-0 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ver Adinha Campeã & Certificado 🏆</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <span>{myFichas} de 20 concluídas</span>
                </div>
              )}
            </div>

            {/* Barra de Progresso com Milestones */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-400">
                  {myFichas >= 20 
                    ? 'Progresso: 100% (Meta Superada!)' 
                    : `Progresso da Meta: ${Math.min(100, Math.round((myFichas / 20) * 100))}%`}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {myFichas >= 20 
                    ? '🏅 Top Entrevistador(a) CEEP' 
                    : `Faltam ${Math.max(0, 20 - myFichas)} entrevista(s)`}
                </span>
              </div>

              {/* Barra Visual */}
              <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    myFichas >= 20 
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-md shadow-amber-500/40' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, (myFichas / 20) * 100)}%` }}
                />
              </div>

              {/* Marcos Intermediários da Adinha */}
              <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                <div className={`p-2 rounded-xl text-[10px] font-bold border transition ${
                  myFichas >= 5 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  <span>🌱 5: Curiosa</span>
                </div>
                <div className={`p-2 rounded-xl text-[10px] font-bold border transition ${
                  myFichas >= 10 
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  <span>🔍 10: Metade</span>
                </div>
                <div className={`p-2 rounded-xl text-[10px] font-bold border transition ${
                  myFichas >= 15 
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  <span>⚡ 15: Reta Final</span>
                </div>
                <div className={`p-2 rounded-xl text-[10px] font-bold border transition ${
                  myFichas >= 20 
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-sm' 
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  <span>🏆 20: Campeã!</span>
                </div>
              </div>
            </div>
          </div>
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
          ) : (() => {
            const listaExibida = abaAtividades === 'minhas'
              ? minhasEntrevistas.filter((item) => {
                  if (!buscaMinhas.trim()) return true;
                  const q = normalizeStr(buscaMinhas);
                  return (
                    normalizeStr(item.nome_participante).includes(q) ||
                    normalizeStr(item.grupo_escolar).includes(q) ||
                    normalizeStr(item.turma).includes(q)
                  );
                })
              : atividadesRecentes;

            if (listaExibida.length === 0) {
              return (
                <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                  {abaAtividades === 'minhas'
                    ? 'Nenhuma entrevista encontrada. Clique em "+ Nova Ficha de Coleta" acima para registrar!'
                    : 'Nenhuma ficha registrada ainda.'}
                </div>
              );
            }

            return (
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
            );
          })()}
        </div>

      </div>

      {showModalColeta && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-blue-600 rounded-xl">
                  <ClipboardList className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h2 className="text-base font-black">Nova Ficha de Coleta • Censo CEEP</h2>
                  <p className="text-xs text-slate-400 font-medium">Pesquisador(a) responsável: {profile?.nomeCompleto || 'Carregando...'}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModalColeta(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 border-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
              {success && (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4 text-emerald-800">
                  <AdinhaMascote pose="vencedora" className="w-12 h-12 shrink-0" />
                  <div>
                    <h4 className="font-black text-sm uppercase">🏆 Ficha Registrada com Sucesso!</h4>
                    <p className="text-xs text-emerald-700 font-medium">
                      {!savedOffline && isOnline ? "Dados sincronizados com a nuvem." : "Salva localmente com segurança no dispositivo (Modo Offline)."}
                    </p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                  <p className="text-xs font-semibold">{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Bloco 1: Identificação Básica</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modal-nome" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nome Completo</label>
                      <input
                        id="modal-nome"
                        type="text"
                        required
                        list="lista-alunos-ceep"
                        placeholder="NOME COMPLETO..."
                        value={nomeParticipante}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setNomeParticipante(val);
                          setHomonimoConfirmado(false);
                          const valNormLookup = normalizeStr(val);
                          let alunoInfo = CATALOGO_ALUNOS_MAP.get(valNormLookup);
                          if (!alunoInfo && valNormLookup.length >= 4) {
                            for (const item of CATALOGO_ALUNOS_MAP.values()) {
                              const itemNorm = normalizeStr(item.nome_completo);
                              if (itemNorm === valNormLookup || (valNormLookup.length >= 8 && itemNorm.includes(valNormLookup))) {
                                alunoInfo = item;
                                break;
                              }
                            }
                          }

                          if (alunoInfo) {
                            setAlunoAutopreenchido(alunoInfo);
                            if (alunoInfo.turma) setTurma(alunoInfo.turma);
                            if (alunoInfo.serie) setSerie(alunoInfo.serie);
                            if (alunoInfo.turno) setTurno(alunoInfo.turno);
                            const ehTec = (alunoInfo.serie || '').toLowerCase().includes('técnico') || (alunoInfo.turma_codigo || '').includes('PROSUB');
                            setVinculo(ehTec ? 'ESTUDANTE_TECNICO' : 'ESTUDANTE_REGULAR');
                            if (navigator.onLine) {
                              void supabase
                                .from('alunos_escola')
                                .select('serie, turma, turno')
                                .eq('nome_normalizado', valNormLookup.toUpperCase())
                                .maybeSingle()
                                .then(({ data: dbAluno }) => {
                                  if (dbAluno) {
                                    if (dbAluno.turma) setTurma(dbAluno.turma);
                                    if (dbAluno.serie) setSerie(dbAluno.serie);
                                    if (dbAluno.turno) setTurno(dbAluno.turno);
                                  }
                                });
                            }
                          } else {
                            setAlunoAutopreenchido(null);
                          }
                          const valNorm = normalizeStr(val);
                          if (profile?.nomeCompleto && valNorm === normalizeStr(profile.nomeCompleto)) {
                            setErrorMsg('Atenção: O(A) entrevistador(a) não pode entrevistar a si mesmo(a).');
                          } else if (entrevistadosExistentes.has(nameKey(val))) {
                            setErrorMsg(`Atenção: "${val.trim()}" já foi entrevistado(a) anteriormente (por ${entrevistadosExistentes.get(nameKey(val))}).`);
                          } else {
                            setErrorMsg(null);
                          }
                        }}
                        className={`w-full p-3 bg-white dark:bg-slate-800 border rounded-xl text-sm font-semibold outline-none transition-colors uppercase ${
                          (profile?.nomeCompleto && normalizeStr(nomeParticipante) === normalizeStr(profile.nomeCompleto)) ||
                          entrevistadosExistentes.has(nameKey(nomeParticipante))
                            ? 'border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-100'
                            : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                        }`}
                      />

                      {alunoAutopreenchido && (
                        <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-semibold animate-in fade-in">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Auto-preenchimento ativado:</strong> {alunoAutopreenchido.nome_completo} ({alunoAutopreenchido.serie || 'Série'} - {alunoAutopreenchido.turma || 'Turma'}) preenchido automaticamente!
                          </span>
                        </div>
                      )}

                      {profile?.nomeCompleto && normalizeStr(nomeParticipante) === normalizeStr(profile.nomeCompleto) && (
                        <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-in fade-in">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                          <span>Você não pode entrevistar a si mesmo(a). Por favor, informe outro participante.</span>
                        </div>
                      )}

                      {nomeParticipante &&
                        !(profile?.nomeCompleto && normalizeStr(nomeParticipante) === normalizeStr(profile.nomeCompleto)) &&
                        entrevistadosExistentes.has(nameKey(nomeParticipante)) && (
                        <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs font-semibold animate-in fade-in">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>Esta pessoa já foi entrevistada por <strong>{entrevistadosExistentes.get(nameKey(nomeParticipante))}</strong>. Cada pessoa só pode responder 1 única vez.</span>
                        </div>
                      )}

                      {nomeParticipante.trim() && nomeIncompleto && !entrevistadosExistentes.has(nameKey(nomeParticipante)) && (
                        <div className="mt-2 p-2.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl flex items-start gap-2 text-sky-800 dark:text-sky-200 text-xs font-semibold animate-in fade-in">
                          <AlertCircle className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                          <span>Digite o <strong>nome completo</strong>, com todos os sobrenomes (ex.: MARCOS DAVI LEAL DA ANUNCIAÇÃO). Nomes abreviados geram registros duplicados.</span>
                        </div>
                      )}

                      {similares.length > 0 && !entrevistadosExistentes.has(nameKey(nomeParticipante)) && (
                        <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-100 text-xs font-semibold animate-in fade-in space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                            <span>Já existe(m) entrevista(s) com nome parecido. Confira se não é a mesma pessoa:</span>
                          </div>
                          <ul className="pl-6 list-disc space-y-0.5">
                            {similares.slice(0, 5).map((r) => (
                              <li key={`${r.nome}-${r.entrevistador}`}>
                                <strong className="uppercase">{r.nome}</strong>
                                {descreverRegistro(r) && <span className="font-normal"> ({descreverRegistro(r)})</span>}
                                <span className="font-normal"> por {r.entrevistador}</span>
                              </li>
                            ))}
                          </ul>
                          <label className="flex items-center gap-2 pl-6 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={homonimoConfirmado}
                              onChange={(e) => setHomonimoConfirmado(e.target.checked)}
                            />
                            <span>Confirmo que é OUTRA pessoa (cargo/turma diferente)</span>
                          </label>
                        </div>
                      )}

                      <datalist id="lista-alunos-ceep">
                        {listaSugerida
                          .filter((nome: string) => {
                            const n = normalizeStr(nome);
                            const ehEleMesmo = profile?.nomeCompleto && n === normalizeStr(profile.nomeCompleto);
                            const jaFoiEntrevistado = entrevistadosExistentes.has(nameKey(nome));
                            return !ehEleMesmo && !jaFoiEntrevistado;
                          })
                          .map((nome: string) => (
                            <option key={nome} value={nome} />
                          ))}
                      </datalist>
                    </div>

                    <div>
                      <label htmlFor="modal-whatsapp" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">WhatsApp / Contato</label>
                      <input
                        id="modal-whatsapp"
                        type="text"
                        placeholder="(75) 90000-0000"
                        value={contatoWhatsapp}
                        onChange={(e) => setContatoWhatsapp(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="modal-genero" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Gênero</label>
                      <input
                        id="modal-genero"
                        type="text"
                        placeholder="Ex: Masculino, Feminino..."
                        value={genero}
                        onChange={(e) => setGenero(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="modal-vinculo" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Vínculo com a Instituição</label>
                      <select
                        id="modal-vinculo"
                        value={vinculo}
                        onChange={(e) => setVinculo(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="ESTUDANTE_REGULAR">Estudante (Ensino Médio Regular)</option>
                        <option value="ESTUDANTE_TECNICO">Estudante (Curso Técnico)</option>
                        <option value="PROFESSOR">Professor(a) / Docente</option>
                        <option value="FUNCIONARIO">Funcionário(a) / Técnico-Administrativo</option>
                        <option value="GESTAO">Gestão / Coordenação</option>
                      </select>
                    </div>

                    {vinculo !== 'FUNCIONARIO' && vinculo !== 'PROFESSOR' && vinculo !== 'GESTAO' && (
                      <div>
                        <label htmlFor="modal-serie" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Série / Ano / Módulo</label>
                        <input
                          id="modal-serie"
                          type="text"
                          required
                          placeholder="Ex: 2º Ano Técnico / 3º Ano Regular"
                          value={serie}
                          onChange={(e) => setSerie(e.target.value)}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="modal-turma" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        {vinculo === 'PROFESSOR' ? 'Área / Disciplina / Matéria' : vinculo === 'FUNCIONARIO' || vinculo === 'GESTAO' ? 'Setor / Função' : 'Turma'}
                      </label>
                      <input
                        id="modal-turma"
                        type="text"
                        required
                        placeholder={
                          vinculo === 'PROFESSOR'
                            ? 'Ex: Informática, Matemática, Coordenação...'
                            : vinculo === 'FUNCIONARIO' || vinculo === 'GESTAO'
                            ? 'Ex: Secretaria, Portaria, Coordenação...'
                            : 'Ex: Informática A / ADM CM'
                        }
                        value={turma}
                        onChange={(e) => setTurma(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="modal-turno" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Turno</label>
                      <select
                        id="modal-turno"
                        value={turno}
                        onChange={(e) => setTurno(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Matutino">Matutino</option>
                        <option value="Vespertino">Vespertino</option>
                        <option value="Noturno">Noturno</option>
                        <option value="Integral">Integral</option>
                      </select>
                    </div>

                    <div className={vinculo.startsWith('ESTUDANTE') ? '' : 'col-span-1 sm:col-span-2'}>
                      <label htmlFor="modal-mora-com" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Com quem você mora atualmente?</label>
                      <select
                        id="modal-mora-com"
                        value={moraCom}
                        onChange={(e) => setMoraCom(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="">Selecione uma opção...</option>
                        <option value="Pai e Mãe">Pai e Mãe</option>
                        <option value="Apenas com a Mãe">Apenas com a Mãe</option>
                        <option value="Apenas com o Pai">Apenas com o Pai</option>
                        <option value="Avós ou outros parentes">Avós ou outros parentes</option>
                        <option value="Cônjuge/Namorado(a)">Cônjuge / Namorado(a)</option>
                        <option value="Amigos/Colegas">Amigos / Colegas</option>
                        <option value="Sozinho(a)">Sozinho(a)</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Bloco 2: Localização, Deslocamento e Inclusão Digital</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modal-cidade-natal" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Cidade em que nasceu</label>
                      <input
                        id="modal-cidade-natal"
                        type="text"
                        placeholder="Ex: Seabra, Palmeiras, Bonito..."
                        value={cidadeNatal}
                        onChange={(e) => setCidadeNatal(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="modal-moradia" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Onde mora atualmente?</label>
                      <select
                        id="modal-moradia"
                        value={localizacaoMoradia}
                        onChange={(e) => setLocalizacaoMoradia(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Sede de Seabra">Sede de Seabra</option>
                        <option value="Zona Rural / Povoado de Seabra">Zona Rural / Povoado de Seabra</option>
                        <option value="Outra cidade">Outra cidade</option>
                      </select>
                    </div>

                    {localizacaoMoradia !== 'Sede de Seabra' && (
                      <div className="col-span-1 sm:col-span-2 animate-in fade-in">
                        <label htmlFor="modal-detalhe-localizacao" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          {localizacaoMoradia === 'Zona Rural / Povoado de Seabra' ? 'Qual o nome do povoado ou região rural?' : 'Qual o nome da cidade onde mora?'}
                        </label>
                        <input
                          id="modal-detalhe-localizacao"
                          type="text"
                          placeholder="Especifique o povoado, comunidade ou cidade..."
                          value={detalheLocalizacao}
                          onChange={(e) => setDetalheLocalizacao(e.target.value)}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="modal-tempo-deslocamento" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tempo de deslocamento até a escola</label>
                      <select
                        id="modal-tempo-deslocamento"
                        value={tempoDeslocamento}
                        onChange={(e) => setTempoDeslocamento(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="Menos de 15 minutos">Menos de 15 minutos</option>
                        <option value="De 15 a 30 minutos">De 15 a 30 minutos</option>
                        <option value="De 30 minutos a 1 hora">De 30 minutos a 1 hora</option>
                        <option value="Mais de 1 hora">Mais de 1 hora</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="modal-acesso-internet" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Acesso à internet em casa</label>
                      <select
                        id="modal-acesso-internet"
                        value={acessoInternet}
                        onChange={(e) => setAcessoInternet(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="Internet rápida e computador próprio">Internet rápida e computador próprio</option>
                        <option value="Internet rápida, mas só usa celular">Internet rápida, mas só usa celular</option>
                        <option value="Internet móvel (3G/4G) limitada">Internet móvel (3G/4G) limitada</option>
                        <option value="Não tem acesso constante">Não tem acesso constante</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Bloco 3: Autodeclaração, Ancestralidade e Origem Familiar</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modal-cor-raca" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Cor ou Raça (Padrão IBGE)</label>
                      <select
                        id="modal-cor-raca"
                        value={corRaca}
                        onChange={(e) => setCorRaca(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Branca">Branca</option>
                        <option value="Preta">Preta</option>
                        <option value="Parda">Parda</option>
                        <option value="Amarela">Amarela</option>
                        <option value="Indígena">Indígena</option>
                        <option value="Prefiro não responder">Prefiro não responder</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="modal-origem-familia" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Origem Predominante da Família</label>
                      <select
                        id="modal-origem-familia"
                        value={origemFamilia}
                        onChange={(e) => setOrigemFamilia(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Predominantemente Negra">Predominantemente Negra</option>
                        <option value="Predominantemente Branca">Predominantemente Branca</option>
                        <option value="Predominantemente Indígena">Predominantemente Indígena</option>
                        <option value="Mista / Diversa">Mista / Diversa</option>
                        <option value="Prefiro não responder">Prefiro não responder</option>
                      </select>
                    </div>

                    {(corRaca === 'Indígena' || origemFamilia === 'Predominantemente Indígena') && (
                      <div className="col-span-1 sm:col-span-2 animate-in fade-in">
                        <label htmlFor="modal-povo-indigena" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Qual o povo ou etnia indígena?</label>
                        <input
                          id="modal-povo-indigena"
                          type="text"
                          placeholder="Informe o povo ou etnia indígena..."
                          value={povoIndigena}
                          onChange={(e) => setPovoIndigena(e.target.value)}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="modal-conhece-ancestralidade" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Você conhece a história da sua ancestralidade?</label>
                      <select
                        id="modal-conhece-ancestralidade"
                        value={conheceAncestralidade}
                        onChange={(e) => setConheceAncestralidade(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Sim, conheço bem">Sim, conheço bem</option>
                        <option value="Conheço um pouco">Conheço um pouco</option>
                        <option value="Não conheço">Não conheço</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="modal-ja-conversou" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Já conversou sobre identidade/raça?</label>
                      <select
                        id="modal-ja-conversou"
                        value={jaConversouSobre}
                        onChange={(e) => setJaConversouSobre(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Sim, com frequência">Sim, com frequência</option>
                        <option value="Sim, poucas vezes">Sim, poucas vezes</option>
                        <option value="Nunca">Nunca</option>
                      </select>
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Ambientes de conversa sobre identidade, raça ou diversidade</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {['Familiar', 'Escolar', 'Conversa com amigos'].map((item) => {
                          const isSelected = ambientesConversa.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleItemLista(ambientesConversa, setAmbientesConversa, item)}
                              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-blue-700 dark:text-blue-300 shadow-sm'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <span>{item}</span>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                                {isSelected && <span className="text-[10px]">✓</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Bloco 4: Percepção Social, Permanência e Vivências</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="modal-cor-raca-influencia" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          A raiz social (cor, raça ou classe) influencia a vida no Brasil?
                        </label>
                        <select
                          id="modal-cor-raca-influencia"
                          value={corRacaInfluencia}
                          onChange={(e) => setCorRacaInfluencia(e.target.value)}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                        >
                          <option value="Sim">Sim</option>
                          <option value="Não">Não</option>
                          <option value="Não sei responder">Não sei responder</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="modal-risco-evasao" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Já pensou em desistir da escola (evasão)?
                        </label>
                        <select
                          id="modal-risco-evasao"
                          value={riscoEvasao}
                          onChange={(e) => setRiscoEvasao(e.target.value)}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                        >
                          <option value="Não, nunca pensei">Não, nunca pensei</option>
                          <option value="Sim, por dificuldades financeiras">Sim, por dificuldades financeiras / trabalho</option>
                          <option value="Sim, por desinteresse ou dificuldade nos estudos">Sim, por desinteresse ou dificuldade nos estudos</option>
                          <option value="Sim, por problemas de convivência/bullying">Sim, por problemas de convivência ou bullying</option>
                          <option value="Sim, por problemas familiares ou de saúde">Sim, por problemas familiares ou de saúde</option>
                          <option value="Outros motivos">Sim, por outros motivos</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Em quais espaços percebe que a influência de cor/raça/classe ocorre com mais força?</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {['Escola', 'Trabalho', 'Relação com Polícia/Justiça', 'Convívio Social', 'Atendimento à Saúde', 'Repartições Públicas', 'Relações Afetivas'].map((item) => {
                          const isSelected = espacosInfluencia.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleItemLista(espacosInfluencia, setEspacosInfluencia, item)}
                              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 shadow-sm'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-left">{item}</span>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'}`}>
                                {isSelected && <span className="text-[10px]">✓</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50">
                      <label htmlFor="modal-preconceito" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Já sofreu preconceito, discriminação ou violência?
                      </label>
                      <select
                        id="modal-preconceito"
                        value={sofreuPreconceito}
                        onChange={(e) => setSofreuPreconceito(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Não">Não</option>
                        <option value="Sim">Sim</option>
                        <option value="Prefiro não responder">Prefiro não responder</option>
                      </select>
                    </div>

                    {sofreuPreconceito === 'Sim' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                          <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Onde isso ocorreu?</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {['Escola', 'Trabalho', 'Comércio', 'Serviço de Saúde', 'Serviço Público', 'Polícia/Justiça', 'Transporte', 'Internet/Redes Sociais', 'Ambiente Familiar', 'Espaço Religioso'].map((item) => {
                              const isSelected = locaisOcorrencia.includes(item);
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => toggleItemLista(locaisOcorrencia, setLocaisOcorrencia, item)}
                                  className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-400 text-orange-900 dark:text-orange-200 shadow-sm'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="text-left truncate">{item}</span>
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300'}`}>
                                    {isSelected && <span className="text-[9px]">✓</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">De que forma aconteceu?</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {['Piadas/comentários', 'Xingamentos/ofensas', 'Apelidos relacionados', 'Exclusão/isolamento', 'Tratamento desigual', 'Suspeita ou vigilância injustificada', 'Oportunidade negada', 'Agressão/ameaça'].map((item) => {
                              const isSelected = formasOcorrencia.includes(item);
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => toggleItemLista(formasOcorrencia, setFormasOcorrencia, item)}
                                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-200 shadow-sm'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="text-left">{item}</span>
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300'}`}>
                                    {isSelected && <span className="text-[9px]">✓</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label htmlFor="modal-relato-sofreu" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                            Relato do ocorrido (Opcional e Sigiloso)
                          </label>
                          <textarea
                            id="modal-relato-sofreu"
                            rows={3}
                            placeholder="Como aconteceu? Sinta-se à vontade para relatar..."
                            value={relatoSofreu}
                            onChange={(e) => setRelatoSofreu(e.target.value)}
                            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none resize-none"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50">
                      <label htmlFor="modal-presenciou" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 mt-2">
                        Já presenciou preconceito, discriminação ou violência com outra pessoa?
                      </label>
                      <select
                        id="modal-presenciou"
                        value={presenciouPreconceito}
                        onChange={(e) => setPresenciouPreconceito(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Não">Não</option>
                        <option value="Sim">Sim</option>
                        <option value="Prefiro não responder">Prefiro não responder</option>
                      </select>
                    </div>

                    {presenciouPreconceito === 'Sim' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label htmlFor="modal-relato-presenciou" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                          Relato do que presenciou (Opcional)
                        </label>
                        <textarea
                          id="modal-relato-presenciou"
                          rows={3}
                          placeholder="O que você observou? Sinta-se à vontade para relatar..."
                          value={relatoPresenciou}
                          onChange={(e) => setRelatoPresenciou(e.target.value)}
                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModalColeta(false)}
                    className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer border-0"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      Boolean(profile?.nomeCompleto && normalizeStr(nomeParticipante) === normalizeStr(profile.nomeCompleto)) ||
                      Boolean(nomeParticipante && entrevistadosExistentes.has(nameKey(nomeParticipante))) ||
                      nomeSemSobrenome ||
                      (similares.length > 0 && !homonimoConfirmado)
                    }
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer border-0"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Salvar Ficha do Censo</>}
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

      {/* Modal de Resgate e Backup de Fichas Offline */}
      {showRescueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
                  💾
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Central de Resgate & Backup Offline</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Proteção contra perda de dados em aparelhos da escola</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowRescueModal(false); setRescueSuccessMsg(null); }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold bg-transparent border-0 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fichas salvas neste aparelho:</span>
                  <span className="text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                    {tasOfflineSync.getDrafts().length} fichas
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  Se você estiver usando um Chromebook ou tablet compartilhado da escola, copie o backup em JSON abaixo para garantir que seus dados nunca se percam!
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const json = tasOfflineSync.exportDraftsAsJson();
                      void navigator.clipboard.writeText(json);
                      setRescueSuccessMsg("Backup copiado para a área de transferência com sucesso!");
                    }}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border-0 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    📋 Copiar Backup (JSON)
                  </button>
                  <button
                    type="button"
                    onClick={() => void syncPendingData()}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border-0 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Subir Agora
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="rescue-json-input" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Restaurar / Importar Fichas de outro aparelho:
                </label>
                <textarea
                  id="rescue-json-input"
                  rows={3}
                  placeholder="Cole aqui o JSON exportado de outro dispositivo (ex: do Chromebook da escola)..."
                  value={rescueJsonInput}
                  onChange={(e) => setRescueJsonInput(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  disabled={!rescueJsonInput.trim()}
                  onClick={() => {
                    const imported = tasOfflineSync.importDraftsFromJson(rescueJsonInput.trim());
                    if (imported > 0) {
                      setPendingSyncCount(tasOfflineSync.getDrafts().length);
                      setRescueSuccessMsg(`${imported} ficha(s) restaurada(s) no aparelho com sucesso!`);
                      setRescueJsonInput('');
                      void syncPendingData();
                    } else {
                      setRescueSuccessMsg("Erro: formato de JSON inválido ou vazio.");
                    }
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-bold rounded-xl border-0 cursor-pointer"
                >
                  📥 Importar e Sincronizar Fichas
                </button>
              </div>

              {rescueSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 text-center animate-in fade-in">
                  {rescueSuccessMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;