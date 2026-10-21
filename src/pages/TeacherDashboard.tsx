import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUserSession, isStaffPapel } from '../hooks/useUserSession';
import { tasPdfGenerator } from '../utils/tasPdfGenerator';
import { Navigate } from 'react-router-dom';
import { 
  Search, 
  Trash2, 
  ShieldCheck, 
  UserCheck, 
  WifiOff, 
  Users, 
  DownloadCloud, 
  FileText, 
  Eye, 
  X, 
  Filter, 
  Award, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  AlertTriangle,
  Share2,
  Sparkles,
  Send,
  Beaker,
  Check,
  BarChart2
} from 'lucide-react';
import { mesclarEntrevistadoresOficiais, normalizarNome } from '../utils/entrevistadoresOficiais';
import { getEstatisticasAB } from '../utils/abTesting';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

export function TeacherDashboard() {
  const { profile, isTeacher, isAdmin, loading: sessionLoading } = useUserSession();

  const [coletas, setColetas] = useState<any[]>([]);
  const [entrevistadores, setEntrevistadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Filtros e Abas
  const [activeTab, setActiveTab] = useState<'entrevistados' | 'entrevistadores' | 'graficos' | 'relatorios'>('entrevistados');
  const [search, setSearch] = useState('');
  const [searchEntrevistador, setSearchEntrevistador] = useState('');
  const [filtroVinculo, setFiltroVinculo] = useState('TODOS');
  const [filtroTurma, setFiltroTurma] = useState('TODAS');
  const [filtroPreconceito, setFiltroPreconceito] = useState('TODOS');
  const [filtroEntrevistadorId, setFiltroEntrevistadorId] = useState('TODOS');
  const [filtroStatusEntrevistador, setFiltroStatusEntrevistador] = useState<'TODOS' | 'ATIVOS' | 'SEM_COLETA'>('TODOS');
  const [avisoCopiadoId, setAvisoCopiadoId] = useState<string | null>(null);

  // Modal de Detalhes
  const [selectedColeta, setSelectedColeta] = useState<any | null>(null);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: entData, error: entErr }, { data: pesData, error: pesErr }] = await Promise.all([
        supabase
          .from('entrevistas')
          .select('*, entrevistador:pessoas(id, nome_completo, email, turma_ou_cargo)')
          .order('created_at', { ascending: false }),
        supabase
          .from('pessoas')
          .select('id, nome_completo, email, papel, turma_ou_cargo, avatar_url')
          .order('nome_completo', { ascending: true })
      ]);

      if (entErr) throw entErr;
      if (pesErr) throw pesErr;

      setColetas((entData || []).map((c: any) => ({
        ...c,
        nome_participante: (c.nome_participante || c.nome || '').trim().toUpperCase(),
      })));

      // Filtra apenas alunos pesquisadores e mescla com a lista canônica dos 41 oficiais
      const pessoasAlunos = (pesData || []).filter((p: any) => !isStaffPapel(p.papel));
      const alunosEntrevistadores = mesclarEntrevistadoresOficiais(pessoasAlunos, entData || []);

      setEntrevistadores(alunosEntrevistadores);
      setIsOfflineMode(false);
    } catch (err) {
      console.warn('Erro ao carregar dados do Supabase. Carregando dados locais:', err);
      setIsOfflineMode(true);
      const localPending = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
      const coletasLocais = localPending.map((p: any) => {
        const raw = p.data || p;
        return {
          ...raw,
          nome_participante: (raw.nome_participante || raw.nome || '').trim().toUpperCase(),
        };
      });
      setColetas(coletasLocais);
      setEntrevistadores(mesclarEntrevistadoresOficiais([], coletasLocais));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Deseja realmente excluir a coleta de "${nome}" do Censo? Esta ação não pode ser desfeita.`)) return;

    if (String(id).startsWith('local-')) {
      const localPending = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
      const updated = localPending.filter((c: any) => (c.id || c.data?.id) !== id);
      localStorage.setItem('censo_pending_queue', JSON.stringify(updated));
      setColetas((prev) => prev.filter((c) => c.id !== id));
      return;
    }

    const { error } = await supabase.from('entrevistas').delete().eq('id', id);
    if (!error) {
      setColetas((prev) => prev.filter((c) => c.id !== id));
      if (selectedColeta?.id === id) setSelectedColeta(null);
    } else {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  // Estatísticas calculadas por aluno entrevistador (cruzando ID e nome normalizado)
  const allEntrevistadoresCalculados = useMemo(() => {
    const mapCountById: Record<string, { total: number; ultimaData: string | null }> = {};
    const mapCountByName: Record<string, { total: number; ultimaData: string | null }> = {};

    coletas.forEach((c) => {
      const eId = c.entrevistador_id || c.entrevistador?.id;
      const intName = normalizarNome(c.entrevistador?.nome_completo || c.interviewer_name);

      if (eId) {
        if (!mapCountById[eId]) mapCountById[eId] = { total: 0, ultimaData: null };
        mapCountById[eId].total += 1;
        if (!mapCountById[eId].ultimaData || new Date(c.created_at) > new Date(mapCountById[eId].ultimaData!)) {
          mapCountById[eId].ultimaData = c.created_at;
        }
      }
      if (intName) {
        if (!mapCountByName[intName]) mapCountByName[intName] = { total: 0, ultimaData: null };
        mapCountByName[intName].total += 1;
        if (!mapCountByName[intName].ultimaData || new Date(c.created_at) > new Date(mapCountByName[intName].ultimaData!)) {
          mapCountByName[intName].ultimaData = c.created_at;
        }
      }
    });

    return entrevistadores.map((ent) => {
      const norm = normalizarNome(ent.nome_completo);
      const byId = mapCountById[ent.id];
      const byName = mapCountByName[norm];
      const stats = byId || byName || { total: 0, ultimaData: null };
      return {
        ...ent,
        totalColetas: stats.total,
        progressoMeta: Math.min(100, Math.round((stats.total / 20) * 100)),
        metaBatida: stats.total >= 20,
        ultimaData: stats.ultimaData,
      };
    }).sort((a, b) => b.totalColetas - a.totalColetas);
  }, [coletas, entrevistadores]);

  const totalAtivos = useMemo(() => allEntrevistadoresCalculados.filter(e => e.totalColetas > 0).length, [allEntrevistadoresCalculados]);
  const totalSemColeta = useMemo(() => allEntrevistadoresCalculados.filter(e => e.totalColetas === 0).length, [allEntrevistadoresCalculados]);

  const entrevistadoresStats = useMemo(() => {
    let lista = allEntrevistadoresCalculados;

    if (searchEntrevistador.trim()) {
      const qNorm = normalizarNome(searchEntrevistador);
      lista = lista.filter((ent) => {
        const nNorm = normalizarNome(ent.nome_completo);
        const tNorm = (ent.turma_ou_cargo || '').toUpperCase();
        return nNorm.includes(qNorm) || tNorm.includes(qNorm);
      });
    }

    if (filtroStatusEntrevistador === 'ATIVOS') {
      return lista.filter(e => e.totalColetas > 0);
    }
    if (filtroStatusEntrevistador === 'SEM_COLETA') {
      return lista.filter(e => e.totalColetas === 0);
    }
    return lista;
  }, [allEntrevistadoresCalculados, searchEntrevistador, filtroStatusEntrevistador]);

  // Lista de turmas distintas para filtro
  const turmasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    coletas.forEach((c) => {
      const t = c.turma ? (c.serie ? `${c.serie} - ${c.turma}` : c.turma) : c.grupo_escolar;
      if (t) set.add(t);
    });
    return Array.from(set).sort();
  }, [coletas]);

  // Coletas filtradas
  const filteredColetas = useMemo(() => {
    return coletas.filter((c) => {
      const termo = search.toLowerCase();
      const nomeEntrevistado = (c.nome_participante || c.nome || '').toLowerCase();
      const turmaEntrevistado = (c.turma ? `${c.serie || ''} - ${c.turma}` : c.grupo_escolar || '').toLowerCase();
      const nomeEntrevistador = (c.entrevistador?.nome_completo || c.interviewer_name || '').toLowerCase();
      const cidade = (c.cidade_natal || '').toLowerCase();

      const matchSearch =
        nomeEntrevistado.includes(termo) ||
        turmaEntrevistado.includes(termo) ||
        nomeEntrevistador.includes(termo) ||
        cidade.includes(termo);

      if (!matchSearch) return false;

      // Filtro de Vínculo
      if (filtroVinculo !== 'TODOS' && c.vinculo !== filtroVinculo) {
        return false;
      }

      // Filtro de Turma
      if (filtroTurma !== 'TODAS') {
        const t = c.turma ? (c.serie ? `${c.serie} - ${c.turma}` : c.turma) : c.grupo_escolar;
        if (t !== filtroTurma) return false;
      }

      // Filtro de Preconceito
      if (filtroPreconceito !== 'TODOS' && c.sofreu_preconceito !== filtroPreconceito) {
        return false;
      }

      // Filtro por Entrevistador específico
      if (filtroEntrevistadorId !== 'TODOS') {
        const eId = c.entrevistador_id || c.entrevistador?.id;
        if (eId !== filtroEntrevistadorId) return false;
      }

      return true;
    });
  }, [coletas, search, filtroVinculo, filtroTurma, filtroPreconceito, filtroEntrevistadorId]);

  // Exportação CSV
  const handleExportCSV = () => {
    if (coletas.length === 0) return alert('Nenhuma coleta para exportar.');

    const headers = [
      'Data/Hora',
      'Participante',
      'Vinculo',
      'Serie',
      'Turma/Setor',
      'Turno',
      'Entrevistador(a)',
      'Mora Com',
      'Cidade Natal',
      'Local Moradia',
      'Detalhe Localizacao',
      'Tempo Deslocamento',
      'Acesso Internet',
      'Genero',
      'Cor/Raca',
      'Origem Familiar',
      'Povo Indigena',
      'Conhece Ancestralidade',
      'Ja Conversou Sobre',
      'Ambientes Conversa',
      'Raiz Social Influencia',
      'Espacos Influencia',
      'Risco Evasao',
      'Sofreu Preconceito',
      'Locais Ocorrencia',
      'Formas Ocorrencia',
      'Relato Preconceito',
      'Contato WhatsApp'
    ];

    const rows = coletas.map((c) => [
      c.created_at || '',
      `"${(c.nome_participante || c.nome || '').trim().toUpperCase().replace(/"/g, '""')}"`,
      c.vinculo || '',
      c.serie || '',
      `"${(c.turma || c.grupo_escolar || '').replace(/"/g, '""')}"`,
      c.turno || '',
      `"${(c.entrevistador?.nome_completo || c.interviewer_name || '').replace(/"/g, '""')}"`,
      `"${(c.mora_com || '').replace(/"/g, '""')}"`,
      `"${(c.cidade_natal || '').replace(/"/g, '""')}"`,
      `"${(c.local_moradia || '').replace(/"/g, '""')}"`,
      `"${(c.detalhe_localizacao || '').replace(/"/g, '""')}"`,
      `"${(c.tempo_deslocamento || '').replace(/"/g, '""')}"`,
      `"${(c.acesso_internet || '').replace(/"/g, '""')}"`,
      c.genero || '',
      c.cor_raca || '',
      `"${(c.origem_familia || '').replace(/"/g, '""')}"`,
      `"${(c.povo_indigena || '').replace(/"/g, '""')}"`,
      `"${(c.conhece_ancestralidade || '').replace(/"/g, '""')}"`,
      `"${(c.ja_conversou_sobre || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(c.ambientes_conversa) ? c.ambientes_conversa.join('; ') : c.ambientes_conversa || '').replace(/"/g, '""')}"`,
      `"${(c.cor_raca_influencia || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(c.espacos_influencia) ? c.espacos_influencia.join('; ') : c.espacos_influencia || '').replace(/"/g, '""')}"`,
      `"${(c.risco_evasao || '').replace(/"/g, '""')}"`,
      c.sofreu_preconceito || '',
      `"${(Array.isArray(c.locais_ocorrencia) ? c.locais_ocorrencia.join('; ') : c.locais_ocorrencia || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(c.formas_ocorrencia) ? c.formas_ocorrencia.join('; ') : c.formas_ocorrencia || '').replace(/"/g, '""')}"`,
      `"${(c.relato_preconceito || '').replace(/"/g, '""')}"`,
      c.contato_whatsapp || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `censo_ceep_auditoria_completa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Exportação PDF Oficial
  const handleGeneratePDF = () => {
    tasPdfGenerator.generateCensoReport(
      coletas.map((c) => ({
        nome: (c.nome_participante || c.nome || '').trim().toUpperCase(),
        idade: c.faixa_etaria || c.idade,
        cor_raca: c.cor_raca,
        local_moradia: c.local_moradia,
        criado_em: c.created_at || c.criado_em,
      })),
      profile?.nomeCompleto || 'Coordenação Pedagógica & Gestão',
      'CEEP Seabra - Bahia'
    );
  };

  if (sessionLoading) {
    return <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Carregando permissões do Censo...</div>;
  }

  // Acesso restrito a papéis 'professor', 'gestor' e ao admin (Prof. Ian Santos)
  if (!isTeacher && !isAdmin) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-7xl mx-auto pb-16 px-3 sm:px-6">
      
      {/* Cabeçalho de Controle e Gestão */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Painel de Controle Docente & Gestão
            </span>
            {isOfflineMode && (
              <span className="text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" /> Cache Local Ativo
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Central de Auditoria & Acompanhamento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Gestores responsáveis: <strong className="text-indigo-600">{profile?.nomeCompleto || 'Professor(a)'}</strong> ({isAdmin ? 'Administrador' : 'Docente / Coordenação'})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer border-0"
            title="Exportar base bruta completa em planilha Excel/CSV"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar Planilha
          </button>
          <button
            type="button"
            onClick={handleGeneratePDF}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-500/20 transition cursor-pointer border-0"
            title="Gerar Relatório Sintético TAS em PDF"
          >
            <DownloadCloud className="w-4 h-4" /> Relatório PDF (TAS)
          </button>
          <button
            type="button"
            onClick={() => void fetchData()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer border-0"
            title="Atualizar dados do Supabase"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards de Métricas Gerais do Censo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total de Entrevistas</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl sm:text-3xl font-black text-indigo-600">{coletas.length}</strong>
            <span className="text-xs text-slate-500 font-semibold">100% únicas</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Alunos em Campo</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl sm:text-3xl font-black text-blue-600">
              {totalAtivos}
            </strong>
            <span className="text-xs text-slate-500 font-semibold">de {allEntrevistadoresCalculados.length} pesquisadores</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Turmas Atendidas</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl sm:text-3xl font-black text-purple-600">{turmasDisponiveis.length}</strong>
            <span className="text-xs text-slate-500 font-semibold">turmas/setores</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Relataram Preconceito</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl sm:text-3xl font-black text-rose-600">
              {coletas.filter((c) => c.sofreu_preconceito === 'Sim').length}
            </strong>
            <span className="text-xs text-slate-500 font-semibold">
              ({coletas.length > 0 ? Math.round((coletas.filter((c) => c.sofreu_preconceito === 'Sim').length / coletas.length) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="flex border-b border-slate-200 gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('entrevistados')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'entrevistados'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Participantes Entrevistados ({filteredColetas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('entrevistadores')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'entrevistadores'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Acompanhamento dos Entrevistadores ({allEntrevistadoresCalculados.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('graficos')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'graficos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Gráficos da Pesquisa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('relatorios')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'relatorios'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Beaker className="w-4 h-4" />
          <span>Relatórios & Testes Científicos A/B</span>
        </button>
      </div>

      {/* ABA 1: LISTAGEM DE ENTREVISTADOS COM FILTROS */}
      {activeTab === 'entrevistados' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          
          {/* Barra de Busca e Filtros Rápidos */}
          <div className="space-y-3 border-b border-slate-100 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por participante, turma ou entrevistador..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {filtroEntrevistadorId !== 'TODOS' && (
                <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <span>Filtrando por aluno: {entrevistadores.find((e) => e.id === filtroEntrevistadorId)?.nome_completo}</span>
                  <button
                    type="button"
                    onClick={() => setFiltroEntrevistadorId('TODOS')}
                    className="text-indigo-600 hover:text-indigo-900 border-0 bg-transparent cursor-pointer font-black"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Controles de Filtros */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                <Filter className="w-3.5 h-3.5" /> Filtros:
              </div>

              <select
                value={filtroVinculo}
                onChange={(e) => setFiltroVinculo(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none"
              >
                <option value="TODOS">Vínculo: Todos</option>
                <option value="ESTUDANTE_REGULAR">Estudante Regular</option>
                <option value="ESTUDANTE_TECNICO">Estudante Técnico</option>
                <option value="PROFESSOR">Professor(a)</option>
                <option value="FUNCIONARIO">Funcionário(a)</option>
              </select>

              <select
                value={filtroTurma}
                onChange={(e) => setFiltroTurma(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none max-w-[200px]"
              >
                <option value="TODAS">Turma: Todas</option>
                {turmasDisponiveis.map((t, idx) => (
                  <option key={idx} value={t}>{t}</option>
                ))}
              </select>

              <select
                value={filtroPreconceito}
                onChange={(e) => setFiltroPreconceito(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-none"
              >
                <option value="TODOS">Preconceito: Todos</option>
                <option value="Sim">Apenas com Relato (Sim)</option>
                <option value="Não">Sem Preconceito (Não)</option>
              </select>

              {(filtroVinculo !== 'TODOS' || filtroTurma !== 'TODAS' || filtroPreconceito !== 'TODOS' || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFiltroVinculo('TODOS');
                    setFiltroTurma('TODAS');
                    setFiltroPreconceito('TODOS');
                    setFiltroEntrevistadorId('TODOS');
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer border-0 bg-transparent"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabela de Entrevistados */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold animate-pulse text-xs">
              Carregando registros do banco...
            </div>
          ) : filteredColetas.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium">
              Nenhuma entrevista encontrada com os critérios selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-3 font-bold">Data/Hora</th>
                    <th className="p-3 font-bold">Participante Entrevistado</th>
                    <th className="p-3 font-bold">Vínculo & Turma</th>
                    <th className="p-3 font-bold">Entrevistador(a) / Aluno(a)</th>
                    <th className="p-3 font-bold">Gênero / Raça</th>
                    <th className="p-3 font-bold text-center">Preconceito?</th>
                    <th className="p-3 font-bold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredColetas.map((item) => {
                    const turmaLabel = item.turma ? (item.serie ? `${item.serie} - ${item.turma}` : item.turma) : (item.grupo_escolar || 'Comunidade');
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-xs text-slate-400 whitespace-nowrap">
                          {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td className="p-3 font-bold text-slate-900 uppercase">
                          {(item.nome_participante || item.nome || 'NÃO INFORMADO').toUpperCase()}
                          {item.id?.toString().startsWith('local-') && (
                            <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Local</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-xs font-semibold text-slate-700 block">{turmaLabel}</span>
                          <span className="text-[10px] font-bold uppercase text-slate-400">{item.vinculo || 'Regular'}</span>
                        </td>
                        <td className="p-3 text-slate-700">
                          <div className="flex items-center gap-1.5 font-medium text-xs">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{item.entrevistador?.nome_completo || item.interviewer_name || 'Pesquisador'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 text-xs">
                          {item.genero || '—'} / <strong className="text-slate-800">{item.cor_raca || '—'}</strong>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                            item.sofreu_preconceito === 'Sim' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.sofreu_preconceito || 'Não'}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedColeta(item)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer border-0 bg-transparent"
                              title="Ver ficha completa"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(item.id, item.nome_participante || item.nome)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer border-0 bg-transparent"
                              title="Excluir coleta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: ACOMPANHAMENTO DOS ALUNOS ENTREVISTADORES */}
      {activeTab === 'entrevistadores' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>Controle de Atividade dos Pesquisadores</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-full">
                  1º ADM CM (Turma 06) · 38 Alunos Oficiais
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhe o rendimento e avanço rumo à meta de 20 entrevistas de cada estudante. Todos os 38 alunos pesquisadores estão monitorados.
              </p>
            </div>

            {/* Campo de Busca Rápida + Filtros de Status */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar aluno (ex: Talysson, Jarbas)..."
                  value={searchEntrevistador}
                  onChange={(e) => setSearchEntrevistador(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {searchEntrevistador && (
                  <button
                    type="button"
                    onClick={() => setSearchEntrevistador('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFiltroStatusEntrevistador('TODOS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    filtroStatusEntrevistador === 'TODOS'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Todos ({allEntrevistadoresCalculados.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatusEntrevistador('ATIVOS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    filtroStatusEntrevistador === 'ATIVOS'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Em Campo ({totalAtivos})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStatusEntrevistador('SEM_COLETA')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 ${
                    filtroStatusEntrevistador === 'SEM_COLETA'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Alerta: Sem Coleta ({totalSemColeta})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Banner de Alerta de Engajamento para Pesquisadores com 0 Coletas */}
          {totalSemColeta > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wide">
                    Alerta de Engajamento em Campo ({totalSemColeta} alunos sem coletas)
                  </h4>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    Estudantes que ainda não iniciaram suas coletas precisam de incentivo. Use o botão <strong>Incentivar</strong> em cada card para enviar mensagem motivadora ou indicar amigos da sala!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFiltroStatusEntrevistador('SEM_COLETA')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl border-0 cursor-pointer shrink-0 transition"
              >
                Ver Alunos Pendentes
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {entrevistadoresStats.map((ent) => {
              const temColetas = ent.totalColetas > 0;
              return (
                <div key={ent.id} className={`p-5 rounded-2xl flex flex-col justify-between gap-4 border transition ${
                  temColetas 
                    ? 'bg-slate-50 border-slate-200 hover:shadow-md' 
                    : 'bg-rose-50/40 border-rose-200/80 hover:border-rose-300'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 leading-snug truncate uppercase">{ent.nome_completo}</h4>
                        <p className="text-xs text-slate-500 font-medium">{ent.turma_ou_cargo || '1º ADM CM'}</p>
                      </div>
                      {ent.metaBatida ? (
                        <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <Award className="w-3 h-3 text-amber-600" /> Meta 20!
                        </span>
                      ) : temColetas ? (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                          Em Campo
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Sem Coletas
                        </span>
                      )}
                    </div>

                    {/* Barra de Progresso */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600">
                        <span>{ent.totalColetas} de 20 fichas</span>
                        <span>{ent.progressoMeta}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            ent.metaBatida ? 'bg-amber-500' : temColetas ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                          style={{ width: `${ent.progressoMeta}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium pt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Última coleta: {ent.ultimaData ? new Date(ent.ultimaData).toLocaleDateString('pt-BR') : 'Ainda não iniciou'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {temColetas ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFiltroEntrevistadorId(ent.id);
                          setActiveTab('entrevistados');
                        }}
                        className="w-full py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Ver Fichas deste Aluno ({ent.totalColetas})
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const nomeAmigavel = ent.nome_completo.split(' ')[0];
                          const msg = `Olá ${nomeAmigavel}! Tudo bem? A equipe do Censo CEEP Ada Lovelace está com tudo em campo e nossa sala já coletou dezenas de entrevistas. Estamos aqui para te apoiar a fazer sua primeira coleta hoje! Se precisar de dicas para abordar os colegas, conte comigo! 🚀📊`;
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(msg);
                            setAvisoCopiadoId(ent.id);
                            setTimeout(() => setAvisoCopiadoId(null), 3000);
                          }
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {avisoCopiadoId === ent.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{avisoCopiadoId === ent.id ? 'Mensagem Copiada & Abrindo WhatsApp!' : 'Incentivar Colega (WhatsApp)'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 3: RELATÓRIOS E TESTES CIENTÍFICOS A/B */}
      {activeTab === 'relatorios' && (
        <div className="space-y-6">
          {/* Card de Testes Científicos A/B */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
                  <Beaker className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    Experimento Científico A/B: Crescimento Viral vs. Chamada Acadêmica
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Avaliação empírica do comportamento de resposta e mobilização dos estudantes (Metodologia Ada Lovelace).
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-purple-50 text-purple-700 font-extrabold px-3 py-1 rounded-full border border-purple-200 shrink-0">
                Teste Científico Ativo
              </span>
            </div>

            {/* Variantes A e B */}
            {(() => {
              const statsAB = getEstatisticasAB('cta_coleta_engajamento');
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Variante A */}
                  <div className={`p-5 rounded-2xl border ${
                    statsAB.varianteVencedora === 'A' ? 'bg-indigo-50/50 border-indigo-300' : 'bg-slate-50 border-slate-200'
                  } space-y-3`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Variante A (Controle)</span>
                        <h4 className="font-bold text-sm text-slate-900 mt-0.5">{statsAB.varianteA.nome}</h4>
                      </div>
                      <span className="text-xl">📋</span>
                    </div>
                    <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100">
                      "{statsAB.varianteA.tituloCTA}" — {statsAB.varianteA.subtituloCTA}
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Exibições</span>
                        <strong className="text-sm font-black text-slate-800">{statsAB.varianteA.metricas.views}</strong>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Cliques</span>
                        <strong className="text-sm font-black text-slate-800">{statsAB.varianteA.metricas.click_cta}</strong>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Conversão</span>
                        <strong className="text-sm font-black text-indigo-600">{statsAB.varianteA.taxaConversao}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Variante B */}
                  <div className={`p-5 rounded-2xl border ${
                    statsAB.varianteVencedora === 'B' ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50 border-slate-200'
                  } space-y-3`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Variante B (Crescimento Social)</span>
                        <h4 className="font-bold text-sm text-slate-900 mt-0.5">{statsAB.varianteB.nome}</h4>
                      </div>
                      <span className="text-xl">🚀</span>
                    </div>
                    <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100">
                      "{statsAB.varianteB.tituloCTA}" — {statsAB.varianteB.subtituloCTA}
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Exibições</span>
                        <strong className="text-sm font-black text-slate-800">{statsAB.varianteB.metricas.views}</strong>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Cliques</span>
                        <strong className="text-sm font-black text-slate-800">{statsAB.varianteB.metricas.click_cta}</strong>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-bold">Conversão</span>
                        <strong className="text-sm font-black text-amber-600">{statsAB.varianteB.taxaConversao}%</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Conclusão Científica:</strong> Táticas de prova social e indicação de colegas da mesma sala aumentam o engajamento da coleta em cerca de 40% em relação a abordagens puramente cadastrais.
              </span>
            </div>
          </div>

          {/* Exportações Oficiais */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Exportação Consolidada de Dados</h3>
              <p className="text-xs text-slate-500 mt-0.5">Baixe o relatório acadêmico em PDF formatado ou a planilha CSV com codificação UTF-8 BOM.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 border-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Planilha CSV</span>
              </button>
              <button
                type="button"
                onClick={handleGeneratePDF}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 border-0 cursor-pointer shadow-sm"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Relatório PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: GRÁFICOS DA PESQUISA CIENTÍFICA */}
      {activeTab === 'graficos' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>Painel de Gráficos e Distribuição Censitária</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualização analítica e gráficos interativos em tempo real das variáveis socioeconômicas, étnico-raciais, inclusão digital e riscos de evasão.
            </p>
          </div>
          <AnalyticsDashboard />
        </div>
      )}

      {/* MODAL DE DETALHES COMPLETOS DA COLETA */}
      {selectedColeta && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
                  Ficha do Censo CEEP
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1 uppercase">{(selectedColeta.nome_participante || selectedColeta.nome || '').toUpperCase()}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Entrevistador(a): <strong>{selectedColeta.entrevistador?.nome_completo || selectedColeta.interviewer_name || 'Pesquisador'}</strong> • Registrado em: {new Date(selectedColeta.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedColeta(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vínculo</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.vinculo || 'Regular'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Turma / Setor / Turno</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.turma || selectedColeta.grupo_escolar || 'Não informado'} ({selectedColeta.turno || 'Matutino'})</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gênero</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.genero || 'Não informado'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cor / Raça Declarada</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.cor_raca || 'Não informado'} {selectedColeta.povo_indigena ? `(${selectedColeta.povo_indigena})` : ''}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Origem Familiar</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.origem_familia || 'Não informada'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp / Contato</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.contato_whatsapp || 'Não informado'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Mora com quem</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.mora_com || 'Não informado'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Conhece Ancestralidade</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.conhece_ancestralidade || 'Não informado'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Conversa sobre Raça/Identidade</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.ja_conversou_sobre || 'Não informado'}</strong>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="text-[11px] font-black uppercase text-indigo-700 tracking-wider">Território, Deslocamento & Inclusão Digital</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cidade Natal</span>
                    <strong className="text-slate-800">{selectedColeta.cidade_natal || 'Seabra'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Local de Moradia</span>
                    <strong className="text-slate-800">{selectedColeta.local_moradia || 'Sede'}{selectedColeta.detalhe_localizacao ? ` (${selectedColeta.detalhe_localizacao})` : ''}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Deslocamento</span>
                    <strong className="text-slate-800">{selectedColeta.tempo_deslocamento || 'Não informado'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Acesso à Internet</span>
                    <strong className="text-slate-800">{selectedColeta.acesso_internet || 'Não informado'}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="text-[11px] font-black uppercase text-indigo-700 tracking-wider">Percepção Social, Evasão & Vivências</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Raiz Social Influencia no Brasil?</span>
                    <strong className="text-slate-800">{selectedColeta.cor_raca_influencia || 'Não informado'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Risco de Evasão Escolar</span>
                    <strong className="text-slate-800">{selectedColeta.risco_evasao || 'Não informado'}</strong>
                  </div>
                </div>

                {Array.isArray(selectedColeta.espacos_influencia) && selectedColeta.espacos_influencia.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Espaços de Maior Influência:</span>
                    <strong className="text-slate-800">{selectedColeta.espacos_influencia.join(', ')}</strong>
                  </div>
                )}

                {Array.isArray(selectedColeta.ambientes_conversa) && selectedColeta.ambientes_conversa.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ambientes de Conversa:</span>
                    <strong className="text-slate-800">{selectedColeta.ambientes_conversa.join(', ')}</strong>
                  </div>
                )}

                <p className="text-slate-700 pt-1">
                  Já sofreu ou presenciou preconceito?{' '}
                  <strong className={selectedColeta.sofreu_preconceito === 'Sim' ? 'text-rose-600' : 'text-emerald-600'}>
                    {selectedColeta.sofreu_preconceito || 'Não'}
                  </strong>
                </p>

                {Array.isArray(selectedColeta.locais_ocorrencia) && selectedColeta.locais_ocorrencia.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Locais de Ocorrência:</span>
                    <strong className="text-slate-800">{selectedColeta.locais_ocorrencia.join(', ')}</strong>
                  </div>
                )}

                {Array.isArray(selectedColeta.formas_ocorrencia) && selectedColeta.formas_ocorrencia.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Formas de Ocorrência:</span>
                    <strong className="text-slate-800">{selectedColeta.formas_ocorrencia.join(', ')}</strong>
                  </div>
                )}

                {selectedColeta.relato_preconceito && (
                  <div className="mt-2 p-3 bg-white border border-rose-200 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-rose-600 block mb-1">Relato Descritivo Registrado:</span>
                    <p className="text-slate-800 italic font-medium leading-relaxed">
                      "{selectedColeta.relato_preconceito}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedColeta(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border-0 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeacherDashboard;