import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useUserSession } from "../hooks/useUserSession";
import { badgeService } from "../services/badgeService";
import {
  Sparkles, Send, Heart, MessageCircle,
  MoreHorizontal, Trash2, TrendingUp, Zap,
  ChevronDown, ChevronUp, X, Smile, Link, Users,
  Share2, Award, Flame, ThumbsUp, Compass, Bookmark,
  CheckCircle2, BarChart3, HelpCircle, Smartphone,
  Plus, ChevronLeft, ChevronRight
} from "lucide-react";
import {
  personalizarFeedTAS,
  TASUserProfile,
  registrarDwellTimeTAS,
  carregarInteressesUsuarioTAS
} from "../utils/tasRecommendationAlgorithm";
import { IndicarAmigosModal } from "../components/IndicarAmigosModal";
import { registrarMetricaAB } from "../utils/abTesting";
import { StudentPulseCard } from "../components/Feed/StudentPulseCard";
import { tasFeedScraperService } from "../services/tasFeedScraperService";
import { ColegaProfileModal, ColegaProfileData } from "../components/ColegaProfileModal";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60)   return "agora mesmo";
  if (s < 3600) return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
}

const GRADS = ["#3B82F6,#6366F1","#EC4899,#F43F5E","#10B981,#14B8A6",
               "#F59E0B,#F97316","#8B5CF6,#A855F7","#06B6D4,#0EA5E9"];
function grad(n: string) { return GRADS[(n||"?").charCodeAt(0) % GRADS.length].split(","); }
function ini(n: string)  { return (n||"?").split(" ").slice(0,2).map(x=>x[0]).join("").toUpperCase(); }

export interface ReactionItem {
  key: string;
  emoji: string;
  label: string;
  color: string;
}

export const REACTION_LIST: ReactionItem[] = [
  { key: "like",  emoji: "👍", label: "Curtir", color: "#2563eb" },
  { key: "heart", emoji: "❤️", label: "Amei",   color: "#e11d48" },
  { key: "fire",  emoji: "🔥", label: "Fogo",   color: "#ea580c" },
  { key: "clap",  emoji: "👏", label: "Palmas", color: "#ca8a04" },
  { key: "bulb",  emoji: "💡", label: "Genial", color: "#7c3aed" },
  { key: "laugh", emoji: "😂", label: "Haha",   color: "#d97706" },
  { key: "wow",   emoji: "😮", label: "Uau",    color: "#0891b2" },
  { key: "sad",   emoji: "😢", label: "Força",  color: "#475569" },
];

/**
 * Normaliza qualquer chave de reação para seu emoji visual UTF-8 correspondente,
 * prevenindo que textos literais como "heart" ou "like" sejam renderizados em tela.
 */
export function normalizeEmoji(val?: string | null): string {
  if (!val) return "❤️";
  const trimmed = val.trim();
  const found = REACTION_LIST.find(
    (r) => r.key === trimmed || r.emoji === trimmed || r.label.toLowerCase() === trimmed.toLowerCase()
  );
  if (found) return found.emoji;
  if (/\p{Extended_Pictographic}/u.test(trimmed)) return trimmed;
  return "❤️";
}


// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, url="", size=40 }: { name:string; url?:string; size?:number }) {
  const [err, setErr] = useState(false);
  const [g] = useState(()=> grad(name));
  if (url && !err) return (
    <img src={url} alt={name} onError={()=>setErr(true)}
      style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
  );
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`linear-gradient(135deg,${g[0]},${g[1]})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:900, fontSize:size*0.35, color:"#fff", userSelect:"none",
    }}>{ini(name)}</div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Post {
  id: number;
  user_id: string;
  author_name: string;
  content: string;
  image_url?: string;
  type: string;
  created_at: string;
  likes_count?: number;
  liked?: boolean;
  my_emoji?: string;
  reactions_map?: Record<string, number>;
  comments_count?: number;
  tasScore?: number;
  tasRecomendacaoMotivo?: string;
}
interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

// ─── Emoji picker (Facebook style) ───────────────────────────────────────────
function EmojiBar({ onPick, currentEmoji }: { onPick: (e:string)=>void; currentEmoji?: string | null }) {
  return (
    <div style={{
      display:"flex", gap:4, background:"#fff", border:"1.5px solid #e2e8f0",
      borderRadius:24, padding:"6px 10px", boxShadow:"0 12px 36px rgba(0,0,0,0.16)",
      alignItems:"center", zIndex:40,
    }}>
      {REACTION_LIST.map(r => (
        <button key={r.key} type="button" onClick={()=>onPick(r.emoji)}
          title={r.label}
          style={{
            fontSize:22, background: currentEmoji === r.emoji ? "#eff6ff" : "none",
            border: currentEmoji === r.emoji ? "1.5px solid #60a5fa" : "none",
            cursor:"pointer", padding:"4px 6px",
            borderRadius:14, transition:"transform 0.15s, background 0.15s",
          }}
          onMouseEnter={el=>(el.currentTarget.style.transform="scale(1.35)")}
          onMouseLeave={el=>(el.currentTarget.style.transform="scale(1)")}
        >{r.emoji}</button>
      ))}
    </div>
  );
}

// ─── Comment ─────────────────────────────────────────────────────────────────
function CommentRow({ c, myId, onDelete, onOpenProfile }: { c:Comment; myId:string; onDelete:()=>void; onOpenProfile?:(name:string, userId?:string)=>void }) {
  const isMe = c.user_id === myId;
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 0", borderBottom:"1px solid #f8fafc" }}>
      <div onClick={() => onOpenProfile?.(c.author_name, c.user_id)} style={{ cursor: onOpenProfile ? "pointer" : "default" }} title="Ver perfil do colega">
        <Avatar name={c.author_name} size={28} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ background:"#f8fafc", borderRadius:12, padding:"8px 12px" }}>
          <span 
            onClick={() => onOpenProfile?.(c.author_name, c.user_id)}
            style={{ fontWeight:800, fontSize:12, color:"#1e293b", marginRight:6, cursor: onOpenProfile ? "pointer" : "default" }}
            onMouseEnter={e => { if (onOpenProfile) e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}
          >
            {c.author_name}
          </span>
          <span style={{ fontSize:13, color:"#374151", lineHeight:1.5 }}>{c.content}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:4 }}>
          <span style={{ fontSize:10, color:"#94a3b8" }}>{timeAgo(c.created_at)}</span>
          {isMe && (
            <button type="button" onClick={onDelete}
              style={{ fontSize:10, color:"#ef4444", fontWeight:700, background:"none", border:"none", cursor:"pointer", padding:0 }}>
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ───────────────────────────────────────────────────────────────
function PostCard({ post, profile, onRefresh, onOpenProfile }: { post:Post; profile:any; onRefresh:()=>void; onOpenProfile?:(name:string, userId?:string)=>void }) {
  const isMe = post.user_id === profile?.id;
  const [liked, setLiked]           = useState(post.liked ?? false);
  const [likeCount, setLikeCount]   = useState(post.likes_count ?? 0);
  const [myEmoji, setMyEmoji]       = useState<string | null>(post.my_emoji || (post.liked ? "❤️" : null));
  const [reactionsMap, setReactionsMap] = useState<Record<string, number>>(post.reactions_map || {});
  const [likeLoading, setLikeLoading] = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [showEmoji, setShowEmoji]   = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]     = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    setLiked(post.liked ?? false);
    setLikeCount(post.likes_count ?? 0);
    setMyEmoji(post.my_emoji || (post.liked ? "❤️" : null));
    setReactionsMap(post.reactions_map || {});
  }, [post.liked, post.likes_count, post.my_emoji, post.reactions_map]);

  // TAS Algoritmo: Rastreia tempo de tela implícito (Dwell Time)
  useEffect(() => {
    const start = Date.now();
    return () => {
      const elapsedSeconds = Math.floor((Date.now() - start) / 1000);
      if (elapsedSeconds >= 3) {
        registrarDwellTimeTAS(post.id, elapsedSeconds, (post as any).news_category);
      }
    };
  }, [post.id]);

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase.from("lyka_comments")
      .select("*").eq("post_id", post.id).order("created_at",{ascending:true});
    setComments((data || []) as Comment[]);
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) { void loadComments(); }
    setShowComments(v => !v);
  };

  // Realtime comments
  useEffect(() => {
    if (!showComments) return;
    const ch = supabase.channel(`post-${post.id}-comments`)
      .on("postgres_changes", { event:"*", schema:"public", table:"lyka_comments",
        filter:`post_id=eq.${post.id}` }, () => void loadComments())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [showComments, post.id]);

  const handleEmojiReact = async (chosenEmoji: string) => {
    setShowEmoji(false);
    if (!profile?.id || likeLoading) return;
    setLikeLoading(true);

    const isUntoggle = myEmoji === chosenEmoji;
    const oldEmoji = myEmoji;
    const oldLiked = liked;
    const oldCount = likeCount;
    const oldMap = { ...reactionsMap };

    // Optimistic Update
    if (isUntoggle) {
      setMyEmoji(null);
      setLiked(false);
      setLikeCount(Math.max(0, oldCount - 1));
      const nextMap = { ...oldMap };
      if (nextMap[chosenEmoji] > 1) nextMap[chosenEmoji]--;
      else delete nextMap[chosenEmoji];
      setReactionsMap(nextMap);
    } else {
      setMyEmoji(chosenEmoji);
      setLiked(true);
      if (!oldLiked) setLikeCount(oldCount + 1);
      const nextMap = { ...oldMap };
      if (oldEmoji && nextMap[oldEmoji]) {
        if (nextMap[oldEmoji] > 1) nextMap[oldEmoji]--;
        else delete nextMap[oldEmoji];
      }
      nextMap[chosenEmoji] = (nextMap[chosenEmoji] || 0) + 1;
      setReactionsMap(nextMap);
    }

    try {
      // 1. Remove qualquer reação anterior deste usuário nesta postagem
      await supabase
        .from("lyka_reactions")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", profile.id);

      // 2. Se não estiver desmarcando, insere a nova reação
      if (!isUntoggle) {
        const { error } = await supabase
          .from("lyka_reactions")
          .insert([{ post_id: post.id, user_id: profile.id, emoji: chosenEmoji }]);

        if (error) {
          console.error("Erro ao salvar reacao:", error);
          // Reverte otimista
          setMyEmoji(oldEmoji);
          setLiked(oldLiked);
          setLikeCount(oldCount);
          setReactionsMap(oldMap);
        } else {
          void badgeService.unlockBadge(profile.id, 'primeira_reacao');
        }
      }
      onRefresh();
    } catch (err) {
      console.error("Erro ao reagir:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleLike = () => {
    if (liked) {
      void handleEmojiReact(myEmoji || "❤️");
    } else {
      void handleEmojiReact("❤️");
    }
  };

  const handleDelete = async () => {
    if (!isMe || deleting) return;
    setDeleting(true);
    await supabase.from("lyka_posts").delete().eq("id",post.id);
    onRefresh();
  };

  const handleSendComment = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const txt = newComment.trim();
    if (!txt || sendingComment) return;
    setSendingComment(true);
    setNewComment("");
    const { error } = await supabase.from("lyka_comments").insert([{
      post_id: post.id, user_id: profile.id,
      author_name: profile.nomeCompleto || "Pesquisador(a)",
      content: txt,
    }]);
    if (error) alert("Erro ao enviar comentário: " + error.message);
    await loadComments();
    setSendingComment(false);
  };

  const handleDeleteComment = async (cid: number) => {
    await supabase.from("lyka_comments").delete().eq("id",cid);
    await loadComments();
  };

  const isAutoPost = post.type === "censo_auto";
  const isConquista = post.type === "conquista" || post.type === "conquista_censo";
  const isOfficial = post.type === "comunicado" || post.type === "official" || post.type === "aviso";
  const isNoticia = (post as any).is_external_news || post.type === "noticia_curada";

  let cardBg = "#ffffff";
  let cardBorder = "1px solid #f1f5f9";
  let cardShadow = "0 2px 12px rgba(0,0,0,0.03)";

  if (isConquista) {
    cardBg = "linear-gradient(180deg, #fefce8 0%, #ffffff 90px)";
    cardBorder = "1.5px solid #fef08a";
    cardShadow = "0 4px 16px rgba(234,179,8,0.08)";
  } else if (isOfficial) {
    cardBg = "linear-gradient(180deg, #f0fdf4 0%, #ffffff 90px)";
    cardBorder = "1.5px solid #86efac";
    cardShadow = "0 4px 16px rgba(34,197,94,0.08)";
  } else if (isNoticia) {
    cardBg = "linear-gradient(180deg, #eff6ff 0%, #ffffff 90px)";
    cardBorder = "1.5px solid #bfdbfe";
    cardShadow = "0 4px 16px rgba(59,130,246,0.08)";
  }

  // Identifica o rótulo da reação ativa
  const activeReactionDef = REACTION_LIST.find(r => r.emoji === myEmoji);

  // Emojis mais reagidos para o cluster normalizados
  const topReactions = Object.entries(reactionsMap)
    .map(([rawKey, count]) => [normalizeEmoji(rawKey), count] as [string, number])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);


  return (
    <article style={{
      background: cardBg,
      borderRadius: 24,
      border: cardBorder,
      boxShadow: cardShadow,
      overflow: "hidden",
      transition: "box-shadow 0.2s",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"16px 18px 12px" }}>
        <div 
          onClick={() => onOpenProfile?.(post.author_name, post.user_id)}
          style={{ display:"flex", alignItems:"center", gap:12, cursor: onOpenProfile ? "pointer" : "default" }}
          title="Ver perfil do colega e curtir"
        >
          <Avatar name={post.author_name} size={40} />
          <div>
            <p 
              style={{ fontWeight:800, fontSize:14, color:"#0f172a", margin:"0 0 2px" }}
              onMouseEnter={e => { if (onOpenProfile) e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}
            >
              {post.author_name}
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, color:"#94a3b8" }}>{timeAgo(post.created_at)}</span>
              {isAutoPost && (
                <span style={{
                  fontSize:10, fontWeight:800, color:"#7c3aed",
                  background:"#ede9fe", border:"1px solid #ddd6fe",
                  padding:"2px 8px", borderRadius:99,
                }}>🎉 nova coleta</span>
              )}
              {isConquista && (
                <span style={{
                  fontSize:10, fontWeight:800, color:"#b45309",
                  background:"#fef3c7", border:"1px solid #fde68a",
                  padding:"2px 8px", borderRadius:99,
                  display:"inline-flex", alignItems:"center", gap:3
                }}>🏆 Top Entrevistador</span>
              )}
              {isOfficial && (
                <span style={{
                  fontSize:10, fontWeight:800, color:"#0369a1",
                  background:"#e0f2fe", border:"1px solid #bae6fd",
                  padding:"2px 8px", borderRadius:99,
                  display:"inline-flex", alignItems:"center", gap:3
                }}>📌 Comunicado Oficial</span>
              )}
              {post.tasRecomendacaoMotivo && (
                <span style={{
                  fontSize:10, fontWeight:700, color:"#7e22ce",
                  background:"#f3e8ff", border:"1px solid #e9d5ff",
                  padding:"2px 8px", borderRadius:99,
                  display:"inline-flex", alignItems:"center", gap:3
                }}>
                  ✨ {post.tasRecomendacaoMotivo}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Menu */}
        <div style={{ position:"relative" }}>
          <button type="button" onClick={()=>setShowMenu(v=>!v)}
            style={{ width:34, height:34, borderRadius:10, background:"transparent", border:"none",
              color:"#94a3b8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <MoreHorizontal style={{width:16,height:16}}/>
          </button>
          {showMenu && (
            <>
              <button type="button" onClick={()=>setShowMenu(false)} aria-label="fechar"
                style={{ position:"fixed", inset:0, zIndex:10, background:"transparent", border:"none", cursor:"default" }}/>
              <div style={{
                position:"absolute", right:0, top:"100%", marginTop:4,
                background:"#fff", border:"1px solid #e2e8f0", borderRadius:16,
                boxShadow:"0 8px 30px rgba(0,0,0,0.12)", zIndex:20, minWidth:160, padding:"4px 0",
              }}>
                {isMe && (
                  <button type="button" onClick={()=>{ setShowMenu(false); void handleDelete(); }}
                    style={{ width:"100%", padding:"10px 16px", textAlign:"left", display:"flex", alignItems:"center", gap:8,
                      fontSize:12, fontWeight:700, color:"#ef4444", background:"none", border:"none", cursor:"pointer",
                      fontFamily:"inherit" }}>
                    <Trash2 style={{width:13,height:13}}/> Excluir post
                  </button>
                )}
                <button type="button" onClick={()=>{ navigator.clipboard.writeText(window.location.href); setShowMenu(false); }}
                  style={{ width:"100%", padding:"10px 16px", textAlign:"left", display:"flex", alignItems:"center", gap:8,
                    fontSize:12, fontWeight:700, color:"#374151", background:"none", border:"none", cursor:"pointer",
                    fontFamily:"inherit" }}>
                  <Link style={{width:13,height:13}}/> Copiar link
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Motivo da Recomendação Algorítmica TAS */}
      {post.tasRecomendacaoMotivo && (
        <div style={{
          margin: "0 18px 10px",
          padding: "6px 12px",
          borderRadius: 12,
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 11,
          fontWeight: 700,
          color: "#166534"
        }}>
          <Sparkles style={{ width: 13, height: 13, color: "#16a34a", flexShrink: 0 }} />
          <span>Sugerido para você: {post.tasRecomendacaoMotivo}</span>
        </div>
      )}

      {/* Content */}
      <div style={{ padding:"0 18px 14px" }}>
        {isConquista ? (
          <div style={{ padding:"12px 16px", background:"#fefce8", border:"1px solid #fde047", borderRadius:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, color:"#a16207", fontSize:11.5, fontWeight:800 }}>
              <span>🏆 Marco Comunitário</span>
            </div>
            <p style={{ fontSize:15, fontWeight:700, color:"#854d0e", lineHeight:1.6, margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
              {post.content}
            </p>
          </div>
        ) : (
          <p style={{ fontSize:14, color:"#1e293b", lineHeight:1.7, margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
            {post.content}
          </p>
        )}
        {post.image_url && (
          <img src={post.image_url} alt="imagem do post"
            style={{ width:"100%", borderRadius:16, marginTop:12, objectFit:"cover", maxHeight:400 }}
            onError={e=>(e.currentTarget.style.display="none")} />
        )}
      </div>

      {/* Stats row com cluster de reações estilo Facebook */}
      {(likeCount > 0 || (post.comments_count||0) > 0) && (
        <div style={{ padding:"0 18px 8px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          {likeCount > 0 ? (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {/* Overlapping icons */}
              <div style={{ display:"flex", alignItems:"center", marginRight:2 }}>
                {topReactions.map(([emoji], idx) => {
                  const norm = normalizeEmoji(emoji);
                  return (
                    <span key={`${norm}-${idx}`} style={{
                      fontSize:14, marginLeft: idx > 0 ? -4 : 0,
                      filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
                    }}>
                      {norm}
                    </span>
                  );
                })}
              </div>
              <span style={{ fontSize:12, fontWeight:700, color:"#64748b" }}>
                {likeCount} {likeCount === 1 ? "reação" : "reações"}
              </span>
            </div>
          ) : <div />}

          {(post.comments_count||0) > 0 && (
            <button type="button" onClick={toggleComments}
              style={{ fontSize:12, color:"#64748b", background:"none", border:"none", cursor:"pointer",
                padding:0, fontFamily:"inherit", fontWeight:600 }}>
              {post.comments_count} {post.comments_count===1?"comentário":"comentários"}
            </button>
          )}
        </div>
      )}

      {/* Action bar estilo Facebook */}
      <div style={{ display:"flex", alignItems:"center", padding:"6px 12px", borderTop:"1px solid #f8fafc", gap:4, position:"relative" }}>
        
        {/* Like / Reação rápida */}
        <div style={{ position:"relative", flex:1, display:"flex" }}
          onMouseEnter={()=>setShowEmoji(true)}
          onMouseLeave={()=>setShowEmoji(false)}
        >
          <button type="button" onClick={handleLike} disabled={likeLoading}
            style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              padding:"9px 0", borderRadius:14, border:"none", cursor:"pointer", fontFamily:"inherit",
              fontWeight:800, fontSize:13,
              background: liked ? "#eff6ff" : "transparent",
              color: activeReactionDef ? activeReactionDef.color : (liked ? "#e11d48" : "#64748b"),
              transition:"all 0.15s",
            }}>
            {myEmoji ? (
              <span style={{ fontSize:17, transform: liked ? "scale(1.2)" : "scale(1)", transition:"transform 0.15s" }}>
                {myEmoji}
              </span>
            ) : (
              <Heart style={{ width:17, height:17, fill: liked?"#e11d48":"none", transition:"transform 0.15s" }} />
            )}
            <span>{activeReactionDef ? activeReactionDef.label : "Reagir"}</span>
          </button>

          {/* Facebook-style Hover Floating Reactions Bar */}
          {showEmoji && (
            <div style={{
              position:"absolute", bottom:"100%", left:0, marginBottom:8,
              zIndex:50, animation:"feedIn 0.2s ease",
            }}>
              <EmojiBar onPick={handleEmojiReact} currentEmoji={myEmoji} />
            </div>
          )}
        </div>

        {/* Botão de abrir reações no toque móvel */}
        <button type="button" onClick={()=>setShowEmoji(v=>!v)}
          style={{ display:"flex", alignItems:"center", justifyContent:"center",
            width:36, height:36, borderRadius:12, border:"none", cursor:"pointer",
            background:showEmoji?"#eff6ff":"transparent", color:"#64748b", transition:"all 0.15s" }}>
          <Smile style={{width:17,height:17}}/>
        </button>

        {/* Comment */}
        <button type="button" onClick={toggleComments}
          style={{
            flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            padding:"9px 0", borderRadius:14, border:"none", cursor:"pointer", fontFamily:"inherit",
            fontWeight:700, fontSize:13, background:"transparent", color:"#64748b", transition:"all 0.15s",
          }}>
          <MessageCircle style={{width:17,height:17}}/>
          Comentar
          {showComments ? <ChevronUp style={{width:13,height:13}}/> : <ChevronDown style={{width:13,height:13}}/>}
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div style={{ padding:"0 18px 16px", borderTop:"1px solid #f8fafc" }}>
          {loadingComments ? (
            <div style={{ padding:"12px 0", textAlign:"center", color:"#94a3b8", fontSize:12 }}>Carregando...</div>
          ) : (
            <>
              {comments.map(c => (
                <CommentRow key={c.id} c={c} myId={profile.id}
                  onDelete={()=>void handleDeleteComment(c.id)} onOpenProfile={onOpenProfile} />
              ))}
              {/* New comment input */}
              <form onSubmit={e=>void handleSendComment(e)}
                style={{ display:"flex", alignItems:"center", gap:10, marginTop:12 }}>
                <Avatar name={profile.nomeCompleto||"EU"} size={30} />
                <div style={{ flex:1, display:"flex", alignItems:"center", background:"#f8fafc",
                  border:"1.5px solid #e2e8f0", borderRadius:20, overflow:"hidden",
                  transition:"border-color 0.2s" }}>
                  <input
                    type="text" value={newComment}
                    onChange={e=>setNewComment(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); void handleSendComment(); }}}
                    placeholder="Escreva um comentário..."
                    style={{ flex:1, padding:"9px 14px", background:"transparent", border:"none",
                      fontSize:13, fontFamily:"inherit", color:"#1e293b", outline:"none" }}
                    onFocus={e=>(e.currentTarget.parentElement!.style.borderColor="#6366f1")}
                    onBlur={e=>(e.currentTarget.parentElement!.style.borderColor="#e2e8f0")}
                  />
                  <button type="submit" disabled={sendingComment||!newComment.trim()}
                    style={{ padding:"0 14px 0 8px", background:"none", border:"none",
                      color: newComment.trim()?"#6366f1":"#94a3b8", cursor:"pointer", display:"flex", alignItems:"center" }}>
                    <Send style={{width:15,height:15}}/>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </article>
  );
}

// ─── Instagram / Telegram Stories da Comunidade ──────────────────────────────
export interface StoryItem {
  id: string;
  author: string;
  authorId?: string;
  role: string;
  avatarUrl?: string;
  gradient: string;
  headline: string;
  text: string;
  time: string;
  tag: string;
  likesCount?: number;
}

const DEFAULT_STORIES: StoryItem[] = [
  {
    id: "lais-destaque",
    author: "Lais Santos",
    authorId: "lais-oficial",
    role: "Pesquisadora Top 1",
    gradient: "linear-gradient(45deg, #ec4899 0%, #f43f5e 50%, #f59e0b 100%)",
    headline: "Rumo ao Topo com a Turma! 🌟",
    text: "Muito feliz em ver nossa pesquisa avançando no CEEP! Cada post e conversa ajuda a entender as necessidades reais dos estudantes.",
    time: "1h atrás",
    tag: "Destaque do Pódio",
    likesCount: 14,
  },
  {
    id: "isadora-campo",
    author: "Isadora Silva",
    authorId: "isadora-oficial",
    role: "Pesquisadora de Campo",
    gradient: "linear-gradient(45deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)",
    headline: "Histórias que Inspiram 📚",
    text: "Mapear o perfil dos alunos do CEEP Seabra nos mostra como a nossa escola é rica em diversidade e talento científico!",
    time: "2h atrás",
    tag: "Pesquisa CEEP",
    likesCount: 19,
  },
  {
    id: "ian-orientador",
    author: "Prof. Ian Santos",
    role: "Coordenador Científico",
    gradient: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    headline: "Dica de Campo: O Turno Noturno 🌙",
    text: "Alunos do Noturno: os estudantes que trabalham durante o dia têm relatos riquíssimos sobre tempo de deslocamento e pertencimento escolar. Aproveitem o intervalo!",
    time: "2h atrás",
    tag: "Orientação Oficial",
    likesCount: 28,
  },
  {
    id: "adinha-etica",
    author: "Adinha Lovelace",
    role: "Mascote & IA do Censo",
    gradient: "linear-gradient(45deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
    headline: "Ética e Sigilo em 1º Lugar 🔒",
    text: "Nosso compromisso é científico e com a LGPD. Respostas sensíveis nunca devem ser expostas individualmente. Parabéns pela postura empática nas abordagens!",
    time: "3h atrás",
    tag: "Boas Práticas",
    likesCount: 42,
  },
  {
    id: "taylon-meta20",
    author: "Taylon Willian",
    role: "Entrevistador 1º ADM",
    gradient: "linear-gradient(45deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)",
    headline: "Rumo à Meta 20! 🏆",
    text: "A turma do 1º ADM CM está acelerando na coleta de campo. Quem já garantiu a insígnia da Adinha Campeã manda um salve aqui no Feed!",
    time: "4h atrás",
    tag: "Top Entrevistadores",
    likesCount: 31,
  },
  {
    id: "ceep-comunidade",
    author: "CEEP Seabra",
    role: "Direção Escolar",
    gradient: "linear-gradient(45deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)",
    headline: "Ciência que Transforma a Escola 🏫",
    text: "Cada ficha preenchida vira diagnóstico real para melhorias no refeitório, transporte e projetos pedagógicos do CEEP Seabra.",
    time: "6h atrás",
    tag: "Comunidade",
    likesCount: 25,
  },
];

function StoriesBar({
  stories,
  userProfile,
  onOpenStory,
  onCreateStory,
}: {
  stories: StoryItem[];
  userProfile?: any;
  onOpenStory: (index: number) => void;
  onCreateStory: () => void;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 24,
        padding: "14px 16px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
        overflowX: "auto",
        display: "flex",
        alignItems: "center",
        gap: 16,
        scrollbarWidth: "none",
      }}
    >
      {/* Botão Telegram / Instagram: Criar meu Story */}
      <button
        type="button"
        onClick={onCreateStory}
        title="Publicar seu story de pesquisa"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
          fontFamily: "inherit",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              padding: 2.5,
              borderRadius: "50%",
              background: "#e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                padding: 2,
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Avatar name={userProfile?.nomeCompleto || "Você"} size={52} url={userProfile?.avatarUrl} />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0284c7, #2563eb)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
              fontSize: 14,
              fontWeight: 900,
              boxShadow: "0 2px 6px rgba(37,99,235,0.4)",
            }}
          >
            +
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "#2563eb",
            maxWidth: 68,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          Seu Story
        </span>
      </button>

      {/* Lista de Stories da Comunidade */}
      {stories.map((story, idx) => (
        <button
          key={story.id}
          type="button"
          onClick={() => onOpenStory(idx)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            flexShrink: 0,
            fontFamily: "inherit",
          }}
        >
          {/* Anel Gradiente Instagram / Telegram */}
          <div
            style={{
              padding: 3,
              borderRadius: "50%",
              background: story.gradient || "linear-gradient(45deg, #f59e0b, #ec4899, #8b5cf6)",
              boxShadow: "0 2px 10px rgba(99,102,241,0.2)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div
              style={{
                padding: 2,
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Avatar name={story.author} size={52} url={story.avatarUrl} />
            </div>
          </div>
          <span
            title={story.author}
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: "#334155",
              maxWidth: 72,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
              display: "block",
            }}
          >
            {story.author}
          </span>
        </button>
      ))}
    </div>
  );
}

function StoryModal({
  stories,
  initialIndex,
  onClose,
  onOpenProfile,
}: {
  stories: StoryItem[];
  initialIndex: number | null;
  onClose: () => void;
  onOpenProfile?: (authorName: string, authorId?: string) => void;
}) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(initialIndex ?? 0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reactionsBurst, setReactionsBurst] = useState<{ id: number; emoji: string; left: number }[]>([]);
  const [storyLikes, setStoryLikes] = useState<Record<string, number>>({});
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (initialIndex !== null) {
      setCurrentIndex(initialIndex);
      setProgress(0);
    }
  }, [initialIndex]);

  const activeStory = initialIndex !== null && stories[currentIndex] ? stories[currentIndex] : null;

  // Auto-avanço com barra de progresso contínua
  useEffect(() => {
    if (!activeStory || isPaused) return;

    const duration = 6000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          clearInterval(timer);
          // Avança para o próximo story ou fecha se for o último
          if (currentIndex + 1 < stories.length) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStory, currentIndex, isPaused, stories.length, onClose]);

  // Teclado (Escape, Seta Esquerda, Seta Direita)
  useEffect(() => {
    if (!activeStory) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeStory, currentIndex]);

  if (!activeStory) return null;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < stories.length) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleEmojiReact = (emoji: string) => {
    const burst = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      emoji,
      left: 20 + Math.random() * 60,
    }));
    setReactionsBurst((prev) => [...prev, ...burst]);
    setTimeout(() => {
      setReactionsBurst([]);
    }, 1200);

    setStoryLikes((prev) => ({
      ...prev,
      [activeStory.id]: (prev[activeStory.id] || activeStory.likesCount || 0) + 1,
    }));
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onClose();
    // Abre conversa privada no Lyka Chat
    navigate(`/lyka-chat?dm=${encodeURIComponent(activeStory.authorId || activeStory.author)}&dmName=${encodeURIComponent(activeStory.author)}`);
  };

  const likesDisplay = storyLikes[activeStory.id] ?? (activeStory.likesCount || 0);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.92)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <style>{`
        @keyframes storyBurst {
          0% { transform: translateY(0) scale(0.6); opacity: 1; }
          100% { transform: translateY(-110px) scale(1.4); opacity: 0; }
        }
      `}</style>

      {/* Botão Seta Anterior (Desktop) */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          style={{
            position: "absolute",
            left: 24,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            zIndex: 100,
          }}
          className="md:flex"
        >
          <ChevronLeft style={{ width: 24, height: 24 }} />
        </button>
      )}

      {/* Cartão Central do Story */}
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#0f172a",
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.18)",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
          position: "relative",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          minHeight: 520,
        }}
      >
        {/* Barra de Progresso Segmentada (Instagram / Telegram) */}
        <div style={{ display: "flex", gap: 4, padding: "14px 16px 8px", width: "100%", zIndex: 10 }}>
          {stories.map((s, idx) => (
            <div
              key={s.id}
              style={{
                flex: 1,
                height: 3,
                background: "rgba(255,255,255,0.25)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "#ffffff",
                  width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%",
                  transition: idx === currentIndex ? "width 0.05s linear" : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Cabeçalho do Story com Acesso Rápido ao Perfil */}
        <div
          style={{
            padding: "8px 16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 10,
          }}
        >
          <div
            onClick={() => onOpenProfile?.(activeStory.author, activeStory.authorId)}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            title="Ver perfil do autor e curtir"
          >
            <div style={{ padding: 2, borderRadius: "50%", background: activeStory.gradient }}>
              <Avatar name={activeStory.author} size={38} url={activeStory.avatarUrl} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <strong style={{ fontSize: 13, color: "#fff" }}>{activeStory.author}</strong>
                <span
                  style={{
                    fontSize: 10,
                    background: "rgba(255,255,255,0.2)",
                    padding: "2px 8px",
                    borderRadius: 99,
                    fontWeight: 800,
                  }}
                >
                  {activeStory.tag}
                </span>
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)" }}>
                {activeStory.role} · {activeStory.time}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={() => onOpenProfile?.(activeStory.author, activeStory.authorId)}
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "none",
                color: "#fff",
                fontSize: 11,
                fontWeight: 800,
                padding: "5px 10px",
                borderRadius: 99,
                cursor: "pointer",
              }}
            >
              Ver Perfil
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar story"
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>

        {/* Corpo do Story com Áreas de Toque Esquerda/Direita */}
        <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Toque Esquerda (Voltar) */}
          <div
            onClick={handlePrev}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "30%",
              zIndex: 5,
              cursor: "pointer",
            }}
            title="História anterior"
          />
          {/* Toque Direita (Avançar) */}
          <div
            onClick={handleNext}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: "70%",
              zIndex: 5,
              cursor: "pointer",
            }}
            title="Próxima história"
          />

          {/* Partículas de Reação Flutuantes */}
          {reactionsBurst.map((r) => (
            <div
              key={r.id}
              style={{
                position: "absolute",
                bottom: 80,
                left: `${r.left}%`,
                fontSize: 26,
                animation: "storyBurst 1.1s ease-out forwards",
                pointerEvents: "none",
                zIndex: 20,
              }}
            >
              {r.emoji}
            </div>
          ))}

          {/* Conteúdo Visual do Story */}
          <div
            style={{
              flex: 1,
              padding: "40px 26px",
              background: "linear-gradient(180deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,1) 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 18,
                background: activeStory.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                marginBottom: 18,
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
            >
              ✨
            </div>
            <h3
              style={{
                fontSize: 21,
                fontWeight: 900,
                marginBottom: 14,
                color: "#f8fafc",
                lineHeight: 1.3,
                letterSpacing: "-0.3px",
              }}
            >
              {activeStory.headline}
            </h3>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.92)",
                margin: 0,
                maxWidth: 340,
              }}
            >
              "{activeStory.text}"
            </p>

            {likesDisplay > 0 && (
              <div
                style={{
                  marginTop: 22,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.1)",
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#fda4af",
                }}
              >
                <span>❤️ {likesDisplay} reações recebidas</span>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Reação & Resposta no Estilo Telegram Stories */}
        <div
          style={{
            padding: "12px 16px 16px",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(15,23,42,0.95)",
            zIndex: 10,
          }}
        >
          {/* Quick Reaction Emojis */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            {["❤️", "🔥", "👏", "💡", "🚀"].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => handleEmojiReact(em)}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "none",
                  fontSize: 20,
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                {em}
              </button>
            ))}
          </div>

          {/* Quick Reply Form */}
          <form onSubmit={handleSendReply} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder={`Responder a ${activeStory.author.split(" ")[0]} no Lyka...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 99,
                padding: "8px 14px",
                color: "#fff",
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              style={{
                padding: "8px 14px",
                borderRadius: 99,
                background: replyText.trim() ? "linear-gradient(135deg, #0284c7, #2563eb)" : "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "none",
                fontWeight: 800,
                fontSize: 12,
                cursor: replyText.trim() ? "pointer" : "default",
              }}
            >
              Enviar
            </button>
          </form>
        </div>
      </div>

      {/* Botão Seta Próximo (Desktop) */}
      {currentIndex + 1 < stories.length && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          style={{
            position: "absolute",
            right: 24,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
            zIndex: 100,
          }}
          className="md:flex"
        >
          <ChevronRight style={{ width: 24, height: 24 }} />
        </button>
      )}
    </div>
  );
}

