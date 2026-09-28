export interface InterviewFormPayload {
    interviewer_id: string;
    vinculo: 'ESTUDANTE' | 'FUNCIONARIO';
    grupo_escolar: string;
    faixa_etaria: string;
    genero: string;
    cor_raca: 'Branca' | 'Preta' | 'Parda' | 'Amarela' | 'Indígena' | 'Prefiro não responder';
    conhece_ancestralidade: 'Sim, conheço bem' | 'Conheço um pouco' | 'Não conheço';
    geracao_alcancada?: string;
    povo_indigena?: string;
    ja_conversou_sobre: 'Sim, com frequência' | 'Sim, poucas vezes' | 'Nunca';
    ambientes_conversa: string[];
    sofreu_preconceito: 'Sim' | 'Não' | 'Prefiro não responder';
    relato_preconceito?: string;
}