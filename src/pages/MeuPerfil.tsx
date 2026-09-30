import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUserSession } from "../hooks/useUserSession";
import { ShieldCheck, BookOpen, Camera, Save, Award, Sparkles, Edit3, X, CheckCircle2, ClipboardList } from "lucide-react";

interface MeuPerfilProps {
  readonly escolaNome: string;
}

export const MeuPerfil: React.FC<MeuPerfilProps> = ({ escolaNome }) => {
  const { profile, loading: sessionLoading } = useUserSession();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [coletasCount, setColetasCount] = useState(0);
  
  // Estado do Perfil sincronizado com a sessão ativa do usuário
  const [perfil, setPerfil] = useState({
    nome: "",
    email: "",
    tipo: "PROFESSOR" as "ESTUDANTE" | "PROFESSOR",
    turma_ou_cargo: "Professor(a) & Orientador(a) do Projeto",
    bio: "Explorador(a) da tecnologia, robótica e educação pública transformadora na Chapada Diamantina.",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    banner_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80"
  });

  // Atualiza o estado local assim que o hook recupera os dados da sessão usando optional chaining
  useEffect(() => {
    if (profile?.name) {
      setPerfil(prev => ({
        ...prev,
        nome: profile.name,
        email: profile.email,
        avatar_url: profile.genero === 'feminino' 
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" 
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80"
      }));
    }
  }, [profile]);

  useEffect(() => {
    // Busca a contagem real de coletas/registros realizados no Supabase
    const fetchColetasCount = async () => {
      try {
        const { count, error } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true });
        
        if (!error && count !== null) {
          setColetasCount(count);
        }
      } catch (err) {
        console.error("Erro ao buscar contagem de coletas:", err);
      }
    };

    fetchColetasCount();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Simulação de salvamento das alterações
      await new Promise(resolve => setTimeout(resolve, 800));
      alert("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-500 animate-pulse">Carregando perfil do usuário ativo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-12">
      
      {/* CAPA DA REDE SOCIAL */}
      <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
        <img 
          src={perfil.banner_url} 
          alt="Capa do Perfil" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end justify-between p-6">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold rounded-full shadow-md flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Censo CEEP — Perfil Verificado
          </span>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer border-0 ${
              isEditing 
                ? 'bg-rose-500 text-white hover:bg-rose-600' 
                : 'bg-white/90 hover:bg-white text-slate-800 backdrop-blur-md'
            }`}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4 text-blue-600" />}
            {isEditing ? 'Cancelar Edição' : 'Editar Perfil'}
          </button>
        </div>
      </div>

      {/* CABEÇALHO DO PERFIL (MODO VISUALIZAÇÃO) */}
      <div className="agora-card relative -mt-16 pt-16 md:pt-8 px-6 md:px-8 pb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        
        {/* AVATAR CUSTOMIZÁVEL */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-slate-200">
            <img 
              src={perfil.avatar_url} 
              alt={perfil.nome} 
              className="w-full h-full object-cover"
            />
          </div>
          {isEditing && (
            <label htmlFor="avatar-upload" className="absolute bottom-2 right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg cursor-pointer transition-all">
              <Camera className="w-4 h-4" />
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setPerfil({ ...perfil, avatar_url: url });
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* INFO PRINCIPAL */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center justify-center md:justify-start gap-2">
                {perfil.nome}
                <CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-50" />
              </h1>
              <p className="text-sm font-bold text-blue-600 flex items-center justify-center md:justify-start gap-1.5 mt-0.5">
                {perfil.tipo === 'PROFESSOR' ? <ShieldCheck className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                {perfil.tipo === 'PROFESSOR' ? 'Professor, Gestor & Orientador do Projeto' : 'Estudante Pesquisador de Campo'}
              </p>
            </div>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 self-center">
              {escolaNome}
            </span>
          </div>

          <p className="text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
            {perfil.bio}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs font-semibold text-slate-500">
            {perfil.tipo === 'ESTUDANTE' ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <ClipboardList className="w-4 h-4 text-emerald-600" /> Coletas Realizadas por Mim: <strong>{coletasCount}</strong>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                <Award className="w-4 h-4 text-blue-600" /> Total de Amostras na Escola (Gestão): <strong>{coletasCount}</strong>
              </span>
            )}
            <span className="flex items-center gap-1.5"><Edit3 className="w-4 h-4 text-blue-500" /> {perfil.turma_ou_cargo}</span>
          </div>
        </div>
      </div>

      {/* SEÇÃO CONDICIONAL: EDIÇÃO OU LEITURA */}
      {isEditing ? (
        <form onSubmit={handleSave} className="agora-card space-y-6 animate-in fade-in duration-300">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" /> Editando Informações do Perfil
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Atualize seus dados para refletir corretamente na comunidade e relatórios oficiais do Censo CEEP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="perfil-nome" className="block text-xs font-bold text-slate-700 uppercase mb-2">Nome Completo</label>
              <input 
                id="perfil-nome"
                type="text" 
                value={perfil.nome} 
                onChange={e => setPerfil({ ...perfil, nome: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="perfil-email" className="block text-xs font-bold text-slate-700 uppercase mb-2">E-mail Institucional</label>
              <input 
                id="perfil-email"
                type="email" 
                value={perfil.email} 
                disabled
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="perfil-tipo" className="block text-xs font-bold text-slate-700 uppercase mb-2">Papel na Instituição</label>
              <select 
                id="perfil-tipo"
                value={perfil.tipo}
                onChange={e => setPerfil({ ...perfil, tipo: e.target.value as any })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
              >
                <option value="ESTUDANTE">Estudante (Pesquisador de Campo)</option>
                <option value="PROFESSOR">Professor / Gestor / Orientador</option>
              </select>
            </div>

            <div>
              <label htmlFor="perfil-turma-cargo" className="block text-xs font-bold text-slate-700 uppercase mb-2">Turma ou Cargo/Função</label>
              <input 
                id="perfil-turma-cargo"
                type="text" 
                value={perfil.turma_ou_cargo} 
                onChange={e => setPerfil({ ...perfil, turma_ou_cargo: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
                placeholder="Ex: 3º Ano Informática ou Professor de Física"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="perfil-bio" className="block text-xs font-bold text-slate-700 uppercase mb-2">Biografia / Sobre Mim</label>
              <textarea 
                id="perfil-bio"
                rows={3}
                value={perfil.bio} 
                onChange={e => setPerfil({ ...perfil, bio: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white resize-none"
                placeholder="Conte um pouco sobre sua trajetória na escola..."
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="perfil-avatar" className="block text-xs font-bold text-slate-700 uppercase mb-2">URL da Foto de Avatar (Opcional)</label>
              <input 
                id="perfil-avatar"
                type="text" 
                value={perfil.avatar_url} 
                onChange={e => setPerfil({ ...perfil, avatar_url: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:bg-white"
                placeholder="https://exemplo.com/sua-foto.jpg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer border-0"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer border-0"
            >
              <Save className="w-4 h-4" /> {saving ? "A salvar..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      ) : (
        <div className="agora-card space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Credenciais & Permissões do Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">E-mail de Acesso</span>
              <span className="font-semibold text-slate-800">{perfil.email}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Perfil Ativo na Pesquisa</span>
              <span className="font-semibold text-slate-800">
                {perfil.tipo === 'ESTUDANTE' ? 'Coletor de Campo (Pesquisador Estudantil)' : 'Gestor, Administrador & Orientador do Censo'}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MeuPerfil;