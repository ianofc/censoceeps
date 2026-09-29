import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Importação correta de todas as expressões oficiais da Adinha
const adinhasFrente = new URL('../assets/imgs/adinhafrente.png', import.meta.url).href;
const adinhaApaixonada = new URL('../assets/imgs/adinhaexpressaoapaixonada-1.png', import.meta.url).href;
const adinhaConfusa = new URL('../assets/imgs/adinhaexpressaoconfusa.png', import.meta.url).href;
const adinhaCuriosa = new URL('../assets/imgs/adinhaexpressaocuriosa.png', import.meta.url).href;
const adinhaEmpolgada = new URL('../assets/imgs/adinhaexpressaoempolgada.png', import.meta.url).href;
const adinhaFeliz = new URL('../assets/imgs/adinhaexpressaofeliz.png', import.meta.url).href;
const adinhaIrritada = new URL('../assets/imgs/adinhaexpressaoirritada.png', import.meta.url).href;
const adinhaPensativa = new URL('../assets/imgs/adinhaexpressaopensativa.png', import.meta.url).href;
const adinhaSurpresa = new URL('../assets/imgs/adinhaexpressaosurpresa.png', import.meta.url).href;
const adinhaIdeia = new URL('../assets/imgs/adinhaideia.png', import.meta.url).href;
const adinhaLendo = new URL('../assets/imgs/adinhalendo.png', import.meta.url).href;

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

  const handleSend = async (e: React.FormEvent) => {
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

    setTimeout(async () => {
      let reply = "Estou a analisar a sua dúvida com base nas diretrizes do Censo CEEP...";
      let poseResponse: AdinhaPose = 'curiosa';
      const lower = userText.toLowerCase();

      if (lower.includes('objetivo') || lower.includes('quem realiza') || lower.includes('projeto')) {
        reply = "O Censo CEEP integra o Projeto Ada Lovelace no CEEP Seabra, mapeando de forma anônima e voluntária dados demográficos e vivências para melhorias pedagógicas.";
        poseResponse = 'empolgada';
      } else if (lower.includes('autodeclaração') || lower.includes('moreno') || lower.includes('cor ou raça') || lower.includes('ibge')) {
        reply = "A autodeclaração é um direito individual e exclusivo da própria pessoa, seguindo as categorias do IBGE (Branca, Preta, Parda, Amarela ou Indígena). Eu não determino raças.";
        poseResponse = 'pensativa';
      } else if (lower.includes('racismo') || lower.includes('preconceito') || lower.includes('colorismo') || lower.includes('discriminação')) {
        reply = "Racismo é um sistema estrutural de opressão; preconceito envolve julgamentos prévios e discriminação é a prática de tratamento desigual. Conceitos fundamentais em nossa pesquisa!";
        poseResponse = 'lendo';
      } else if (lower.includes('o que significa') || lower.includes('como preencher') || lower.includes('duvida')) {
        reply = "As perguntas captam suas percepções reais. Posso explicar a teoria por trás dos termos, mas a escolha da resposta é estritamente pessoal e voluntária.";
        poseResponse = 'ideia';
      } else if (lower.includes('lgpd') || lower.includes('privacidade') || lower.includes('sigilo') || lower.includes('anonimato')) {
        reply = "Sua participação é totalmente sigilosa e voluntária. Os dados são anonimizados e usados exclusivamente para fins estatísticos e educacionais, em total conformidade com a LGPD.";
        poseResponse = 'feliz';
      } else if (lower.includes('sofreu') || lower.includes('ajuda') || lower.includes('denúncia')) {
        reply = "Lamento muito por essa vivência. O Censo CEEP preza por um ambiente seguro e respeitoso. A instituição dispõe de canais de orientação pedagógica e apoio institucional.";
        poseResponse = 'apaixonada';
      } else if (lower.includes('quantas pessoas') || lower.includes('quantos') || lower.includes('estatística') || lower.includes('percentual')) {
        try {
          const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true });
          reply = `Até o momento, o Censo CEEP registrou ${count || 0} respostas válidas coletadas em campo! Veja os percentuais detalhados no Dashboard de Indicadores.`;
          poseResponse = 'surpresa';
        } catch {
          reply = "O termômetro de coletas está ativo na página inicial com os dados agregados da escola.";
          poseResponse = 'curiosa';
        }
      }

      setCurrentPose(poseResponse);
      
      const adinhaMessage: Message = {
        id: `adinha-${Date.now()}`,
        sender: 'adinha',
        text: reply,
        pose: poseResponse
      };

      setMessages(prev => [...prev, adinhaMessage]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* BOTÃO FLUTUANTE DA MASCOTE */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-2xl shadow-blue-500/40 hover:scale-110 transition-transform cursor-pointer border-0 flex items-center justify-center"
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
        <div className="w-[92vw] sm:w-[400px] h-[540px] bg-white border border-slate-200 rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
          
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
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
            <button 
              type="button"
              onClick={() => setInput("O que é autodeclaração?")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[11px] font-bold rounded-xl whitespace-nowrap transition border-0 cursor-pointer shadow-sm"
            >
              👤 Autodeclaração
            </button>
            <button 
              type="button"
              onClick={() => setInput("Quantas pessoas participaram?")}
              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 text-[11px] font-bold rounded-xl whitespace-nowrap transition border-0 cursor-pointer shadow-sm"
            >
              📊 Estatísticas Coletadas
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