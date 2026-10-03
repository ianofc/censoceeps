import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

import adinhasFrente from '../assets/imgs/adinhafrente.png';
import adinhaApaixonada from '../assets/imgs/adinhaexpressaoapaixonada-1.png';
import adinhaConfusa from '../assets/imgs/adinhaexpressaoconfusa.png';
import adinhaCuriosa from '../assets/imgs/adinhaexpressaocuriosa.png';
import adinhaEmpolgada from '../assets/imgs/adinhaexpressaoempolgada.png';
import adinhaFeliz from '../assets/imgs/adinhaexpressaofeliz.png';
import adinhaIrritada from '../assets/imgs/adinhaexpressaoirritada.png';
import adinhaPensativa from '../assets/imgs/adinhaexpressaopensativa.png';
import adinhaSurpresa from '../assets/imgs/adinhaexpressaosurpresa.png';
import adinhaIdeia from '../assets/imgs/adinhaideia.png';
import adinhaLendo from '../assets/imgs/adinhalendo.png';

type AdinhaPose = 
  | 'frente' 
  | 'apaixonada' 
  | 'confusa' 
  | 'curiosa' 
  | 'empolgada' 
  | 'feliz' 
  | 'irritada' 
  | 'pensativa' 
  | 'surpresa' 
  | 'ideia' 
  | 'lendo';

interface Message {
  readonly id: string;
  readonly sender: 'user' | 'adinha';
  readonly text: string;
  readonly pose?: AdinhaPose;
}

