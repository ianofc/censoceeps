import React, { useState } from 'react';
import { InterviewData } from '../types/interview';

interface Props {
  userId: string;
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
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (res.ok) {
        alert('Entrevista gravada com sucesso!');
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
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      alert('Erro de conexão com o servidor.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Censo CEEP - Ficha de Coleta</h2>

      {/* BLOCO 1 */}
      <fieldset className="border p-4 rounded">
        <legend className="font-semibold text-gray-700">Bloco 1: Identificação do Entrevistado</legend>
        <div className="space-y-3 mt-2">
          <div>
            <label htmlFor="vinculo-escola" className="block text-sm font-medium">Vínculo com a Escola</label>
            <select 
              id="vinculo-escola"
              value={formData.vinculo} 
              onChange={e => setFormData({ ...formData, vinculo: e.target.value as any })}
              className="w-full border p-2 rounded mt-1"
            >
              <option value="ESTUDANTE">Estudante</option>
              <option value="FUNCIONARIO">Funcionário</option>
            </select>
          </div>
          <div>
            <label htmlFor="grupo-escolar" className="block text-sm font-medium">Série / Turma / Setor</label>
            <input 
              id="grupo-escolar"
              type="text" 
              value={formData.grupo_escolar || ''} 
              onChange={e => setFormData({ ...formData, grupo_escolar: e.target.value })}
              required 
              placeholder="Ex: 1º Ano A ou Secretaria"
              className="w-full border p-2 rounded mt-1" 
            />
          </div>
        </div>
      </fieldset>

      {/* BLOCO 2 */}
      <fieldset className="border p-4 rounded">
        <legend className="font-semibold text-gray-700">Bloco 2: Autodeclaração IBGE</legend>
        <div className="mt-2">
          <label htmlFor="cor-raca" className="block text-sm font-medium">Cor ou Raça</label>
          <select 
            id="cor-raca"
            value={formData.cor_raca} 
            onChange={e => setFormData({ ...formData, cor_raca: e.target.value as any })}
            className="w-full border p-2 rounded mt-1"
          >
            <option value="Branca">Branca</option>
            <option value="Preta">Preta</option>
            <option value="Parda">Parda</option>
            <option value="Amarela">Amarela</option>
            <option value="Indígena">Indígena</option>
            <option value="Prefiro não responder">Prefiro não responder</option>
          </select>
        </div>
      </fieldset>

      {/* BLOCO 3 */}
      <fieldset className="border p-4 rounded">
        <legend className="font-semibold text-gray-700">Bloco 3: Ancestralidade e Vivências</legend>
        <div className="space-y-3 mt-2">
          {formData.cor_raca === 'Indígena' && (
            <div>
              <label htmlFor="povo-indigena" className="block text-sm font-medium">Povo ou Etnia Indígena</label>
              <input 
                id="povo-indigena"
                type="text" 
                value={formData.povo_indigena || ''} 
                onChange={e => setFormData({ ...formData, povo_indigena: e.target.value })}
                className="w-full border p-2 rounded mt-1" 
              />
            </div>
          )}

          <div>
            <span className="block text-sm font-medium mb-1">Ambientes de Conversa sobre Raça/Gênero</span>
            <div className="flex flex-wrap gap-4 mt-1">
              {['Familiar', 'Escolar', 'Conversa com amigos'].map((item, idx) => (
                <label key={item} htmlFor={`ambiente-${idx}`} className="inline-flex items-center">
                  <input 
                    id={`ambiente-${idx}`}
                    type="checkbox" 
                    checked={formData.ambientes_conversa?.includes(item)}
                    onChange={() => handleCheckbox(item)}
                    className="mr-2"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="sofreu-preconceito" className="block text-sm font-medium">Já sofreu preconceito?</label>
            <select 
              id="sofreu-preconceito"
              value={formData.sofreu_preconceito} 
              onChange={e => setFormData({ ...formData, sofreu_preconceito: e.target.value })}
              className="w-full border p-2 rounded mt-1"
            >
              <option value="Não">Não</option>
              <option value="Sim">Sim</option>
              <option value="Prefiro não responder">Prefiro não responder</option>
            </select>
          </div>

          {formData.sofreu_preconceito === 'Sim' && (
            <div>
              <label htmlFor="relato-preconceito" className="block text-sm font-medium">Relato (opcional e anônimo)</label>
              <textarea 
                id="relato-preconceito"
                value={formData.relato_preconceito || ''} 
                onChange={e => setFormData({ ...formData, relato_preconceito: e.target.value })}
                className="w-full border p-2 rounded mt-1"
                rows={3}
                placeholder="Descreva brevemente a situação se desejar..."
              />
            </div>
          )}
        </div>
      </fieldset>

      <button type="submit" className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition">
        Salvar Resposta do Censo
      </button>
    </form>
  );
};