import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Send, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { AdinhaMascote } from './AdinhaMascote';
import { supabase, salvarEntrevistaResiliente, nameKey, nameWords, isSimilarName } from '../lib/supabaseClient';
import { tasOfflineSync, withTimeout } from '../utils/tasOfflineSync';
import { badgeService } from '../services/badgeService';
import catalogoAlunosLocal from '../data/alunos_turmas.json';

export interface AlunoCatalogoInfo {
  nome_completo: string;
  nome_normalizado: string;
  turma_codigo: string;
  turma_origem?: string | null;
  serie?: string | null;
  turma?: string | null;
  turno?: string | null;
}

export interface RegistroEntrevistado {
  nome: string;
  entrevistador: string;
  vinculo?: string;
  serie?: string;
  turma?: string;
}

const CATALOGO_ALUNOS_MAP = new Map<string, AlunoCatalogoInfo>(
  (catalogoAlunosLocal as AlunoCatalogoInfo[]).map((item) => [
    (item.nome_completo || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    item,
  ])
);

const normalizeStr = (s?: string) =>
  (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const descreverRegistro = (r: RegistroEntrevistado) =>
  [r.vinculo, r.serie, r.turma].filter(Boolean).join(' · ');

function findAlunoInCatalogo(valNormLookup: string): AlunoCatalogoInfo | null {
  const exato = CATALOGO_ALUNOS_MAP.get(valNormLookup);
  if (exato) return exato;
  if (valNormLookup.length >= 4) {
    for (const item of CATALOGO_ALUNOS_MAP.values()) {
      const itemNorm = normalizeStr(item.nome_completo);
      if (itemNorm === valNormLookup || (valNormLookup.length >= 8 && itemNorm.includes(valNormLookup))) {
        return item;
      }
    }
  }
  return null;
}

function checkNomeParticipanteConflict(
  val: string,
  profileNome: string | undefined,
  entrevistadosExistentes: Map<string, string>
): string | null {
  const valNorm = normalizeStr(val);
  if (profileNome && valNorm === normalizeStr(profileNome)) {
    return 'Atenção: O(A) entrevistador(a) não pode entrevistar a si mesmo(a).';
  }
  if (entrevistadosExistentes.has(nameKey(val))) {
    return `Atenção: "${val.trim()}" já foi entrevistado(a) anteriormente (por ${entrevistadosExistentes.get(nameKey(val))}).`;
  }
  return null;
}

interface ValidationParams {
  profileNome?: string;
  nomeParticipante: string;
  entrevistadosExistentes: Map<string, string>;
  nomeSemSobrenome: boolean;
  similares: RegistroEntrevistado[];
  homonimoConfirmado: boolean;
}

function validateBasicInterview(params: ValidationParams): string | null {
  const { profileNome, nomeParticipante, entrevistadosExistentes, nomeSemSobrenome, similares, homonimoConfirmado } = params;

  if (profileNome && normalizeStr(nomeParticipante) === normalizeStr(profileNome)) {
    return 'O(A) entrevistador(a) não pode entrevistar a si mesmo(a). Por favor, informe o nome do participante entrevistado.';
  }

  const jaFeito = entrevistadosExistentes.get(nameKey(nomeParticipante));
  if (jaFeito) {
    return `O(A) participante "${nomeParticipante.trim()}" já foi entrevistado(a) anteriormente (por ${jaFeito}). Cada pessoa só pode ser entrevistada uma única vez.`;
  }

  if (nomeSemSobrenome) {
    return 'Informe o nome completo do(a) participante (nome e sobrenomes).';
  }

  if (similares.length > 0 && !homonimoConfirmado) {
    return `Já existe entrevista com nome parecido (${similares[0].nome}). Confira se não é a mesma pessoa ou marque que é outra pessoa.`;
  }

  return null;
}

async function checkDuplicateOnline(
  nomeParticipante: string,
  homonimoConfirmado: boolean
): Promise<{ errorMsg: string | null; similarOnline?: RegistroEntrevistado }> {
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
    const existing = (candidatos || []).find((r: any) => nameKey(r.nome_participante) === alvo);
    if (existing) {
      const intName = (existing as any).entrevistador?.nome_completo;
      const responsavelStr = intName ? `por ${intName}` : 'no sistema';
      return {
        errorMsg: `O(A) participante "${nomeParticipante.trim()}" já foi entrevistado(a) anteriormente (${responsavelStr}). Para manter os dados estatísticos íntegros, cada pessoa só pode ser entrevistada uma vez.`,
      };
    }

    const similar = (candidatos || []).find((r: any) => isSimilarName(r.nome_participante, nomeParticipante));
    if (similar && !homonimoConfirmado) {
      return {
        errorMsg: `Já existe entrevista com nome parecido (${similar.nome_participante}). Confira se não é a mesma pessoa ou marque que é outra pessoa.`,
        similarOnline: {
          nome: similar.nome_participante,
          entrevistador: (similar as any).entrevistador?.nome_completo || 'outro entrevistador',
          vinculo: similar.vinculo,
          serie: similar.serie,
          turma: similar.turma,
        },
      };
    }
  } catch (checkErr) {
    console.warn('Não foi possível checar duplicidade online, prosseguindo com verificação local:', checkErr);
  }
  return { errorMsg: null };
}

interface InterviewFormParams {
  profile: any;
  nomeParticipante: string;
  contatoWhatsapp: string;
  genero: string;
  vinculo: string;
  serie: string;
  turma: string;
  turno: string;
  moraCom: string;
  cidadeNatal: string;
  localizacaoMoradia: string;
  detalheLocalizacao: string;
  tempoDeslocamento: string;
  acessoInternet: string;
  corRaca: string;
  origemFamilia: string;
  povoIndigena: string;
  conheceAncestralidade: string;
  jaConversouSobre: string;
  ambientesConversa: string[];
  corRacaInfluencia: string;
  espacosInfluencia: string[];
  riscoEvasao: string;
  sofreuPreconceito: string;
  locaisOcorrencia: string[];
  formasOcorrencia: string[];
  relatoSofreu: string;
  relatoPresenciou: string;
}

function assembleInterviewPayload(form: InterviewFormParams) {
  const isDocenteOuServidor = form.vinculo === 'PROFESSOR' || form.vinculo === 'FUNCIONARIO' || form.vinculo === 'GESTAO';
  const defaultSerie = form.vinculo === 'PROFESSOR' ? 'Corpo Docente' : form.vinculo === 'GESTAO' ? 'Gestão' : 'Servidor(a)';
  const defaultTurma = form.vinculo === 'PROFESSOR' ? 'Docente' : form.vinculo === 'GESTAO' ? 'Coordenação' : 'Funcionário';
  const isIndigena = form.corRaca === 'Indígena' || form.origemFamilia === 'Predominantemente Indígena';

  return {
    id: `local-${Date.now()}`,
    entrevistador_id: form.profile?.id || null,
    interviewer_name: form.profile?.nomeCompleto || 'Pesquisador(a)',
    nome_participante: form.nomeParticipante.trim().toUpperCase(),
    contato_whatsapp: form.contatoWhatsapp,
    genero: form.genero,
    vinculo: form.vinculo,
    serie: isDocenteOuServidor ? (form.serie || defaultSerie) : form.serie,
    turma: isDocenteOuServidor ? (form.turma || defaultTurma) : form.turma,
    turno: form.turno || 'Matutino',
    mora_com: form.moraCom || null,
    cidade_natal: form.cidadeNatal,
    local_moradia: form.localizacaoMoradia,
    detalhe_localizacao: form.localizacaoMoradia !== 'Sede de Seabra' ? (form.detalheLocalizacao.trim() || null) : null,
    tempo_deslocamento: form.tempoDeslocamento || null,
    acesso_internet: form.acessoInternet || null,
    cor_raca: form.corRaca,
    origem_familia: form.origemFamilia,
    povo_indigena: isIndigena ? (form.povoIndigena.trim() || null) : null,
    conhece_ancestralidade: form.conheceAncestralidade || null,
    ja_conversou_sobre: form.jaConversouSobre || null,
    ambientes_conversa: form.ambientesConversa,
    cor_raca_influencia: form.corRacaInfluencia || null,
    espacos_influencia: form.espacosInfluencia,
    risco_evasao: form.riscoEvasao || null,
    sofreu_preconceito: form.sofreuPreconceito,
    locais_ocorrencia: form.sofreuPreconceito === 'Sim' ? form.locaisOcorrencia : [],
    formas_ocorrencia: form.sofreuPreconceito === 'Sim' ? form.formasOcorrencia : [],
    relato_preconceito: form.relatoSofreu || form.relatoPresenciou || null,
    created_at: new Date().toISOString(),
    synced: false
  };
}

function unlockMilestoneBadges(profileId: string | undefined, total: number) {
  if (!profileId) return;
  if (total >= 1) void badgeService.unlockBadge(profileId, 'primeira_entrevista');
  if (total >= 5) void badgeService.unlockBadge(profileId, 'meta_5_entrevistas');
  if (total >= 10) void badgeService.unlockBadge(profileId, 'meta_10_entrevistas');
  if (total >= 20) void badgeService.unlockBadge(profileId, 'adinha_campea_meta_20');
}

export interface CensoModalColetaProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
  readonly profile: any;
  readonly myFichas: number;
  readonly setMyFichas: React.Dispatch<React.SetStateAction<number>>;
  readonly entrevistadosExistentes: Map<string, string>;
  readonly registrosEntrevistados: RegistroEntrevistado[];
  readonly setRegistrosEntrevistados: React.Dispatch<React.SetStateAction<RegistroEntrevistado[]>>;
  readonly listaSugerida: string[];
  readonly isOnline: boolean;
  readonly setPendingSyncCount: React.Dispatch<React.SetStateAction<number>>;
  readonly prefillColega?: { nome: string; turma?: string; serie?: string; turno?: string } | null;
  readonly onClearPrefillColega?: () => void;
}

