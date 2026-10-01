import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Save, Edit3, X, ShieldCheck, Mail, Phone, MapPin, Briefcase } from "lucide-react";

interface MeuPerfilProps {
  readonly escolaNome: string;
}

export const MeuPerfil: React.FC<MeuPerfilProps> = ({ escolaNome }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [perfil, setPerfil] = useState({
    id: "",
    nome: "",
    email: "",
    papel: "entrevistador",
    turma_ou_cargo: "",
    telefone: "",
    telefone_alternativo: "",
    cep: "",
    cidade: "Palmeiras",
    estado: "BA",
    endereco: "",
    numero: "",
    bairro: "Mandacaru",
    disciplina_principal: "",
    disponibilidade: "",
    bio: "",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const userId = session.user.id;
        const userEmail = session.user.email || "";

        const { data: pessoaData, error } = await supabase
          .from('pessoas')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error("Erro ao buscar dados na tabela pessoas:", error.message);
        }

        const nomeCompleto = pessoaData?.nome_completo || session.user.user_metadata?.nome_completo || "Usuário Censo";
        const papelUsuario = pessoaData?.papel || session.user.user_metadata?.papel || "entrevistador";
        const turmaCargo = pessoaData?.turma_ou_cargo || (papelUsuario === 'entrevistador' ? '1º ADM CM' : 'Professor');

        const isFeminino = nomeCompleto.toLowerCase().includes('maria') || 
                           nomeCompleto.toLowerCase().includes('ana') || 
                           nomeCompleto.toLowerCase().includes('juliana') ||
                           nomeCompleto.toLowerCase().includes('stefany') ||
                           nomeCompleto.toLowerCase().includes('samyra') ||
                           nomeCompleto.toLowerCase().includes('isadora') ||
                           nomeCompleto.toLowerCase().includes('izabela');

        const avatarPadrao = isFeminino 
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80";

        setPerfil({
          id: userId,
          nome: nomeCompleto,
          email: userEmail,
          papel: papelUsuario,
          turma_ou_cargo: turmaCargo,
          telefone: pessoaData?.telefone || "(75) 99999-9999",
          telefone_alternativo: pessoaData?.telefone_alternativo || "",
          cep: pessoaData?.cep || "46933-475",
          cidade: pessoaData?.cidade || "Palmeiras",
          estado: pessoaData?.estado || "BA",
          endereco: pessoaData?.endereco || "Rua Frederico Sanches de Carvalho",
          numero: pessoaData?.numero || "244",
          bairro: pessoaData?.bairro || "Mandacaru",
          disciplina_principal: pessoaData?.disciplina_principal || "Censo & Pesquisa",
          disponibilidade: pessoaData?.disponibilidade || "Disponível para turnos regulares.",
          bio: pessoaData?.bio || "Pesquisador(a) do Censo CEEP — Projeto Ada Lovelace.",
          avatar_url: pessoaData?.avatar_url || avatarPadrao
        });

      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    }

    void fetchUserData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pessoas')
        .update({
          nome_completo: perfil.nome,
          turma_ou_cargo: perfil.turma_ou_cargo,
          bio: perfil.bio,
          avatar_url: perfil.avatar_url
        })
        .eq('id', perfil.id);

      if (error) throw error;
      alert("Perfil atualizado com sucesso!");
      setIsEditing(false); // Retorna para o modo visualização após salvar
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar alterações: " + (err.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-500 animate-pulse">Carregando painel de perfil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-16">
      
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex justify-between items-center bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-100 shadow-inner shrink-0">
            <img src={perfil.avatar_url} alt={perfil.nome} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{perfil.nome}</h1>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-blue-200">
                {perfil.papel}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" /> {perfil.turma_ou_cargo} • {escolaNome}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition cursor-pointer border-0 ${
            isEditing ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4 text-blue-400" />}
          {isEditing ? 'Cancelar' : 'Editar Perfil'}
        </button>
      </div>

      {/* MODO EDIÇÃO OU MODO VISUALIZAÇÃO PADRÃO */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600" /> Atualizar Informações do Membro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inputNomeEdit" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
              <input 
                id="inputNomeEdit"
                type="text"
                value={perfil.nome}
                onChange={e => setPerfil({ ...perfil, nome: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="inputCargoEdit" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cargo / Turma</label>
              <input 
                id="inputCargoEdit"
                type="text"
                value={perfil.turma_ou_cargo}
                onChange={e => setPerfil({ ...perfil, turma_ou_cargo: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="inputBioEdit" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mini Bio</label>
              <textarea 
                id="inputBioEdit"
                rows={3}
                value={perfil.bio}
                onChange={e => setPerfil({ ...perfil, bio: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="inputAvatarEdit" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">URL da Foto de Avatar</label>
              <input 
                id="inputAvatarEdit"
                type="text"
                value={perfil.avatar_url}
                onChange={e => setPerfil({ ...perfil, avatar_url: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer border-0"
            >
              <Save className="w-4 h-4" /> {saving ? "A salvar..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      ) : (
        /* CARTÃO ESTILO REDE SOCIAL (PADRÃO) */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
              Credenciais & Contato
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">E-mail Institucional</span>
                  <span className="font-semibold text-slate-800">{perfil.email}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefone de Contato</span>
                  <span className="font-semibold text-slate-800">{perfil.telefone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
              Endereço e Localização na Chapada Diamantina
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Localização</span>
                  <span className="font-semibold text-slate-800">{perfil.endereco}, nº {perfil.numero}</span>
                  <span className="text-xs text-slate-500 block">{perfil.bairro} — {perfil.cidade}/{perfil.estado}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Disciplina / Foco</span>
                <span className="font-semibold text-slate-800">{perfil.disciplina_principal}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status do Membro</span>
                <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Ativo no Censo
                </span>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 mt-4">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Mini Bio</span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">{perfil.bio}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MeuPerfil;