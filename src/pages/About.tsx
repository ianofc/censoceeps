import React from 'react';
import { BookOpen, ShieldCheck, Cpu, Award, Sparkles, Scale, Download } from 'lucide-react';
import cartilhaPdf from '../assets/docs/Cartilha_Censo_Escolar_Ada_Lovelace_CEEP_Seabra.pdf';

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
            Plataforma tecnológica desenvolvida no {escolaNome} para mapeamento de dados demográficos, vivências e percepção social na comunidade escolar com total sigilo e rigor metodológico.
          </p>

          <div className="pt-2">
            <a 
              href={cartilhaPdf} 
              download="Cartilha_Censo_Escolar_Ada_Lovelace_CEEP_Seabra.PDF"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Baixar Cartilha Oficial (PDF)
            </a>
          </div>
        </div>
      </div>

      {/* MANIFESTO INSTITUCIONAL: CIÊNCIA, LEI E CONVIVÊNCIA */}
      <div className="agora-card space-y-6">
        <div className="border-b border-slate-200 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Princípios e Fundamentos Metodológicos</h2>
            <p className="text-xs text-slate-500 font-medium">Equíbrio, altivez cívica e respeito estrito à Constituição Federal de 1988.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-3 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> O Espírito Analítico
            </h3>
            <p>
              Inspirado no legado de Ada Lovelace — que enxergava o mundo através da lógica, dos padrões e da busca intransigente pela verdade factual —, o censo recusa visões panfletárias. Nosso papel científico é radiografar com exatidão estatística a realidade, transformando dados empíricos em conhecimento útil para a melhoria do clima institucional.
            </p>
          </div>

          <div className="space-y-3 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> O Pacto Republicano
            </h3>
            <p>
              Sob a égide da Constituição de 1988, todos os cidadãos possuem igual dignidade perante a lei, independentemente de raça, cor, gênero ou condição social. O projeto valoriza a autonomia e a responsabilidade individual, educando os jovens para a altivez cívica e para o uso altivo e legal dos direitos e deveres.
            </p>
          </div>

          <div className="space-y-3 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span> Urbanidade e Respeito Mútuo
            </h3>
            <p>
              A convivência coletiva exige civilidade e decoro em via de mão dupla. Seja no trato profissional entre servidores e alunos ou na preservação de espaços comuns e privativos, o respeito aos limites alheios combate-se com diálogo franco, orientação pedagógica constante e exigência de urbanidade para todos.
            </p>
          </div>

          <div className="space-y-3 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Para Além dos Muros
            </h3>
            <p>
              O que se pratica no CEEP reflete-se na sociedade da Chapada Diamantina. O projeto fornece à gestão evidências sólidas para subsidiar decisões administrativas, unindo esforços na construção de uma escola mais segura, ordeira, justa e profundamente humana.
            </p>
          </div>
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
            Coleta anônima baseada em autodeclaração e proteção estrita à privacidade dos participantes.
          </p>
        </div>

        <div className="agora-card space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800">Arquitetura Híbrida</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Integração avançada com Supabase e IA orientada por núcleos de conhecimento metodológico e estatístico.
          </p>
        </div>

        <div className="agora-card space-y-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800">Diretrizes do IBGE</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Padronização oficial nas categorias censitárias, respeitando a liberdade e a individualidade.
          </p>
        </div>
      </div>

      {/* DETALHAMENTO DOS NÚCLEOS DA ADINHA */}
      <div className="agora-card space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Núcleos de Orientação da Assistente Adinha
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
            <span className="text-slate-600">Esclarece as categorias do IBGE respeitando a autonomia individual.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">3. Conceitos Fundamentais</strong>
            <span className="text-slate-600">Aborda cidadania, respeito institucional, leis e convivência ética.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">4. Situações Práticas</strong>
            <span className="text-slate-600">Contextualiza vivências cotidianas de forma neutra e pedagógica.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">5. Ajuda no Preenchimento</strong>
            <span className="text-slate-600">Orienta sobre o significado dos itens do formulário com total imparcialidade.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">6. Privacidade e LGPD</strong>
            <span className="text-slate-600">Garante total transparência sobre o armazenamento seguro e anonimizado.</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <strong className="text-slate-800 font-bold block">7. Acolhimento Institucional</strong>
            <span className="text-slate-600">Apóia com ética e indica os canais pedagógicos de suporte da escola.</span>
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