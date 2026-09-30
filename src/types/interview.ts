export type CorRacaIBGE =
    | 'Branca'
    | 'Preta'
    | 'Parda (inclui pessoas com misturas de raças/etnias, caboclos, mamelucos, etc.)'
    | 'Parda'
    | 'Amarela (origem asiática: japonesa, chinesa, coreana, etc.)'
    | 'Amarela'
    | 'Indígena'
    | 'Prefiro não responder';

export type VinculoTipo =
    | 'ESTUDANTE_REGULAR'
    | 'ESTUDANTE_TECNICO'
    | 'PROFESSOR'
    | 'FUNCIONARIO'
    | 'GESTAO'
    | 'ESTUDANTE';

export type ConheceAncestralidadeTipo =
    | 'Sim, conheço bem'
    | 'Conheço um pouco'
    | 'Não conheço';

export type JaConversouTipo =
    | 'Sim, com frequência'
    | 'Sim, poucas vezes'
    | 'Nunca';

export type PreconceitoTipo = 'Sim' | 'Não' | 'Prefiro não responder';

export type LocalizacaoMoradiaTipo =
    | 'Sede de Seabra'
    | 'Zona Rural / Povoado de Seabra'
    | 'Outra cidade';

export type OrigemFamiliaTipo =
    | 'Predominantemente Negra'
    | 'Predominantemente Branca'
    | 'Predominantemente Indígena'
    | 'Mista / Diversa'
    | 'Prefiro não responder';

export interface InterviewFormPayload {
    readonly interviewer_id?: string;
    readonly nome_participante?: string;
    readonly contato_whatsapp?: string;
    readonly genero?: string;
    readonly vinculo?: VinculoTipo;
    readonly grupo_escolar?: string;
    readonly cor_raca?: CorRacaIBGE;
    readonly conhece_ancestralidade?: ConheceAncestralidadeTipo;
    readonly geracao_alcancada?: string;
    readonly povo_indigena?: string;
    readonly ja_conversou_sobre?: JaConversouTipo;
    readonly ambientes_conversa?: readonly string[];
    readonly sofreu_preconceito?: PreconceitoTipo;
    readonly relato_preconceito?: string;

    // Novos campos de localização, origem e detalhamento de vivências
    readonly cidade_natal?: string;
    readonly localizacao_moradia?: LocalizacaoMoradiaTipo;
    readonly detalhe_localizacao?: string;
    readonly origem_familia?: OrigemFamiliaTipo;
    readonly locais_ocorrencia?: readonly string[];
    readonly formas_ocorrencia?: readonly string[];

    // Propriedades legadas/unificadas para compatibilidade
    readonly id?: string;
    readonly serie?: string;
    readonly turma?: string;
    readonly turno?: string;
    readonly faixa_etaria?: string;
    readonly origem_familia_legado?: string;
    readonly geracao_ancestral?: string;
    readonly etnia_indigena?: string;
    readonly conversou_antes?: string;
    readonly ambito_conversa?: string;
    readonly created_at?: string;
}

// Tipo único consolidado (resolve o aviso de duplicidade do SonarLint)
export type InterviewData = InterviewFormPayload & {
    interviewer_id: string;
    nome_participante: string;
    vinculo: VinculoTipo;
    grupo_escolar: string;
    cor_raca: string;
    conhece_ancestralidade: string;
    ja_conversou_sobre: string;
    ambientes_conversa: string[];
    sofreu_preconceito: PreconceitoTipo;
};