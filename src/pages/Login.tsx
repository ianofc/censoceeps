import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Landmark, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';

// Resolução correta e exata do nome do arquivo AdaLovelace.png na pasta assets/imgs
const adinhaprogramando = new URL('../assets/imgs/adinhaprogramando.png', import.meta.url).href;
const logoCenso = new URL('../assets/imgs/AdaLovelace.png', import.meta.url).href;
const bgImage = new URL('../assets/imgs/adalovelacebackground.png', import.meta.url).href;

interface LoginProps {
  readonly onLoginSuccess: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      
      {/* BACKGROUND DA TELA DE LOGIN */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat filter brightness-[0.4] scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Camada sutil de gradiente para dar profundidade */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-slate-950/80 via-blue-950/40 to-slate-900/60 pointer-events-none" />

      {/* CONTAINER PRINCIPAL RESPONSIVO */}
      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* LADO ESQUERDO: Painel da Personagem Ada Lovelace (Adinha) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          
          {/* Header da Instituição */}
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-black tracking-widest text-blue-200 uppercase">CEEP Seabra</h2>
              <p className="text-sm font-extrabold text-white">Projeto Ada Lovelace</p>
            </div>
          </div>

          {/* Ilustração Responsiva da Adinha */}
          <div className="my-8 flex flex-col items-center text-center z-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition duration-500" />
              <img
                src={adinhaprogramando}
                alt="Ada Lovelace (Adinha) Programando"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain relative z-10 drop-shadow-2xl transition-transform duration-300 hover:scale-105"
              />
            </div>
            <h3 className="text-xl font-black mt-4 text-white">Censo CEEP</h3>
            <p className="text-xs text-blue-100 font-medium max-w-xs mt-1">
              Pesquisa Científica sobre Gênero, Raça e Pertencimento na Comunidade Escolar
            </p>
          </div>

          {/* Rodapé da Ilustração */}
          <div className="flex items-center justify-between text-[11px] text-blue-200 font-bold border-t border-white/10 pt-4 z-10">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Ágora OS
            </span>
            <span>SISTEMA DE COLETA v2.0</span>
          </div>

          {/* Elemento Decorativo no Fundo do Card */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* LADO DIREITO: Formulário de Autenticação */}
        <div className="p-8 sm:p-10 flex flex-col justify-center space-y-6 bg-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img 
                src={logoCenso} 
                alt="Logo Censo CEEP" 
                className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm bg-slate-50" 
              />
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Acesso Restrito
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Entrar no Sistema</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Digite suas credenciais de coletor ou pesquisador
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold animate-in shake">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="emailInput" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                E-mail Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="emailInput"
                  type="email"
                  required
                  placeholder="pesquisador@ceep.edu.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="passwordInput" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  id="passwordInput"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Autenticar Acesso <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-400 font-medium">
            Centro Estadual de Educação Profissional de Seabra — CEEP<br />
            Grupo de Pesquisa Científica Ada Lovelace
          </p>
        </div>

      </div>
    </div>
  );
}