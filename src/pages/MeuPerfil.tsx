import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, AppTheme } from "../context/ThemeContext";
import { supabase, supabaseAdmin } from "../lib/supabaseClient";
import {
  Save, Edit2, X, ShieldCheck, Mail, Phone, MapPin,
  Briefcase, BookOpen, Star, Award, GraduationCap,
  CheckCircle, UserCircle, Calendar, Hash, Trophy, Target,
  Upload, Camera, Trash2, Link as LinkIcon, Loader2, Check, AlertCircle, RefreshCw,
  Plus, MessageCircle, Heart, UserPlus, MoreHorizontal, Sparkles, Image as ImageIcon,
  ChevronDown, Flame, Share2, ThumbsUp, ChevronRight, FileText, Users, Eye, Globe,
  Palette, Sun, Moon
} from "lucide-react";
import BadgeList from "../components/Gamification/BadgeList";
import { CrachaPesquisador } from "../components/CrachaPesquisador";
import { badgeService } from "../services/badgeService";
import { tasFeedScraperService } from "../services/tasFeedScraperService";

/**
 * Ícone visual do Lyka Chat oficial do Censo CEEP
 */
function LaikaNavIcon({ size = 16 }: { readonly size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8 C4 4 2 3 3 7" />
      <path d="M19 8 C20 4 22 3 21 7" />
      <ellipse cx="12" cy="10" rx="7" ry="6" />
      <ellipse cx="12" cy="13" rx="3" ry="2" />
      <ellipse cx="12" cy="12" rx="1.2" ry="0.8" fill="currentColor" stroke="none" />
      <circle cx="9" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <path d="M7 15.5 C6 18 6 21 8 21 L16 21 C18 21 18 18 17 15.5" />
      <path d="M17 16 C21 14 22 10 20 9" />
    </svg>
  );
}

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

function Field({ id, label, value, onChange, multiline = false, placeholder = "" }: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  const base: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "9px 12px", background: "#f8fafc",
    border: "1px solid #cbd5e1", borderRadius: 10,
    fontSize: 13, fontWeight: 500, color: "#0f172a",
    fontFamily: "inherit", outline: "none", transition: "border-color 0.2s",
    resize: "none" as const,
  };
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={3} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)} style={base}
          onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
          onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.background = "#f8fafc"; }}
        />
      ) : (
        <input id={id} type="text" value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)} style={base}
          onFocus={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.background = "#fff"; }}
          onBlur={e => { e.target.style.borderColor = "#cbd5e1"; e.target.style.background = "#f8fafc"; }}
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
}

interface TrendItem {
  category: string;
  topic: string;
  posts: string;
  isGlobal?: boolean;
}

// Capa padrão elegante de paisagem tropical/mar para compor o visual igual à imagem de referência
const DEFAULT_HERO_COVER = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80";

export type PerfilTheme = "clean" | "rosa" | "azul" | "dark";

