import React, { useState } from 'react';
import { InterviewData, PreconceitoTipo, LocalizacaoMoradiaTipo, OrigemFamiliaTipo, CorRacaIBGE, VinculoTipo } from '../types/interview';
import { ClipboardList, UserCheck, Users, AlertCircle, Send, User, Phone, MapPin, Globe, Compass, ShieldAlert } from 'lucide-react';
import { AdinhaMascote } from './AdinhaMascote';

interface Props {
  readonly userId: string;
}

export const InterviewForm: React.FC<Props> = ({ userId }) => {
  const [formData, setFormData] = useState<Partial<InterviewData>>({
    interviewer_id: userId,
    nome_participante: '',
    contato_whatsapp: '',
    genero: '',
    vinculo: 'ESTUDANTE_REGULAR',
    serie: '',
    turma: '',
    turno: 'Matutino',
    faixa_etaria: '',
    cidade_natal: 'Seabra',
    localizacao_moradia: 'Sede de Seabra',
    detalhe_localizacao: '',
    cor_raca: 'Parda',
    origem_familia: 'Mista / Diversa',
    mora_com: '',
    povo_indigena: '',
    cor_raca_influencia: 'Sim',
    espacos_influencia: [],
    conhece_ancestralidade: 'Não conheço',
    ja_conversou_sobre: 'Nunca',
    ambientes_conversa: [],
    sofreu_preconceito: 'Não',
    locais_ocorrencia: [],
    formas_ocorrencia: [],
    relato_preconceito: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleArrayToggle = (field: 'espacos_influencia' | 'ambientes_conversa' | 'locais_ocorrencia' | 'formas_ocorrencia', item: string) => {
    const atuais = (formData[field] as string[]) || [];
    if (atuais.includes(item)) {
      setFormData({ ...formData, [field]: atuais.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...atuais, item] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        grupo_escolar: `${formData.serie || ''} - ${formData.turma || ''}`.trim()
      };

      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        setSuccess(true);
        setFormData({
          interviewer_id: userId,
          nome_participante: '',
          contato_whatsapp: '',
          genero: '',
          vinculo: 'ESTUDANTE_REGULAR',
          serie: '',
          turma: '',
          turno: 'Matutino',
          faixa_etaria: '',
          cidade_natal: 'Seabra',
          localizacao_moradia: 'Sede de Seabra',
          detalhe_localizacao: '',
          cor_raca: 'Parda',
          origem_familia: 'Mista / Diversa',
          mora_com: '',
          povo_indigena: '',
          cor_raca_influencia: 'Sim',
          espacos_influencia: [],
          conhece_ancestralidade: 'Não conheço',
          ja_conversou_sobre: 'Nunca',
          ambientes_conversa: [],
          sofreu_preconceito: 'Não',
          locais_ocorrencia: [],
          formas_ocorrencia: [],
          relato_preconceito: ''
        });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* CABEÇALHO */}
      <div className="agora-light-card">
        <div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 inline-block mb-2">
            Projeto Científico Ada Lovelace — CEEP Seabra
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Censo Escolar: Identidade e Vivências
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Preencha os blocos abaixo com base nas diretrizes censitárias e de percepção social.
          </p>
        </div>
        <div className="hidden md:flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
          <ClipboardList className="w-7 h-7" />
        </div>
      </div>

      {success && (
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-lg animate-in zoom-in-95">
          <AdinhaMascote pose="vencedora" className="w-24 h-24 shrink-0" />
          <div className="space-y-1 text-center md:text-left">
            <span className="px-3 py-1 bg-emerald-200/60 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full">
              🏆 Ficha Salva com Sucesso!
            </span>
            <h3 className="text-base font-black text-slate-800">Parabéns, Pesquisador(a)!</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Os dados foram computados e sincronizados com a base do Censo CEEP.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BLOCO 1: PERFIL E IDENTIFICAÇÃO DO PARTICIPANTE */}
        <div className="agora-card space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <UserCheck className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-slate-800">Bloco 1: Identificação Básica e Perfil</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nome-participante" className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" /> Nome Completo
              </label>
              <input 
                id="nome-participante"
                type="text" 
                value={formData.nome_participante || ''} 
                onChange={e => setFormData({ ...formData, nome_participante: e.target.value })}
                required 
                placeholder="Nome completo do participante..."
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white" 
              />
            </div>

            <div>
              <label htmlFor="contato-whatsapp" className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" /> Contato / WhatsApp
              </label>
              <input 
                id="contato-whatsapp"
                type="text" 
                value={formData.contato_whatsapp || ''} 
                onChange={e => setFormData({ ...formData, contato_whatsapp: e.target.value })}
                placeholder="(75) 90000-0000"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white" 
              />
            </div>

            <div>
              <label htmlFor="genero" className="block text-xs font-bold text-slate-700 uppercase mb-2">Gênero</label>
              <input 
                id="genero"
                type="text" 
                value={formData.genero || ''} 
                onChange={e => setFormData({ ...formData, genero: e.target.value })}
                placeholder="Ex: Masculino, Feminino, Não-binário..."
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white" 
              />
            </div>

            <div>
              <label htmlFor="vinculo-escola" className="block text-xs font-bold text-slate-700 uppercase mb-2">Vínculo com a Instituição</label>
              <select 
                id="vinculo-escola"
                value={formData.vinculo} 
                onChange={e => setFormData({ ...formData, vinculo: e.target.value as VinculoTipo })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
              >
                <option value="ESTUDANTE_REGULAR">Estudante (Ensino Médio Regular)</option>
                <option value="ESTUDANTE_TECNICO">Estudante (Curso Técnico)</option>
                <option value="PROFESSOR">Professor(a) / Docente</option>
                <option value="FUNCIONARIO">Funcionário(a) / Técnico-Administrativo</option>
                <option value="GESTAO">Gestão / Coordenação</option>
              </select>
            </div>

            <div>
              <label htmlFor="serie-ano" className="block text-xs font-bold text-slate-700 uppercase mb-2">Série / Ano / Módulo</label>
              <input 
                id="serie-ano"
                type="text" 
                value={formData.serie || ''} 
                onChange={e => setFormData({ ...formData, serie: e.target.value })}
                required 
                placeholder="Ex: 2º Ano Técnico / 3º Ano Regular"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white" 
              />
            </div>

            <div>
              <label htmlFor="turma" className="block text-xs font-bold text-slate-700 uppercase mb-2">Turma / Setor</label>
              <input 
                id="turma"
                type="text" 
                value={formData.turma || ''} 
                onChange={e => setFormData({ ...formData, turma: e.target.value })}
                required 
                placeholder="Ex: Informática A / Secretaria"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white" 
              />
            </div>

            {formData.vinculo?.startsWith('ESTUDANTE') && (
              <div className="md:col-span-2 animate-in fade-in pt-2">
                <label htmlFor="mora-com" className="block text-xs font-bold text-slate-700 uppercase mb-2">Com quem você mora atualmente?</label>
                <select 
                  id="mora-com"
                  value={formData.mora_com || ''} 
                  onChange={e => setFormData({ ...formData, mora_com: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
                >
                  <option value="" disabled>Selecione uma opção...</option>
                  <option value="Pai e Mãe">Pai e Mãe</option>
                  <option value="Apenas com a Mãe">Apenas com a Mãe</option>
                  <option value="Apenas com o Pai">Apenas com o Pai</option>
                  <option value="Avós ou outros parentes">Avós ou outros parentes</option>
                  <option value="Cônjuge/Namorado(a)">Cônjuge / Namorado(a)</option>
                  <option value="Amigos/Colegas">Amigos / Colegas</option>
                  <option value="Sozinho(a)">Sozinho(a)</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* BLOCO 2: LOCALIZAÇÃO E ORIGEM GEOGRÁFICA */}
        <div className="agora-card space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <MapPin className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-slate-800">Bloco 2: Localização e Origem Geográfica</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cidade-natal" className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" /> Cidade em que nasceu
              </label>
              <input 
                id="cidade-natal"
                type="text" 
                value={formData.cidade_natal || ''} 
                onChange={e => setFormData({ ...formData, cidade_natal: e.target.value })}
                placeholder="Ex: Seabra, Palmeiras, Bonito..."
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white" 
              />
            </div>

            <div>
              <label htmlFor="localizacao-moradia" className="block text-xs font-bold text-slate-700 uppercase mb-2">Onde mora atualmente?</label>
              <select 
                id="localizacao-moradia"
                value={formData.localizacao_moradia} 
                onChange={e => setFormData({ ...formData, localizacao_moradia: e.target.value as LocalizacaoMoradiaTipo })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
              >
                <option value="Sede de Seabra">Sede de Seabra</option>
                <option value="Zona Rural / Povoado de Seabra">Zona Rural / Povoado de Seabra</option>
                <option value="Outra cidade">Outra cidade</option>
              </select>
            </div>

            {formData.localizacao_moradia !== 'Sede de Seabra' && (
              <div className="md:col-span-2 animate-in fade-in">
                <label htmlFor="detalhe-localizacao" className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  {formData.localizacao_moradia === 'Zona Rural / Povoado de Seabra' ? 'Qual o nome do povoado ou região rural?' : 'Qual o nome da cidade onde mora?'}
                </label>
                <input 
                  id="detalhe-localizacao"
                  type="text" 
                  value={formData.detalhe_localizacao || ''} 
                  onChange={e => setFormData({ ...formData, detalhe_localizacao: e.target.value })}
                  placeholder="Especifique o local..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white" 
                />
              </div>
            )}
          </div>
        </div>

        {/* BLOCO 3: AUTODECLARAÇÃO IBGE E ORIGEM FAMILIAR */}
        <div className="agora-card space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-slate-800">Bloco 3: Autodeclaração e Origem Familiar</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cor-raca" className="block text-xs font-bold text-slate-700 uppercase mb-2">Cor ou Raça (Padrão IBGE)</label>
              <select 
                id="cor-raca"
                value={formData.cor_raca} 
                onChange={e => setFormData({ ...formData, cor_raca: e.target.value as CorRacaIBGE })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
              >
                <option value="Branca">Branca</option>
                <option value="Preta">Preta</option>
                <option value="Parda">Parda</option>
                <option value="Amarela">Amarela</option>
                <option value="Indígena">Indígena</option>
                <option value="Prefiro não responder">Prefiro não responder</option>
              </select>
            </div>

            <div>
              <label htmlFor="origem-familia" className="block text-xs font-bold text-slate-700 uppercase mb-2">Origem Predominante da Família</label>
              <select 
                id="origem-familia"
                value={formData.origem_familia} 
                onChange={e => setFormData({ ...formData, origem_familia: e.target.value as OrigemFamiliaTipo })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
              >
                <option value="Predominantemente Negra">Predominantemente Negra</option>
                <option value="Predominantemente Branca">Predominantemente Branca</option>
                <option value="Predominantemente Indígena">Predominantemente Indígena</option>
                <option value="Mista / Diversa">Mista / Diversa</option>
                <option value="Prefiro não responder">Prefiro não responder</option>
              </select>
            </div>
          </div>

          {(formData.cor_raca === 'Indígena' || formData.origem_familia === 'Predominantemente Indígena') && (
            <div className="animate-in fade-in">
              <label htmlFor="povo-indigena" className="block text-xs font-bold text-slate-700 uppercase mb-2">Qual o povo ou etnia indígena?</label>
              <input 
                id="povo-indigena"
                type="text" 
                value={formData.povo_indigena || ''} 
                onChange={e => setFormData({ ...formData, povo_indigena: e.target.value })}
                placeholder="Informe o povo ou etnia..."
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white" 
              />
            </div>
          )}
        </div>

        {/* BLOCO 4: PERCEPÇÃO SOCIAL E VIVÊNCIAS */}
        <div className="agora-card space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Compass className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-slate-800">Bloco 4: Percepção Social e Vivências</h2>
          </div>

          <div>
            <label htmlFor="cor-raca-influencia" className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Você considera que a cor ou raça influencia a vida das pessoas no Brasil?
            </label>
            <select 
              id="cor-raca-influencia"
              value={formData.cor_raca_influencia} 
              onChange={e => setFormData({ ...formData, cor_raca_influencia: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
            >
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
              <option value="Não sei responder">Não sei responder</option>
            </select>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase mb-3">Em quais espaços você percebe que essa influência ocorre com mais força?</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {['Escola', 'Trabalho', 'Relação com Polícia/Justiça', 'Convívio Social', 'Atendimento à Saúde', 'Repartições Públicas', 'Relações Afetivas'].map((item) => {
                const isSelected = formData.espacos_influencia?.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleArrayToggle('espacos_influencia', item)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-left">{item}</span>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'}`}>
                      {isSelected && <span className="text-[10px]">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase mb-3">Ambientes de conversa sobre identidade, raça ou diversidade</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Familiar', 'Escolar', 'Conversa com amigos'].map((item) => {
                const isSelected = formData.ambientes_conversa?.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleArrayToggle('ambientes_conversa', item)}
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item}</span>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                      {isSelected && <span className="text-[10px]">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="sofreu-preconceito" className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Você já sofreu preconceito ou discriminação?
            </label>
            <select 
              id="sofreu-preconceito"
              value={formData.sofreu_preconceito} 
              onChange={e => setFormData({ ...formData, sofreu_preconceito: e.target.value as PreconceitoTipo })}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
            >
              <option value="Não">Não</option>
              <option value="Sim">Sim</option>
              <option value="Prefiro não responder">Prefiro não responder</option>
            </select>
          </div>

          {formData.sofreu_preconceito === 'Sim' && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in">
              <div>
                <span className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-orange-500" /> Onde isso ocorreu?
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {['Escola', 'Trabalho', 'Comércio', 'Serviço de Saúde', 'Serviço Público', 'Polícia/Justiça', 'Transporte', 'Internet/Redes Sociais', 'Ambiente Familiar', 'Espaço Religioso'].map((item) => {
                    const isSelected = formData.locais_ocorrencia?.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleArrayToggle('locais_ocorrencia', item)}
                        className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-orange-50 border-orange-300 text-orange-900 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-left truncate">{item}</span>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300'}`}>
                          {isSelected && <span className="text-[9px]">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-700 uppercase mb-3">De que forma aconteceu?</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Piadas/comentários', 'Xingamentos/ofensas', 'Apelidos relacionados', 'Exclusão/isolamento', 'Tratamento desigual', 'Suspeita ou vigilância injustificada', 'Oportunidade negada', 'Agressão/ameaça'].map((item) => {
                    const isSelected = formData.formas_ocorrencia?.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleArrayToggle('formas_ocorrencia', item)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-left">{item}</span>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-slate-300'}`}>
                          {isSelected && <span className="text-[9px]">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="relato-preconceito" className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-orange-500" /> Relato (Opcional e Sigiloso)
                </label>
                <textarea 
                  id="relato-preconceito"
                  value={formData.relato_preconceito || ''} 
                  onChange={e => setFormData({ ...formData, relato_preconceito: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white resize-none"
                  rows={3}
                  placeholder="Descreva brevemente a situação se desejar..."
                />
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer border-0"
        >
          <Send className="w-4 h-4" /> {loading ? "A gravar resposta..." : "Salvar Ficha do Censo"}
        </button>

      </form>
    </div>
  );
};

export default InterviewForm;