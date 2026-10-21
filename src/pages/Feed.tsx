import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUserSession } from "../hooks/useUserSession";
import { badgeService } from "../services/badgeService";
import {
  Sparkles, Send, Heart, MessageCircle,
  MoreHorizontal, Trash2, TrendingUp, Zap,
  ChevronDown, ChevronUp, X, Smile, Link, Users,
  Share2, Award, Flame, ThumbsUp, Compass
} from "lucide-react";
import { personalizarFeedTAS, TASUserProfile } from "../utils/tasRecommendationAlgorithm";
import { IndicarAmigosModal } from "../components/IndicarAmigosModal";
import { registrarMetricaAB } from "../utils/abTesting";

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
function CommentRow({ c, myId, onDelete }: { c:Comment; myId:string; onDelete:()=>void }) {
  const isMe = c.user_id === myId;
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 0", borderBottom:"1px solid #f8fafc" }}>
      <Avatar name={c.author_name} size={28} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ background:"#f8fafc", borderRadius:12, padding:"8px 12px" }}>
          <span style={{ fontWeight:800, fontSize:12, color:"#1e293b", marginRight:6 }}>{c.author_name}</span>
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
function PostCard({ post, profile, onRefresh }: { post:Post; profile:any; onRefresh:()=>void }) {
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

  let cardBg = "#fff";
  let cardBorder = "1px solid #f1f5f9";
  let cardShadow = "0 2px 12px rgba(0,0,0,0.04)";

  if (isConquista) {
    cardBg = "linear-gradient(180deg, #fef3c7 0%, #ffffff 80px)";
    cardBorder = "1.5px solid #fbbf24";
    cardShadow = "0 4px 20px rgba(251,191,36,0.15)";
  } else if (isOfficial) {
    cardBg = "linear-gradient(180deg, #f0fdfa 0%, #ffffff 80px)";
    cardBorder = "1.5px solid #38bdf8";
    cardShadow = "0 4px 20px rgba(14,165,233,0.12)";
  }

  // Identifica o rótulo da reação ativa
  const activeReactionDef = REACTION_LIST.find(r => r.emoji === myEmoji);

  // Emojis mais reagidos para o cluster
  const topReactions = Object.entries(reactionsMap)
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
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Avatar name={post.author_name} size={40} />
          <div>
            <p style={{ fontWeight:800, fontSize:14, color:"#0f172a", margin:"0 0 2px" }}>{post.author_name}</p>
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
          <p style={{ fontSize:16, fontWeight:800, color:"#92400e", lineHeight:1.6, margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word", padding:"12px 16px", background:"#fefce8", border:"1px dashed #fde047", borderRadius:16, textAlign:"center" }}>
            {post.content}
          </p>
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
                {topReactions.map(([emoji], idx) => (
                  <span key={emoji} style={{
                    fontSize:14, marginLeft: idx > 0 ? -4 : 0,
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
                  }}>
                    {emoji}
                  </span>
                ))}
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
                  onDelete={()=>void handleDeleteComment(c.id)} />
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
  const [posts, setPosts]           = useState<Post[]>([]);
  const [feedTab, setFeedTab]       = useState<"para_voce" | "recentes" | "minha_turma" | "conquistas">("para_voce");
  const [showIndicarModal, setShowIndicarModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [imageUrl, setImageUrl]     = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [posting, setPosting]       = useState(false);
  const [fetchingPosts, setFetchingPosts] = useState(true);
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
  }), [profile]);

  const fetchPosts = useCallback(async (silent=false) => {
    if(!silent) setFetchingPosts(true);
    const [{ data: postsData }, { data: reactionsData }, { data: commentsCount }] = await Promise.all([
      supabase.from("lyka_posts").select("*").order("created_at",{ascending:false}).limit(60),
      supabase.from("lyka_reactions").select("post_id, user_id, emoji"),
      supabase.from("lyka_comments").select("post_id"),
    ]);

    if (postsData) {
      const rm: Record<number, { count: number; userLiked: boolean; userEmoji?: string; emojiMap: Record<string, number> }> = {};
      (reactionsData || []).forEach((r: { post_id: number; user_id: string; emoji?: string }) => {
        if (!rm[r.post_id]) rm[r.post_id] = { count: 0, userLiked: false, emojiMap: {} };
        rm[r.post_id].count++;
        const e = r.emoji || "❤️";
        rm[r.post_id].emojiMap[e] = (rm[r.post_id].emojiMap[e] || 0) + 1;
        if (r.user_id === profile.id) {
          rm[r.post_id].userLiked = true;
          rm[r.post_id].userEmoji = e;
        }
      });
      const cm: Record<number, number> = {};
      (commentsCount || []).forEach((c: { post_id: number }) => { cm[c.post_id] = (cm[c.post_id] || 0) + 1; });

      const enriched = postsData.map((p: any) => ({
        ...p,
        likes_count: rm[p.id]?.count ?? 0,
        liked: rm[p.id]?.userLiked ?? false,
        my_emoji: rm[p.id]?.userEmoji,
        reactions_map: rm[p.id]?.emojiMap,
        comments_count: cm[p.id] ?? 0,
      }));
      setPosts(enriched);
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
          background:"linear-gradient(135deg,#1d4ed8,#4f46e5,#7c3aed)",
          borderRadius:24, padding:"22px 24px",
          boxShadow:"0 12px 40px rgba(79,70,229,0.3)", position:"relative", overflow:"hidden",
        }}>
          <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
          <div style={{position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:40,height:40,borderRadius:12,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Sparkles style={{width:20,height:20,color:"#fff"}}/>
              </div>
              <div>
                <h1 style={{color:"#fff",fontWeight:900,fontSize:19,margin:0,letterSpacing:"-0.3px"}}>Feed da Pesquisa</h1>
                <p style={{color:"rgba(199,210,254,0.8)",fontSize:12,margin:0}}>CEEP Seabra · Projeto Ada Lovelace</p>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.8)",
                background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",
                padding:"4px 12px",borderRadius:99,display:"flex",alignItems:"center",gap:5}}>
                <TrendingUp style={{width:12,height:12}}/> {posts.length} publicações
              </span>
              <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.8)",
                background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",
                padding:"4px 12px",borderRadius:99,display:"flex",alignItems:"center",gap:5}}>
                <Users style={{width:12,height:12}}/> {totalUsers} pesquisadores
              </span>
              <span style={{fontSize:11,fontWeight:700,color:"#6ee7b7",
                background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",
                padding:"4px 12px",borderRadius:99,display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:"#10b981",display:"inline-block",animation:"feedPulse 2s infinite"}}/>
                Ao vivo
              </span>
            </div>
          </div>
        </div>

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
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <button type="button" onClick={()=>setShowImageInput(v=>!v)}
                    style={{padding:"7px 12px",borderRadius:10,border:"none",cursor:"pointer",
                      background:showImageInput?"#ede9fe":"transparent",
                      color:showImageInput?"#7c3aed":"#64748b",fontSize:12,fontWeight:700,
                      display:"flex",alignItems:"center",gap:5,fontFamily:"inherit"}}>
                    📸 Anexar Foto / Evidência
                  </button>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
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
              <div style={{
                marginTop: 2,
                padding: "8px 12px",
                borderRadius: 12,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#166534",
                fontWeight: 600,
              }}>
                <span style={{ fontSize: 14 }}>📸</span>
                <span><strong>Evidência de Campo:</strong> Sempre que realizar entrevistas, anexe uma foto para comprovar sua aplicação com a coordenação!</span>
              </div>
            </form>
          </div>
        </div>

        {/* Banner de Crescimento Viral e Indicação de Colegas (Estratégias de Crescimento Facebook) */}
        <div style={{
          background: "linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #7c3aed 100%)",
          borderRadius: 20,
          padding: "16px 20px",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          boxShadow: "0 8px 24px rgba(79,70,229,0.22)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0
            }}>
              🤝
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>Cresça a Rede Científica</h3>
                <span style={{ fontSize: 10, fontWeight: 900, background: "#fef08a", color: "#854d0e", padding: "2px 8px", borderRadius: 99 }}>
                  +30 XP
                </span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", margin: "4px 0 0", lineHeight: 1.4 }}>
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
              padding: "10px 16px",
              borderRadius: 14,
              background: "#fff",
              color: "#4338ca",
              fontWeight: 900,
              fontSize: 12,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "inherit",
              whiteSpace: "nowrap"
            }}
          >
            <Share2 style={{ width: 14, height: 14 }} />
            Indicar Amigos
          </button>
        </div>

        {/* Navegação de Abas do Feed (Sistemas de Recomendação Científico TAS) */}
        <div style={{
          display: "flex",
          background: "#fff",
          borderRadius: 18,
          padding: 4,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          gap: 4
        }}>
          {[
            { id: "para_voce", label: "✨ Para Você", desc: "Algoritmo TAS" },
            { id: "recentes", label: "🕒 Recentes", desc: "Tempo real" },
            { id: "minha_turma", label: "👥 Minha Turma", desc: profile.turmaOuCargo || "Minha Turma" },
            { id: "conquistas", label: "🏆 Conquistas", desc: "Marcos" },
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
                  padding: "10px 6px",
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: active ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "transparent",
                  color: active ? "#fff" : "#64748b",
                  fontWeight: active ? 800 : 700,
                  fontSize: 12,
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <span>{tab.label}</span>
                <span style={{ fontSize: 9, opacity: active ? 0.85 : 0.6, fontWeight: 500 }}>{tab.desc}</span>
              </button>
            );
          })}
        </div>

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
          displayedPosts.map((p,i)=>(
            <div key={p.id} style={{animation:`feedIn 0.3s ease ${i*0.04}s both`}}>
              <PostCard post={p} profile={profile} onRefresh={()=>void fetchPosts(true)} />
            </div>
          ))
        )}
      </div>

      <IndicarAmigosModal
        isOpen={showIndicarModal}
        onClose={() => setShowIndicarModal(false)}
      />
    </div>
  );
}

export default Feed;
