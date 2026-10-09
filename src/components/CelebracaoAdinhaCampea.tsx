import React, { useState } from 'react';
import { useCelebracaoMeta20 } from '../hooks/useCelebracaoMeta20';
import { useUserSession } from '../hooks/useUserSession';
import { UserAvatar } from './UserAvatar';
import {
  Trophy, Award, Sparkles, Share2, Download, Check, X,
  ShieldCheck, Star, PartyPopper
} from 'lucide-react';

const adinhaVencedora = new URL('../assets/imgs/adinhavencedora.png', import.meta.url).href;
const adinhaCoroa = new URL('../assets/imgs/adinhacabelocoroa.png', import.meta.url).href;

interface CelebracaoAdinhaCampeaProps {
  readonly isOpenOverride?: boolean;
  readonly onCloseOverride?: () => void;
}

export const CelebracaoAdinhaCampea: React.FC<CelebracaoAdinhaCampeaProps> = ({
  isOpenOverride,
  onCloseOverride,
}) => {
  const { profile } = useUserSession();
  const {
    isOpen: hookIsOpen,
    closeCelebration: hookCloseCelebration,
    dispararConfetes,
    compartilharNoFeed,
    baixarCertificadoPdf,
    copiarTextoCompartilhamento,
    isSharing,
    sharedSuccess,
  } = useCelebracaoMeta20();

  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Permite controle via hook global ou via props manuais
  const isModalOpen = isOpenOverride !== undefined ? isOpenOverride : hookIsOpen;
  const handleClose = onCloseOverride || hookCloseCelebration;

  if (!isModalOpen) return null;

  const nomeAluno = profile?.nomeCompleto || 'Pesquisador(a) Nota 10';
  const primeiroNome = nomeAluno.split(' ')[0];
  const turmaAluno = profile?.turmaOuCargo || 'Comunidade Escolar CEEP';
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const handleCopy = async () => {
    const ok = await copiarTextoCompartilhamento();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleDownloadPdf = () => {
    baixarCertificadoPdf();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3500);
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      {/* Botão de Fechar no Canto Superior */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Fechar celebração"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 p-2.5 rounded-full backdrop-blur transition cursor-pointer z-50 border border-white/10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Conteúdo Principal do Modal */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-white via-amber-50/25 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-2 border-amber-400/80 dark:border-amber-500/50 rounded-3xl shadow-2xl p-6 sm:p-8 text-center overflow-hidden my-auto">
        
        {/* Efeitos de Iluminação de Fundo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/25 dark:bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Faixa / Badge Superior */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md shadow-amber-500/20 mb-4 animate-pulse">
          <Trophy className="w-4 h-4 fill-slate-950" />
          <span>Missão Cumprida: Adinha Campeã</span>
          <Sparkles className="w-4 h-4" />
        </div>

        {/* Mascote Adinha Campeã com Efeito Flutuante e Glow */}
        <div className="relative flex flex-col items-center justify-center my-2">
          {/* Círculo de Luz Dourada */}
          <div className="absolute w-44 h-44 rounded-full bg-gradient-to-tr from-amber-400/30 via-yellow-300/40 to-transparent blur-xl animate-pulse" />
          
          {/* Imagem da Mascote */}
          <div className="relative z-10">
            <img
              src={adinhaVencedora}
              alt="Adinha Campeã Vencedora"
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback gracioso se a imagem não carregar
                e.currentTarget.src = adinhaCoroa;
              }}
            />
            {/* Medalha / Troféu Flutuante */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-2.5 rounded-2xl shadow-lg border-2 border-white dark:border-slate-800 flex items-center justify-center rotate-6">
              <Award className="w-5 h-5 text-slate-950" />
            </div>
          </div>
        </div>

        {/* Mensagem Motivacional Personalizada */}
        <div className="space-y-2 mt-4">
          <h2 id="celebration-title" className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Parabéns, {primeiroNome}! 🎉
          </h2>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-semibold max-w-lg mx-auto leading-relaxed">
            Você concluiu suas <span className="text-amber-600 dark:text-amber-400 font-black">20 entrevistas</span> e ajudou a mapear o futuro do <span className="text-indigo-600 dark:text-indigo-400 font-black">CEEP Seabra</span>!
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Seu protagonismo científico na pesquisa Ada Lovelace fortalece toda a comunidade escolar na Chapada Diamantina.
          </p>
        </div>

        {/* Card de Vitória Compartilhável (Estilo Mini-Certificado) */}
        <div className="mt-6 mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-purple-50/50 dark:from-slate-800/80 dark:via-slate-850 dark:to-slate-800/80 border-2 border-amber-300/80 dark:border-amber-500/40 shadow-inner relative text-left overflow-hidden">
          {/* Marca d'água de Fundo */}
          <div className="absolute -right-4 -bottom-6 opacity-10 pointer-events-none">
            <Trophy className="w-36 h-36 text-amber-600" />
          </div>

          <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-slate-700 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  CEEP Seabra • Censo Escolar
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Cartão Oficial de Conquista Científica
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black bg-emerald-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
              20/20 Coletas
            </span>
          </div>

          <div className="flex items-center gap-4">
            <UserAvatar 
              genero={profile?.genero} 
              name={nomeAluno} 
              className="w-14 h-14 border-2 border-amber-400 shadow-md shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                {nomeAluno}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                {turmaAluno} • Pesquisador(a) Ada Lovelace
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Top Entrevistador(a)
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  Data: {dataHoje}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grade de Botões de Ação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          
          {/* Botão 1: Compartilhar no Feed do Censo */}
          <button
            type="button"
            onClick={() => void compartilharNoFeed()}
            disabled={isSharing || sharedSuccess}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer border-0 shadow-lg ${
              sharedSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-indigo-600/30'
            }`}
          >
            {sharedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Publicado no Feed da Escola!</span>
              </>
            ) : isSharing ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Publicando no Feed...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Compartilhar no Feed do Censo</span>
              </>
            )}
          </button>

          {/* Botão 2: Baixar Certificado Oficial em PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="w-full py-3.5 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer border-0 shadow-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-amber-500/25"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Certificado Baixado com Sucesso!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Certificado Oficial (PDF)</span>
              </>
            )}
          </button>

          {/* Botão 3: Copiar para WhatsApp / Stories */}
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Texto copiado para WhatsApp!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copiar Texto para WhatsApp / Redes</span>
              </>
            )}
          </button>

          {/* Botão 4: Disparar Mais Confetes */}
          <button
            type="button"
            onClick={dispararConfetes}
            className="w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          >
            <PartyPopper className="w-4 h-4 text-amber-500" />
            <span>Jogar Mais Confetes! 🎉</span>
          </button>

        </div>

        {/* Rodapé: Botão Concluir / Continuar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition py-2 px-4 rounded-xl cursor-pointer bg-transparent border-0"
          >
            Continuar Navegando na Plataforma
          </button>
        </div>

      </div>
    </div>
  );
};
