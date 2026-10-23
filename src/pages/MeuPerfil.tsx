import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, supabaseAdmin } from "../lib/supabaseClient";
import {
  Save, Edit3, X, ShieldCheck, Mail, Phone, MapPin,
  Briefcase, BookOpen, Star, Award, GraduationCap,
  CheckCircle, UserCircle, Calendar, Hash, Trophy, Target,
  Upload, Camera, Trash2, Link as LinkIcon, Loader2, Check, AlertCircle, RefreshCw,
  Plus, MessageCircle, Heart, UserPlus, MoreHorizontal, Sparkles, Image as ImageIcon,
  ChevronDown, Flame, Share2, ThumbsUp, ChevronRight
} from "lucide-react";
import BadgeList from "../components/Gamification/BadgeList";
import { CrachaPesquisador } from "../components/CrachaPesquisador";
import { badgeService } from "../services/badgeService";

/**
 * Redimensiona e recorta a imagem em quadrado (512x512) no cliente antes do upload.
 */
async function processImageForAvatar(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("O arquivo selecionado não é uma imagem válida."));
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      const MAX_SIZE = 512;
      const minDimension = Math.min(img.width, img.height);
      const sx = (img.width - minDimension) / 2;
      const sy = (img.height - minDimension) / 2;

      canvas.width = Math.min(minDimension, MAX_SIZE);
      canvas.height = Math.min(minDimension, MAX_SIZE);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.88
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível carregar a imagem selecionada."));
    };
    img.src = objectUrl;
  });
}

/**
 * Envia a foto processada para o bucket público do Supabase Storage e retorna a URL pública.
 */
async function uploadAvatarImage(file: File, userId: string): Promise<string> {
  const processedBlob = await processImageForAvatar(file);
  const safeId = userId || "user";
  const fileName = `avatars/${safeId}_${Date.now()}.jpg`;

  let { error: uploadError } = await supabase.storage
    .from("lyka_media")
    .upload(fileName, processedBlob, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    console.warn("Upload com cliente padrão falhou, tentando com supabaseAdmin:", uploadError.message);
    const { error: adminError } = await supabaseAdmin.storage
      .from("lyka_media")
      .upload(fileName, processedBlob, {
        contentType: "image/jpeg",
        upsert: true,
      });
    if (adminError) {
      throw new Error(`Erro ao enviar foto: ${adminError.message || uploadError.message}`);
    }
  }

  const { data: pubData } = supabase.storage.from("lyka_media").getPublicUrl(fileName);
  if (!pubData?.publicUrl) {
    throw new Error("Não foi possível obter o endereço público da foto.");
  }
  return pubData.publicUrl;
}

interface MeuPerfilProps {
  readonly escolaNome: string;
}

const NIVEIS = [
  { nome: "Novato",      minXP: 0,    color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", icon: "🌱" },
  { nome: "Explorador",  minXP: 200,  color: "#3B82F6", bg: "#eff6ff", border: "#bfdbfe", icon: "🔍" },
  { nome: "Pesquisador", minXP: 500,  color: "#8B5CF6", bg: "#ede9fe", border: "#ddd6fe", icon: "📋" },
  { nome: "Especialista",minXP: 1000, color: "#F59E0B", bg: "#fffbeb", border: "#fde68a", icon: "⭐" },
  { nome: "Mestre",      minXP: 2500, color: "#EF4444", bg: "#fef2f2", border: "#fecaca", icon: "🏆" },
];
function getNivel(xp: number) {
  let lvl = NIVEIS[0];
  for (const n of NIVEIS) { if (xp >= n.minXP) lvl = n; }
  return lvl;
}
function getNextNivel(xp: number) {
  for (const n of NIVEIS) { if (xp < n.minXP) return n; }
  return null;
}

const GRAD_PAIRS: [string, string][] = [
  ["#3B82F6","#6366F1"], ["#EC4899","#F43F5E"], ["#10B981","#14B8A6"],
  ["#F59E0B","#F97316"], ["#8B5CF6","#A855F7"], ["#06B6D4","#0EA5E9"],
];
function gradFor(name: string): [string, string] {
  return GRAD_PAIRS[(name || "?").charCodeAt(0) % GRAD_PAIRS.length];
}
function getInitials(name: string) {
  return (name || "?").split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase();
}

function papelBadge(papel: string) {
  if (papel === "gestor" || papel === "admin" || papel === "professor") return { label: "Gestor", color: "#F59E0B", bg: "#FEF3C7", border: "#FDE68A" };
  if (papel === "entrevistador_aluno" || papel === "entrevistador") return { label: "Pesquisador", color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" };
  return { label: "Entrevistado", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" };
}

function StatCard({ value, label, icon }: { value: string | number; label: string; icon: React.ReactNode }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      padding: "14px 8px", gap: 4,
    }}>
      <div style={{ color: "#7c3aed", marginBottom: 2 }}>{icon}</div>
      <span style={{ fontWeight: 900, fontSize: 20, color: "#0f172a", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textAlign: "center", letterSpacing: "0.2px" }}>{label}</span>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ color: "#7c3aed", flexShrink: 0, marginTop: 1 }}>{icon}</div>
      <div>
        <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{value}</span>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, multiline = false, placeholder = "" }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  const base: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "11px 14px", background: "#f8fafc",
    border: "1.5px solid #e2e8f0", borderRadius: 12,
    fontSize: 14, fontWeight: 500, color: "#0f172a",
    fontFamily: "inherit", outline: "none", transition: "border-color 0.2s",
    resize: "none" as const,
  };
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={3} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)} style={base}
          onFocus={e => { e.target.style.borderColor = "#7c3aed"; e.target.style.background = "#fff"; }}
          onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
        />
      ) : (
        <input id={id} type="text" value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)} style={base}
          onFocus={e => { e.target.style.borderColor = "#7c3aed"; e.target.style.background = "#fff"; }}
          onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
        />
      )}
    </div>
  );
}