export const MeuPerfil: React.FC<MeuPerfilProps> = ({ escolaNome }) => {
  const navigate = useNavigate();
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [coverImgErr, setCoverImgErr] = useState(false);
  const [totalFichas, setTotalFichas] = useState(0);
  const [xpStats, setXpStats] = useState({ posts: 0, msgs: 0, likes: 0 });
  const [seguindoCount, setSeguindoCount] = useState(0);
  const [seguidoresCount, setSeguidoresCount] = useState(0);

  // Seletor de Tema do Perfil: Clean, Rosa, Azul, Dark (Persistido no localStorage)
  const [perfilTheme, setPerfilTheme] = useState<PerfilTheme>(() => {
    const saved = localStorage.getItem("ceep_perfil_theme");
    return (saved === "clean" || saved === "rosa" || saved === "azul" || saved === "dark") ? saved : "clean";
  });

  // Abas sociais com Perfil e Conquistas
  const [activeTab, setActiveTab] = useState<"midia" | "respostas" | "repostagens" | "postagens" | "conquistas" | "perfil">("midia");
  const [userPosts, setUserPosts] = useState<PostItem[]>([]);
  const [mediaPosts, setMediaPosts] = useState<PostItem[]>([]);

  // Destaques do usuário (novo usuário = vazio por padrão, estilo Instagram)
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);

  // Trends mundiais + adaptação inteligente ao perfil do usuário (Estilo Twitter/X)
  const [trendingTopics, setTrendingTopics] = useState<TrendItem[]>([]);

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
  const [isEditingData, setIsEditingData] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTheme = (theme: PerfilTheme) => {
    setPerfilTheme(theme);
    try {
      localStorage.setItem("ceep_perfil_theme", theme);
    } catch {}
    // Se selecionar tema Dark, também sincroniza a classe dark do sistema
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

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
          { count: seguidosCount },
          { data: myPosts }
        ] = await Promise.all([
          supabase.from("pessoas").select("*").eq("id", userId).maybeSingle(),
          supabase.from("entrevistas").select("*", { count: "exact", head: true }).eq("entrevistador_id", userId),
          supabase.from("lyka_posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("lyka_messages").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("pessoa_likes").select("*", { count: "exact", head: true }).eq("liked_id", userId),
          supabase.from("pessoa_likes").select("*", { count: "exact", head: true }).eq("liker_id", userId),
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

        setSeguidoresCount(lC || 0);
        setSeguindoCount(seguidosCount || 0);

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

        let localCover = "";
        try {
          localCover = localStorage.getItem(`ceep_profile_cover_${userId}`) || "";
        } catch {}

        const p = {
          id: userId, nome: nomeCompleto, email: userEmail, papel: papelUsuario,
          turma_ou_cargo: turmaCargo, telefone: pessoaData?.telefone || "",
          cep: pessoaData?.cep || "", cidade: pessoaData?.cidade || "Palmeiras",
          estado: pessoaData?.estado || "BA", endereco: pessoaData?.endereco || "",
          numero: pessoaData?.numero || "", bairro: pessoaData?.bairro || "Mandacaru",
          bio: pessoaData?.bio || "", avatar_url: pessoaData?.avatar_url || cachedProfile?.avatarUrl || avatarPadrao,
          genero,
          cover_url: localCover || DEFAULT_HERO_COVER,
        };
        setPerfil(p);
        setEditPerfil(p);

        const postsList = (myPosts || []) as PostItem[];
        setUserPosts(postsList);
        const withMedia = postsList.filter(item => Boolean(item.image_url));
        setMediaPosts(withMedia);

        try {
          const userHighlightsRaw = localStorage.getItem(`ceep_highlights_${userId}`);
          if (userHighlightsRaw) {
            setHighlights(JSON.parse(userHighlightsRaw));
          } else {
            setHighlights([]);
          }
        } catch {}

        try {
          const curatedNews = await tasFeedScraperService.getCuratedNews();
          const trendsArray: TrendItem[] = [
            { category: "Tecnologia & IA · Mundo", topic: "Artificial Intelligence & Robotics", posts: "842.1K posts", isGlobal: true },
            { category: "Ciência & Exploração · Mundo", topic: "James Webb & Deep Space", posts: "318.5K posts", isGlobal: true },
            { category: "Educação & Inovação · Bahia", topic: "SEC Bahia — Educação Profissional", posts: "42.8K posts", isGlobal: false },
          ];

          if (turmaCargo) {
            trendsArray.push({
              category: `Sua Turma · ${turmaCargo}`,
              topic: `#Censo${turmaCargo.replace(/[^a-zA-Z0-9]/g, '')}`,
              posts: `${Math.max(12, totalFichasContadas * 5)} menções`,
              isGlobal: false
            });
          }

          if (curatedNews && curatedNews.length > 0) {
            trendsArray.push({
              category: "Educação & Ciência · Destaque",
              topic: curatedNews[0].title.slice(0, 36) + "...",
              posts: "15.4K leituras",
              isGlobal: false
            });
          }

          trendsArray.push({ category: "Cultura & Sociedade · Mundo", topic: "Global Climate Summit", posts: "594.3K posts", isGlobal: true });
          setTrendingTopics(trendsArray);
        } catch {
          setTrendingTopics([
            { category: "Tecnologia & IA · Mundo", topic: "Artificial Intelligence", posts: "720K posts", isGlobal: true },
            { category: "Ciência · Mundo", topic: "Space Exploration", posts: "245K posts", isGlobal: true },
            { category: "Censo CEEP · Local", topic: "#Meta20Alcançada", posts: "128 posts", isGlobal: false },
          ]);
        }

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
      alert("Por favor, selecione um arquivo de imagem (JPG, PNG, WEBP, etc.).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert("A imagem selecionada é muito pesada (máx 15MB).");
      return;
    }

    setUploadingImg(true);
    const localUrl = URL.createObjectURL(file);
    setEditPerfil(prev => ({ ...prev, avatar_url: localUrl }));
    setPerfil(prev => ({ ...prev, avatar_url: localUrl }));
    setImgErr(false);

    try {
      const publicUrl = await uploadAvatarImage(file, perfil.id);
      URL.revokeObjectURL(localUrl);
      setEditPerfil(prev => ({ ...prev, avatar_url: publicUrl }));
      setPerfil(prev => ({ ...prev, avatar_url: publicUrl }));
      await supabase.from("pessoas").update({ avatar_url: publicUrl }).eq("id", perfil.id);
      try {
        await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      } catch {}
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      console.warn("Upload falhou, mantendo base64:", err);
      try {
        const compressedBlob = await processImageForAvatar(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Url = reader.result as string;
          setEditPerfil(prev => ({ ...prev, avatar_url: base64Url }));
          setPerfil(prev => ({ ...prev, avatar_url: base64Url }));
        };
        reader.readAsDataURL(compressedBlob);
      } catch {}
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
      setPerfil(prev => ({ ...prev, cover_url: localUrl }));

      try {
        const publicUrl = await uploadAvatarImage(file, `${perfil.id}_cover`);
        setEditPerfil(prev => ({ ...prev, cover_url: publicUrl }));
        setPerfil(prev => ({ ...prev, cover_url: publicUrl }));
        localStorage.setItem(`ceep_profile_cover_${perfil.id}`, publicUrl);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setEditPerfil(prev => ({ ...prev, cover_url: base64 }));
          setPerfil(prev => ({ ...prev, cover_url: base64 }));
          try {
            localStorage.setItem(`ceep_profile_cover_${perfil.id}`, base64);
          } catch {}
        };
        reader.readAsDataURL(file);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveData = async (e: React.FormEvent) => {
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

      try {
        await supabase.auth.updateUser({
          data: {
            nome_completo: editPerfil.nome,
            avatar_url: editPerfil.avatar_url,
          }
        });
      } catch {}

      setPerfil({ ...editPerfil });
      setUploadMsg(null);
      setIsEditingData(false);
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

  const handleAddHighlight = () => {
    const nome = prompt("Nome do novo destaque (ex: Pesquisa, Visitas, Amigos):");
    if (!nome) return;
    const novoHighlight: StoryHighlight = {
      id: `hl-${Date.now()}`,
      label: nome.slice(0, 12),
      coverImg: perfil.avatar_url,
    };
    const updated = [...highlights, novoHighlight];
    setHighlights(updated);
    try {
      localStorage.setItem(`ceep_highlights_${perfil.id}`, JSON.stringify(updated));
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
        <style>{`@keyframes perfilSpin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 44, height: 44, border: "3px solid #ede9fe", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "perfilSpin 0.8s linear infinite" }} />
        <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 14 }}>Carregando perfil...</span>
      </div>
    );
  }

  const badge = papelBadge(perfil.papel);
  const [g1, g2] = gradFor(perfil.nome);
  const activeAvatar = perfil.avatar_url;
  const showAvatar = activeAvatar && !imgErr;

  const activeCover = perfil.cover_url || DEFAULT_HERO_COVER;
  const showCover = activeCover && !coverImgErr;

  // Paleta de tema selecionada
  const themeAccent = {
    clean: {
      borderActive: "#2563eb",
      textActive: "#0f172a",
      cardBg: "bg-white dark:bg-slate-900",
      subText: "text-slate-500 dark:text-slate-400",
      tabIndicator: "border-blue-600 text-slate-900 dark:text-white",
      badgeColor: "#475569",
    },
    rosa: {
      borderActive: "#f43f5e",
      textActive: "#881337",
      cardBg: "bg-gradient-to-b from-rose-50/40 to-white dark:from-slate-900 dark:to-slate-950",
      subText: "text-rose-600/80 dark:text-rose-300/80",
      tabIndicator: "border-rose-500 text-rose-700 dark:text-rose-300",
      badgeColor: "#e11d48",
    },
    azul: {
      borderActive: "#2563eb",
      textActive: "#1e3a8a",
      cardBg: "bg-gradient-to-b from-blue-50/40 to-white dark:from-slate-900 dark:to-slate-950",
      subText: "text-blue-600/80 dark:text-blue-300/80",
      tabIndicator: "border-blue-600 text-blue-700 dark:text-blue-300",
      badgeColor: "#2563eb",
    },
    dark: {
      borderActive: "#fbbf24",
      textActive: "#f8fafc",
      cardBg: "bg-slate-900 dark:bg-slate-950",
      subText: "text-slate-400",
      tabIndicator: "border-amber-400 text-amber-300",
      badgeColor: "#f59e0b",
    },
  }[perfilTheme];

  return (
    <div className={`w-full max-w-5xl mx-auto pb-24 px-2 sm:px-6 font-sans theme-${perfilTheme}`}>
      <style>{`
        @keyframes perfilSpin { to { transform: rotate(360deg); } }
        @keyframes perfilPop { from { opacity:0; transform: scale(0.98) translateY(6px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes savedPulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
        .tab-btn-active { border-bottom: 2.5px solid #0084ff !important; color: #0f172a !important; font-weight: 800 !important; }
        .highlight-item:hover { transform: scale(1.06); }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .icon-stat-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 9999px;
          background: #f8fafc;
          color: #1e293b;
          font-weight: 700;
          font-size: 12px;
          border: 1px solid #cbd5e1;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
          line-height: 1;
        }
        .icon-stat-btn:hover, .icon-stat-btn:active {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
          transform: translateY(-1px);
        }
        .icon-stat-tooltip {
          position: absolute;
          bottom: 120%;
          left: 50%;
          transform: translateX(-50%);
          background: #0f172a;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          z-index: 50;
        }
        .icon-stat-btn:hover .icon-stat-tooltip,
        .icon-stat-btn:focus .icon-stat-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(-2px);
        }
      `}</style>

      {/* Crachá comemorativo para 1º ADM */}
      {perfil.turma_ou_cargo?.toUpperCase().includes('1º ADM') || perfil.turma_ou_cargo?.toUpperCase().includes('1° ADM') || perfil.turma_ou_cargo?.toUpperCase().includes('1 ADM') ? (
        <div className="mb-4">
          <CrachaPesquisador nome={perfil.nome} avatarUrl={perfil.avatar_url} turma={perfil.turma_ou_cargo} />
        </div>
      ) : null}

      {/* ── CARD PRINCIPAL COM CAPA PANORÂMICA MINIMALISTA ───────────────── */}
      <div className={`${themeAccent.cardBg} rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 transition-colors`}>

        {/* Capa Panorâmica padrão (igual à imagem de referência) */}
        <div className="h-44 sm:h-64 md:h-72 w-full relative overflow-hidden bg-slate-900 group">
          {showCover ? (
            <img
              src={activeCover}
              alt="Capa de perfil"
              onError={() => setCoverImgErr(true)}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center relative"
              style={{ background: `linear-gradient(135deg, ${g1}dd 0%, ${g2}dd 100%)` }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 pointer-events-none" />

          {/* Input oculto para capa */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleCoverSelect(file);
              e.target.value = "";
            }}
          />

          {/* Controles no topo da Capa: Seletor de Tema (Clean, Rosa, Azul, Dark) e Lápis de Edição */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            {/* Seletor de Tema Dinâmico */}
            <div className="flex items-center gap-1 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-1 rounded-full shadow-md border border-white/20">
              <button
                type="button"
                onClick={() => handleSelectTheme("clean")}
                title="Tema Clean"
                aria-label="Tema Clean"
                className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide transition cursor-pointer ${
                  perfilTheme === "clean"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                }`}
              >
                Clean
              </button>
              <button
                type="button"
                onClick={() => handleSelectTheme("rosa")}
                title="Tema Rosa"
                aria-label="Tema Rosa"
                className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide transition cursor-pointer ${
                  perfilTheme === "rosa"
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-xs"
                    : "text-rose-600 hover:text-rose-700"
                }`}
              >
                Rosa
              </button>
              <button
                type="button"
                onClick={() => handleSelectTheme("azul")}
                title="Tema Azul"
                aria-label="Tema Azul"
                className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide transition cursor-pointer ${
                  perfilTheme === "azul"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs"
                    : "text-blue-600 hover:text-blue-700"
                }`}
              >
                Azul
              </button>
              <button
                type="button"
                onClick={() => handleSelectTheme("dark")}
                title="Tema Dark"
                aria-label="Tema Dark"
                className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide transition cursor-pointer ${
                  perfilTheme === "dark"
                    ? "bg-black text-amber-300 shadow-xs"
                    : "text-slate-700 dark:text-slate-200 hover:text-black"
                }`}
              >
                Dark
              </button>
            </div>

            {/* Botão de edição da Capa */}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              title="Trocar foto de capa"
              aria-label="Editar foto de capa"
              className="w-8 h-8 rounded-full bg-white/85 hover:bg-white text-slate-700 flex items-center justify-center shadow-md backdrop-blur-sm transition cursor-pointer"
            >
              {uploadingCover ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Edit2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* ── CABEÇALHO COM AVATAR, LÁPIS AO LADO E ÍCONES REDUZIDOS LADO A LADO ── */}
        <div className="px-4 sm:px-7 pb-4 relative">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 -mt-12 sm:-mt-16 md:-mt-20 mb-4">
            
            {/* Bloco Esquerda: Avatar Circular com Lápis ao lado */}
            <div className="flex flex-row items-end gap-3.5">
              
              {/* Avatar com botão de lápis ao lado */}
              <div className="relative inline-block flex-shrink-0">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center relative bg-slate-100"
                  style={{ background: `linear-gradient(135deg,${g1},${g2})` }}
                  title="Foto do pesquisador"
                >
                  {showAvatar ? (
                    <img
                      src={activeAvatar}
                      alt={perfil.nome}
                      onError={() => setImgErr(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-black text-2xl sm:text-3xl text-white">
                      {getInitials(perfil.nome)}
                    </span>
                  )}
                  {uploadingImg && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Input oculto para foto de perfil */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFileSelect(file);
                    e.target.value = "";
                  }}
                />

                {/* Ícone de Lápis ao lado do avatar para trocar foto */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Trocar foto de perfil"
                  aria-label="Editar foto de perfil"
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-white flex items-center justify-center shadow-md cursor-pointer transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Informações: Nome, Turma */}
              <div className="pb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight m-0">
                    {perfil.nome}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wide"
                    style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                    {badge.label}
                  </span>
                  {saved && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <CheckCircle className="w-2.5 h-2.5" /> Atualizado!
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
                  {perfil.turma_ou_cargo || "CEEP Seabra"} · {escolaNome}
                </p>
                {/* Espaço fixo e elegante reservado para Bio */}
                <div className="mt-1.5 max-w-xl">
                  {perfil.bio ? (
                    <p className="text-xs text-slate-700 leading-relaxed m-0">
                      {perfil.bio}
                    </p>
                  ) : (
                    <p
                      onClick={() => {
                        setActiveTab("perfil");
                        setIsEditingData(true);
                      }}
                      className="text-xs text-slate-400 italic hover:text-blue-600 transition cursor-pointer m-0 flex items-center gap-1"
                      title="Clique para adicionar sua bio"
                    >
                      <Plus className="w-3 h-3" /> Adicionar biografia ao perfil...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── BLOCO DIREITA: BOTÕES DE MÉTRICAS EXPANDIDOS E MINIMALISTAS ────────── */}
            <div className="flex items-center gap-2 pt-2 md:pt-0 flex-nowrap overflow-x-auto scrollbar-none justify-start md:justify-end max-w-full">
              
              {/* 1. Coletas */}
              <button
                type="button"
                className="icon-stat-btn"
                tabIndex={0}
                onClick={() => navigate("/coleta")}
                aria-label={`Coletas: ${totalFichas} fichas`}
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>{totalFichas}</span>
                <span className="icon-stat-tooltip">Coletas: {totalFichas} fichas</span>
              </button>

              {/* 2. Postagens */}
              <button
                type="button"
                className="icon-stat-btn"
                tabIndex={0}
                onClick={() => navigate("/feed")}
                aria-label={`Postagens: ${xpStats.posts}`}
              >
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>{xpStats.posts}</span>
                <span className="icon-stat-tooltip">Postagens: {xpStats.posts}</span>
              </button>

              {/* 3. Curtidas */}
              <button
                type="button"
                className="icon-stat-btn"
                tabIndex={0}
                aria-label={`Curtidas: ${xpStats.likes}`}
              >
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>{xpStats.likes}</span>
                <span className="icon-stat-tooltip">Curtidas: {xpStats.likes}</span>
              </button>

              {/* 4. Seguindo */}
              <button
                type="button"
                className="icon-stat-btn"
                tabIndex={0}
                onClick={() => navigate("/membros")}
                aria-label={`Seguindo: ${seguindoCount}`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{seguindoCount}</span>
                <span className="icon-stat-tooltip">Seguindo: {seguindoCount}</span>
              </button>

              {/* 5. Seguidores */}
              <button
                type="button"
                className="icon-stat-btn"
                tabIndex={0}
                aria-label={`Seguidores: ${seguidoresCount}`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{seguidoresCount}</span>
                <span className="icon-stat-tooltip">Seguidores: {seguidoresCount}</span>
              </button>

              {/* 6. Ícone do Lyka Chat direcionando diretamente para /lyka-chat */}
              <button
                type="button"
                onClick={() => navigate("/lyka-chat")}
                className="icon-stat-btn !bg-violet-600 hover:!bg-violet-700 !text-white !border-violet-600 shadow-sm"
                tabIndex={0}
                aria-label="Abrir Lyka Chat"
              >
                <LaikaNavIcon size={16} />
                <span>Chat</span>
                <span className="icon-stat-tooltip">Abrir Lyka Chat</span>
              </button>
            </div>

          </div>

          {/* ── DESTAQUES DE STORIES (ESTILO INSTAGRAM NOVO) ──────────────────── */}
          <div className="pt-3 border-t border-slate-100">
            {highlights.length > 0 ? (
              <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
                {highlights.map((hl) => (
                  <div
                    key={hl.id}
                    className="highlight-item flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-sm">
                      <div className="w-full h-full rounded-full border border-white overflow-hidden bg-slate-100">
                        <img
                          src={hl.coverImg || perfil.avatar_url}
                          alt={hl.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 max-w-[56px] truncate text-center">
                      {hl.label}
                    </span>
                  </div>
                ))}

                <div
                  className="highlight-item flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 transition-transform"
                  onClick={handleAddHighlight}
                >
                  <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center bg-slate-50 text-slate-500 hover:border-slate-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Novo</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-0.5">
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Novo Destaque</span>
                </button>
              </div>
            )}
          </div>

          {/* ── BARRA DE ABAS SOCIAL: Mídia, Respostas, Repostagens, Postagens e PERFIL ── */}
          <div className="flex items-center gap-3 sm:gap-5 border-t border-slate-200 dark:border-slate-800 mt-2.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("midia")}
              className={`inline-flex items-center gap-1 py-2.5 px-1 border-b-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "midia" ? `${themeAccent.tabIndicator} !font-extrabold` : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <span>Mídia</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("respostas")}
              className={`py-2.5 px-1 border-b-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "respostas" ? `${themeAccent.tabIndicator} !font-extrabold` : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Respostas
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("repostagens")}
              className={`py-2.5 px-1 border-b-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "repostagens" ? `${themeAccent.tabIndicator} !font-extrabold` : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Repostagens
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("postagens")}
              className={`py-2.5 px-2 border-b-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "postagens" ? `${themeAccent.tabIndicator} !font-extrabold` : "border-transparent text-slate-600 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Postagens
            </button>

            {/* ABA "CONQUISTAS" - Gamificação e Insígnias Unificadas */}
            <button
              type="button"
              onClick={() => setActiveTab("conquistas")}
              className={`inline-flex items-center gap-1.5 py-2.5 px-2 border-b-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "conquistas" ? `${themeAccent.tabIndicator} !font-extrabold` : "border-transparent text-slate-600 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Conquistas</span>
            </button>

            {/* ABA "PERFIL" minimalista ao lado de Postagens e Conquistas */}
            <button
              type="button"
              onClick={() => setActiveTab("perfil")}
              className={`inline-flex items-center gap-1.5 py-2.5 px-2 border-b-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "perfil" ? `${themeAccent.tabIndicator} !font-extrabold` : "border-transparent text-slate-600 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <UserCircle className="w-3.5 h-3.5" />
              <span>Perfil</span>
            </button>
          </div>

        </div>
      </div>

      {/* ── CORPO PRINCIPAL COM GRID: CONTEÚDO ESCOLHIDO + TRENDS ADAPTATIVAS ── */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Coluna Principal */}
        <div className="lg:col-span-8 order-2 lg:order-1">
          
          {/* ABA: MÍDIA */}
          {activeTab === "midia" && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm">
              {mediaPosts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-2xl overflow-hidden">
                  {mediaPosts.map((post) => (
                    <div
                      key={post.id}
                      className="aspect-square overflow-hidden bg-slate-100 relative group cursor-pointer"
                      onClick={() => window.open(post.image_url, "_blank")}
                    >
                      <img
                        src={post.image_url}
                        alt="Publicação com mídia"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white font-bold text-xs">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-white" />
                          <span>{post.likes_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 mb-2.5">
                    <Camera className="w-7 h-7 opacity-70" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800 m-0">Ainda não há mídias publicadas</h3>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    Suas fotos e registros de campo no Feed do Censo serão arquivados aqui.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/feed")}
                    className="mt-3.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                  >
                    Publicar no Feed
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ABA: POSTAGENS */}
          {activeTab === "postagens" && (
            <div className="flex flex-col gap-3">
              {userPosts.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
                  <p className="font-bold text-sm text-slate-800 m-0">Nenhuma postagem realizada ainda</p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">Compartilhe suas descobertas de pesquisa com os colegas!</p>
                  <button
                    type="button"
                    onClick={() => navigate("/feed")}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"
                  >
                    Ir para o Feed
                  </button>
                </div>
              ) : (
                userPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {showAvatar ? (
                          <img src={perfil.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(perfil.nome)
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{post.author_name}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(post.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-2.5">{post.content}</p>
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-full max-h-72 object-cover rounded-xl mb-2"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ABA: PERFIL (Visualização e Edição Minimalista) */}
          {activeTab === "perfil" && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 m-0">Dados do Perfil</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingData(!isEditingData)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isEditingData ? "Modo Leitura" : "Editar Dados"}</span>
                </button>
              </div>

              {isEditingData ? (
                <form onSubmit={handleSaveData} className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Field id="edit-nome" label="Nome Completo" value={editPerfil.nome}
                        onChange={v => setEditPerfil(p => ({ ...p, nome: v }))} />
                    </div>
                    <Field id="edit-turma" label="Turma / Cargo" value={editPerfil.turma_ou_cargo}
                      onChange={v => setEditPerfil(p => ({ ...p, turma_ou_cargo: v }))} />
                    <Field id="edit-tel" label="Telefone" value={editPerfil.telefone}
                      onChange={v => setEditPerfil(p => ({ ...p, telefone: v }))} placeholder="(75) 99999-9999" />
                    <div className="sm:col-span-2">
                      <Field id="edit-bio" label="Bio" value={editPerfil.bio}
                        onChange={v => setEditPerfil(p => ({ ...p, bio: v }))} multiline
                        placeholder="Escreva sobre você..." />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditPerfil({ ...perfil });
                        setIsEditingData(false);
                      }}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? "Salvando..." : "Salvar"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nome</span>
                    <span className="font-bold text-slate-800 text-sm">{perfil.nome}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Turma / Cargo</span>
                    <span className="font-bold text-slate-800 text-sm">{perfil.turma_ou_cargo || "Não informada"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">E-mail</span>
                    <span className="font-semibold text-slate-700">{perfil.email || "Não informado"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Telefone</span>
                    <span className="font-semibold text-slate-700">{perfil.telefone || "Não informado"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Localização</span>
                    <span className="font-semibold text-slate-700">{perfil.cidade} — {perfil.estado}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA: CONQUISTAS (Gamificação Unificada no Grid) */}
          {activeTab === "conquistas" && (
            <div className="flex flex-col gap-4">
              {(() => {
                const totalXP = (totalFichas * 100) + (xpStats.posts * 20) + (xpStats.msgs * 5) + (xpStats.likes * 10);
                const nivel = getNivel(totalXP);
                const nextNivel = getNextNivel(totalXP);
                const progress = nextNivel ? Math.round(((totalXP - nivel.minXP) / (nextNivel.minXP - nivel.minXP)) * 100) : 100;
                const xpRestante = nextNivel ? nextNivel.minXP - totalXP : 0;
                
                return (
                  <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-sm">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="m-0 font-extrabold text-base text-slate-900">Conquistas do Pesquisador</h3>
                        <p className="m-0 text-xs text-slate-600 font-semibold">Gerenciado pelo módulo Accumbens (TAS)</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-end bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                        <div>
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Nível Atual</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-2xl">{nivel.icon}</span>
                            <span className="text-xl font-black" style={{ color: nivel.color }}>{nivel.nome}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">{totalXP.toLocaleString()}</span>
                          <span className="text-xs font-bold text-slate-600 ml-1">XP Total</span>
                        </div>
                      </div>

                      {nextNivel && (
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                            <span>Progresso para {nextNivel.nome}</span>
                            <span className="text-blue-700 font-black">{progress}% ({totalXP} / {nextNivel.minXP} XP)</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, ${nivel.color}, ${nextNivel.color})`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-slate-600 mt-1.5">
                            <span>{nivel.nome} ({nivel.minXP} XP)</span>
                            <span className="text-amber-700 font-extrabold">Faltam {xpRestante.toLocaleString()} XP para o próximo nível</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <BookOpen className="w-4 h-4 text-blue-600 mb-1.5" />
                          <div className="text-lg font-black text-slate-900">{totalFichas}</div>
                          <div className="text-xs font-semibold text-slate-600">Fichas Coletadas (+{totalFichas * 100} XP)</div>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <Target className="w-4 h-4 text-emerald-600 mb-1.5" />
                          <div className="text-lg font-black text-slate-900">{xpStats.posts + xpStats.msgs + xpStats.likes}</div>
                          <div className="text-xs font-semibold text-slate-600">Interações Sociais no App</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <BadgeList userId={perfil.id} />
              </div>
            </div>
          )}

          {/* ABA: RESPOSTAS */}
          {activeTab === "respostas" && (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-xs text-slate-800 m-0">Nenhuma resposta recente</p>
              <p className="text-[11px] text-slate-400 mt-1">Suas respostas aos colegas aparecerão aqui.</p>
            </div>
          )}

          {/* ABA: REPOSTAGENS */}
          {activeTab === "repostagens" && (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <Share2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-xs text-slate-800 m-0">Nenhuma repostagem encontrada</p>
              <p className="text-[11px] text-slate-400 mt-1">Publicações repostadas aparecerão aqui.</p>
            </div>
          )}
        </div>

        {/* Coluna Lateral: Trends Mundiais + CEEP adaptadas estilo Twitter/X */}
        <div className="lg:col-span-4 order-1 lg:order-2 flex flex-col gap-3.5">
          
          <div className="bg-slate-50 rounded-3xl p-4 sm:p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm sm:text-base text-slate-900 tracking-tight m-0 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>O que está acontecendo?</span>
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {trendingTopics.map((trend, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 cursor-pointer group"
                  onClick={() => navigate("/feed")}
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-slate-500 block">
                      {trend.category}
                    </span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5 group-hover:text-blue-600 transition truncate">
                      {trend.topic}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {trend.posts}
                    </span>
                  </div>
                  <button
                    type="button"
                    title="Mais informações"
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="mt-3 pt-2.5 border-t border-slate-200 w-full text-left text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Mostrar mais notícias
            </button>
          </div>

          {/* Dados de Contato / Localização do Pesquisador */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5">
              Informações do Pesquisador
            </h4>
            <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-300">
              {perfil.email && (
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{perfil.email}</span>
                </div>
              )}
              {perfil.telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>{perfil.telefone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>{perfil.cidade} — {perfil.estado}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default MeuPerfil;