function CreateStoryModal({
  isOpen,
  onClose,
  onPublish,
  userName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (story: StoryItem) => void;
  userName: string;
}) {
  const [headline, setHeadline] = useState("");
  const [text, setText] = useState("");
  const [selectedGrad, setSelectedGrad] = useState(0);

  const GRADIENTS = [
    "linear-gradient(45deg, #ec4899 0%, #f43f5e 50%, #f59e0b 100%)",
    "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    "linear-gradient(45deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
    "linear-gradient(45deg, #10b981 0%, #06b6d4 50%, #3b82f6 100%)",
    "linear-gradient(45deg, #8b5cf6 0%, #d946ef 50%, #f43f5e 100%)",
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !text.trim()) return;

    const newStory: StoryItem = {
      id: `story-${Date.now()}`,
      author: userName || "Pesquisador Censo",
      role: "Pesquisador CEEP",
      gradient: GRADIENTS[selectedGrad],
      headline: headline.trim(),
      text: text.trim(),
      time: "agora",
      tag: "Relato de Campo",
      likesCount: 0,
    };

    onPublish(newStory);
    setHeadline("");
    setText("");
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 24,
          width: "100%",
          maxWidth: 420,
          padding: 24,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", margin: 0 }}>
            Publicar Story no Feed ✨
          </h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
              Título ou Destaque
            </label>
            <input
              type="text"
              placeholder="Ex: Achado do intervalo no pátio 🔍"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
              Mensagem / Relato do Story
            </label>
            <textarea
              rows={3}
              placeholder="Compartilhe uma dica de campo, reflexão científica ou novidade da coleta..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid #e2e8f0",
                fontSize: 13,
                outline: "none",
                fontFamily: "inherit",
                resize: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
              Estilo da Borda
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              {GRADIENTS.map((g, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedGrad(idx)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: g,
                    border: selectedGrad === idx ? "3px solid #0f172a" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: 6,
              padding: "12px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #0284c7, #2563eb)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
            }}
          >
            Publicar Story
          </button>
        </form>
      </div>
    </div>
  );
}




// ─── Skeleton ────────────────────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div style={{ background:"#fff", borderRadius:24, border:"1px solid #f1f5f9", padding:20, animation:"feedPulse 1.5s ease infinite" }}>
      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        <div style={{ width:40,height:40,borderRadius:"50%",background:"#f1f5f9",flexShrink:0 }}/>
        <div style={{ flex:1 }}>
          <div style={{ height:12,background:"#f1f5f9",borderRadius:8,width:"40%",marginBottom:6 }}/>
          <div style={{ height:10,background:"#f8fafc",borderRadius:8,width:"25%" }}/>
        </div>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        <div style={{ height:12,background:"#f8fafc",borderRadius:8,width:"100%" }}/>
        <div style={{ height:12,background:"#f8fafc",borderRadius:8,width:"80%" }}/>
        <div style={{ height:12,background:"#f8fafc",borderRadius:8,width:"60%" }}/>
      </div>
    </div>
  );
}

