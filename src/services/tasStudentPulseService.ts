/**
 * tasStudentPulseService.ts
 * Motor de Pulso e Escuta Ativa Estudantil do Censo CEEP
 * Projeto Científico Ada Lovelace — CEEP Seabra
 * 
 * Permite coletar opiniões corriqueiras dos alunos através de micro-enquetes temáticas,
 * termômetro de sentimento e caixas de sugestão rápida para retroalimentar o algoritmo TAS.
 */

export interface StudentPollOption {
  id: string;
  text: string;
  icon?: string;
  baseVotes: number;
  categoryTag: string; // ex: 'infraestrutura', 'cursos', 'merenda', 'transporte', 'ciencias'
}

export interface StudentPoll {
  id: string;
  category: 'infraestrutura' | 'cursos' | 'merenda' | 'transporte' | 'ciencias' | 'saude_mental';
  title: string;
  question: string;
  description: string;
  badge: string;
  options: StudentPollOption[];
  activeUntil?: string;
}

export interface StudentOpinionPulse {
  id: string;
  pollId: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  userTurma?: string;
  selectedOptionId: string;
  opinionText?: string;
  sentiment?: 'positivo' | 'neutro' | 'critico' | 'propositivo';
  timestamp: string;
}

// Catálogo diversificado de enquetes para escuta contínua dos alunos do CEEP
export const STUDENT_POLLS_CATALOG: StudentPoll[] = [
  {
    id: "poll_turno_acessibilidade",
    category: "infraestrutura",
    title: "Facilidade de Coleta",
    question: "Em qual turno você encontrou maior facilidade para entrevistar colegas no CEEP?",
    description: "Ajuda a coordenadoria a orientar os horários de campo dos novos entrevistadores.",
    badge: "⏱️ Organização de Campo",
    options: [
      { id: "opt_matutino", text: "Matutino (Cursos Técnicos Integrados)", icon: "☀️", baseVotes: 38, categoryTag: "rotina" },
      { id: "opt_vespertino", text: "Vespertino (Ensino Médio e Geral)", icon: "🌤️", baseVotes: 24, categoryTag: "rotina" },
      { id: "opt_noturno", text: "Noturno (Prosub e Jovens Adultos)", icon: "🌙", baseVotes: 18, categoryTag: "rotina" },
      { id: "opt_receptivo", text: "Todos com ótima receptividade", icon: "🤝", baseVotes: 15, categoryTag: "geral" },
    ]
  },
  {
    id: "poll_cursos_interesse",
    category: "cursos",
    title: "Vocação & Futuro",
    question: "Qual área técnica você mais gostaria de ver em novos minicursos e oficinas no CEEP?",
    description: "Sua opinião direciona parcerias acadêmicas e oficinas práticas na escola.",
    badge: "💻 Cursos & Inovação",
    options: [
      { id: "opt_ia_dev", text: "Inteligência Artificial, Algoritmos e Programação Web", icon: "🤖", baseVotes: 45, categoryTag: "tecnologia" },
      { id: "opt_saude", text: "Primeiros Socorros, Enfermagem e Saúde Coletiva", icon: "🩺", baseVotes: 32, categoryTag: "saude" },
      { id: "opt_agro", text: "Agroecologia, Irrigação Sustentável e Clima", icon: "🌱", baseVotes: 27, categoryTag: "meio_ambiente" },
      { id: "opt_gestao", text: "Empreendedorismo Digital, Finanças e Marketing", icon: "📈", baseVotes: 21, categoryTag: "gestao" },
    ]
  },
  {
    id: "poll_transporte_ceep",
    category: "transporte",
    title: "Mobilidade Escolar",
    question: "Como você se desloca até o CEEP e quanto tempo gasta em média?",
    description: "Mapeamento socioeconômico de mobilidade urbana e rural em Seabra.",
    badge: "🚌 Mobilidade & Território",
    options: [
      { id: "opt_onibus_rural", text: "Ônibus Escolar Rural (mais de 40 minutos)", icon: "🚌", baseVotes: 41, categoryTag: "rural" },
      { id: "opt_pe_urbano", text: "A pé ou bicicleta (mora na sede de Seabra)", icon: "🚶", baseVotes: 35, categoryTag: "urbano" },
      { id: "opt_van_coletivo", text: "Van ou lotação intermunicipal", icon: "🚐", baseVotes: 19, categoryTag: "transporte" },
      { id: "opt_moto_carro", text: "Moto ou carona particular (até 20 minutos)", icon: "🛵", baseVotes: 14, categoryTag: "transporte" },
    ]
  },
  {
    id: "poll_merenda_espaco",
    category: "merenda",
    title: "Alimentação & Convivência",
    question: "Qual melhoria no refeitório ou área de convivência tornaria o dia no CEEP mais agradável?",
    description: "Contribua com ideias para o bem-estar e permanência estudantil.",
    badge: "🍎 Espaço & Acolhimento",
    options: [
      { id: "opt_cardapio_regional", text: "Mais opções de frutas e lanches regionais", icon: "🍉", baseVotes: 36, categoryTag: "alimentacao" },
      { id: "opt_bancos_sombra", text: "Mais mesas e áreas com sombra para descanso", icon: "🌳", baseVotes: 44, categoryTag: "espaco" },
      { id: "opt_tomadas_estudo", text: "Pontos de tomada para notebooks e celulares", icon: "🔌", baseVotes: 52, categoryTag: "infraestrutura" },
      { id: "opt_musica_intervalo", text: "Música e projetos culturais no intervalo", icon: "🎵", baseVotes: 29, categoryTag: "cultura" },
    ]
  },
  {
    id: "poll_feira_ada_lovelace",
    category: "ciencias",
    title: "Cientistas do CEEP",
    question: "O que você acha mais fascinante na realização do Censo e Feira Ada Lovelace?",
    description: "A ciência feita por estudantes transformando a realidade de Seabra.",
    badge: "🔬 Espírito Científico",
    options: [
      { id: "opt_descobrir_dados", text: "Descobrir a realidade real e os dados da nossa escola", icon: "📊", baseVotes: 48, categoryTag: "dados" },
      { id: "opt_entrevistar_conhecer", text: "Conversar com pessoas diferentes e fazer novas amizades", icon: "👥", baseVotes: 39, categoryTag: "social" },
      { id: "opt_certificado_curriculo", text: "Ganhar horas científicas e insígnias para o currículo", icon: "📜", baseVotes: 28, categoryTag: "carreira" },
      { id: "opt_ia_tecnologia", text: "Usar tecnologia avançada e inteligência artificial no CEEP", icon: "⚡", baseVotes: 33, categoryTag: "tecnologia" },
    ]
  }
];

