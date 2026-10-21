import React, { useState, useEffect } from 'react';
import { useUserSession, isStaffPapel } from '../hooks/useUserSession';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Users, 
  Database, 
  Tv, 
  Download, 
  RefreshCw, 
  FolderCheck, 
  ExternalLink,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const Admin: React.FC = () => {
  const { isAdmin, loading: sessionLoading, profile } = useUserSession();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [totalEntrevistas, setTotalEntrevistas] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      void fetchAdminData();
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [{ data: pData }, { count: entCount }] = await Promise.all([
        supabase
          .from('pessoas')
          .select('id, nome_completo, email, papel, turma_ou_cargo, avatar_url, created_at')
          .order('nome_completo', { ascending: true }),
        supabase
          .from('entrevistas')
          .select('*', { count: 'exact', head: true })
      ]);

      setPessoas(pData || []);
      setTotalEntrevistas(entCount || 0);
    } catch (err) {
      console.error('Erro ao carregar dados administrativos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    setStatusMessage('Preparando backup completo do banco de dados...');
    try {
      const [{ data: allEntrevistas }, { data: allPessoas }] = await Promise.all([
        supabase.from('entrevistas').select('*'),
        supabase.from('pessoas').select('*')
      ]);

      const normalizedEntrevistas = (allEntrevistas || []).map(row => ({
        ...row,
        nome_participante: row.nome_participante ? String(row.nome_participante).trim().toUpperCase() : row.nome_participante
      }));

      const backup = {
        exportDate: new Date().toISOString(),
        geradoPor: profile.nomeCompleto,
        totalEntrevistas: normalizedEntrevistas.length,
        totalPessoas: allPessoas?.length || 0,
        entrevistas: normalizedEntrevistas,
        pessoas: allPessoas || []
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `censo_ceep_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage('Backup JSON gerado e baixado com sucesso!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao exportar JSON:', err);
      setStatusMessage('Erro ao gerar exportação JSON.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    setStatusMessage('Exportando entrevistas para CSV...');
    try {
      const { data: allEntrevistas } = await supabase.from('entrevistas').select('*').order('created_at', { ascending: false });
      if (!allEntrevistas || allEntrevistas.length === 0) {
        alert('Nenhuma entrevista encontrada para exportação.');
        return;
      }

      const headers = Object.keys(allEntrevistas[0]);
      const csvRows = [
        headers.join(','),
        ...allEntrevistas.map(row => 
          headers.map(field => {
            let val = row[field];
            if (val === null || val === undefined) return '""';
            if (field === 'nome_participante') val = String(val).trim().toUpperCase();
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];

      const blob = new Blob(["\uFEFF" + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `censo_ceep_todas_entrevistas_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatusMessage('Planilha CSV gerada com sucesso!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
      setStatusMessage('Erro ao exportar CSV.');
    } finally {
      setExporting(false);
    }
  };

  const handleChangeRole = async (pessoaId: string, currentRole: string) => {
    if (currentRole === 'admin') {
      alert('O papel de administrador é exclusivo do Prof. Ian Santos e não pode ser alterado por aqui.');
      return;
    }
    const PAPEIS_PERMITIDOS = ['entrevistador', 'professor', 'gestor', 'entrevistado'];
    const input = window.prompt(
      'Informe o novo papel (opções: entrevistador, professor, gestor, entrevistado):',
      currentRole
    );
    const newRole = (input || '').trim().toLowerCase();
    if (!newRole || newRole === currentRole) return;
    if (!PAPEIS_PERMITIDOS.includes(newRole)) {
      alert(`Papel inválido: "${newRole}". Use: ${PAPEIS_PERMITIDOS.join(', ')}.`);
      return;
    }

    try {
      const { error } = await supabase
        .from('pessoas')
        .update({ papel: newRole })
        .eq('id', pessoaId);

      if (error) throw error;
      setStatusMessage('Papel atualizado com sucesso!');
      void fetchAdminData();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao atualizar papel:', err);
      alert('Não foi possível atualizar o papel no banco.');
    }
  };

  if (sessionLoading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Verificando credenciais de Administrador...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/feed" replace />;
  }

  const filteredPessoas = pessoas.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.nome_completo || '').toLowerCase().includes(term) ||
      (p.email || '').toLowerCase().includes(term) ||
      (p.papel || '').toLowerCase().includes(term) ||
      (p.turma_ou_cargo || '').toLowerCase().includes(term)
    );
  });

  const totalProfessores = pessoas.filter(p => isStaffPapel(p.papel)).length;

  const totalAlunos = Math.max(0, pessoas.length - totalProfessores);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Painel do Administrador Geral</h1>
              <p className="text-slate-400 text-sm font-medium">
                Controle pleno do Censo CEEP Seabra • Professor Ian Santos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchAdminData()}
              disabled={loading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Dados
            </button>
            <button
              type="button"
              onClick={() => navigate('/auditoria')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
            >
              <FolderCheck className="w-4 h-4" />
              Gestão & Auditoria
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Entrevistas no Banco</span>
            <span className="text-2xl lg:text-3xl font-black text-indigo-400 mt-1 block">{totalEntrevistas}</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total de Usuários</span>
            <span className="text-2xl lg:text-3xl font-black text-blue-400 mt-1 block">{pessoas.length}</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Alunos Pesquisadores</span>
            <span className="text-2xl lg:text-3xl font-black text-amber-400 mt-1 block">{totalAlunos}</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Docentes / Gestores</span>
            <span className="text-2xl lg:text-3xl font-black text-emerald-400 mt-1 block">{totalProfessores}</span>
          </div>
        </div>
      </div>

      {/* Central Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Auditoria e Controle */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <FolderCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Painel Docente & Auditoria</h3>
            <p className="text-xs text-slate-500 mt-1">
              Acompanhamento minucioso de cada aluno entrevistador e de todos os entrevistados com filtros avançados e relatórios TAS.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/auditoria')}
            className="mt-4 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
          >
            Abrir Central de Auditoria
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Backups e Exportações */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Exportação e Backups</h3>
            <p className="text-xs text-slate-500 mt-1">
              Baixe os dados brutos de todo o censo escolar em JSON completo ou planilha CSV para análises externas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              disabled={exporting}
              onClick={handleExportJSON}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              JSON Bruto
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={handleExportCSV}
              className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              CSV Coletas
            </button>
          </div>
        </div>

        {/* Card 3: Telão Público */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Telão da Escola (Público)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Painel em tela cheia projetado para televisores e projetores do pátio com métricas dinâmicas do Censo em tempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.open('/telao', '_blank')}
            className="mt-4 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
          >
            Abrir Telão em Nova Aba
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabela de Usuários / Gestão de Perfis */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="font-black text-slate-900 text-lg">Diretório de Usuários & Papéis</h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou turma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Carregando usuários...</div>
        ) : filteredPessoas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Nome Completo</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Papel Atual</th>
                  <th className="py-3 px-4">Turma / Cargo</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPessoas.map((p) => {
                  const isDocente = isStaffPapel(p.papel);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {(p.nome_completo || 'U')[0]}
                          </div>
                        )}
                        <span>{p.nome_completo}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{p.email || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isDocente 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {p.papel || 'entrevistador_aluno'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{p.turma_ou_cargo || '—'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleChangeRole(p.id, p.papel || 'entrevistador_aluno')}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition"
                        >
                          Alterar Papel
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
