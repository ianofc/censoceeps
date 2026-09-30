import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUserSession } from '../hooks/useUserSession';
import { UserAvatar } from '../components/UserAvatar';
import { ClipboardList, Send, AlertCircle, Loader2, BookOpen, User, Phone, MapPin, Globe, ShieldAlert } from 'lucide-react';
import { AdinhaMascote } from '../components/AdinhaMascote';

export function Home() {
  const { profile } = useUserSession(); // Pega dinamicamente quem está logado (Ian, Juliana, etc.)
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ... (estados dos campos do formulário)
  const [nomeParticipante, setNomeParticipante] = useState('');
  const [contatoWhatsapp, setContatoWhatsapp] = useState('');
  const [genero, setGenero] = useState('');
  const [vinculo, setVinculo] = useState('ESTUDANTE_REGULAR');
  const [serie, setSerie] = useState('');
  const [turma, setTurma] = useState('');
  const [cidadeNatal, setCidadeNatal] = useState('Seabra');
  const [localizacaoMoradia, setLocalizacaoMoradia] = useState('Sede de Seabra');
  const [detalheLocalizacao, setDetalheLocalizacao] = useState('');
  const [corRaca, setCorRaca] = useState('Parda');
  const [origemFamilia, setOrigemFamilia] = useState('Mista / Diversa');
  const [povoIndigena, setPovoIndigena] = useState('');
  const [corRacaInfluencia, setCorRacaInfluencia] = useState('Sim');
  const [espacosInfluencia, setEspacosInfluencia] = useState<string[]>([]);
  const [ambientesConversa, setAmbientesConversa] = useState<string[]>([]);
  const [sofreuPreconceito, setSofreuPreconceito] = useState('Não');
  const [locaisOcorrencia, setLocaisOcorrencia] = useState<string[]>([]);
  const [formasOcorrencia, setFormasOcorrencia] = useState<string[]>([]);
  const [relatoPreconceito, setRelatoPreconceito] = useState('');

  const handleArrayToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[], item: string) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // Grava no Supabase vinculando estritamente ao ID e nome do usuário logado (ex: Juliana)
      const { error } = await supabase.from('censo_respostas').insert([
        {
          user_id: profile.id,
          interviewer_name: profile.name,
          nome_participante: nomeParticipante,
          contato_whatsapp: contatoWhatsapp,
          genero,
          vinculo,
          serie,
          turma,
          grupo_escolar: `${serie} - ${turma}`.trim(),
          cidade_natal: cidadeNatal,
          local_moradia: localizacaoMoradia,
          detalhe_localizacao: detalheLocalizacao,
          cor_raca: corRaca,
          origem_familia: origemFamilia,
          povo_indigena: povoIndigena,
          cor_raca_influencia: corRacaInfluencia,
          espacos_influencia: espacosInfluencia,
          ambientes_conversa: ambientesConversa,
          sofreu_preconceito: sofreuPreconceito,
          locais_ocorrencia: locaisOcorrencia,
          formas_ocorrencia: formasOcorrencia,
          relato_preconceito: relatoPreconceito,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;

      setSuccess(true);
      setNomeParticipante('');
      setContatoWhatsapp('');
      setGenero('');
      setSerie('');
      setTurma('');
      setDetalheLocalizacao('');
      setPovoIndigena('');
      setEspacosInfluencia([]);
      setAmbientesConversa([]);
      setLocaisOcorrencia([]);
      setFormasOcorrencia([]);
      setRelatoPreconceito('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Erro ao salvar no Supabase:', err);
      setErrorMsg(err.message || 'Erro ao registrar os dados. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500 pb-12 px-4 sm:px-0">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-10">
        
        {/* Cabeçalho com Identificação Dinâmica do Usuário e Avatar por Gênero */}
        <div className="border-b border-slate-100 pb-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar genero={profile.genero} name={profile.name} className="w-14 h-14" />
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-blue-200 mb-2">
                <ClipboardList className="w-4 h-4" /> Coleta Oficial — CEEP Seabra
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Censo Escolar: Identidade e Vivências
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                Pesquisador(a) Responsável: <span className="font-bold text-slate-700">{profile.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Restante do formulário inalterado... */}
        {success && (
          <div className="mb-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-emerald-800">
            <AdinhaMascote pose="vencedora" className="w-16 h-16 shrink-0" />
            <div>
              <h4 className="font-black text-sm uppercase">🏆 Ficha Salva com Sucesso!</h4>
              <p className="text-xs text-emerald-700 font-medium">Os dados foram computados sob a responsabilidade de {profile.name} e sincronizados com o Supabase.</p>
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
          {/* BLOCO 1: IDENTIFICAÇÃO BÁSICA E PERFIL */}
          <div className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/60">
            <h2 className="text-sm font-black uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span>Bloco 1:</span> Identificação Básica e Perfil
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="inputNome" className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Nome Completo
                </label>
                <input
                  id="inputNome"
                  type="text"
                  required
                  placeholder="Nome completo do participante..."
                  value={nomeParticipante}
                  onChange={(e) => setNomeParticipante(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="inputContato" className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> Contato / WhatsApp
                </label>
                <input
                  id="inputContato"
                  type="text"
                  placeholder="(75) 90000-0000"
                  value={contatoWhatsapp}
                  onChange={(e) => setContatoWhatsapp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="inputGenero" className="text-xs font-bold text-slate-700 block">Gênero</label>
                <input
                  id="inputGenero"
                  type="text"
                  placeholder="Ex: Masculino, Feminino, Não-binário..."
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="selectVinculo" className="text-xs font-bold text-slate-700 block">Vínculo com a Instituição</label>
                <select
                  id="selectVinculo"
                  value={vinculo}
                  onChange={(e) => setVinculo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ESTUDANTE_REGULAR">Estudante (Ensino Médio Regular)</option>
                  <option value="ESTUDANTE_TECNICO">Estudante (Curso Técnico)</option>
                  <option value="PROFESSOR">Professor(a) / Docente</option>
                  <option value="FUNCIONARIO">Funcionário(a) / Técnico-Administrativo</option>
                  <option value="GESTAO">Gestão / Coordenação</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="inputSerie" className="text-xs font-bold text-slate-700 block">Série / Ano / Módulo</label>
                <input
                  id="inputSerie"
                  type="text"
                  required
                  placeholder="Ex: 2º Ano Técnico / 3º Ano Regular"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="inputTurma" className="text-xs font-bold text-slate-700 block">Turma / Setor</label>
                <input
                  id="inputTurma"
                  type="text"
                  required
                  placeholder="Ex: Informática A / Secretaria"
                  value={turma}
                  onChange={(e) => setTurma(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* BLOCO 2: LOCALIZAÇÃO E ORIGEM GEOGRÁFICA */}
          <div className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/60">
            <h2 className="text-sm font-black uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span>Bloco 2:</span> Localização e Origem Geográfica
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="inputCidadeNatal" className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" /> Cidade em que nasceu
                </label>
                <input
                  id="inputCidadeNatal"
                  type="text"
                  placeholder="Ex: Seabra, Palmeiras, Bonito..."
                  value={cidadeNatal}
                  onChange={(e) => setCidadeNatal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="selectMoradia" className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Onde mora atualmente?
                </label>
                <select
                  id="selectMoradia"
                  value={localizacaoMoradia}
                  onChange={(e) => setLocalizacaoMoradia(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Sede de Seabra">Sede de Seabra</option>
                  <option value="Zona Rural / Povoado de Seabra">Zona Rural / Povoado de Seabra</option>
                  <option value="Outra cidade">Outra cidade</option>
                </select>
              </div>

              {localizacaoMoradia !== 'Sede de Seabra' && (
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="inputDetalheLocal" className="text-xs font-bold text-slate-700 block">
                    {localizacaoMoradia === 'Zona Rural / Povoado de Seabra' ? 'Qual o nome do povoado ou região rural?' : 'Qual o nome da cidade onde mora?'}
                  </label>
                  <input
                    id="inputDetalheLocal"
                    type="text"
                    placeholder="Especifique o local..."
                    value={detalheLocalizacao}
                    onChange={(e) => setDetalheLocalizacao(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* BLOCO 3: AUTODECLARAÇÃO E ORIGEM FAMILIAR */}
          <div className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/60">
            <h2 className="text-sm font-black uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span>Bloco 3:</span> Autodeclaração e Origem Familiar
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="selectCorRaca" className="text-xs font-bold text-slate-700 block">Cor ou Raça (Padrão IBGE)</label>
                <select
                  id="selectCorRaca"
                  value={corRaca}
                  onChange={(e) => setCorRaca(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Branca">Branca</option>
                  <option value="Preta">Preta</option>
                  <option value="Parda">Parda</option>
                  <option value="Amarela">Amarela</option>
                  <option value="Indígena">Indígena</option>
                  <option value="Prefiro não responder">Prefiro não responder</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="selectOrigemFamilia" className="text-xs font-bold text-slate-700 block">Origem Predominante da Família</label>
                <select
                  id="selectOrigemFamilia"
                  value={origemFamilia}
                  onChange={(e) => setOrigemFamilia(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Predominantemente Negra">Predominantemente Negra</option>
                  <option value="Predominantemente Branca">Predominantemente Branca</option>
                  <option value="Predominantemente Indígena">Predominantemente Indígena</option>
                  <option value="Mista / Diversa">Mista / Diversa</option>
                  <option value="Prefiro não responder">Prefiro não responder</option>
                </select>
              </div>
            </div>

            {(corRaca === 'Indígena' || origemFamilia === 'Predominantemente Indígena') && (
              <div className="space-y-1.5 pt-2">
                <label htmlFor="inputPovoIndigena" className="text-xs font-bold text-slate-700 block">Qual o povo ou etnia indígena?</label>
                <input
                  id="inputPovoIndigena"
                  type="text"
                  placeholder="Ex: Povo Pataxó, Tuxá..."
                  value={povoIndigena}
                  onChange={(e) => setPovoIndigena(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 mt-4">
              <BookOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>Dica Pedagógica:</strong> O IBGE considera a população negra como a soma das pessoas que se declaram pretas e pardas.
              </div>
            </div>
          </div>

          {/* BLOCO 4: PERCEPÇÃO SOCIAL E VIVÊNCIAS */}
          <div className="space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/60">
            <h2 className="text-sm font-black uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <span>Bloco 4:</span> Percepção Social e Vivências
            </h2>

            <div className="space-y-2">
              <label htmlFor="selectInfluencia" className="text-xs font-bold text-slate-700 block">
                Você considera que a cor ou raça influencia a vida das pessoas no Brasil?
              </label>
              <select
                id="selectInfluencia"
                value={corRacaInfluencia}
                onChange={(e) => setCorRacaInfluencia(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
                <option value="Não sei responder">Não sei responder</option>
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Em quais espaços você percebe que essa influência ocorre com mais força?</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {['Escola', 'Trabalho', 'Relação com Polícia/Justiça', 'Convívio Social', 'Atendimento à Saúde', 'Repartições Públicas', 'Relações Afetivas'].map((item) => {
                  const isSelected = espacosInfluencia.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleArrayToggle(setEspacosInfluencia, espacosInfluencia, item)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                        isSelected ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{item}</span>
                      <span>{isSelected ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Ambientes de conversa sobre identidade, raça ou diversidade</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {['Familiar', 'Escolar', 'Conversa com amigos'].map((item) => {
                  const isSelected = ambientesConversa.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleArrayToggle(setAmbientesConversa, ambientesConversa, item)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                        isSelected ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{item}</span>
                      <span>{isSelected ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="selectSofreuPreconceito" className="text-xs font-bold text-slate-700 block">Você já sofreu preconceito ou discriminação?</label>
              <select
                id="selectSofreuPreconceito"
                value={sofreuPreconceito}
                onChange={(e) => setSofreuPreconceito(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="Não">Não</option>
                <option value="Sim">Sim</option>
                <option value="Prefiro não responder">Prefiro não responder</option>
              </select>
            </div>

            {sofreuPreconceito === 'Sim' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-orange-500" /> Onde isso ocorreu?
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Escola', 'Trabalho', 'Comércio', 'Serviço de Saúde', 'Serviço Público', 'Polícia/Justiça', 'Transporte', 'Internet/Redes Sociais', 'Ambiente Familiar', 'Espaço Religioso'].map((item) => {
                      const isSelected = locaisOcorrencia.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleArrayToggle(setLocaisOcorrencia, locaisOcorrencia, item)}
                          className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-between transition ${
                            isSelected ? 'bg-orange-50 border-orange-300 text-orange-900' : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{item}</span>
                          <span>{isSelected ? '✓' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">De que forma aconteceu?</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {['Piadas/comentários', 'Xingamentos/ofensas', 'Apelidos relacionados', 'Exclusão/isolamento', 'Tratamento desigual', 'Suspeita ou vigilância injustificada', 'Oportunidade negada', 'Agressão/ameaça'].map((item) => {
                      const isSelected = formasOcorrencia.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleArrayToggle(setFormasOcorrencia, formasOcorrencia, item)}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                            isSelected ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{item}</span>
                          <span>{isSelected ? '✓' : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="inputRelato" className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-orange-500" /> Relato (Opcional e Sigiloso)
                  </label>
                  <textarea
                    id="inputRelato"
                    rows={3}
                    placeholder="Descreva brevemente a situação se desejar..."
                    value={relatoPreconceito}
                    onChange={(e) => setRelatoPreconceito(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 text-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
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