interface PostItem {
  id: number;
  user_id: string;
  author_name: string;
  content: string;
  image_url?: string;
  type: string;
  created_at: string;
  likes_count?: number;
  liked?: boolean;
}

interface StoryHighlight {
  id: string;
  label: string;
  coverImg?: string;
  iconBg?: string;
}

export const MeuPerfil: React.FC<MeuPerfilProps> = ({ escolaNome }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [coverImgErr, setCoverImgErr] = useState(false);
  const [totalFichas, setTotalFichas] = useState(0);
  const [xpStats, setXpStats] = useState({ posts: 0, msgs: 0, likes: 0 });
  const [totalPessoasCount, setTotalPessoasCount] = useState(156);
  const memberSince = new Date().getFullYear();

  // Abas sociais estilo Twitter/X e Facebook
  const [activeTab, setActiveTab] = useState<"midia" | "respostas" | "repostagens" | "postagens">("midia");
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);
  const [mediaPosts, setMediaPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Trending / O que está acontecendo
  const [trendingTopics, setTrendingTopics] = useState([
    { category: "Censo CEEP · Tendências", topic: "#Meta20Alcançada", posts: "128 menções" },
    { category: "Pesquisa Científica · Destaque", topic: "Projeto Ada Lovelace", posts: "342 menções" },
    { category: "Educação · Bahia", topic: "CEEP Seabra", posts: "89 menções" },
    { category: "Comunidade · Tendências", topic: "#AdinhaLovelace", posts: "215 menções" },
  ]);

  // Destaques / Stories
  const [highlights, setHighlights] = useState<StoryHighlight[]>([
    { id: "destaques", label: "Destaques", coverImg: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&auto=format&fit=crop&q=80" },
    { id: "amor", label: "Amor", coverImg: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=200&auto=format&fit=crop&q=80" },
    { id: "ensaio", label: "Ensaio", coverImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
    { id: "songs", label: "Songs", coverImg: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80" },
    { id: "city", label: "City", coverImg: "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=200&auto=format&fit=crop&q=80" },
  ]);

  const [perfil, setPerfil] = useState({
    id: "", nome: "", email: "", papel: "entrevistador_aluno",
    turma_ou_cargo: "", telefone: "", cep: "", cidade: "Palmeiras",
    estado: "BA", endereco: "", numero: "", bairro: "Mandacaru",
    bio: "", avatar_url: "", genero: "masculino",
    cover_url: "",
  });
  const [editPerfil, setEditPerfil] = useState({ ...perfil });
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarInputMode, setAvatarInputMode] = useState<"upload" | "url">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let authUser = session?.user;
        if (!authUser) {
          try {
            const offlineSession = JSON.parse(localStorage.getItem('ceep_offline_session') || '{}');
            authUser = offlineSession?.user;
          } catch {}
        }
        if (!authUser) return;
        const userId = authUser.id;
        const userEmail = authUser.email || "";

        const [
          { data: pessoaData },
          { count: entrevistasCount },
          { count: pC },
          { count: mC },
          { count: lC },
          { count: totalColegasCount },
          { data: myPosts }
        ] = await Promise.all([
          supabase.from("pessoas").select("*").eq("id", userId).maybeSingle(),
          supabase.from("entrevistas").select("*", { count: "exact", head: true }).eq("entrevistador_id", userId),
          supabase.from("lyka_posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("lyka_messages").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("pessoa_likes").select("*", { count: "exact", head: true }).eq("liked_id", userId),
          supabase.from("pessoas").select("*", { count: "exact", head: true }),
          supabase.from("lyka_posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(40)
        ]);

        let pendingUserCount = 0;
        let cachedFichasCount = 0;
        try {
          const pending = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
          pendingUserCount = pending.filter((item: any) => {
            const raw = item.data || item;
            return (
              raw.entrevistador_id === userId ||
              raw.user_id === userId ||
              raw.entrevistador_id === 'offline-user' ||
              !raw.entrevistador_id
            );
          }).length;
          const cachedInterviews = JSON.parse(localStorage.getItem(`censo_my_interviews_cache_${userId}`) || '[]');
          cachedFichasCount = Array.isArray(cachedInterviews) ? cachedInterviews.length : 0;
        } catch {}
        const baseOnlineCount = typeof entrevistasCount === 'number' ? entrevistasCount : cachedFichasCount;
        const totalFichasContadas = baseOnlineCount + pendingUserCount;
        setTotalFichas(totalFichasContadas);
        setXpStats({ posts: pC || 0, msgs: mC || 0, likes: lC || 0 });
        if (totalColegasCount) {
          setTotalPessoasCount(totalColegasCount);
        }

        let cachedProfile: any = null;
        try {
          cachedProfile = JSON.parse(localStorage.getItem('ceep_cached_profile') || 'null');
        } catch {}

        const nomeCompleto = pessoaData?.nome_completo || cachedProfile?.nomeCompleto || authUser.user_metadata?.nome_completo || "Usuário Censo";
        const papelUsuario = pessoaData?.papel || cachedProfile?.papel || "entrevistador_aluno";
        const turmaCargo = pessoaData?.turma_ou_cargo || cachedProfile?.turmaOuCargo || "";
        const genero = pessoaData?.genero || cachedProfile?.genero || "masculino";

        const avatarPadrao = genero === "feminino"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80";

        // Recupera capa personalizada salva localmente se houver
        let localCover = "";
        try {
          localCover = localStorage.getItem(`ceep_profile_cover_${userId}`) || "";
        } catch {}

        const defaultCover = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80";

        const p = {
          id: userId, nome: nomeCompleto, email: userEmail, papel: papelUsuario,
          turma_ou_cargo: turmaCargo, telefone: pessoaData?.telefone || "",
          cep: pessoaData?.cep || "", cidade: pessoaData?.cidade || "Palmeiras",
          estado: pessoaData?.estado || "BA", endereco: pessoaData?.endereco || "",
          numero: pessoaData?.numero || "", bairro: pessoaData?.bairro || "Mandacaru",
          bio: pessoaData?.bio || "", avatar_url: pessoaData?.avatar_url || cachedProfile?.avatarUrl || avatarPadrao,
          genero,
          cover_url: localCover || defaultCover,
        };
        setPerfil(p);
        setEditPerfil(p);

        // Posts do usuário e posts com mídia
        const postsList = (myPosts || []) as PostItem[];
        setUserPosts(postsList);
        const withMedia = postsList.filter(item => Boolean(item.image_url));
        setMediaPosts(withMedia);

      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    }
    void fetchUserData();
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadMsg({ type: "error", text: "Por favor, selecione um arquivo de imagem (JPG, PNG, WEBP, etc.)." });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadMsg({ type: "error", text: "A imagem selecionada é muito pesada (máx 15MB). Escolha outra foto." });
      return;
    }

    setUploadingImg(true);
    setUploadMsg(null);

    const localUrl = URL.createObjectURL(file);
    setEditPerfil(prev => ({ ...prev, avatar_url: localUrl }));
    setImgErr(false);

    try {
      const publicUrl = await uploadAvatarImage(file, perfil.id);
      URL.revokeObjectURL(localUrl);
      setEditPerfil(prev => ({ ...prev, avatar_url: publicUrl }));
      setUploadMsg({ type: "success", text: "Foto carregada com sucesso! Clique em 'Salvar alterações' para confirmar." });
    } catch (err: unknown) {
      console.warn("Upload no storage falhou, gerando base64 otimizado:", err);
      try {
        const compressedBlob = await processImageForAvatar(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Url = reader.result as string;
          setEditPerfil(prev => ({ ...prev, avatar_url: base64Url }));
          setUploadMsg({
            type: "success",
            text: "Foto pronta! Clique em 'Salvar alterações' para gravar no seu perfil.",
          });
        };
        reader.readAsDataURL(compressedBlob);
      } catch {
        const msg = err instanceof Error ? err.message : "Erro ao processar imagem.";
        setUploadMsg({ type: "error", text: msg });
      }
    } finally {
      setUploadingImg(false);
    }
  };

  const handleCoverSelect = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione um arquivo de imagem válido.");
      return;
    }
    setUploadingCover(true);
    try {
      const localUrl = URL.createObjectURL(file);
      setCoverImgErr(false);
      setEditPerfil(prev => ({ ...prev, cover_url: localUrl }));

      try {
        const publicUrl = await uploadAvatarImage(file, `${perfil.id}_cover`);
        setEditPerfil(prev => ({ ...prev, cover_url: publicUrl }));
        localStorage.setItem(`ceep_profile_cover_${perfil.id}`, publicUrl);
      } catch {
        // Fallback para FileReader base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setEditPerfil(prev => ({ ...prev, cover_url: base64 }));
          try {
            localStorage.setItem(`ceep_profile_cover_${perfil.id}`, base64);
          } catch {}
        };
        reader.readAsDataURL(file);
      }
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const gLow = (editPerfil.genero || 'masculino').toLowerCase().trim();
      const validGenero = ['masculino', 'feminino', 'outro'].includes(gLow) ? gLow : 'outro';

      const updatePayload = {
        nome_completo: editPerfil.nome,
        turma_ou_cargo: editPerfil.turma_ou_cargo,
        bio: editPerfil.bio,
        avatar_url: editPerfil.avatar_url,
        telefone: editPerfil.telefone,
        cidade: editPerfil.cidade,
        estado: editPerfil.estado,
        endereco: editPerfil.endereco,
        numero: editPerfil.numero,
        bairro: editPerfil.bairro,
        cep: editPerfil.cep,
        genero: validGenero,
      };

      let { error } = await supabase.from("pessoas").update(updatePayload).eq("id", perfil.id);
      if (error) {
        const { error: adminErr } = await supabaseAdmin.from("pessoas").update(updatePayload).eq("id", perfil.id);
        if (adminErr) throw adminErr;
      }

      // Salva capa no localStorage
      if (editPerfil.cover_url) {
        try {
          localStorage.setItem(`ceep_profile_cover_${perfil.id}`, editPerfil.cover_url);
        } catch {}
      }

      // Sincroniza localmente para sessões de teste e cache
      try {
        const testUserStr = localStorage.getItem('ceep_test_user');
        if (testUserStr) {
          const testUser = JSON.parse(testUserStr);
          if (testUser.id === perfil.id || !testUser.id) {
            testUser.avatarUrl = editPerfil.avatar_url;
            testUser.nomeCompleto = editPerfil.nome;
            testUser.turmaOuCargo = editPerfil.turma_ou_cargo;
            localStorage.setItem('ceep_test_user', JSON.stringify(testUser));
          }
        }
      } catch (e) {
        console.warn("Erro ao sincronizar ceep_test_user:", e);
      }

      try {
        await supabase.auth.updateUser({
          data: {
            nome_completo: editPerfil.nome,
            avatar_url: editPerfil.avatar_url,
          }
        });
      } catch {}

      setPerfil({ ...editPerfil });
      setImgErr(false);
      setCoverImgErr(false);
      setUploadMsg(null);
      setIsEditing(false);
      setSaved(true);
      if (editPerfil.avatar_url && editPerfil.turma_ou_cargo) {
        void badgeService.unlockBadge(perfil.id, "perfil_completo");
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      alert("Erro ao salvar: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditPerfil({ ...perfil });
    setUploadMsg(null);
    setImgErr(false);
    setCoverImgErr(false);
    setIsEditing(false);
  };

  const handleAddHighlight = () => {
    const nome = prompt("Nome do novo destaque (ex: Eventos, Campo, Amigos):");
    if (!nome) return;
    const novoHighlight: StoryHighlight = {
      id: `hl-${Date.now()}`,
      label: nome.slice(0, 10),
      coverImg: perfil.avatar_url || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&auto=format&fit=crop&q=80",
    };
    setHighlights(prev => [...prev, novoHighlight]);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
        <style>{`@keyframes perfilSpin { to { transform: rotate(360deg); } }`}</style>

        {perfil.turma_ou_cargo?.toUpperCase().includes('1º ADM') || perfil.turma_ou_cargo?.toUpperCase().includes('1° ADM') || perfil.turma_ou_cargo?.toUpperCase().includes('1 ADM') ? (
          <div style={{ marginBottom: 24 }}>
            <CrachaPesquisador nome={perfil.nome} avatarUrl={perfil.avatar_url} turma={perfil.turma_ou_cargo} />
          </div>
        ) : null}
        <div style={{ width: 44, height: 44, border: "3px solid #ede9fe", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "perfilSpin 0.8s linear infinite" }} />
        <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 14 }}>Carregando perfil...</span>
      </div>
    );
  }

  const badge = papelBadge(perfil.papel);
  const [g1, g2] = gradFor(perfil.nome);
  const activeAvatar = isEditing ? editPerfil.avatar_url : perfil.avatar_url;
  const showAvatar = activeAvatar && !imgErr;

  const activeCover = isEditing ? editPerfil.cover_url : perfil.cover_url;
  const showCover = activeCover && !coverImgErr;

  // Imagens da galeria de Mídia (combina as do usuário com preenchimento visual elegante se tiver poucas)
  const fallbackMedia = [
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&auto=format&fit=crop&q=80",
  ];

  const galleryImages = mediaPosts.length > 0 
    ? mediaPosts.map(p => p.image_url!).concat(fallbackMedia).slice(0, 15)
    : fallbackMedia;

  return (
    <div style={{ width: "100%", maxWidth: 1080, margin: "0 auto", paddingBottom: 80, fontFamily: "inherit" }}>
      <style>{`
        @keyframes perfilSpin { to { transform: rotate(360deg); } }
        @keyframes perfilPop { from { opacity:0; transform: scale(0.98) translateY(6px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes savedPulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
        .tab-btn-active { border-bottom: 3.5px solid #0084ff !important; color: #0f172a !important; font-weight: 800 !important; }
        .highlight-item:hover { transform: scale(1.05); }
      `}</style>

      {/* Crachá comemorativo para 1º ADM */}
      {perfil.turma_ou_cargo?.toUpperCase().includes('1º ADM') || perfil.turma_ou_cargo?.toUpperCase().includes('1° ADM') || perfil.turma_ou_cargo?.toUpperCase().includes('1 ADM') ? (
        <div style={{ marginBottom: 20 }}>
          <CrachaPesquisador nome={perfil.nome} avatarUrl={perfil.avatar_url} turma={perfil.turma_ou_cargo} />
        </div>
      ) : null}

      {/* ── CARD PRINCIPAL COM A CAPA AMPLA DO TOPO ──────────────────────── */}
      <div style={{
        background: "#fff",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 6px 30px rgba(0,0,0,0.06)",
        border: "1px solid #e2e8f0",
        animation: "perfilPop 0.35s ease",
      }}>

        {/* Capa Panorâmica estilo Facebook */}
        <div style={{
          height: 280,
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#1e293b",
        }}>
          {showCover ? (
            <img
              src={activeCover}
              alt="Capa de perfil"
              onError={() => setCoverImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)",
            }} />
          )}

          {/* Sombra sutil superior/inferior para contraste */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 40%, rgba(0,0,0,0.4) 100%)",
            pointerEvents: "none",
          }} />

          {/* Input oculto para capa */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleCoverSelect(file);
              e.target.value = "";
            }}
          />

          {/* Botão de Trocar Capa */}
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8, zIndex: 10 }}>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              title="Trocar foto de capa"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 99,
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.4)",
                color: "#1e293b", fontSize: 12, fontWeight: 700,
                cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                transition: "all 0.15s",
              }}
            >
              {uploadingCover ? (
                <Loader2 style={{ width: 14, height: 14, animation: "perfilSpin 0.8s linear infinite" }} />
              ) : (
                <Camera style={{ width: 14, height: 14, color: "#0284c7" }} />
              )}
              <span>{uploadingCover ? "Atualizando capa..." : "Editar capa"}</span>
            </button>

            <button
              type="button"
              onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 99,
                background: isEditing ? "rgba(239,68,68,0.9)" : "rgba(15,23,42,0.75)",
                border: "none",
                color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: "pointer", backdropFilter: "blur(8px)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                transition: "all 0.2s",
              }}
            >
              {isEditing ? <X style={{ width: 13, height: 13 }} /> : <Edit3 style={{ width: 13, height: 13 }} />}
              {isEditing ? "Cancelar" : "Editar perfil"}
            </button>
          </div>
        </div>

        {/* ── SEÇÃO DE CABEÇALHO COM AVATAR SOBREPOSTO E BOTÕES ESTILO FACEBOOK ── */}
        <div style={{ padding: "0 24px 20px", position: "relative" }}>
          
          <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginTop: -68,
            marginBottom: 16,
          }}>
            {/* Bloco Esquerda: Avatar Circular e Nome */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
              
              {/* Avatar com borda branca grossa */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 140, height: 140, borderRadius: "50%",
                    border: "5px solid #fff",
                    background: `linear-gradient(135deg,${g1},${g2})`,
                    overflow: "hidden",
                    boxShadow: "0 6px 22px rgba(0,0,0,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative",
                    cursor: isEditing ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (isEditing) fileInputRef.current?.click();
                  }}
                  title={isEditing ? "Clique para escolher uma foto" : undefined}
                >
                  {showAvatar ? (
                    <img
                      src={activeAvatar}
                      alt={editPerfil.nome || perfil.nome}
                      onError={() => setImgErr(true)}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ fontWeight: 900, fontSize: 44, color: "#fff", letterSpacing: "-1px" }}>
                      {getInitials(editPerfil.nome || perfil.nome)}
                    </span>
                  )}

                  {isEditing && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(15,23,42,0.5)",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      color: "#fff",
                    }}>
                      {uploadingImg ? (
                        <Loader2 style={{ width: 26, height: 26, animation: "perfilSpin 0.8s linear infinite" }} />
                      ) : (
                        <>
                          <Camera style={{ width: 22, height: 22, marginBottom: 2 }} />
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Alterar</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Ícone de status ou botão de câmera */}
                {isEditing ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    title="Escolher foto do dispositivo"
                    style={{
                      position: "absolute", bottom: 6, right: 6,
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#0084ff", border: "3px solid #fff",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", boxShadow: "0 2px 10px rgba(0,132,255,0.4)",
                    }}
                  >
                    <Camera style={{ width: 17, height: 17 }} />
                  </button>
                ) : (
                  <div style={{
                    position: "absolute", bottom: 8, right: 8,
                    width: 22, height: 22, borderRadius: "50%",
                    background: "#10b981", border: "3.5px solid #fff",
                    boxShadow: "0 2px 6px rgba(16,185,129,0.4)",
                  }} />
                )}
              </div>

              {/* Informações do usuário: Nome e Amigos */}
              <div style={{ paddingBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h1 style={{ fontWeight: 900, fontSize: 26, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
                    {perfil.nome}
                  </h1>
                  <span style={{
                    padding: "3px 12px", borderRadius: 99, fontSize: 11, fontWeight: 800,
                    color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
                  }}>
                    {badge.label}
                  </span>
                  {saved && (
                    <span style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                      color: "#10b981", background: "#ecfdf5", border: "1px solid #a7f3d0",
                      animation: "savedPulse 1s ease infinite",
                    }}>
                      <CheckCircle style={{ width: 11, height: 11 }} /> Salvo!
                    </span>
                  )}
                </div>
                <p style={{ color: "#64748b", fontSize: 13, fontWeight: 600, margin: "4px 0 0" }}>
                  {totalPessoasCount} amigos · {perfil.turma_ou_cargo || "CEEP Seabra"}
                </p>
                {perfil.bio && (
                  <p style={{ color: "#475569", fontSize: 14, margin: "8px 0 0", lineHeight: 1.5, maxWidth: 440 }}>
                    {perfil.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Bloco Direita: Botões idênticos aos da imagem (Adicionar aos amigos, Mensagem, Dropdown) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8 }}>
              <button
                type="button"
                onClick={() => navigate("/membros")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 10,
                  background: "#0084ff", color: "#fff",
                  border: "none", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", boxShadow: "0 2px 8px rgba(0,132,255,0.3)",
                  transition: "all 0.15s",
                }}
              >
                <UserPlus style={{ width: 15, height: 15 }} />
                <span>Adicionar aos amigos</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/lyka-chat")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", borderRadius: 10,
                  background: "#e4e6eb", color: "#050505",
                  border: "none", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <MessageCircle style={{ width: 15, height: 15 }} />
                <span>Mensagem</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(v => !v)}
                title="Mais opções"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 38, height: 38, borderRadius: 10,
                  background: "#e4e6eb", color: "#050505",
                  border: "none", cursor: "pointer",
                }}
              >
                <ChevronDown style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* ── DESTAQUES DE STORIES CIRCULARES (Destaques, Amor, Ensaio, Songs, City, Novo) ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "16px 0 12px",
            borderTop: "1px solid #f1f5f9",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}>
            {highlights.map((hl) => (
              <div
                key={hl.id}
                className="highlight-item"
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 6, cursor: "pointer", flexShrink: 0,
                  transition: "transform 0.15s",
                }}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  padding: 2.5,
                  background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}>
                  <div style={{
                    width: "100%", height: "100%", borderRadius: "50%",
                    border: "2px solid #fff", overflow: "hidden", background: "#f1f5f9",
                  }}>
                    <img
                      src={hl.coverImg}
                      alt={hl.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
                  {hl.label}
                </span>
              </div>
            ))}

            {/* Botão circular de "Novo" (+) */}
            <div
              className="highlight-item"
              onClick={handleAddHighlight}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 6, cursor: "pointer", flexShrink: 0,
                transition: "transform 0.15s",
              }}
            >
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                border: "2px dashed #cbd5e1",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#f8fafc", color: "#64748b",
              }}>
                <Plus style={{ width: 24, height: 24 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                Novo
              </span>
            </div>
          </div>

          {/* ── BARRA DE ABAS SOCIAL (Mídia v, Respostas, Repostagens, Postagens) ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            borderTop: "1px solid #e2e8f0",
            paddingTop: 4,
          }}>
            <button
              type="button"
              onClick={() => setActiveTab("midia")}
              className={activeTab === "midia" ? "tab-btn-active" : ""}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "14px 4px", border: "none", background: "none",
                fontSize: 15, fontWeight: activeTab === "midia" ? 800 : 600,
                color: activeTab === "midia" ? "#0f172a" : "#64748b",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <span>Mídia</span>
              <ChevronDown style={{ width: 14, height: 14 }} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("respostas")}
              className={activeTab === "respostas" ? "tab-btn-active" : ""}
              style={{
                padding: "14px 4px", border: "none", background: "none",
                fontSize: 15, fontWeight: activeTab === "respostas" ? 800 : 600,
                color: activeTab === "respostas" ? "#0f172a" : "#64748b",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              Respostas
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("repostagens")}
              className={activeTab === "repostagens" ? "tab-btn-active" : ""}
              style={{
                padding: "14px 4px", border: "none", background: "none",
                fontSize: 15, fontWeight: activeTab === "repostagens" ? 800 : 600,
                color: activeTab === "repostagens" ? "#0f172a" : "#64748b",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              Repostagens
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("postagens")}
              className={activeTab === "postagens" ? "tab-btn-active" : ""}
              style={{
                padding: "14px 4px", border: "none", background: "none",
                fontSize: 15, fontWeight: activeTab === "postagens" ? 800 : 600,
                color: activeTab === "postagens" ? "#0f172a" : "#64748b",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              Postagens
            </button>
          </div>

        </div>
      </div>

      {/* ── MODO EDIÇÃO DO PERFIL ─────────────────────────────────────────── */}
      {isEditing && (
        <form onSubmit={handleSave}
          style={{
            background: "#fff", borderRadius: 24, padding: 28,
            marginTop: 18, boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            border: "1px solid #e2e8f0", animation: "perfilPop 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0084ff,#0284c7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Edit3 style={{ width: 16, height: 16, color: "#fff" }} />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: "#0f172a", margin: 0 }}>Editar Perfil</p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Atualize sua foto, capa e informações públicas</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <Field id="edit-nome" label="Nome Completo" value={editPerfil.nome}
                onChange={v => setEditPerfil(p => ({ ...p, nome: v }))} />
            </div>
            <Field id="edit-turma" label="Turma / Cargo" value={editPerfil.turma_ou_cargo}
              onChange={v => setEditPerfil(p => ({ ...p, turma_ou_cargo: v }))} />
            <Field id="edit-tel" label="Telefone" value={editPerfil.telefone}
              onChange={v => setEditPerfil(p => ({ ...p, telefone: v }))} placeholder="(75) 99999-9999" />
            <div style={{ gridColumn: "1/-1" }}>
              <Field id="edit-bio" label="Bio" value={editPerfil.bio}
                onChange={v => setEditPerfil(p => ({ ...p, bio: v }))} multiline
                placeholder="Conte um pouco sobre você..." />
            </div>

            {/* Foto de Perfil */}
            <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileSelect(file);
                  e.target.value = "";
                }}
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Foto de Perfil
                </label>
                <div style={{ display: "flex", background: "#f1f5f9", padding: 3, borderRadius: 10, gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => setAvatarInputMode("upload")}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 8, border: "none",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      background: avatarInputMode === "upload" ? "#fff" : "transparent",
                      color: avatarInputMode === "upload" ? "#0084ff" : "#64748b",
                      boxShadow: avatarInputMode === "upload" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    <Upload style={{ width: 13, height: 13 }} />
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarInputMode("url")}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 8, border: "none",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      background: avatarInputMode === "url" ? "#fff" : "transparent",
                      color: avatarInputMode === "url" ? "#0084ff" : "#64748b",
                      boxShadow: avatarInputMode === "url" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    }}
                  >
                    <LinkIcon style={{ width: 13, height: 13 }} />
                    URL da Foto
                  </button>
                </div>
              </div>

              {avatarInputMode === "upload" ? (
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) void handleFileSelect(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: isDragging ? "2px dashed #0084ff" : "2px dashed #cbd5e1",
                      borderRadius: 16,
                      background: isDragging ? "#eff6ff" : "#f8fafc",
                      padding: "22px 18px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {uploadingImg ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "10px 0" }}>
                        <Loader2 style={{ width: 30, height: 30, color: "#0084ff", animation: "perfilSpin 0.8s linear infinite" }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#0084ff" }}>
                          Processando e otimizando sua foto...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: "#eff6ff", color: "#0084ff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Camera style={{ width: 24, height: 24 }} />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                            Clique para escolher foto do aparelho
                          </p>
                          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                            Formatos: JPG, PNG, WEBP (recorte automático)
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {uploadMsg && (
                    <div style={{
                      marginTop: 8,
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: uploadMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
                      color: uploadMsg.type === "success" ? "#065f46" : "#991b1b",
                      border: `1px solid ${uploadMsg.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                    }}>
                      {uploadMsg.type === "success" ? (
                        <Check style={{ width: 15, height: 15, flexShrink: 0 }} />
                      ) : (
                        <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
                      )}
                      <span>{uploadMsg.text}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Field
                    id="edit-avatar"
                    label=""
                    value={editPerfil.avatar_url}
                    onChange={(v) => {
                      setEditPerfil(p => ({ ...p, avatar_url: v }));
                      setImgErr(false);
                      setUploadMsg(null);
                    }}
                    placeholder="Cole aqui o link da imagem (https://...)"
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <button type="button" onClick={handleCancel}
              style={{
                padding: "10px 20px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                background: "#fff", color: "#64748b", fontWeight: 700, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{
                padding: "10px 24px", borderRadius: 12, border: "none",
                background: saving ? "rgba(0,132,255,0.5)" : "#0084ff",
                color: "#fff", fontWeight: 800, fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 14px rgba(0,132,255,0.35)",
              }}
            >
              <Save style={{ width: 14, height: 14 }} />
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      )}

      {/* ── CORPO PRINCIPAL COM FEED DE MÍDIA E SIDEBAR "O QUE ESTÁ ACONTECENDO?" ── */}
      <div style={{
        marginTop: 18,
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: 18,
      }}>

        {/* Coluna Esquerda: Grid de Mídia / Fotos / Publicações */}
        <div>
          {activeTab === "midia" && (
            <div style={{
              background: "#fff",
              borderRadius: 24,
              padding: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 14px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 6,
                borderRadius: 16,
                overflow: "hidden",
              }}>
                {galleryImages.map((src, index) => (
                  <div
                    key={index}
                    style={{
                      aspectRatio: "1/1",
                      overflow: "hidden",
                      background: "#f1f5f9",
                      position: "relative",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      // Abre imagem em tela cheia se desejar
                      window.open(src, "_blank");
                    }}
                  >
                    <img
                      src={src}
                      alt={`Mídia ${index + 1}`}
                      style={{
                        width: "100%", height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s ease",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    {/* Efeito sutil ao passar o cursor */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0.15)",
                      opacity: 0, transition: "opacity 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                      color: "#fff", fontWeight: 700, fontSize: 13,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Heart style={{ width: 16, height: 16, fill: "#fff" }} />
                        <span>{12 + (index * 7) % 50}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MessageCircle style={{ width: 16, height: 16, fill: "#fff" }} />
                        <span>{2 + (index * 3) % 15}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "postagens" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {userPosts.length === 0 ? (
                <div style={{
                  background: "#fff", borderRadius: 20, padding: 36, textAlign: "center",
                  border: "1px solid #e2e8f0", color: "#64748b",
                }}>
                  <p style={{ fontWeight: 700, fontSize: 16, color: "#1e293b", margin: 0 }}>Você ainda não publicou no Feed</p>
                  <p style={{ fontSize: 13, margin: "6px 0 16px" }}>Compartilhe suas descobertas de campo com os colegas!</p>
                  <button
                    type="button"
                    onClick={() => navigate("/feed")}
                    style={{
                      padding: "8px 18px", borderRadius: 10,
                      background: "#0084ff", color: "#fff", border: "none",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Ir para o Feed
                  </button>
                </div>
              ) : (
                userPosts.map((post) => (
                  <div key={post.id} style={{
                    background: "#fff", borderRadius: 20, padding: 20,
                    border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: `linear-gradient(135deg,${g1},${g2})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 800, fontSize: 14, overflow: "hidden",
                      }}>
                        {showAvatar ? (
                          <img src={perfil.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          getInitials(perfil.nome)
                        )}
                      </div>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{post.author_name}</span>
                        <span style={{ display: "block", fontSize: 11, color: "#94a3b8" }}>
                          {new Date(post.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.6, margin: "0 0 12px" }}>
                      {post.content}
                    </p>
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 14, marginBottom: 12 }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "respostas" && (
            <div style={{
              background: "#fff", borderRadius: 20, padding: 36, textAlign: "center",
              border: "1px solid #e2e8f0", color: "#64748b",
            }}>
              <MessageCircle style={{ width: 32, height: 32, color: "#cbd5e1", margin: "0 auto 10px" }} />
              <p style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", margin: 0 }}>Nenhuma resposta recente</p>
              <p style={{ fontSize: 13, margin: "4px 0 0" }}>Suas interações e respostas aos colegas do CEEP aparecerão aqui.</p>
            </div>
          )}

          {activeTab === "repostagens" && (
            <div style={{
              background: "#fff", borderRadius: 20, padding: 36, textAlign: "center",
              border: "1px solid #e2e8f0", color: "#64748b",
            }}>
              <Share2 style={{ width: 32, height: 32, color: "#cbd5e1", margin: "0 auto 10px" }} />
              <p style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", margin: 0 }}>Nenhuma repostagem encontrada</p>
              <p style={{ fontSize: 13, margin: "4px 0 0" }}>Publicações que você repostar do Feed do Censo serão listadas aqui.</p>
            </div>
          )}
        </div>

        {/* Coluna Direita: Caixa "O que está acontecendo?" (Trending) */}
        <div>
          <div style={{
            background: "#f8fafc",
            borderRadius: 20,
            padding: "18px 20px",
            border: "1px solid #e2e8f0",
          }}>
            <h3 style={{
              margin: "0 0 16px",
              fontWeight: 900,
              fontSize: 18,
              color: "#0f172a",
              letterSpacing: "-0.3px",
            }}>
              O que está acontecendo?
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {trendingTopics.map((trend, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => navigate("/feed")}
                >
                  <div>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block" }}>
                      {trend.category}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", display: "block", marginTop: 2 }}>
                      {trend.topic}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8", display: "block", marginTop: 2 }}>
                      {trend.posts}
                    </span>
                  </div>
                  <button
                    type="button"
                    title="Opções"
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 4 }}
                  >
                    <MoreHorizontal style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate("/feed")}
              style={{
                marginTop: 18,
                padding: "8px 0 0",
                background: "none",
                border: "none",
                color: "#0084ff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
                display: "block",
              }}
            >
              Mostrar mais
            </button>
          </div>

          {/* Mini resumo de informações do pesquisador */}
          <div style={{
            marginTop: 16,
            background: "#fff",
            borderRadius: 20,
            padding: 18,
            border: "1px solid #e2e8f0",
          }}>
            <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
              Informações de Contato
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              {perfil.email && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#475569" }}>
                  <Mail style={{ width: 15, height: 15, color: "#0084ff", flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{perfil.email}</span>
                </div>
              )}
              {perfil.telefone && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#475569" }}>
                  <Phone style={{ width: 15, height: 15, color: "#0084ff", flexShrink: 0 }} />
                  <span>{perfil.telefone}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#475569" }}>
                <MapPin style={{ width: 15, height: 15, color: "#0084ff", flexShrink: 0 }} />
                <span>{perfil.cidade} — {perfil.estado}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── SEÇÃO DE CONQUISTAS DO PESQUISADOR (GAMIFICAÇÃO ACCUMBENS / TAS) ── */}
      {(() => {
        const totalXP = (totalFichas * 100) + (xpStats.posts * 20) + (xpStats.msgs * 5) + (xpStats.likes * 10);
        const nivel = getNivel(totalXP);
        const nextNivel = getNextNivel(totalXP);
        const progress = nextNivel ? Math.round(((totalXP - nivel.minXP) / (nextNivel.minXP - nivel.minXP)) * 100) : 100;
        
        return (
          <div style={{
            marginTop: 24, background: "#fff", borderRadius: 24, padding: 24,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0",
            animation: "perfilPop 0.4s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ padding: 10, borderRadius: 14, background: "linear-gradient(135deg, #f59e0b, #ea580c)", color: "#fff", boxShadow: "0 4px 14px rgba(245,158,11,0.3)" }}>
                <Trophy style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Conquistas do Pesquisador</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 600 }}>Gerenciado pelo módulo Accumbens (TAS)</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Nível atual */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>Nível Atual</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 24 }}>{nivel.icon}</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: nivel.color }}>{nivel.nome}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{totalXP.toLocaleString()}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#64748b", marginLeft: 4 }}>XP</span>
                </div>
              </div>

              {/* Barra de Progresso */}
              {nextNivel && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
                    <span>Progresso para {nextNivel.nome}</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ width: "100%", height: 10, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${nivel.color}, ${nextNivel.color})`, borderRadius: 99, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                  </div>
                  <div style={{ textAlign: "right", fontSize: 10, fontWeight: 700, color: "#94a3b8", marginTop: 4 }}>
                    Faltam {(nextNivel.minXP - totalXP).toLocaleString()} XP
                  </div>
                </div>
              )}
              
              {/* Grid de Atividades */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                <div style={{ background: "#f8fafc", padding: 14, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "#3b82f6", marginBottom: 8 }}><BookOpen style={{ width: 18, height: 18 }}/></div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{totalFichas}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Fichas Coletadas (x100 XP)</div>
                </div>
                <div style={{ background: "#f8fafc", padding: 14, borderRadius: 16, border: "1px solid #e2e8f0" }}>
                  <div style={{ color: "#10b981", marginBottom: 8 }}><Target style={{ width: 18, height: 18 }}/></div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{xpStats.posts + xpStats.msgs + xpStats.likes}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Interações Sociais</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{ marginTop: 20 }}>
        <BadgeList userId={perfil.id} />
      </div>

    </div>
  );
};

export default MeuPerfil;