export const CensoModalColeta: React.FC<CensoModalColetaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  profile,
  myFichas,
  setMyFichas,
  entrevistadosExistentes,
  registrosEntrevistados,
  setRegistrosEntrevistados,
  listaSugerida,
  isOnline,
  setPendingSyncCount,
  prefillColega,
  onClearPrefillColega,
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [homonimoConfirmado, setHomonimoConfirmado] = useState(false);
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

  // Prefill colega quando disparado pelo RecomendacaoColegasCard
  useEffect(() => {
    if (prefillColega && isOpen) {
      setNomeParticipante(prefillColega.nome.toUpperCase());
      if (prefillColega.turma) setTurma(prefillColega.turma);
      if (prefillColega.serie) setSerie(prefillColega.serie);
      if (prefillColega.turno) setTurno(prefillColega.turno);
      const ehTec = (prefillColega.serie || '').toLowerCase().includes('técnico');
      setVinculo(ehTec ? 'ESTUDANTE_TECNICO' : 'ESTUDANTE_REGULAR');
      setAlunoAutopreenchido({
        nome_completo: prefillColega.nome,
        nome_normalizado: normalizeStr(prefillColega.nome),
        turma_codigo: prefillColega.turma || '',
        turma: prefillColega.turma,
        serie: prefillColega.serie,
        turno: prefillColega.turno,
      });
      onClearPrefillColega?.();
    }
  }, [prefillColega, isOpen, onClearPrefillColega]);

  const nomeIncompleto = nameWords(nomeParticipante).length < 3;
  const nomeSemSobrenome = nomeParticipante.trim() !== '' && nameWords(nomeParticipante).length < 2;

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

  const opcoesDatalist = useMemo(() => {
    return listaSugerida.filter((nome: string) => {
      const n = normalizeStr(nome);
      const ehEleMesmo = profile?.nomeCompleto && n === normalizeStr(profile.nomeCompleto);
      const jaFoiEntrevistado = entrevistadosExistentes.has(nameKey(nome));
      return !ehEleMesmo && !jaFoiEntrevistado;
    });
  }, [listaSugerida, profile?.nomeCompleto, entrevistadosExistentes]);

  const isSubmitDisabled =
    loading ||
    Boolean(profile?.nomeCompleto && normalizeStr(nomeParticipante) === normalizeStr(profile.nomeCompleto)) ||
    Boolean(nomeParticipante && entrevistadosExistentes.has(nameKey(nomeParticipante))) ||
    nomeSemSobrenome ||
    (similares.length > 0 && !homonimoConfirmado);

  const toggleItemLista = (lista: string[], setLista: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (lista.includes(item)) {
      setLista(lista.filter((i) => i !== item));
    } else {
      setLista([...lista, item]);
    }
  };

  const handleNomeParticipanteChange = (valRaw: string) => {
    const val = valRaw.toUpperCase();
    setNomeParticipante(val);
    setHomonimoConfirmado(false);

    const valNormLookup = normalizeStr(val);
    const alunoInfo = findAlunoInCatalogo(valNormLookup);

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

    setErrorMsg(checkNomeParticipanteConflict(val, profile?.nomeCompleto, entrevistadosExistentes));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const basicErr = validateBasicInterview({
      profileNome: profile?.nomeCompleto,
      nomeParticipante,
      entrevistadosExistentes,
      nomeSemSobrenome,
      similares,
      homonimoConfirmado,
    });

    if (basicErr) {
      setErrorMsg(basicErr);
      setLoading(false);
      return;
    }

    const { errorMsg: dupErr, similarOnline } = await checkDuplicateOnline(nomeParticipante, homonimoConfirmado);
    if (dupErr) {
      if (similarOnline) {
        setRegistrosEntrevistados((prev) => [...prev, similarOnline]);
      }
      setErrorMsg(dupErr);
      setLoading(false);
      return;
    }

    const rawFicha = assembleInterviewPayload({
      profile,
      nomeParticipante,
      contatoWhatsapp,
      genero,
      vinculo,
      serie,
      turma,
      turno,
      moraCom,
      cidadeNatal,
      localizacaoMoradia,
      detalheLocalizacao,
      tempoDeslocamento,
      acessoInternet,
      corRaca,
      origemFamilia,
      povoIndigena,
      conheceAncestralidade,
      jaConversouSobre,
      ambientesConversa,
      corRacaInfluencia,
      espacosInfluencia,
      riscoEvasao,
      sofreuPreconceito,
      locaisOcorrencia,
      formasOcorrencia,
      relatoSofreu,
      relatoPresenciou,
    });

    const novoTotal = myFichas + 1;
    setMyFichas(novoTotal);
    unlockMilestoneBadges(profile?.id, novoTotal);

    tasOfflineSync.saveDraftOffline(rawFicha);
    const existingQueue: any[] = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
    setPendingSyncCount(existingQueue.length);

    try {
      if (!navigator.onLine) {
        throw new Error('Dispositivo offline. Ficha retida com segurança localmente.');
      }

      const res = await withTimeout(salvarEntrevistaResiliente(rawFicha, profile?.id), 7000);
      if (res.error) throw res.error;

      tasOfflineSync.removeDraft(rawFicha.id);
      const afterQueue: any[] = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
      setPendingSyncCount(afterQueue.length);

      setSavedOffline(false);
      setSuccess(true);
      resetForm();
      onSuccess();
    } catch (err) {
      console.warn('Ficha gravada com 100% de segurança no aparelho (aguardando envio para a nuvem):', err);
      setSavedOffline(true);
      setSuccess(true);
      setErrorMsg('Conexão instável ou offline: Ficha gravada com 100% de segurança no aparelho! Sincronizará automaticamente assim que houver sinal.');
      resetForm();
      onSuccess();
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (novoTotal >= 20) {
          window.dispatchEvent(new CustomEvent('abrir-celebracao-meta-20', { detail: { count: novoTotal } }));
        }
      }, novoTotal >= 20 ? 800 : 2000);
    }
  };

  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
                  {!savedOffline && isOnline ? 'Dados sincronizados com a nuvem.' : 'Salva localmente com segurança no dispositivo (Modo Offline).'}
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
            {/* Bloco 1: Identificação Básica */}
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
                    onChange={(e) => handleNomeParticipanteChange(e.target.value)}
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
                    {opcoesDatalist.map((nome: string) => (
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

            {/* Bloco 2: Localização, Deslocamento e Inclusão Digital */}
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

            {/* Bloco 3: Autodeclaração, Ancestralidade e Origem Familiar */}
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

            {/* Bloco 4: Percepção Social, Permanência e Vivências */}
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
                onClick={onClose}
                className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer border-0"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer border-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Salvar Ficha do Censo</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
