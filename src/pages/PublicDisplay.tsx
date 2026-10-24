import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Sun,
  CloudSun,
  Users,
  Flame,
  Award,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  QrCode,
  GraduationCap,
  HeartHandshake,
  TrendingUp,
  Landmark,
  Radio,
  BookOpen,
  Calendar,
  Layers,
  BarChart3,
  BarChart2,
  CheckCircle2,
  Clock,
  PieChart as PieIcon,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useUserSession } from '../hooks/useUserSession';
import { Navigate } from 'react-router-dom';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

interface SlideHighlight {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  description: string;
  bgGradient: string;
  badgeIcon: any;
  metricLabel?: string;
  metricValue?: string;
}

export function PublicDisplay() {
  const { isTeacher, isAdmin } = useUserSession();

  // Estados principais de dados
  const [totalAmostras, setTotalAmostras] = useState<number>(0);
  const [entrevistas, setEntrevistas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'censo' | 'graficos' | 'conquistas' | 'avisos'>('censo');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Busca de dados em tempo real com auto-refresh a cada 8s
  const fetchCensoData = async () => {
    try {
      // 1. Contagem total exata
      const { count } = await supabase
        .from('entrevistas')
        .select('*', { count: 'exact', head: true });

      // Pendentes no cache offline
      let pendingCount = 0;
      let localPendingDrafts: any[] = [];
      try {
        localPendingDrafts = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
        pendingCount = localPendingDrafts.length;
      } catch {}

      const totalCalculado = (count || 0) + pendingCount;
      setTotalAmostras(totalCalculado);

      // 2. Busca as últimas entrevistas para computar estatísticas e gráficos do censo
      const { data } = await supabase
        .from('entrevistas')
        .select('turma, serie, genero, cor_raca, sofreu_preconceito, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      const serverList = data || [];
      const localFormatted = localPendingDrafts.map((p: any) => p.data || p);
      setEntrevistas([...localFormatted, ...serverList]);
    } catch (err) {
      console.warn('Erro ao carregar dados do telão:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCensoData();
    const interval = setInterval(fetchCensoData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Computação dos dados e gráficos do Censo
  const analytics = useMemo(() => {
    const total = entrevistas.length || totalAmostras || 1;

    // Gênero
    const generosRaw: Record<string, number> = {};
    // Raça / Etnia
    const racasRaw: Record<string, number> = {};
    // Engajamento por Turma/Curso
    const turmas: Record<string, number> = {};
    let relatosPreconceito = 0;

    entrevistas.forEach((item) => {
      // Normalização amigável de gênero
      let g = (item.genero || '').trim();
      if (!g) {
        g = 'Não informado';
      } else {
        const gLow = g.toLowerCase();
        if (gLow.includes('fem')) g = 'Feminino';
        else if (gLow.includes('masc')) g = 'Masculino';
        else if (gLow.includes('não bin') || gLow.includes('nao bin')) g = 'Não-binário';
        else if (gLow.includes('trans')) g = 'Transgênero';
        else g = g.charAt(0).toUpperCase() + g.slice(1);
      }
      generosRaw[g] = (generosRaw[g] || 0) + 1;

      // Raça / Etnia
      let r = (item.cor_raca || '').trim();
      if (!r) {
        r = 'Não informado';
      } else {
        r = r.charAt(0).toUpperCase() + r.slice(1);
      }
      racasRaw[r] = (racasRaw[r] || 0) + 1;

      // Turma / Curso
      const t = item.turma?.trim() 
        ? (item.serie?.trim() ? `${item.serie.trim()}ª ${item.turma.trim()}` : item.turma.trim())
        : (item.grupo_escolar?.trim() || 'Comunidade Escolar');
      turmas[t] = (turmas[t] || 0) + 1;

      if (
        item.sofreu_preconceito === 'SIM' ||
        item.sofreu_preconceito === true ||
        String(item.sofreu_preconceito).toLowerCase().includes('sim')
      ) {
        relatosPreconceito++;
      }
    });

    // Ordena gêneros e raças pelo maior número
    const generos = Object.fromEntries(
      Object.entries(generosRaw).sort((a, b) => b[1] - a[1])
    );
    const racas = Object.fromEntries(
      Object.entries(racasRaw).sort((a, b) => b[1] - a[1])
    );

    // Top 4 turmas mais engajadas
    const topTurmas = Object.entries(turmas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      generos,
      racas,
      topTurmas,
      totalProcessado: total,
      indicePreconceito: Math.round((relatosPreconceito / total) * 100) || 0,
    };
  }, [entrevistas, totalAmostras]);

  // Slides do Carrossel de Destaques
  const slides: SlideHighlight[] = useMemo(() => [
    {
      id: 'censo-meta',
      tag: 'Censo CEEP 2026',
      tagColor: 'bg-emerald-500 text-white',
      title: 'Pesquisa Científica Ada Lovelace em Tempo Real',
      subtitle: 'Mapeamento Socioeconômico, Identitário e Diversidade no CEEP Seabra',
      description: `${totalAmostras} amostras coletadas em campo pelos 41 pesquisadores discentes. Cada voz fortalece políticas de inclusão estudantil e permanência escolar.`,
      bgGradient: isDarkMode
        ? 'from-blue-950 via-slate-900 to-indigo-950'
        : 'from-blue-700 via-indigo-700 to-slate-900',
      badgeIcon: Sparkles,
      metricLabel: 'Amostras Computadas',
      metricValue: `${totalAmostras}`
    },
    {
      id: 'projeto-ada',
      tag: 'Ciência & Inovação',
      tagColor: 'bg-purple-500 text-white',
      title: 'Projeto Científico Ada Lovelace: Conhecimento que Transforma',
      subtitle: 'Alunos Pesquisadores liderando a revolução de dados da Chapada Diamantina',
      description: 'Metodologia científica aplicada à educação pública: formulários dinâmicos com suporte offline TAS e inteligência de dados pelo IO OS.',
      bgGradient: isDarkMode
        ? 'from-purple-950 via-slate-900 to-pink-950'
        : 'from-purple-800 via-indigo-900 to-slate-900',
      badgeIcon: GraduationCap,
      metricLabel: 'Pesquisadores Ativos',
      metricValue: '41 Alunos'
    },
    {
      id: 'inclusao',
      tag: 'Diversidade & Respeito',
      tagColor: 'bg-amber-500 text-black',
      title: 'Voz, Raça e Pertencimento na Comunidade CEEP',
      subtitle: 'Diagnóstico preciso para a gestão escolar e apoio pedagógico',
      description: 'Os dados levantados orientam ações concretas de acolhimento, bolsas de estudo e valorização da juventude trabalhadora de Seabra.',
      bgGradient: isDarkMode
        ? 'from-amber-950 via-slate-900 to-stone-900'
        : 'from-amber-700 via-orange-800 to-slate-900',
      badgeIcon: HeartHandshake,
      metricLabel: 'Índice de Consciência',
      metricValue: '100% Auditável'
    }
  ], [totalAmostras, isDarkMode]);

  // Rotação automática do carrossel (a cada 7 segundos)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Alternador de Tela Cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const slide = slides[currentSlide];

  return (
    <div
      className={`min-h-[88vh] w-full rounded-3xl p-4 sm:p-6 lg:p-8 transition-colors duration-500 flex flex-col justify-between font-sans border select-none ${
        isDarkMode
          ? 'bg-slate-950 text-slate-100 border-slate-800 shadow-2xl'
          : 'bg-[#f4f6fa] text-slate-900 border-slate-200 shadow-xl'
      }`}
    >
      {/* ─── 1. BARRA SUPERIOR (HEADER ESTILO WIDGETS HUB) ────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-400">
            {currentTime.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </span>
          <div className="flex items-center gap-3 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {getGreeting()}
            </h1>
            <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              CEEP Seabra • IO OS
            </span>
          </div>
        </div>

        {/* Abas e Controles de Topo */}
        <div className="flex items-center gap-3">
          {/* Navegação de Abas Rápidas */}
          <div className={`hidden md:flex p-1 rounded-xl border ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('censo')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'censo'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Censo & Dados
            </button>
            <button
              onClick={() => setActiveTab('graficos')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'graficos'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Gráficos da Pesquisa
            </button>
            <button
              onClick={() => setActiveTab('conquistas')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'conquistas'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Projetos & Destaques
            </button>
            <button
              onClick={() => setActiveTab('avisos')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'avisos'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mural & Recados
            </button>
          </div>

          {/* Botão de Tema (Dark / Light) */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-semibold text-slate-400">
              Modo Escuro
            </span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Alternar tema"
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                isDarkMode ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Sincronização e Tela Cheia */}
          <button
            onClick={fetchCensoData}
            title="Atualizar dados agora"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={toggleFullscreen}
            title="Alternar Tela Cheia (F11)"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ─── 2. CORPO PRINCIPAL COM GRID WIDGETS + FEED ─────────────────────── */}
      {activeTab === 'graficos' ? (
        <main className="my-4 flex-1 w-full animate-in fade-in duration-300">
          <div className={`p-6 sm:p-8 rounded-3xl border ${
            isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200/60 dark:border-slate-800 gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2">
                  <BarChart2 className="w-3.5 h-3.5" /> Painel de Inteligência Científica
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  Gráficos da Pesquisa & Distribuição Censitária
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Métricas em tempo real de diversidade, perfil socioeconômico, inclusão digital e riscos de evasão no CEEP Seabra.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('censo')}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Voltar ao Telão Principal
                </button>
              </div>
            </div>

            <AnalyticsDashboard />
          </div>
        </main>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 flex-1 items-stretch">
        
        {/* COLUNA ESQUERDA: WIDGETS LATERAIS (4 colunas) */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Widgets do Colégio
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ao Vivo
            </span>
          </div>

          {/* WIDGET 1: NOTIFICAÇÃO RÁPIDA / BANNER */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                <Flame className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Plantão do Censo • Hoje
                </span>
                <h2 className="text-sm font-bold mt-0.5 leading-snug">
                  Coleta ativa nos turnos Matutino, Vespertino e Noturno
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Responda com seu líder de turma ou aponte a câmera para o QR Code da tela.
                </p>
              </div>
            </div>
          </div>

          {/* WIDGET 2: CLIMA & LOCALIZAÇÃO (SEABRA - CHAPADA DIAMANTINA) */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-[-15px] top-[-15px] opacity-20">
              <Sun className="w-32 h-32" />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-100">
                  <Landmark className="w-4 h-4" />
                  <span>Seabra, Bahia • Chapada Diamantina</span>
                </div>
                <CloudSun className="w-5 h-5 text-amber-300" />
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-4xl font-black">28°C</span>
                  <p className="text-xs font-medium text-blue-100 mt-0.5">
                    Tempo firme • Pôr do sol às 17h52
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-blue-200">
                    Hora Local
                  </span>
                  <p className="text-xl font-black">
                    {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET 3: TERMÔMETRO DE ENGAJAMENTO (SUBSTITUTO DAS COTAÇÕES DE MERCADO) */}
          <div className={`p-4 rounded-2xl border flex-1 flex flex-col justify-between ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
          }`}>
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Engajamento por Turma
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Top 4</span>
              </div>

              {/* Lista dos Cursos / Turmas mais ativas */}
              <div className="space-y-3 pt-3">
                {analytics.topTurmas.length > 0 ? (
                  analytics.topTurmas.map(([turmaNome, qtd], index) => {
                    const pct = Math.min(100, Math.round((qtd / (totalAmostras || 1)) * 100));
                    return (
                      <div key={turmaNome} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                            index === 0
                              ? 'bg-amber-400 text-amber-950'
                              : index === 1
                              ? 'bg-slate-300 text-slate-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {index + 1}º
                          </span>
                          <span className="font-bold truncate max-w-[140px] text-slate-800 dark:text-slate-200">
                            {turmaNome}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">
                            {qtd} fichas
                          </span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            +{pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Aguardando primeiros dados de turmas...
                  </p>
                )}
              </div>
            </div>

            {/* Total Geral de Amostras do Censo */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                  Total de Amostras
                </span>
                <strong className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {totalAmostras}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                  Status da Base
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Sincronizado
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* COLUNA DIREITA: FEED VISUAL & GRÁFICOS DO CENSO (8 colunas) */}
        <section className="lg:col-span-8 flex flex-col gap-4">
          
          {/* BANNER PRINCIPAL COM CARROSSEL VISUAL */}
          <div
            className={`relative rounded-3xl p-6 sm:p-8 text-white bg-gradient-to-br ${slide.bgGradient} shadow-lg transition-all duration-700 overflow-hidden min-h-[260px] flex flex-col justify-between`}
          >
            {/* Decoração de Fundo */}
            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-15 pointer-events-none">
              <slide.badgeIcon className="w-64 h-64" />
            </div>

            {/* Cabeçalho do Card */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${slide.tagColor}`}>
                  {slide.tag}
                </span>
                <span className="text-xs font-semibold text-white/70">
                  Transmissão ao vivo
                </span>
              </div>

              {/* Botões do Carrossel */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                  className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur transition"
                  aria-label="Slide anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                  className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur transition"
                  aria-label="Próximo slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo Central */}
            <div className="relative z-10 max-w-2xl my-4 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                {slide.title}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-white/90">
                {slide.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-white/75 line-clamp-2">
                {slide.description}
              </p>
            </div>

            {/* Rodapé do Slide com Métricas & Indicador */}
            <div className="flex items-center justify-between relative z-10 pt-2 border-t border-white/10">
              {slide.metricLabel && (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-white/70 uppercase">
                    {slide.metricLabel}:
                  </span>
                  <span className="text-lg font-black text-amber-300">
                    {slide.metricValue}
                  </span>
                </div>
              )}

              {/* Indicadores de Traço */}
              <div className="flex items-center gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentSlide === idx ? 'w-6 bg-white' : 'w-2 bg-white/30'
                    }`}
                    aria-label={`Ir para slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* GRID INFERIOR: GRÁFICOS DO CENSO + QR CODE DE PARTICIPAÇÃO */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
            
            {/* GRÁFICO 1: DIVERSIDADE E IDENTIDADE (5 colunas) */}
            <div className={`md:col-span-4 p-5 rounded-2xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Identidade de Gênero
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {Object.entries(analytics.generos).slice(0, 4).map(([gen, qtd], i) => {
                    const pct = Math.round((qtd / (analytics.totalProcessado || 1)) * 100);
                    const cores = ['bg-indigo-500', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500'];
                    return (
                      <div key={gen} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                            {gen}
                          </span>
                          <span className="text-slate-400">{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${cores[i % cores.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(analytics.generos).length === 0 && (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Processando amostras...
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Fonte: Censo CEEP 2026</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('graficos')}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-0 bg-transparent p-0 flex items-center gap-1"
                >
                  Ver Gráficos Detalhados →
                </button>
              </div>
            </div>

            {/* GRÁFICO 2: RAÇA / ETNIA & CONVIVÊNCIA (4 colunas) */}
            <div className={`md:col-span-4 p-5 rounded-2xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Composição Étnico-Racial
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {Object.entries(analytics.racas).slice(0, 4).map(([raca, qtd], i) => {
                    const pct = Math.round((qtd / (analytics.totalProcessado || 1)) * 100);
                    const cores = ['bg-amber-500', 'bg-blue-500', 'bg-teal-500', 'bg-purple-500'];
                    return (
                      <div key={raca} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                            {raca}
                          </span>
                          <span className="text-slate-400">{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${cores[i % cores.length]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(analytics.racas).length === 0 && (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      Processando dados de raça/cor...
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Pertencimento Escolar</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('graficos')}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer border-0 bg-transparent p-0 flex items-center gap-1"
                >
                  Painel Analítico →
                </button>
              </div>
            </div>

            {/* CARD 3: QR CODE DE PARTICIPAÇÃO DIRETA NO TELÃO (4 colunas) */}
            <div className={`md:col-span-4 p-5 rounded-2xl border flex flex-col items-center justify-between text-center ${
              isDarkMode
                ? 'bg-gradient-to-b from-blue-950/40 to-slate-900 border-blue-900/40'
                : 'bg-gradient-to-b from-blue-50 to-white border-blue-200/80 shadow-sm'
            }`}>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-full inline-block">
                  Participe Agora
                </span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Responda pelo Celular
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Aponte a câmera para responder ao Censo CEEP
                </p>
              </div>

              {/* Representação visual do QR Code com SVG de alta nitidez */}
              <div className="my-2 p-3 bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col items-center justify-center">
                <div className="relative">
                  <QrCode className="w-24 h-24 text-slate-900" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-[9px] font-black shadow">
                      IO
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold text-blue-600 tracking-wider mt-1 uppercase">
                  censo.ceepseabra.edu.br
                </span>
              </div>

              <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-200/60 dark:border-slate-800 pt-2">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" /> Ao Vivo
                </span>
                <span>Anônimo & Seguro</span>
              </div>
            </div>

          </div>
        </section>

      </div>
      )}

      {/* ─── 3. RODAPÉ DE NOTÍCIAS ROLANTES & CRÉDITOS ──────────────────────── */}
      <footer className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest text-[11px] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-500" /> CEEP Informa:
          </span>
          <span className="text-xs truncate max-w-xl text-slate-600 dark:text-slate-300 font-medium">
            Formulários de campo sincronizados pelo protocolo offline TAS • Projeto Científico Ada Lovelace • Secretaria de Educação da Bahia
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-bold">
          <span>IO OS v2.0</span>
          <span>•</span>
          <span>CEEP Seabra</span>
        </div>
      </footer>
    </div>
  );
}
