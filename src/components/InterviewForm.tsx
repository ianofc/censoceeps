import React, { useState } from 'react';
import { InterviewData, PreconceitoTipo } from '../types/interview';
import { ClipboardList, UserCheck, Users, HeartHandshake, AlertCircle, Send } from 'lucide-react';
import { AdinhaMascote } from './AdinhaMascote';

interface Props {
  readonly userId: string;
}

export const InterviewForm: React.FC<Props> = ({ userId }) => {
  const [formData, setFormData] = useState<Partial<InterviewData>>({
    interviewer_id: userId,
    vinculo: 'ESTUDANTE',
    grupo_escolar: '',
    faixa_etaria: '',
    genero: '',
    cor_raca: 'Parda',
    conhece_ancestralidade: 'Não conheço',
    ja_conversou_sobre: 'Nunca',
    ambientes_conversa: [],
    sofreu_preconceito: 'Não',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCheckbox = (ambiente: string) => {
    const atuais = formData.ambientes_conversa || [];
    if (atuais.includes(ambiente)) {
      setFormData({ ...formData, ambientes_conversa: atuais.filter(a => a !== ambiente) });
    } else {
      setFormData({ ...formData, ambientes_conversa: [...atuais, ambiente] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok) {
        setSuccess(true);
        setFormData({
          interviewer_id: userId,
          vinculo: 'ESTUDANTE',
          grupo_escolar: '',
          faixa_etaria: '',
          genero: '',
          cor_raca: 'Parda',
          conhece_ancestralidade: 'Não conheço',
          ja_conversou_sobre: 'Nunca',
          ambientes_conversa: [],
          sofreu_preconceito: 'Não',
          relato_preconceito: '',
          povo_indigena: ''
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
      
      {/* CABEÇALHO DO FORMULÁRIO */}
      <div className="agora-light-card">
        <div>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 inline-block mb-2">
            Projeto Ada Lovelace
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Ficha de Coleta — Censo CEEP
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Preencha os blocos abaixo com base nas diretrizes oficiais de autodeclaração e vivências.
          </p>
        </div>
        <div className="hidden md:flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
          <ClipboardList className="w-7 h-7" />
        </div>
      </div>

      {/* GAMIFICAÇÃO: SUCESSO COM A ADINHA VENCEDORA */}
      {success && (
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-lg animate-in zoom-in-95">
          <AdinhaMascote pose="vencedora" className="w-24 h-24 shrink-0" />
          <div className="space-y-1 text-center md:text-left">
            <span className="px-3 py-1 bg-emerald-200/60 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full">
              🏆 Meta de Coleta Alcançada!
            </span>
            <h3 className="text-base font-black text-slate-800">Parabéns, Pesquisador(a)!</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Sua entrevista foi registrada com sucesso e somada ao termômetro oficial do Censo CEEP no CEEP Seabra.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BLOCO 1: IDENTIFICAÇÃO */}
        <div className="agora-card space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <UserCheck className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-slate-800">Bloco 1: Identificação do Entrevistado</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vinculo-escola" className="block text-xs font-bold text-slate-700 uppercase mb-2">Vínculo com a Escola</label>
              <select 
                id="vinculo-escola"
                value={formData.vinculo} 
                onChange={e => setFormData({ ...formData, vinculo: e.target.value as any })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
              >
                <option value="ESTUDANTE">Estudante</option>
                <option value="FUNCIONARIO">Funcionário / Docente</option>
              </select>
            </div>

            <div>
              <label htmlFor="grupo-escolar" className="block text-xs font-bold text-slate-700 uppercase mb-2">Série / Turma / Setor</label>
              <input 
                id="grupo-escolar"
                type="text" 
                value={formData.grupo_escolar || ''} 
                onChange={e => setFormData({ ...formData, grupo_escolar: e.target.value })}
                required 
                placeholder="Ex: 3º Ano Informática"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white" 
              />
            </div>
          </div>
        </div>

        {/* BLOCO 2: AUTODECLARAÇÃO IBGE */}
        <div className="agora-card space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-slate-800">Bloco 2: Autodeclaração IBGE</h2>
          </div>

          <div>
            <label htmlFor="cor-raca" className="block text-xs font-bold text-slate-700 uppercase mb-2">Cor ou Raça</label>
            <select 
              id="cor-raca"
              value={formData.cor_raca} 
              onChange={e => setFormData({ ...formData, cor_raca: e.target.value as any })}
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

          {formData.cor_raca === 'Indígena' && (
            <div className="animate-in fade-in">
              <label htmlFor="povo-indigena" className="block text-xs font-bold text-slate-700 uppercase mb-2">Povo ou Etnia Indígena</label>
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

        {/* BLOCO 3: ANCESTRALIDADE E VIVÊNCIAS */}
        <div className="agora-card space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <h2 className="text-base font-black text-slate-800">Bloco 3: Ancestralidade e Vivências</h2>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase mb-3">Ambientes de Conversa sobre Raça/Gênero</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Familiar', 'Escolar', 'Conversa com amigos'].map((item) => {
                const isSelected = formData.ambientes_conversa?.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleCheckbox(item)}
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
            <label htmlFor="sofreu-preconceito" className="block text-xs font-bold text-slate-700 uppercase mb-2">Já sofreu preconceito?</label>
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
            <div className="animate-in fade-in space-y-2">
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
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer border-0"
        >
          <Send className="w-4 h-4" /> {loading ? "A gravar resposta..." : "Salvar Resposta do Censo"}
        </button>

      </form>
    </div>
  );
};

export default InterviewForm;