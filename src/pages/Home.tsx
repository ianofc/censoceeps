import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUserSession } from '../hooks/useUserSession';
import { UserAvatar } from '../components/UserAvatar';
import { ClipboardList, Send, AlertCircle, Loader2, Plus, CheckCircle, Award, Users, Heart } from 'lucide-react';
import { AdinhaMascote } from '../components/AdinhaMascote';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

export function Home() {
  const { profile } = useUserSession(); 
  
  const [showModalColeta, setShowModalColeta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const [stats, setStats] = useState({
    totalColetas: 0,
    alunosValidados: 24,
    totalAlunos: 29
  });
  const [atividadesRecentes, setAtividadesRecentes] = useState<any[]>([]);

  const [nomeParticipante, setNomeParticipante] = useState('');
  const [contatoWhatsapp, setContatoWhatsapp] = useState('');
  const [genero, setGenero] = useState('');
  const [vinculo, setVinculo] = useState('ESTUDANTE_REGULAR');
  const [serie, setSerie] = useState('');
  const [turma, setTurma] = useState('');
  const [cidadeNatal] = useState('Seabra');
  const [localizacaoMoradia] = useState('Sede de Seabra');
  const [corRaca] = useState('Parda');
  const [origemFamilia] = useState('Mista / Diversa');
  const [sofreuPreconceito, setSofreuPreconceito] = useState('Não');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { count, error } = await supabase
          .from('censo_respostas')
          .select('*', { count: 'exact', head: true });

        if (!error && count !== null) {
          setStats(prev => ({ ...prev, totalColetas: count }));
        }

        const { data: recentes } = await supabase
          .from('censo_respostas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentes) {
          setAtividadesRecentes(recentes);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setFetchingData(false);
      }
    }

    void fetchDashboardData();
  }, []);

  const handleLikeProfile = () => {
    if (hasLiked) {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from('censo_respostas').insert([
        {
          user_id: profile.id,
          interviewer_name: profile.name,
          nome_participante: nomeParticipante,
          contato_whatsapp: contatoWhatsapp,
          genero,
          vinculo,
          serie,
          turma,
          grupo_escolar: `${serie} - ${turma}`.trim(),
          cidade_natal: cidadeNatal,
          local_moradia: localizacaoMoradia,
          cor_raca: corRaca,
          origem_familia: origemFamilia,
          sofreu_preconceito: sofreuPreconceito,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;

      setSuccess(true);
      setNomeParticipante('');
      setContatoWhatsapp('');
      setGenero('');
      setSerie('');
      setTurma('');
      
      setTimeout(() => {
        setSuccess(false);
        setShowModalColeta(false);
        window.location.reload();
      }, 2500);
    } catch (err: any) {
      console.error('Erro ao salvar no Supabase:', err);
      setErrorMsg(err.message || 'Erro ao registrar os dados.');
    } finally {
      setLoading(false);
    }
  };

  // Variável isolada para evitar ternários aninhados no JSX
  let likeButtonClasses = 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25';
  if (hasLiked) {
    likeButtonClasses = 'bg-rose-500 text-white';
  }

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500 pb-16 px-4 sm:px-6">
      <div className="w-full max-w-6xl space-y-6">

        {/* 1. CABEÇALHO UNIFICADO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <UserAvatar genero={profile.genero} name={profile.name} className="w-20 h-20 shadow-md border-2 border-white dark:border-slate-800" />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-3.5 py-1 rounded-full border border-blue-100 dark:border-blue-800 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" /> Censo CEEP • CEEPES
                </span>

                <button
                  type="button"
                  onClick={handleLikeProfile}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer border border-rose-200 dark:border-rose-900 ${likeButtonClasses}`}
                  title="Curtidas recebidas no seu perfil público"
                >
                  <Heart className="h-4 w-4 fill-current" />
                  <span>{likesCount}</span>
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Bem-vindo(a), {profile.name}! ✨
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                {profile.cargo || 'Pesquisador(a) Científico'} • CEEP Seabra & Região da Chapada Diamantina
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowModalColeta(true)}
            className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center gap-2 text-xs transition cursor-pointer border-0 shrink-0"
          >
            <Plus className="w-4 h-4" /> Nova Ficha de Coleta
          </button>
        </div>

        {/* 2. ALERTA */}
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-4 sm:px-6 flex items-center justify-between gap-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">Atenção: Pesquisa em Andamento</h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">Continue realizando as entrevistas de campo com rigor metodológico na comunidade escolar do CEEP Seabra.</p>
            </div>
          </div>
        </div>

        {/* 3. ESTATÍSTICAS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" /> Seu Mês em Números (Censo CEEP)
            </h3>
            <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md">
              Tempo Real
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Entrevistas Registradas</span>
              <strong className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.totalColetas}</strong>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fichas Validadas</span>
              <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.alunosValidados}</strong>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Turmas Atendidas</span>
              <strong className="text-2xl font-black text-indigo-600 dark:text-indigo-400">18</strong>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Taxa de Sucesso</span>
              <strong className="text-2xl font-black text-teal-600 dark:text-teal-400">98%</strong>
            </div>
          </div>
        </div>

        {/* 4. DASHBOARD DE GRÁFICOS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Distribuições Científicas por Gênero e Raça
            </h3>
          </div>
          <AnalyticsDashboard />
        </div>

        {/* 5. ATIVIDADES RECENTES */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" /> Atividades Recentes de Coleta
            </h3>
            <span className="text-xs font-bold text-blue-600">Sincronizado com Supabase</span>
          </div>

          {fetchingData ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse font-semibold">Carregando registos recentes...</div>
          ) : atividadesRecentes.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">Nenhuma ficha registrada ainda. Clique em "Nova Ficha de Coleta" acima!</div>
          ) : (
            <div className="space-y-3">
              {atividadesRecentes.map((item) => (
                <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl">
                      <CheckCircle className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.nome_participante}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Turma: {item.grupo_escolar || 'Não informada'} • Entrevistador(a): {item.interviewer_name}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODAL DE NOVA FICHA */}
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
                  <p className="text-xs text-slate-400 font-medium">Pesquisador(a) responsável: {profile.name}</p>
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
                    <h4 className="font-black text-sm uppercase">🏆 Ficha Salva com Sucesso!</h4>
                    <p className="text-xs text-emerald-700 font-medium">Os dados foram computados e sincronizados com o Supabase.</p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800">
                  <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
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
                        placeholder="Nome completo..."
                        value={nomeParticipante}
                        onChange={(e) => setNomeParticipante(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      />
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
                      <label htmlFor="modal-vinculo" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Vínculo</label>
                      <select
                        id="modal-vinculo"
                        value={vinculo}
                        onChange={(e) => setVinculo(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="ESTUDANTE_REGULAR">Estudante (Regular)</option>
                        <option value="ESTUDANTE_TECNICO">Estudante (Técnico)</option>
                        <option value="PROFESSOR">Professor(a)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="modal-serie" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Série / Ano</label>
                      <input
                        id="modal-serie"
                        type="text"
                        required
                        placeholder="Ex: 3º Ano Técnico"
                        value={serie}
                        onChange={(e) => setSerie(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="modal-turma" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Turma</label>
                      <input
                        id="modal-turma"
                        type="text"
                        required
                        placeholder="Ex: Informática A"
                        value={turma}
                        onChange={(e) => setTurma(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Bloco 2: Localização Geográfica</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modal-cidade-natal" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Cidade Natal</label>
                      <input
                        id="modal-cidade-natal"
                        type="text"
                        value={cidadeNatal}
                        onChange={(e) => setCidadeNatal(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="modal-moradia" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Local de Moradia</label>
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
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Bloco 3: Autodeclaração e Origem</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="modal-cor-raca" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Cor ou Raça (IBGE)</label>
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
                      </select>
                    </div>

                    <div>
                      <label htmlFor="modal-origem-familia" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Origem Familiar</label>
                      <select
                        id="modal-origem-familia"
                        value={origemFamilia}
                        onChange={(e) => setOrigemFamilia(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none"
                      >
                        <option value="Predominantemente Negra">Predominantemente Negra</option>
                        <option value="Predominantemente Branca">Predominantemente Branca</option>
                        <option value="Mista / Diversa">Mista / Diversa</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Bloco 4: Percepção Social</h3>
                  <div>
                    <label htmlFor="modal-preconceito" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Já sofreu preconceito?</label>
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
                    disabled={loading}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer border-0"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Salvar Ficha do Censo</>}
                  </button>
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Home;