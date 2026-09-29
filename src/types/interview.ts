export type CorRacaIBGE =
    | 'Branca'
    | 'Preta'
    | 'Parda (inclui pessoas com misturas de raças/etnias, caboclos, mamelucos, etc.)'
    | 'Parda'
    | 'Amarela (origem asiática: japonesa, chinesa, coreana, etc.)'
    | 'Amarela'
    | 'Indígena'
    | 'Prefiro não responder';

export type VinculoTipo = 'ESTUDANTE' | 'FUNCIONARIO';

export type ConheceAncestralidadeTipo =
    | 'Sim, conheço bem'
    | 'Conheço um pouco'
    | 'Não conheço';

export type JaConversouTipo =
    | 'Sim, com frequência'
    | 'Sim, poucas vezes'
    | 'Nunca';

export type PreconceitoTipo = 'Sim' | 'Não' | 'Prefiro não responder';

export interface InterviewFormPayload {
    readonly interviewer_id?: string;
    readonly vinculo?: VinculoTipo;
    readonly grupo_escolar?: string;
    readonly genero?: string;
    readonly cor_raca?: CorRacaIBGE;
    readonly conhece_ancestralidade?: ConheceAncestralidadeTipo;
    readonly geracao_alcancada?: string;
    readonly povo_indigena?: string;
    readonly ja_conversou_sobre?: JaConversouTipo;
    readonly ambientes_conversa?: readonly string[];
    readonly sofreu_preconceito?: PreconceitoTipo;
    readonly relato_preconceito?: string;

    // Propriedades unificadas e legadas para compatibilidade total com os componentes
    readonly id?: string;
    readonly serie?: string;
    readonly turma?: string;
    readonly turno?: string;
    readonly faixa_etaria?: string;
    readonly origem_familia?: string;
    readonly geracao_ancestral?: string;
    readonly etnia_indigena?: string;
    readonly conversou_antes?: string;
    readonly ambito_conversa?: string;
    readonly created_at?: string;
}

// Alias oficial para manter compatibilidade com InterviewForm, TeacherDashboard e pdf-generator
export type InterviewData = InterviewFormPayload;