// ─── Main Feed ───────────────────────────────────────────────────────────────
export function Feed() {
  const { profile } = useUserSession();
  const [storiesList, setStoriesList] = useState<StoryItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("censo_custom_stories") || "[]");
      return [...saved, ...DEFAULT_STORIES];
    } catch {
      return DEFAULT_STORIES;
    }
  });
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedColega, setSelectedColega] = useState<ColegaProfileData | null>(null);
  const [posts, setPosts]           = useState<Post[]>([]);

  const handleOpenColegaProfile = async (authorName: string, userId?: string) => {
    let pessoaData: any = null;
    if (userId && userId !== "censo-bot" && userId !== "bot") {
      const { data } = await supabase.from("pessoas").select("*").eq("id", userId).maybeSingle();
      pessoaData = data;
    }
    if (!pessoaData && authorName) {
      const { data } = await supabase.from("pessoas").select("*").ilike("nome_completo", authorName).maybeSingle();
      pessoaData = data;
    }

    setSelectedColega({
      id: pessoaData?.id || userId || "aluno",
      nome_completo: pessoaData?.nome_completo || authorName,
      avatar_url: pessoaData?.avatar_url,
      papel: pessoaData?.papel,
      turma_ou_cargo: pessoaData?.turma_ou_cargo,
      bio: pessoaData?.bio,
    });
  };

  const [feedTab, setFeedTab]       = useState<"para_voce" | "recentes" | "minha_turma" | "conquistas" | "noticias">("para_voce");
  const [showIndicarModal, setShowIndicarModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [imageUrl, setImageUrl]     = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [posting, setPosting]       = useState(false);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const [visibleCount, setVisibleCount] = useState(15);
  const [totalUsers, setTotalUsers] = useState(0);
  const [newPostsBanner, setNewPostsBanner] = useState(0);
  const lastSeenRef = useRef<string>(new Date().toISOString());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tasUser: TASUserProfile = React.useMemo(() => ({
    id: profile.id,
    nomeCompleto: profile.nomeCompleto || "Pesquisador",
    papel: profile.papel || "entrevistador",
    turmaOuCargo: profile.turmaOuCargo || "1º ADM CM",
    genero: (profile as any).genero,
    interesses: carregarInteressesUsuarioTAS(),
  }), [profile]);

  const fetchPosts = useCallback(async (silent=false) => {
    if(!silent) setFetchingPosts(true);
    const [{ data: postsData }, { data: reactionsData }, { data: commentsCount }, curatedNews] = await Promise.all([
      supabase.from("lyka_posts").select("*").order("created_at",{ascending:false}).limit(60),
      supabase.from("lyka_reactions").select("post_id, user_id, emoji"),
      supabase.from("lyka_comments").select("post_id"),
      tasFeedScraperService.getCuratedNews(),
    ]);

    const newsFeedPosts = tasFeedScraperService.convertNewsToFeedPosts(curatedNews);

    if (postsData || newsFeedPosts.length > 0) {
      const rm: Record<number, { count: number; userLiked: boolean; userEmoji?: string; emojiMap: Record<string, number> }> = {};
      (reactionsData || []).forEach((r: { post_id: number; user_id: string; emoji?: string }) => {
        if (!rm[r.post_id]) rm[r.post_id] = { count: 0, userLiked: false, emojiMap: {} };
        rm[r.post_id].count++;
        const e = normalizeEmoji(r.emoji || "❤️");
        rm[r.post_id].emojiMap[e] = (rm[r.post_id].emojiMap[e] || 0) + 1;
        if (r.user_id === profile.id) {
          rm[r.post_id].userLiked = true;
          rm[r.post_id].userEmoji = e;
        }
      });
      const cm: Record<number, number> = {};
      (commentsCount || []).forEach((c: { post_id: number }) => { cm[c.post_id] = (cm[c.post_id] || 0) + 1; });

      const enriched = (postsData || []).map((p: any) => ({
        ...p,
        likes_count: rm[p.id]?.count ?? 0,
        liked: rm[p.id]?.userLiked ?? false,
        my_emoji: rm[p.id]?.userEmoji,
        reactions_map: rm[p.id]?.emojiMap,
        comments_count: cm[p.id] ?? 0,
      }));
      setPosts([...enriched, ...(newsFeedPosts as any)]);
    }
    setFetchingPosts(false);
  }, [profile.id]);

  // Fetch users count
  useEffect(() => {
    supabase.from("pessoas").select("*",{count:"exact",head:true})
      .then(({count}) => setTotalUsers(count||0));
  }, []);

  useEffect(() => { void fetchPosts(); }, [fetchPosts]);

  // Realtime — show banner for new posts instead of auto-refresh
  useEffect(() => {
    const ch = supabase.channel("feed-rt-v2")
      .on("postgres_changes", {event:"INSERT", schema:"public", table:"lyka_posts"}, (payload) => {
        const p = payload.new as Post;
        if (p.user_id !== profile.id) setNewPostsBanner(n=>n+1);
        else void fetchPosts(true);
      })
      .on("postgres_changes", {event:"DELETE", schema:"public", table:"lyka_posts"}, () => void fetchPosts(true))
      .on("postgres_changes", {event:"*", schema:"public", table:"lyka_reactions"}, () => void fetchPosts(true))
      .on("postgres_changes", {event:"*", schema:"public", table:"lyka_comments"}, () => void fetchPosts(true))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [profile.id, fetchPosts]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if(!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [newPostContent]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newPostContent.trim() || posting) return;
    setPosting(true);
    lastSeenRef.current = new Date().toISOString();
    const { error } = await supabase.from("lyka_posts").insert([{
      user_id: profile.id || "anon",
      author_name: profile.nomeCompleto || "Pesquisador(a)",
      content: newPostContent.trim(),
      image_url: imageUrl.trim() || null,
      type: "user_post",
    }]);
    
    if (error) {
      alert("Erro ao publicar: " + error.message);
    } else {
      setNewPostContent(""); setImageUrl(""); setShowImageInput(false);
      if (profile?.id) {
        void (async () => {
          await badgeService.unlockBadge(profile.id, 'primeiro_post');
          const { count } = await supabase
            .from('lyka_posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.id);
          if (count && count >= 5) {
            await badgeService.unlockBadge(profile.id, 'cronista_do_feed');
          }
        })();
      }
      await fetchPosts();
    }
    setPosting(false);
  };

  const loadNew = () => {
    setNewPostsBanner(0);
    void fetchPosts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayedPosts = React.useMemo(() => {
    if (feedTab === "para_voce") {
      return personalizarFeedTAS(posts, tasUser) as Post[];
    }
    if (feedTab === "recentes") {
      return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (feedTab === "minha_turma") {
      const userTurma = (profile.turmaOuCargo || "").toUpperCase().trim();
      const filtered = posts.filter(p => {
        if (!userTurma) return true;
        const cNorm = (p.content || "").toUpperCase();
        const aNorm = (p.author_name || "").toUpperCase();
        return cNorm.includes(userTurma) || aNorm.includes(userTurma);
      });
      return filtered.length > 0 ? filtered : posts;
    }
    if (feedTab === "conquistas") {
      const filtered = posts.filter(p => p.type === "conquista" || p.type === "conquista_censo" || p.type === "censo_auto");
      return filtered.length > 0 ? filtered : posts;
    }
    if (feedTab === "noticias") {
      const filtered = posts.filter(p => (p as any).is_external_news || p.type === "noticia_curada");
      return filtered.length > 0 ? filtered : posts;
    }
    return posts;
  }, [posts, feedTab, tasUser, profile.turmaOuCargo]);

  return (
    <div style={{ width:"100%", display:"flex", flexDirection:"column", alignItems:"center", paddingBottom:80 }}>
      <style>{`
        @keyframes feedPulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        @keyframes feedSlide { from{opacity:0;transform:translateY(-12px);} to{opacity:1;transform:translateY(0);} }
        @keyframes feedIn { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
      `}</style>
      <div style={{ width:"100%", maxWidth:600, display:"flex", flexDirection:"column", gap:14 }}>

        {/* Header */}
        <div style={{
          background:"linear-gradient(135deg,#1e40af,#3730a3,#6b21a8)",
          borderRadius:24, padding:"22px 24px",
          boxShadow:"0 12px 36px rgba(30,58,138,0.25)", position:"relative", overflow:"hidden",
        }}>
          <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
          <div style={{position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:42,height:42,borderRadius:14,background:"rgba(255,255,255,0.18)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Sparkles style={{width:22,height:22,color:"#fff"}}/>
              </div>
              <div>
                <h1 style={{color:"#ffffff",fontWeight:900,fontSize:20,margin:0,letterSpacing:"-0.3px",textShadow:"0 1px 2px rgba(0,0,0,0.2)"}}>Feed da Pesquisa</h1>
                <p style={{color:"#e0e7ff",fontSize:12.5,margin:"2px 0 0",fontWeight:600}}>CEEP Seabra · Projeto Ada Lovelace</p>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:11.5,fontWeight:800,color:"#ffffff",
                background:"rgba(15,23,42,0.35)",border:"1px solid rgba(255,255,255,0.25)",backdropFilter:"blur(6px)",
                padding:"5px 12px",borderRadius:99,display:"flex",alignItems:"center",gap:6}}>
                <TrendingUp style={{width:13,height:13,color:"#93c5fd"}}/> {posts.length} publicações
              </span>
              <span style={{fontSize:11.5,fontWeight:800,color:"#ffffff",
                background:"rgba(15,23,42,0.35)",border:"1px solid rgba(255,255,255,0.25)",backdropFilter:"blur(6px)",
                padding:"5px 12px",borderRadius:99,display:"flex",alignItems:"center",gap:6}}>
                <Users style={{width:13,height:13,color:"#c4b5fd"}}/> {totalUsers} pesquisadores
              </span>
              <span style={{fontSize:11.5,fontWeight:800,color:"#a7f3d0",
                background:"rgba(6,78,59,0.55)",border:"1px solid rgba(52,211,153,0.5)",backdropFilter:"blur(6px)",
                padding:"5px 12px",borderRadius:99,display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#34d399",display:"inline-block",boxShadow:"0 0 8px #34d399",animation:"feedPulse 2s infinite"}}/>
                Ao vivo
              </span>
            </div>
          </div>
        </div>

        {/* Instagram / Telegram Stories Carousel */}
        <StoriesBar
          stories={storiesList}
          userProfile={profile}
          onOpenStory={(idx) => setActiveStoryIndex(idx)}
          onCreateStory={() => setShowCreateStory(true)}
        />

        {/* New posts banner */}
        {newPostsBanner > 0 && (
          <button type="button" onClick={loadNew}
            style={{
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              padding:"12px 20px",borderRadius:16,border:"none",
              background:"linear-gradient(135deg,#6366f1,#4338ca)",
              color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",
              boxShadow:"0 4px 20px rgba(99,102,241,0.4)",
              animation:"feedSlide 0.3s ease",fontFamily:"inherit",
            }}>
            <ChevronDown style={{width:16,height:16}}/>
            {newPostsBanner} nova{newPostsBanner>1?"s":""} publicaç{newPostsBanner>1?"ões":"ão"} — clique para ver
          </button>
        )}

        {/* Composer */}
        <div style={{ background:"#fff", borderRadius:24, border:"1px solid #f1f5f9", padding:"16px 18px",
          boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <Avatar name={profile.nomeCompleto||"EU"} size={40} />
            <form onSubmit={e=>void handleCreatePost(e)} style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
              <textarea ref={textareaRef} rows={2}
                placeholder="Compartilhe uma evidência de campo (com foto 📸), relato da entrevista ou conquista... (Ctrl+Enter)"
                value={newPostContent}
                onChange={e=>setNewPostContent(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)) void handleCreatePost(e as any); }}
                style={{
                  width:"100%",boxSizing:"border-box",padding:"11px 14px",
                  background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:16,
                  fontSize:14,fontFamily:"inherit",color:"#1e293b",outline:"none",
                  resize:"none",minHeight:72,lineHeight:1.6,transition:"border-color 0.2s",
                }}
                onFocus={e=>(e.target.style.borderColor="#6366f1")}
                onBlur={e=>(e.target.style.borderColor="#e2e8f0")}
              />
              {showImageInput && (
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setImageUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                    style={{flex:1,padding:"6px 14px",background:"#f8fafc",border:"1.5px solid #e2e8f0",
                      borderRadius:12,fontSize:13,fontFamily:"inherit",color:"#1e293b",outline:"none",cursor:"pointer"}}
                  />
                  {imageUrl && <img src={imageUrl} alt="preview" style={{width: 32, height: 32, borderRadius: 6, objectFit: "cover"}} />}
                  <button type="button" onClick={()=>{setShowImageInput(false);setImageUrl("");}}
                    style={{padding:8,borderRadius:10,border:"none",background:"#fee2e2",color:"#ef4444",cursor:"pointer"}}>
                    <X style={{width:14,height:14}}/>
                  </button>
                </div>
              )}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <button type="button" onClick={()=>setShowImageInput(v=>!v)}
                    title="Anexe uma foto para comprovar sua aplicação com a coordenação"
                    style={{padding:"7px 12px",borderRadius:10,border:"none",cursor:"pointer",
                      background:showImageInput?"#ede9fe":"#f1f5f9",
                      color:showImageInput?"#7c3aed":"#475569",fontSize:12,fontWeight:700,
                      display:"flex",alignItems:"center",gap:5,fontFamily:"inherit",
                      transition:"background 0.15s"}}>
                    📸 Anexar Evidência
                  </button>
                  <span style={{fontSize:11,color:"#64748b",display:"inline-flex",alignItems:"center",gap:4}}>
                    <span style={{width:5,height:5,borderRadius:"50%",background:"#10b981",display:"inline-block"}}/>
                    Comprova aplicação em campo
                  </span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:"#94a3b8"}}>{newPostContent.length}/500</span>
                  <button type="submit" disabled={posting||!newPostContent.trim()}
                    style={{
                      padding:"9px 20px",borderRadius:14,border:"none",
                      background:posting||!newPostContent.trim()?"rgba(99,102,241,0.3)":"linear-gradient(135deg,#6366f1,#4338ca)",
                      color:"#fff",fontWeight:800,fontSize:13,
                      cursor:posting||!newPostContent.trim()?"not-allowed":"pointer",
                      display:"flex",alignItems:"center",gap:6,fontFamily:"inherit",
                      boxShadow:newPostContent.trim()?"0 4px 14px rgba(99,102,241,0.35)":"none",
                    }}>
                    {posting ? (<><Zap style={{width:14,height:14}}/> Publicando...</>) : (<><Send style={{width:14,height:14}}/> Publicar</>)}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Banner de Crescimento Viral e Indicação de Colegas */}
        <div style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: 20,
          padding: "14px 18px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          border: "1px solid #334155",
          boxShadow: "0 4px 16px rgba(15,23,42,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: "rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0
            }}>
              🤝
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, margin: 0, color: "#f8fafc" }}>Cresça a Rede Científica</h3>
                <span style={{ fontSize: 10, fontWeight: 800, background: "#fef08a", color: "#854d0e", padding: "1px 7px", borderRadius: 99 }}>
                  +30 XP
                </span>
              </div>
              <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "2px 0 0", lineHeight: 1.4 }}>
                Indique colegas de sala pelo WhatsApp para entrevistarem e ganhe pontos no ranking!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              registrarMetricaAB("cta_coleta_engajamento", "indicacao_amigo");
              setShowIndicarModal(true);
            }}
            style={{
              flexShrink: 0,
              padding: "8px 14px",
              borderRadius: 12,
              background: "#4f46e5",
              color: "#fff",
              fontWeight: 800,
              fontSize: 12,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(79,70,229,0.3)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "inherit",
              whiteSpace: "nowrap"
            }}
          >
            <Share2 style={{ width: 13, height: 13 }} />
            Indicar Amigos
          </button>
        </div>

        {/* Navegação de Abas do Feed (Sistemas de Recomendação Científico TAS) */}
        <div style={{
          display: "flex",
          background: "#fff",
          borderRadius: 16,
          padding: 4,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          gap: 4
        }}>
          {[
            { id: "para_voce", label: "✨ Para Você" },
            { id: "recentes", label: "🕒 Recentes" },
            { id: "minha_turma", label: "👥 Minha Turma" },
            { id: "noticias", label: "📰 Oportunidades" },
            { id: "conquistas", label: "🏆 Conquistas" },
          ].map((tab) => {
            const active = feedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFeedTab(tab.id as any);
                  registrarMetricaAB("cta_coleta_engajamento", "click_cta");
                }}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: active ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "transparent",
                  color: active ? "#fff" : "#64748b",
                  fontWeight: active ? 800 : 700,
                  fontSize: 12,
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Radar de Pulso Estudantil e Escuta Ativa (Retroalimenta o Algoritmo TAS) */}
        <StudentPulseCard
          userName={profile.nomeCompleto}
          userRole={profile.papel}
          userTurma={profile.turmaOuCargo}
          onOpinionSubmitted={() => void fetchPosts(true)}
        />

        {/* Posts */}
        {fetchingPosts ? (
          [1,2,3].map(i=><PostSkeleton key={i}/>)
        ) : displayedPosts.length === 0 ? (
          <div style={{background:"#fff",borderRadius:24,padding:"60px 30px",textAlign:"center",border:"1px solid #f1f5f9"}}>
            <Sparkles style={{width:40,height:40,color:"#6366f1",margin:"0 auto 16px",display:"block"}}/>
            <p style={{fontWeight:800,fontSize:16,color:"#1e293b",margin:"0 0 8px"}}>Nenhuma publicação encontrada</p>
            <p style={{color:"#94a3b8",fontSize:14,margin:0}}>
              {feedTab === "conquistas" ? "Ainda não há registros de conquistas de coletas." : "Seja o primeiro a compartilhar algo com a turma! 🚀"}
            </p>
          </div>
        ) : (
          <>
            {displayedPosts.slice(0, visibleCount).map((p,i)=>(
              <div key={p.id} style={{animation:`feedIn 0.3s ease ${Math.min(i, 8)*0.04}s both`}}>
                <PostCard post={p} profile={profile} onRefresh={()=>void fetchPosts(true)} onOpenProfile={handleOpenColegaProfile} />
              </div>
            ))}

            {visibleCount < displayedPosts.length ? (
              <button
                type="button"
                onClick={() => setVisibleCount(c => c + 15)}
                style={{
                  width: "100%",
                  padding: "13px 20px",
                  borderRadius: 16,
                  background: "#fff",
                  border: "1.5px solid #e2e8f0",
                  color: "#4f46e5",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.background = "#f5f3ff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fff"; }}
              >
                <ChevronDown style={{ width: 16, height: 16 }} />
                Carregar mais publicações ({displayedPosts.length - visibleCount} restantes)
              </button>
            ) : displayedPosts.length > 5 ? (
              <div style={{
                textAlign: "center",
                padding: "20px 0 10px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6
              }}>
                <div style={{ width: 36, height: 2, background: "#e2e8f0", borderRadius: 99 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                  🎉 Você visualizou todas as publicações do momento!
                </span>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Story Viewer Modal */}
      <StoryModal
        stories={storiesList}
        initialIndex={activeStoryIndex}
        onClose={() => setActiveStoryIndex(null)}
        onOpenProfile={handleOpenColegaProfile}
      />

      {/* Modal Criar Story */}
      <CreateStoryModal
        isOpen={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        userName={profile?.nomeCompleto || "Pesquisador Censo"}
        onPublish={(newStory) => {
          const updated = [newStory, ...storiesList];
          setStoriesList(updated);
          try {
            const saved = JSON.parse(localStorage.getItem('censo_custom_stories') || '[]');
            localStorage.setItem('censo_custom_stories', JSON.stringify([newStory, ...saved]));
          } catch {}
        }}
      />

      {/* Modal Perfil do Colega & Curtidas */}
      <ColegaProfileModal
        colega={selectedColega}
        onClose={() => setSelectedColega(null)}
        onLikeChanged={() => void fetchPosts(true)}
      />

      <IndicarAmigosModal
        isOpen={showIndicarModal}
        onClose={() => setShowIndicarModal(false)}
      />
    </div>
  );
}

export default Feed;
