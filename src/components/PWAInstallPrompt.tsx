import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Download, 
  X, 
  Share2, 
  PlusSquare, 
  Sparkles, 
  Copy, 
  Check, 
  Smartphone, 
  Compass, 
  HelpCircle, 
  AlertCircle, 
  Globe, 
  ArrowDown,
  ExternalLink
} from 'lucide-react';

const adinhaAvatar = new URL('../assets/imgs/AdaLovelace.png', import.meta.url).href;
const OFFICIAL_URL = 'https://censoceeps.vercel.app/';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, hasPrompt, isInstalled, isIOS, isInApp, isSafari, triggerInstall } = usePWAInstall();
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'url' | 'android'>(isIOS ? 'ios' : 'android');
  const [copied, setCopied] = useState<boolean>(false);

  // Inicializa a aba padrão conforme o sistema detectado
  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }
  }, [isIOS]);

  // Exibe o banner discreto inicial após 1.5s
  useEffect(() => {
    const dismissedInSession = sessionStorage.getItem('pwa_prompt_dismissed');
    if (!dismissedInSession && !isInstalled && isInstallable) {
      const timer = setTimeout(() => {
        setIsBannerDismissed(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  // Listener para abrir o modal manualmente (ex: vindo de FloatingNav ou tela de Login)
  useEffect(() => {
    const handleOpenManual = () => {
      setIsBannerDismissed(true);
      setIsModalOpen(true);
    };
    window.addEventListener('open-pwa-install-modal', handleOpenManual);
    return () => window.removeEventListener('open-pwa-install-modal', handleOpenManual);
  }, []);

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleBannerAction = async () => {
    if (hasPrompt) {
      const installed = await triggerInstall();
      if (installed) {
        setIsBannerDismissed(true);
      }
    } else {
      setIsBannerDismissed(true);
      setIsModalOpen(true);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(OFFICIAL_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = OFFICIAL_URL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Censo CEEP — Projeto Ada Lovelace',
          text: 'Acesse o aplicativo oficial do Censo Escolar CEEP Seabra:',
          url: OFFICIAL_URL,
        });
      } catch {
        // Ignora cancelamento do usuário
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <>
      {/* ─── BANNER FLUTUANTE DISCRETO (SUPERIOR) ────────────────────────── */}
      {!isInstalled && !isBannerDismissed && (
        <aside 
          aria-label="Aviso de instalação do aplicativo"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9998] w-[92%] max-w-[420px] animate-in fade-in slide-in-from-top-6 duration-300"
        >
          <div className="relative bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 text-white ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <div className="shrink-0 relative">
                <img 
                  src={adinhaAvatar} 
                  alt="Ada Lovelace" 
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/50"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white font-bold ring-2 ring-slate-900">
                  <Sparkles size={10} />
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">Censo CEEP</p>
                <p className="text-[11px] text-slate-300 truncate">
                  {isIOS ? 'Instale no iPhone ou acesse offline' : 'Instale para usar em tela cheia e offline'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDismissBanner}
                aria-label="Fechar aviso"
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBannerAction}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md transition-all border-0 cursor-pointer"
              >
                <Download size={14} />
                <span>{isIOS ? 'Como Instalar no iPhone' : 'Instalar Aplicativo'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsBannerDismissed(true);
                  setActiveTab('url');
                  setIsModalOpen(true);
                }}
                title="Dificuldade com URL no Safari"
                className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Globe size={13} className="text-indigo-400" />
                <span className="hidden sm:inline">Ajuda Link</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ─── MODAL COMPLETO DE GUIA DE INSTALAÇÃO & ACESSO ───────────────── */}
      {isModalOpen && (
        <dialog 
          open
          aria-label="Guia de Instalação e Acesso"
          className="fixed inset-0 z-[9999] m-0 w-full h-full bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 border-0 animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl text-white max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header do Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-600/30">
                  <img 
                    src={adinhaAvatar} 
                    alt="Ada Lovelace" 
                    className="w-full h-full rounded-[14px] object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Censo CEEP Seabra
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                      PWA
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Guia Oficial de Instalação & Acesso Direto</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navegação por Abas */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl my-3 border border-slate-800/80 shrink-0 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
                  activeTab === 'ios' 
                    ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                    : 'bg-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone size={14} />
                <span>iPhone / iPad</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
                  activeTab === 'url' 
                    ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                    : 'bg-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Globe size={14} />
                <span>Link & Google IA</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
                  activeTab === 'android' 
                    ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                    : 'bg-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Download size={14} />
                <span>Android / PC</span>
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="overflow-y-auto pr-1 flex-1 space-y-3.5 text-xs text-slate-300">

              {/* ─── ABA 1: GUIA IPHONE / IPAD ───────────────────────────────── */}
              {activeTab === 'ios' && (
                <div className="space-y-3">
                  
                  {/* ALERTA CRÍTICO: In-App Browser (Instagram, WhatsApp, etc) */}
                  {isInApp && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>Navegador interno detectado (WhatsApp / Instagram / Google)</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-200/90">
                        A Apple <strong>não permite</strong> baixar ou adicionar aplicativos se você estiver dentro do WhatsApp, Instagram ou Google App.
                      </p>
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Como resolver:</span>
                        <span className="text-[11px] text-white">Toque nos <strong>três pontinhos (...)</strong> ou no ícone da bússola e escolha <strong>&quot;Abrir no Safari&quot;</strong>.</span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl space-y-2">
                    <p className="font-semibold text-white text-xs">
                      Por que o iPhone não baixa como no Android?
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      No sistema iOS da Apple, os aplicativos PWA não usam a App Store e não possuem botão de download direto. A instalação é feita nativamente pelo Safari através do botão <strong>Compartilhar</strong>.
                    </p>
                  </div>

                  {/* Passos Ilustrados */}
                  <div className="space-y-2.5">
                    <p className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Compass size={14} className="text-blue-400" /> Passo a Passo no Safari do iPhone:
                    </p>

                    {/* Passo 1 */}
                    <div className="flex items-start gap-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <Share2 size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">1. Toque em Compartilhar</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Na barra de ferramentas inferior do Safari no seu iPhone, toque no ícone de um <strong>quadrado com a seta apontando para cima</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Passo 2 */}
                    <div className="flex items-start gap-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <PlusSquare size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">2. Adicionar à Tela de Início</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Role o menu que abriu para baixo até encontrar e tocar na opção <strong className="text-white">&quot;Adicionar à Tela de Início&quot;</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Passo 3 */}
                    <div className="flex items-start gap-3 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Check size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">3. Confirme tocando em &quot;Adicionar&quot;</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          No canto superior direito da tela, confirme tocando em <strong className="text-white">&quot;Adicionar&quot;</strong>. Pronto! O app do Censo CEEP estará na sua tela inicial.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dica Safari Toolbar */}
                  {isSafari && (
                    <div className="p-2.5 bg-blue-950/40 border border-blue-500/30 rounded-xl text-center flex items-center justify-center gap-2 text-blue-200 text-[11px]">
                      <ArrowDown size={14} className="text-blue-400 animate-bounce" />
                      <span>O botão de compartilhar do Safari fica na barra inferior do seu iPhone</span>
                    </div>
                  )}
                </div>
              )}

              {/* ─── ABA 2: LINK & GOOGLE IA (POR QUE VAI PARA PESQUISA) ──────── */}
              {activeTab === 'url' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl space-y-1.5">
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      <HelpCircle size={15} className="text-blue-400" />
                      Por que o Safari abre a Pesquisa do Google IA?
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      No iPhone, a barra do Safari funciona tanto para <strong>digitar o endereço de um site</strong> quanto para <strong>fazer pesquisas no Google</strong>.
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Se você digitar o endereço e o corretor do iPhone colocar um espaço após o ponto (ex: <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">censoceeps. netlify...</code>) ou se você tocar na lupa de pesquisa, o iPhone envia como busca no Google com resumo de inteligência artificial.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2">
                    <p className="font-bold text-white text-xs">✅ Como entrar direto sem passar pelo Google IA:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                      <li>Use sempre o endereço completo com <strong className="text-white">https://</strong></li>
                      <li>Ao digitar no teclado do iPhone, toque no botão azul <strong className="text-blue-400">&quot;Ir&quot;</strong> (e não na sugestão com a lupa)</li>
                      <li>Ou utilize o botão abaixo para copiar o link oficial exato:</li>
                    </ol>
                  </div>

                  {/* Caixa de Ação Rápida: Copiar Link Oficial */}
                  <div className="p-3.5 bg-slate-950 border border-indigo-500/40 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider">Endereço Oficial:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check size={12} /> Seguro & Verificado
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-indigo-300 truncate select-all">
                      {OFFICIAL_URL}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border-0 cursor-pointer ${
                          copied 
                            ? 'bg-emerald-600 text-white shadow-md' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        }`}
                      >
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                        <span>{copied ? 'Link Copiado!' : 'Copiar Link Direto'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNativeShare}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                        title="Compartilhar no WhatsApp ou outros apps"
                      >
                        <Share2 size={14} />
                        <span>Compartilhar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── ABA 3: ANDROID / COMPUTADOR ────────────────────────────── */}
              {activeTab === 'android' && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl space-y-2">
                    <p className="font-semibold text-white text-xs">
                      Instalação no Android e Google Chrome:
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      No Android ou no computador com Google Chrome / Edge, a instalação pode ser feita com um único clique.
                    </p>
                  </div>

                  {hasPrompt ? (
                    <div className="p-4 bg-slate-800/80 border border-indigo-500/40 rounded-2xl text-center space-y-3">
                      <p className="text-xs text-white font-bold">Instalação nativa disponível!</p>
                      <button
                        type="button"
                        onClick={async () => {
                          const installed = await triggerInstall();
                          if (installed) setIsModalOpen(false);
                        }}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all border-0 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download size={16} />
                        <span>Instalar Aplicativo Agora</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-2">
                      <p className="font-bold text-white text-xs">Instalação manual no Chrome (Android):</p>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                        <li>Toque nos <strong className="text-white">três pontinhos (⋮)</strong> no canto superior direito do Chrome.</li>
                        <li>Toque em <strong className="text-white">&quot;Instalar aplicativo&quot;</strong> ou <strong className="text-white">&quot;Adicionar à tela inicial&quot;</strong>.</li>
                        <li>Confirme para finalizar.</li>
                      </ol>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
                    </button>
                    <a
                      href={OFFICIAL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 no-underline cursor-pointer"
                    >
                      <ExternalLink size={14} />
                      <span>Abrir</span>
                    </a>
                  </div>
                </div>
              )}

            </div>

            {/* Footer do Modal */}
            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between shrink-0 text-[11px] text-slate-400">
              <span>Projeto Ada Lovelace • CEEP</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border-0 cursor-pointer font-medium"
              >
                Fechar
              </button>
            </div>

          </div>
        </dialog>
      )}
    </>
  );
};