export const AdinhaAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [currentPose, setCurrentPose] = useState<AdinhaPose>('feliz');
  const [isTyping, setIsTyping] = useState(false);
  
  const [messages, setMessages] = useState<readonly Message[]>([
    {
      id: 'msg-initial',
      sender: 'adinha',
      text: 'Olá! Sou a Adinha, orientadora metodológica do Censo CEEP. Como posso ajudar você hoje com os conceitos ou estatísticas?',
      pose: 'empolgada'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getPoseImage = (pose?: AdinhaPose) => {
    switch (pose) {
      case 'apaixonada': return adinhaApaixonada;
      case 'confusa': return adinhaConfusa;
      case 'curiosa': return adinhaCuriosa;
      case 'empolgada': return adinhaEmpolgada;
      case 'feliz': return adinhaFeliz;
      case 'irritada': return adinhaIrritada;
      case 'pensativa': return adinhaPensativa;
      case 'surpresa': return adinhaSurpresa;
      case 'ideia': return adinhaIdeia;
      case 'lendo': return adinhaLendo;
      default: return adinhasFrente;
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setIsTyping(true);
    setCurrentPose('lendo');

    setTimeout(async () => {
      let reply = "Hum, essa é uma ótima pergunta! Estou a analisar a sua dúvida com base nas diretrizes do Censo CEEP...";
      let poseResponse: AdinhaPose = 'curiosa';
      const lower = userText.toLowerCase();

      if (lower.includes('objetivo') || lower.includes('quem realiza') || lower.includes('projeto') || lower.includes('serve')) {
        reply = "O Censo CEEP é o coração do Projeto Ada Lovelace! Mapeamos dados demográficos e vivências para construir um ambiente escolar mais seguro e igualitário para todos nós.";
        poseResponse = 'empolgada';
      } else if (lower.includes('autodeclaração') || lower.includes('moreno') || lower.includes('cor') || lower.includes('raça') || lower.includes('ibge')) {
        reply = "A autodeclaração é um direito seu! Usamos as categorias oficiais do IBGE: Branca, Preta, Parda, Amarela ou Indígena. Não existe 'certo ou errado', apenas como você se identifica.";
        poseResponse = 'pensativa';
      } else if (lower.includes('racismo') || lower.includes('preconceito') || lower.includes('colorismo') || lower.includes('discriminação') || lower.includes('violência')) {
        reply = "Racismo é estrutural, preconceito é o julgamento prévio, e discriminação é a ação de excluir ou oprimir. Estamos coletando dados sobre isso justamente para combater essas violências na escola!";
        poseResponse = 'irritada';
      } else if (lower.includes('o que significa') || lower.includes('como preencher') || lower.includes('duvida')) {
        reply = "Se tiver dúvidas sobre algum termo na ficha de coleta, pode me perguntar! Meu objetivo é garantir que todas as suas respostas reflitam exatamente o que você sente.";
        poseResponse = 'ideia';
      } else if (lower.includes('lgpd') || lower.includes('privacidade') || lower.includes('sigilo') || lower.includes('anonimato')) {
        reply = "Pode ficar tranquilo(a)! A sua participação é 100% anônima e sigilosa. Todos os dados são protegidos e usados apenas para gerar estatísticas gerais, seguindo à risca a LGPD.";
        poseResponse = 'feliz';
      } else if (lower.includes('sofreu') || lower.includes('ajuda') || lower.includes('denúncia') || lower.includes('medo')) {
        reply = "Sinto muito se você passou por isso. O CEEP preza por um ambiente seguro. Procure a coordenação pedagógica, não tenha medo de falar. Estamos aqui para te acolher!";
        poseResponse = 'apaixonada';
      } else if (lower.includes('quantas pessoas') || lower.includes('quantos') || lower.includes('estatística') || lower.includes('percentual') || lower.includes('dados')) {
        try {
          const { count } = await supabase.from('entrevistas').select('*', { count: 'exact', head: true });
          reply = `Uau! Já registramos ${count || 0} formulários válidos coletados! Você pode ver todos os gráficos em tempo real no Ranking e Dashboard.`;
          poseResponse = 'surpresa';
        } catch {
          reply = "Os números estão crescendo! Você pode acompanhar o termômetro de coletas diretamente na página de Ranking.";
          poseResponse = 'curiosa';
        }
      } else if (lower.includes('jornal') || lower.includes('mercúrio') || lower.includes('notícia') || lower.includes('feed')) {
        reply = "Ah, O Mercúrio! É o nosso jornal com curadoria algorítmica. Ele traz notícias focadas em educação, ciência e questões sociais, ignorando polêmicas de ódio!";
        poseResponse = 'feliz';
      } else if (lower.includes('lyka') || lower.includes('chat') || lower.includes('conversa')) {
        reply = "O LykaChat foi inspirado na cadelinha espacial Laika! Lá você pode trocar mensagens, fixar seus colegas favoritos, mandar áudios e se comunicar em tempo real.";
        poseResponse = 'empolgada';
      } else if (lower.includes('oi') || lower.includes('olá') || lower.includes('bom dia') || lower.includes('boa tarde')) {
        reply = "Olá! É muito bom falar com você! Sou a Adinha, orientadora da pesquisa. O que gostaria de saber sobre o Censo ou sobre o Projeto Ada Lovelace?";
        poseResponse = 'feliz';
      }

      setCurrentPose(poseResponse);
      setIsTyping(false);
      
      const adinhaMessage: Message = {
        id: `adinha-${Date.now()}`,
        sender: 'adinha',
        text: reply,
        pose: poseResponse
      };

      setMessages(prev => [...prev, adinhaMessage]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 font-sans">
      
      {/* BOTÃO FLUTUANTE DA MASCOTE */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-2xl shadow-blue-500/40 hover:scale-110 transition-transform cursor-pointer border-0 flex items-center justify-center"
          title="Falar com a Adinha"
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
            <img 
              src={adinhasFrente} 
              alt="Mascote Adinha" 
              className="w-full h-full object-cover object-top scale-100"
            />
          </div>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
          
          <div className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
            Orientadora Metodológica — Adinha 👋
          </div>
        </button>
      )}

      {/* JANELA DO CHAT REFINADA */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[400px] h-[500px] md:h-[540px] bg-white border border-slate-200 rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 absolute bottom-0 right-0 md:static">
          
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                <img 
                  src={getPoseImage(currentPose)} 
                  alt="Expressão Adinha" 
                  className="w-full h-full object-cover object-top scale-100"
                />
              </div>
              <div>
                <h3 className="font-black text-sm flex items-center gap-1.5">
                  Adinha <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[10px] text-blue-100 font-medium">Orientadora de Pesquisa — Censo CEEP</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer border-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'adinha' && (
                  <div className="w-9 h-9 rounded-full border border-blue-200 overflow-hidden bg-white shrink-0 shadow-sm flex items-center justify-center mb-1">
                    <img 
                      src={getPoseImage(msg.pose)} 
                      alt="Adinha" 
                      className="w-full h-full object-cover object-top scale-100"
                    />
                  </div>
                )}
                
                <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-end gap-2.5 justify-start animate-in fade-in">
                <div className="w-9 h-9 rounded-full border border-blue-200 overflow-hidden bg-white shrink-0 shadow-sm flex items-center justify-center mb-1">
                  <img 
                    src={getPoseImage('lendo')} 
                    alt="Adinha pensando" 
                    className="w-full h-full object-cover object-top scale-100"
                  />
                </div>
                <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5 h-[42px]">
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 shadow-sm">
            <button 
              type="button"
              onClick={() => setInput("O que é autodeclaração?")}
              className="px-3.5 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-full whitespace-nowrap transition border border-slate-200 cursor-pointer shadow-sm"
            >
              👤 Autodeclaração
            </button>
            <button 
              type="button"
              onClick={() => setInput("Qual o objetivo do censo?")}
              className="px-3.5 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-full whitespace-nowrap transition border border-slate-200 cursor-pointer shadow-sm"
            >
              🎯 Objetivo
            </button>
            <button 
              type="button"
              onClick={() => setInput("Quantas pessoas já participaram?")}
              className="px-3.5 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold rounded-full whitespace-nowrap transition border border-slate-200 cursor-pointer shadow-sm"
            >
              📊 Estatísticas
            </button>
          </div>

          <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2.5 shrink-0">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Consulte a Adinha sobre o censo..."
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:bg-white focus:border-blue-600 outline-none transition"
            />
            <button 
              type="submit"
              className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/25 transition cursor-pointer border-0 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

export default AdinhaAssistant;