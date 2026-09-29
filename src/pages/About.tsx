import React from 'react';
import { BookOpen, ShieldCheck, Cpu, Award, Sparkles } from 'lucide-react';

interface AboutProps {
  readonly escolaNome?: string;
}

export const About: React.FC<AboutProps> = ({ escolaNome = "CEEP Seabra" }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-16 font-sans">
      
      {/* HERO SECTION */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[32px] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3.5 py-1.5 bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider rounded-full border border-white/30 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Projeto de Pesquisa Científica Ada Lovelace
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Sobre o Censo CEEP
          </h1>
          <p className="text-sm md:text-base text-blue-100 font-medium leading-relaxed">
            Plataforma tecnológica desenvolvida no {escolaNome} para mapeamento de dados demográficos, vivências étnico-raciais e pertencimento na comunidade escolar com total sigilo e rigor metodológico.
          </p>
        </div>
      </div>

      {/* PILARES DO PROJETO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="agora-card space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800">Sigilo e LGPD</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Coleta 100% anônima baseada em autodeclaração, sem armazenamento de identificadores diretos dos participantes.
          </p>
        </div>

        <div className="agora-card space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800">Arquitetura Híbrida</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Integração avançada com Supabase e IA (Adinha) orientada por 8 núcleos de conhecimento metodológico e estatístico.
          </p>
        </div>

        <div className="agora-card space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800">Diretrizes do IBGE</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Padronização oficial nas categorias de cor ou raça, respeitando a autonomia individual na autodeclaração.
          </p>
        </div>
      </div>

      {/* DETALHAMENTO DOS 8 NÚCLEOS DA ADINHA */}
      <div className="agora-card space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Os 8 Núcleos de Orientação da Assistente Adinha
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            A mascote do projeto atua como orientadora metodológica, dividindo sua base em frentes conceituais e analíticas:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">1. Projeto e Objetivos</strong>
            <span className="text-slate-600">Explicação clara da finalidade institucional e acadêmica do Censo.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">2. Cor, Raça e Autodeclaração</strong>
            <span className="text-slate-600">Esclarece as categorias do IBGE sem jamais tentar definir a raça de terceiros.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">3. Conceitos Fundamentais</strong>
            <span className="text-slate-600">Aborda racismo estrutural, preconceito, discriminação, colorismo e etnicidade.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">4. Situações Práticas</strong>
            <span className="text-slate-600">Contextualiza vivências cotidianas de forma neutra e pedagógica.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">5. Ajuda no Preenchimento</strong>
            <span className="text-slate-600">Orienta sobre o significado dos itens do formulário sem induzir respostas.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">6. Privacidade e LGPD</strong>
            <span className="text-slate-600">Garante total transparência sobre o armazenamento seguro e anonimizado.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">7. Acolhimento Institucional</strong>
            <span className="text-slate-600">Apóia com empatia e indica os canais pedagógicos de suporte da escola.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">8. Estatísticas Agregadas</strong>
            <span className="text-slate-600">Consulta via API dados consolidados em tempo real direto do Supabase.</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default About;