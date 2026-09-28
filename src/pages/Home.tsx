import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ClipboardList, Send, CheckCircle2, AlertCircle, Loader2, BookOpen } from 'lucide-react';

interface HomeProps {
  readonly userId?: string;
}

export function Home({ userId }: HomeProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados dos Blocos do Questionário
  const [serie, setSerie] = useState('');
  const [turma, setTurma] = useState('');
  const [turno, setTurno] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [corRaca, setCorRaca] = useState('');
  const [origemFamilia, setOrigemFamilia] = useState('');
  const [geracaoAncestral, setGeracaoAncestral] = useState('');
  const [etniaIndigena, setEtniaIndigena] = useState('');
  const [conversouAntes, setConversouAntes] = useState('');
  const [ambitoConversa, setAmbitoConversa] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.from('censo_respostas').insert([
        {
          user_id: userId,
          serie,
          turma,
          turno,
          faixa_etaria: faixaEtaria,
          cor_raca: corRaca,
          origem_familia: origemFamilia,
          geracao_ancestral: geracaoAncestral,
          etnia_indigena: etniaIndigena,
          conversou_antes: conversouAntes,
          ambito_conversa: ambitoConversa,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;

      setSuccess(true);
      setSerie('');
      setTurma('');
      setTurno('');
      setFaixaEtaria('');
      setCorRaca('');
      setOrigemFamilia('');
      setGeracaoAncestral('');
      setEtniaIndigena('');
      setConversouAntes('');
      setAmbitoConversa('');
    } catch (err: any) {
      console.error('Erro ao salvar no Supabase:', err);
      setErrorMsg(err.message || 'Erro ao registrar os dados. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500 pb-12">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-8 sm:p-10">
        
        {/* Cabeçalho do Formulário */}
        <div className="border-b border-slate-100 pb-6 mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-blue-200 mb-2">
              <ClipboardList className="w-4 h-4" /> Coleta Oficial
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Censo Escolar de Cor e Raça
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Projeto Científico Ada Lovelace — CEEP Seabra
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Resistrada com Sucesso!</h4>
              <p className="text-xs text-emerald-700">Os dados da ficha foram salvos com segurança no banco de dados do Censo.</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Erro ao enviar</h4>
              <p className="text-xs text-rose-700">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* BLOCO 1: Perfil do Estudante */}
          <div className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/60">
            <h2 className="text-sm font-black uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span>Bloco 1:</span> Perfil do Estudante
            </h2>
            <p className="text-xs text-slate-500">Importante para cruzar os dados depois (comparar respostas por turma ou ano).</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="inputSerie" className="text-xs font-bold text-slate-700 block">1. Série / Ano</label>
                <input
                  id="inputSerie"
                  type="text"
                  required
                  placeholder="Ex: 2º Ano Técnico"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="inputTurma" className="text-xs font-bold text-slate-700 block">2. Turma</label>
                <input
                  id="inputTurma"
                  type="text"
                  required
                  placeholder="Ex: Informática A"
                  value={turma}
                  onChange={(e) => setTurma(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="selectTurno" className="text-xs font-bold text-slate-700 block">3. Turno</label>
                <select
                  id="selectTurno"
                  required
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o Turno...</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite / EJA">Noite / EJA</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="selectFaixaEtaria" className="text-xs font-bold text-slate-700 block">4. Faixa Etária</label>
                <select
                  id="selectFaixaEtaria"
                  required
                  value={faixaEtaria}
                  onChange={(e) => setFaixaEtaria(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione a Idade...</option>
                  <option value="15 anos">15 anos</option>
                  <option value="16 anos">16 anos</option>
                  <option value="17 anos">17 anos</option>
                  <option value="18 anos ou mais">18 anos ou mais</option>
                </select>
              </div>
            </div>
          </div>

          {/* BLOCO 2: Autodeclaração de Cor ou Raça (Padrão IBGE) */}
          <div className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/60">
            <h2 className="text-sm font-black uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span>Bloco 2:</span> Autodeclaração de Cor ou Raça (Padrão IBGE)
            </h2>
            <p className="text-xs text-slate-500">Utilize exatamente os 5 termos oficiais utilizados pelo IBGE.</p>

            <fieldset className="space-y-2 pt-2 border-0 p-0 m-0">
              <legend className="text-xs font-bold text-slate-700 block mb-2">5. Sua cor ou raça é:</legend>
              <div className="space-y-2">
                {[
                  'Branca',
                  'Preta',
                  'Parda (inclui pessoas com misturas de raças/etnias, caboclos, mamelucos, etc.)',
                  'Amarela (origem asiática: japonesa, chinesa, coreana, etc.)',
                  'Indígena',
                  'Prefiro não responder'
                ].map((opcao, index) => (
                  <label key={opcao} htmlFor={`opcaoCor_${index}`} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50/50 transition">
                    <input
                      id={`opcaoCor_${index}`}
                      type="radio"
                      name="corRaca"
                      required
                      value={opcao}
                      checked={corRaca === opcao}
                      onChange={(e) => setCorRaca(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">{opcao}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Dica Pedagógica */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 mt-4">
              <BookOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>Dica Pedagógica:</strong> O IBGE considera a população negra como a soma das pessoas que se declaram pretas e pardas. Vale destacar esse conceito para os alunos durante a análise dos dados.
              </div>
            </div>
          </div>

          {/* BLOCO 3: Pertencimento e Consciência */}
          <div className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/60">
            <h2 className="text-sm font-black uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span>Bloco 3:</span> Pertencimento e Consciência
            </h2>
            <p className="text-xs text-slate-500">Perguntas complementares para enriquecer o projeto do Mês da Consciência Negra.</p>

            <fieldset className="space-y-3 pt-2 border-0 p-0 m-0">
              <legend className="text-xs font-bold text-slate-700 block mb-2">6. Você conhece a origem da sua família (antepassados)?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {['Sim, conheço bem', 'Conheço um pouco', 'Não conheço'].map((opcao, index) => (
                  <label key={opcao} htmlFor={`origemFam_${index}`} className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50/50">
                    <input
                      id={`origemFam_${index}`}
                      type="radio"
                      name="origemFamilia"
                      required
                      value={opcao}
                      checked={origemFamilia === opcao}
                      onChange={(e) => setOrigemFamilia(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-xs font-semibold text-slate-800">{opcao}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2 pt-2">
              <label htmlFor="selectGeracao" className="text-xs font-bold text-slate-700 block">7. Se sim, conhece até qual geração?</label>
              <select
                id="selectGeracao"
                value={geracaoAncestral}
                onChange={(e) => setGeracaoAncestral(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione a geração...</option>
                <option value="Pais (1ª geração acima)">Pais (1ª geração acima)</option>
                <option value="Avós (2ª geração acima)">Avós (2ª geração acima)</option>
                <option value="Bisavós (3ª geração acima)">Bisavós (3ª geração acima)</option>
                <option value="Trisavós (4ª geração acima)">Trisavós (4ª geração acima)</option>
                <option value="Tetravós / Tataravós (5ª geração acima)">Tetravós / Tataravós (5ª geração acima)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label htmlFor="inputEtnia" className="text-xs font-bold text-slate-700 block">8. Caso seja Indígena, qual é o seu povo / etnia? (Opcional)</label>
              <input
                id="inputEtnia"
                type="text"
                placeholder="Ex: Povo Pataxó, Tuxá..."
                value={etniaIndigena}
                onChange={(e) => setEtniaIndigena(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <fieldset className="space-y-3 pt-2 border-0 p-0 m-0">
              <legend className="text-xs font-bold text-slate-700 block mb-2">9. Você já conversou sobre autodeclaração de cor/etnia com sua família ou na escola antes?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {['Sim, com frequência', 'Sim, poucas vezes', 'Nunca'].map((opcao, index) => (
                  <label key={opcao} htmlFor={`conversou_${index}`} className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50/50">
                    <input
                      id={`conversou_${index}`}
                      type="radio"
                      name="conversouAntes"
                      required
                      value={opcao}
                      checked={conversouAntes === opcao}
                      onChange={(e) => setConversouAntes(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-xs font-semibold text-slate-800">{opcao}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2 pt-2">
              <label htmlFor="selectAmbito" className="text-xs font-bold text-slate-700 block">10. Se sim, a conversa aconteceu no âmbito:</label>
              <select
                id="selectAmbito"
                value={ambitoConversa}
                onChange={(e) => setAmbitoConversa(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione o âmbito...</option>
                <option value="Familiar">Familiar</option>
                <option value="Escolar">Escolar</option>
                <option value="Conversa com amigos">Conversa com amigos</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition duration-200 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Salvar Ficha do Censo <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}