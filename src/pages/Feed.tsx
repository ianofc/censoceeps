import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUserSession } from "../hooks/useUserSession";
import {
  Sparkles, Send, Heart, MessageCircle,
  MoreHorizontal, Trash2, TrendingUp, Zap,
  ChevronDown, ChevronUp, X, Smile, Link, Users
} from "lucide-react";

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

const EMOJIS = ["❤️","😂","😮","😢","🔥","👏"];

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
  comments_count?: number;
}
interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

// ─── Emoji picker (mini) ─────────────────────────────────────────────────────
function EmojiBar({ onPick }: { onPick: (e:string)=>void }) {
  return (
    <div style={{
      display:"flex", gap:4, background:"#fff", border:"1px solid #e2e8f0",
      borderRadius:14, padding:"6px 10px", boxShadow:"0 4px 20px rgba(0,0,0,0.12)",
    }}>
      {EMOJIS.map(e => (
        <button key={e} type="button" onClick={()=>onPick(e)}
          style={{ fontSize:20, background:"none", border:"none", cursor:"pointer", padding:"2px 4px",
            borderRadius:8, transition:"transform 0.15s" }}
          onMouseEnter={el=>(el.currentTarget.style.transform="scale(1.3)")}
          onMouseLeave={el=>(el.currentTarget.style.transform="scale(1)")}
        >{e}</button>
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
  const isMe = post.user_id === profile.id;
  const [liked, setLiked]           = useState(post.liked ?? false);
  const [likeCount, setLikeCount]   = useState(post.likes_count ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const [showEmoji, setShowEmoji]   = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments]     = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => { setLiked(post.liked??false); setLikeCount(post.likes_count??0); }, [post.liked, post.likes_count]);

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

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const was = liked;
    setLiked(!was); setLikeCount(c => was ? c-1 : c+1);
    if (was) await supabase.from("lyka_reactions").delete().eq("post_id",post.id).eq("user_id",profile.id);
    else {
      const { error } = await supabase.from("lyka_reactions").insert([{post_id:post.id, user_id:profile.id, emoji:"heart"}]);
      if (error) {
        alert("Erro ao reagir: " + error.message);
        // revert optimistic update
        setLiked(false); setLikeCount(c => c-1);
      }
    }
    onRefresh();
    setLikeLoading(false);
  };

  const handleEmojiReact = async (emoji: string) => {
    setShowEmoji(false);
    await supabase.from("lyka_reactions").upsert([{post_id:post.id, user_id:profile.id, emoji}],{onConflict:"post_id,user_id"});
    onRefresh();
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
  const isOfficial = post.type === "comunicado" || post.type === "official" || post.type === "aviso";

  return (
    <article style={{
      background: isOfficial ? "linear-gradient(180deg, #f0fdfa 0%, #ffffff 80px)" : "#fff",
      borderRadius:24,
      border: isOfficial ? "1.5px solid #38bdf8" : "1px solid #f1f5f9",
      boxShadow: isOfficial ? "0 4px 20px rgba(14,165,233,0.12)" : "0 2px 12px rgba(0,0,0,0.04)",
      overflow:"hidden",
      transition:"box-shadow 0.2s",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"16px 18px 12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Avatar name={post.author_name} size={40} />
          <div>
            <p style={{ fontWeight:800, fontSize:14, color:"#0f172a", margin:"0 0 2px" }}>{post.author_name}</p>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:"#94a3b8" }}>{timeAgo(post.created_at)}</span>
              {isAutoPost && (
                <span style={{
                  fontSize:10, fontWeight:800, color:"#7c3aed",
                  background:"#ede9fe", border:"1px solid #ddd6fe",
                  padding:"2px 8px", borderRadius:99,
                }}>🎉 conquista</span>
              )}
              {isOfficial && (
                <span style={{
                  fontSize:10, fontWeight:800, color:"#0369a1",
                  background:"#e0f2fe", border:"1px solid #bae6fd",
                  padding:"2px 8px", borderRadius:99,
                  display:"inline-flex", alignItems:"center", gap:3
                }}>📌 Comunicado Oficial</span>
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

      {/* Content */}
      <div style={{ padding:"0 18px 14px" }}>
        <p style={{ fontSize:14, color:"#1e293b", lineHeight:1.7, margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
          {post.content}
        </p>
        {post.image_url && (
          <img src={post.image_url} alt="imagem do post"
            style={{ width:"100%", borderRadius:16, marginTop:12, objectFit:"cover", maxHeight:400 }}
            onError={e=>(e.currentTarget.style.display="none")} />
        )}
      </div>

      {/* Stats row */}
      {(likeCount > 0 || (post.comments_count||0) > 0) && (
        <div style={{ padding:"0 18px 8px", display:"flex", alignItems:"center", gap:12 }}>
          {likeCount > 0 && (
            <span style={{ fontSize:12, color:"#64748b", display:"flex", alignItems:"center", gap:4 }}>
              <span>❤️</span> {likeCount} {likeCount===1?"curtida":"curtidas"}
            </span>
          )}
          {(post.comments_count||0) > 0 && (
            <button type="button" onClick={toggleComments}
              style={{ fontSize:12, color:"#64748b", background:"none", border:"none", cursor:"pointer",
                padding:0, fontFamily:"inherit" }}>
              {post.comments_count} {post.comments_count===1?"comentário":"comentários"}
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display:"flex", alignItems:"center", padding:"8px 12px", borderTop:"1px solid #f8fafc", gap:2, position:"relative" }}>
        {/* Like */}
        <button type="button" onClick={()=>void handleLike()} disabled={likeLoading}
          style={{
            flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            padding:"9px 0", borderRadius:14, border:"none", cursor:"pointer", fontFamily:"inherit",
            fontWeight:700, fontSize:13,
            background: liked ? "#fff0f0" : "transparent",
            color: liked ? "#e11d48" : "#64748b",
            transition:"all 0.15s",
          }}>
          <Heart style={{ width:17, height:17, fill: liked?"#e11d48":"none", transition:"transform 0.15s",
            transform: liked?"scale(1.2)":"scale(1)" }} />
          Curtir
        </button>

        {/* Emoji react */}
        <div style={{ position:"relative" }}>
          <button type="button" onClick={()=>setShowEmoji(v=>!v)}
            style={{ display:"flex", alignItems:"center", justifyContent:"center",
              width:38, height:38, borderRadius:12, border:"none", cursor:"pointer",
              background:showEmoji?"#f1f5f9":"transparent", color:"#64748b", transition:"all 0.15s" }}>
            <Smile style={{width:17,height:17}}/>
          </button>
          {showEmoji && (
            <div style={{ position:"absolute", bottom:"100%", left:"50%", transform:"translateX(-50%)", marginBottom:8, zIndex:30 }}>
              <EmojiBar onPick={handleEmojiReact} />
            </div>
          )}
        </div>

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
  const [newPostContent, setNewPostContent] = useState("");
  const [imageUrl, setImageUrl]     = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [posting, setPosting]       = useState(false);
  const [fetchingPosts, setFetchingPosts] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [newPostsBanner, setNewPostsBanner] = useState(0);
  const lastSeenRef = useRef<string>(new Date().toISOString());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchPosts = useCallback(async (silent=false) => {
    if(!silent) setFetchingPosts(true);
    const [{ data: postsData }, { data: reactionsData }, { data: commentsCount }] = await Promise.all([
      supabase.from("lyka_posts").select("*").order("created_at",{ascending:false}).limit(60),
      supabase.from("lyka_reactions").select("post_id, user_id"),
      supabase.from("lyka_comments").select("post_id"),
    ]);

    if (postsData) {
      const rm: Record<number,{count:number;userLiked:boolean}> = {};
      (reactionsData||[]).forEach((r:{post_id:number;user_id:string}) => {
        if(!rm[r.post_id]) rm[r.post_id]={count:0,userLiked:false};
        rm[r.post_id].count++;
        if(r.user_id===profile.id) rm[r.post_id].userLiked=true;
      });
      const cm: Record<number,number> = {};
      (commentsCount||[]).forEach((c:{post_id:number}) => { cm[c.post_id]=(cm[c.post_id]||0)+1; });

      const enriched = postsData.map((p:Post) => ({
        ...p, likes_count:rm[p.id]?.count??0, liked:rm[p.id]?.userLiked??false,
        comments_count:cm[p.id]??0,
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
      await fetchPosts();
    }
    setPosting(false);
  };

  const loadNew = () => {
    setNewPostsBanner(0);
    void fetchPosts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

        {/* Posts */}
        {fetchingPosts ? (
          [1,2,3].map(i=><PostSkeleton key={i}/>)
        ) : posts.length === 0 ? (
          <div style={{background:"#fff",borderRadius:24,padding:"60px 30px",textAlign:"center",border:"1px solid #f1f5f9"}}>
            <Sparkles style={{width:40,height:40,color:"#6366f1",margin:"0 auto 16px",display:"block"}}/>
            <p style={{fontWeight:800,fontSize:16,color:"#1e293b",margin:"0 0 8px"}}>Nenhuma publicação ainda</p>
            <p style={{color:"#94a3b8",fontSize:14,margin:0}}>Seja o primeiro a compartilhar algo com a turma! 🚀</p>
          </div>
        ) : (
          posts.map((p,i)=>(
            <div key={p.id} style={{animation:`feedIn 0.3s ease ${i*0.04}s both`}}>
              <PostCard post={p} profile={profile} onRefresh={()=>void fetchPosts(true)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Feed;
