import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserSession } from '../hooks/useUserSession';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { UserAvatar } from '../components/UserAvatar';
import { ClipboardList, Plus, Award, Users, Heart, AlertCircle } from 'lucide-react';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { CelebrationScreen } from '../components/CelebrationScreen';
import { RecomendacaoColegasCard } from '../components/RecomendacaoColegasCard';
import { CensoOfflineBanner } from '../components/CensoOfflineBanner';
import { CensoMeta20Card } from '../components/CensoMeta20Card';
import { CensoModalRescue } from '../components/CensoModalRescue';
import { CensoModalColeta } from '../components/CensoModalColeta';
import { CensoAtividadesList } from '../components/CensoAtividadesList';

export function Home() {
  const { profile } = useUserSession();

  const [showModalColeta, setShowModalColeta] = useState(false);
  const [showRescueModal, setShowRescueModal] = useState(false);
  const [prefillColega, setPrefillColega] = useState<{ nome: string; turma?: string; serie?: string; turno?: string } | null>(null);

  const {
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
  } = useHomeDashboard(profile);

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

        <CensoAtividadesList
          fetchingData={fetchingData}
          minhasEntrevistas={minhasEntrevistas}
          atividadesRecentes={atividadesRecentes}
          userProfileName={profile?.nomeCompleto}
          onRefresh={() => void fetchDashboardData()}
        />

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