const VOTES_STORAGE_KEY = "censo_student_poll_votes_v2";
const OPINIONS_STORAGE_KEY = "censo_student_opinions_v2";

export const tasStudentPulseService = {
  /**
   * Retorna a lista de todas as enquetes disponíveis
   */
  getPolls(): StudentPoll[] {
    return STUDENT_POLLS_CATALOG;
  },

  /**
   * Obtém os votos registrados localmente pelo usuário atual
   */
  getUserVotes(): Record<string, string> {
    try {
      const data = localStorage.getItem(VOTES_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  /**
   * Registra o voto do usuário em uma enquete
   */
  registerVote(pollId: string, optionId: string): { success: boolean; totalPollVotes: number } {
    try {
      const votes = this.getUserVotes();
      votes[pollId] = optionId;
      localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes));

      // Atualiza o vetor de interesse no TAS LocalStorage
      const poll = STUDENT_POLLS_CATALOG.find(p => p.id === pollId);
      const option = poll?.options.find(o => o.id === optionId);
      if (option) {
        this.updateTASInterestPreference(option.categoryTag);
      }

      return { success: true, totalPollVotes: this.getTotalVotesForPoll(pollId) };
    } catch (e) {
      console.error("[TAS Pulse] Erro ao registrar voto:", e);
      return { success: false, totalPollVotes: 0 };
    }
  },

  /**
   * Calcula o total de votos de uma enquete (base + voto do usuário local)
   */
  getTotalVotesForPoll(pollId: string): number {
    const poll = STUDENT_POLLS_CATALOG.find(p => p.id === pollId);
    if (!poll) return 0;
    const baseTotal = poll.options.reduce((sum, opt) => sum + opt.baseVotes, 0);
    const userVotes = this.getUserVotes();
    return baseTotal + (userVotes[pollId] ? 1 : 0);
  },

  /**
   * Calcula as estatísticas completas para exibição gráfica
   */
  getPollStats(pollId: string): { options: { id: string; text: string; icon?: string; votes: number; percentage: number; isUserPick: boolean }[]; totalVotes: number } {
    const poll = STUDENT_POLLS_CATALOG.find(p => p.id === pollId);
    if (!poll) return { options: [], totalVotes: 0 };

    const userVotes = this.getUserVotes();
    const userChoiceId = userVotes[pollId];
    const total = this.getTotalVotesForPoll(pollId);

    const options = poll.options.map(opt => {
      const isPick = userChoiceId === opt.id;
      const votes = opt.baseVotes + (isPick ? 1 : 0);
      const percentage = total > 0 ? Math.round((votes / total) * 100) : 0;
      return {
        id: opt.id,
        text: opt.text,
        icon: opt.icon,
        votes,
        percentage,
        isUserPick: isPick
      };
    });

    return { options, totalVotes: total };
  },

  /**
   * Salva uma opinião aberta/sugestão expressa pelo aluno
   */
  submitOpenOpinion(opinion: Omit<StudentOpinionPulse, 'id' | 'timestamp'>): boolean {
    try {
      const list: StudentOpinionPulse[] = JSON.parse(localStorage.getItem(OPINIONS_STORAGE_KEY) || "[]");
      const newEntry: StudentOpinionPulse = {
        ...opinion,
        id: `opinion-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
      };
      list.unshift(newEntry);
      // Mantém as últimas 50 opiniões em cache local
      localStorage.setItem(OPINIONS_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));

      // Extrai palavras-chave para refinar afinidade no TAS
      if (opinion.opinionText) {
        this.extractKeywordsToTAS(opinion.opinionText);
      }

      return true;
    } catch (e) {
      console.error("[TAS Pulse] Erro ao salvar opinião:", e);
      return false;
    }
  },

  /**
   * Obtém a lista recente de opiniões dos alunos
   */
  getRecentOpinions(): StudentOpinionPulse[] {
    try {
      return JSON.parse(localStorage.getItem(OPINIONS_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  },

  /**
   * Atualiza as preferências de afinidade do usuário no motor TAS
   */
  updateTASInterestPreference(tag: string) {
    try {
      const existing: Record<string, number> = JSON.parse(localStorage.getItem("censo_tas_user_interests") || "{}");
      existing[tag] = (existing[tag] || 0) + 1;
      localStorage.setItem("censo_tas_user_interests", JSON.stringify(existing));
    } catch {}
  },

  /**
   * Analisa palavras-chave de comentários/opiniões para calibrar o sentimento no TAS
   */
  extractKeywordsToTAS(text: string) {
    const lower = text.toLowerCase();
    if (lower.includes("tecnologia") || lower.includes("computador") || lower.includes("ia") || lower.includes("program")) {
      this.updateTASInterestPreference("tecnologia");
    }
    if (lower.includes("merenda") || lower.includes("alimento") || lower.includes("lanche")) {
      this.updateTASInterestPreference("alimentacao");
    }
    if (lower.includes("onibus") || lower.includes("transporte") || lower.includes("carona")) {
      this.updateTASInterestPreference("transporte");
    }
    if (lower.includes("estudo") || lower.includes("livro") || lower.includes("aula") || lower.includes("professor")) {
      this.updateTASInterestPreference("estudos");
    }
  }
};
