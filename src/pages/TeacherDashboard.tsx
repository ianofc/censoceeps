import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUserSession } from '../hooks/useUserSession';
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
  FileSpreadsheet
} from 'lucide-react';

export function TeacherDashboard() {
  const { profile, isTeacher, isAdmin, loading: sessionLoading } = useUserSession();

  const [coletas, setColetas] = useState<any[]>([]);
  const [entrevistadores, setEntrevistadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Filtros e Abas
  const [activeTab, setActiveTab] = useState<'entrevistados' | 'entrevistadores' | 'relatorios'>('entrevistados');
  const [search, setSearch] = useState('');
  const [filtroVinculo, setFiltroVinculo] = useState('TODOS');
  const [filtroTurma, setFiltroTurma] = useState('TODAS');
  const [filtroPreconceito, setFiltroPreconceito] = useState('TODOS');
  const [filtroEntrevistadorId, setFiltroEntrevistadorId] = useState('TODOS');

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

      setColetas(entData || []);

      // Filtra apenas os alunos pesquisadores (entrevistadores)
      const alunosEntrevistadores = (pesData || []).filter((p: any) => {
        const papel = (p.papel || '').toLowerCase();
        const nome = (p.nome_completo || '').toLowerCase();
        const isDocente = papel === 'admin' || papel === 'professor' || papel === 'gestor' || nome.includes('ian') || nome.includes('juliana');
        return !isDocente;
      });

      setEntrevistadores(alunosEntrevistadores);
      setIsOfflineMode(false);
    } catch (err) {
      console.warn('Erro ao carregar dados do Supabase. Carregando dados locais:', err);
      setIsOfflineMode(true);
      const localPending = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
      setColetas(localPending.map((p: any) => p.data || p));
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

  // Estatísticas calculadas por aluno entrevistador
  const entrevistadoresStats = useMemo(() => {
    const mapCount: Record<string, { total: number; ultimaData: string | null }> = {};

    coletas.forEach((c) => {
      const eId = c.entrevistador_id || c.entrevistador?.id;
      if (!eId) return;
      if (!mapCount[eId]) {
        mapCount[eId] = { total: 0, ultimaData: null };
      }
      mapCount[eId].total += 1;
      if (!mapCount[eId].ultimaData || new Date(c.created_at) > new Date(mapCount[eId].ultimaData!)) {
        mapCount[eId].ultimaData = c.created_at;
      }
    });

    return entrevistadores.map((ent) => {
      const stats = mapCount[ent.id] || { total: 0, ultimaData: null };
      return {
        ...ent,
        totalColetas: stats.total,
        progressoMeta: Math.min(100, Math.round((stats.total / 20) * 100)),
        metaBatida: stats.total >= 20,
        ultimaData: stats.ultimaData,
      };
    }).sort((a, b) => b.totalColetas - a.totalColetas);
  }, [coletas, entrevistadores]);

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
      'Cidade Natal',
      'Local Moradia',
      'Genero',
      'Cor/Raca',
      'Origem Familiar',
      'Sofreu Preconceito',
      'Relato Preconceito',
      'Contato WhatsApp'
    ];

    const rows = coletas.map((c) => [
      c.created_at || '',
      `"${(c.nome_participante || c.nome || '').replace(/"/g, '""')}"`,
      c.vinculo || '',
      c.serie || '',
      `"${(c.turma || c.grupo_escolar || '').replace(/"/g, '""')}"`,
      c.turno || '',
      `"${(c.entrevistador?.nome_completo || c.interviewer_name || '').replace(/"/g, '""')}"`,
      `"${(c.cidade_natal || '').replace(/"/g, '""')}"`,
      `"${(c.local_moradia || '').replace(/"/g, '""')}"`,
      c.genero || '',
      c.cor_raca || '',
      `"${(c.origem_familia || '').replace(/"/g, '""')}"`,
      c.sofreu_preconceito || '',
      `"${(c.relato_preconceito || '').replace(/"/g, '""')}"`,
      c.contato_whatsapp || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `censo_ceep_auditoria_completa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportação PDF Oficial
  const handleGeneratePDF = () => {
    tasPdfGenerator.generateCensoReport(
      coletas.map((c) => ({
        nome: c.nome_participante || c.nome,
        cor_raca: c.cor_raca,
        local_moradia: c.local_moradia,
        criado_em: c.created_at,
      })),
      profile?.nomeCompleto || 'Coordenação Pedagógica & Gestão',
      'CEEP Seabra - Bahia'
    );
  };

  if (sessionLoading) {
    return <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Carregando permissões do Censo...</div>;
  }

  // Acesso restrito a professores e administradores (Ian e Juliana têm total acesso)
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
              {entrevistadoresStats.filter((e) => e.totalColetas > 0).length}
            </strong>
            <span className="text-xs text-slate-500 font-semibold">de {entrevistadores.length} cadastrados</span>
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
      <div className="flex border-b border-slate-200 gap-4">
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
          <span>Acompanhamento dos Entrevistadores ({entrevistadores.length})</span>
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
                        <td className="p-3 font-bold text-slate-900">
                          {item.nome_participante || item.nome || 'Não informado'}
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
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Controle de Atividade dos Pesquisadores
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhe o rendimento e avanço rumo à meta de 20 entrevistas de cada estudante.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600">
              Total: {entrevistadoresStats.length} alunos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {entrevistadoresStats.map((ent) => (
              <div key={ent.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-4 hover:shadow-md transition">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{ent.nome_completo}</h4>
                      <p className="text-xs text-slate-500 font-medium">{ent.turma_ou_cargo || 'Estudante Pesquisador(a)'}</p>
                    </div>
                    {ent.metaBatida ? (
                      <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Award className="w-3 h-3 text-amber-600" /> Meta 20!
                      </span>
                    ) : ent.totalColetas > 0 ? (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                        Em Campo
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                        Pendente
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
                          ent.metaBatida ? 'bg-amber-500' : 'bg-indigo-600'
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
              </div>
            ))}
          </div>
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
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedColeta.nome_participante || selectedColeta.nome}</h3>
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
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Turma / Setor</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.turma || selectedColeta.grupo_escolar || 'Não informado'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gênero</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.genero || 'Não informado'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cor / Raça Declarada</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.cor_raca || 'Não informado'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Origem Familiar</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.origem_familia || 'Não informada'}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp / Contato</span>
                  <strong className="text-slate-800 text-xs">{selectedColeta.contato_whatsapp || 'Não informado'}</strong>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="text-[11px] font-black uppercase text-indigo-700 tracking-wider">Território & Moradia</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cidade Natal</span>
                    <strong className="text-slate-800">{selectedColeta.cidade_natal || 'Seabra'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Local de Moradia</span>
                    <strong className="text-slate-800">{selectedColeta.local_moradia || 'Sede'}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="text-[11px] font-black uppercase text-indigo-700 tracking-wider">Declaração sobre Preconceito Racial</h4>
                <p className="text-slate-700">
                  Já sofreu ou presenciou preconceito no ambiente escolar/acadêmico?{' '}
                  <strong className={selectedColeta.sofreu_preconceito === 'Sim' ? 'text-rose-600' : 'text-emerald-600'}>
                    {selectedColeta.sofreu_preconceito || 'Não'}
                  </strong>
                </p>
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