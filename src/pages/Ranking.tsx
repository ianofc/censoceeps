import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUserSession } from "../hooks/useUserSession";
import {
  Trophy, Zap, Star, BookOpen, MessageCircle,
  Rss, Heart, RefreshCw, Medal, Crown, Flame,
  ChevronUp, Shield, Award, TrendingUp
} from "lucide-react";

// ─── XP CONFIG ───────────────────────────────────────────────────────────────
const XP_FICHA   = 100;   // por ficha coletada
const XP_POST    = 20;    // por post no feed
const XP_MSG     = 5;     // por mensagem no chat (sem DMs)
const XP_LIKE    = 10;    // por curtida recebida (pessoa_likes)

interface Nivel {
  nome: string;
  minXP: number;
  color: string;
  bg: string;
  border: string;
  icon: string;
}
const NIVEIS: Nivel[] = [
  { nome: "Novato",      minXP: 0,    color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", icon: "🌱" },
  { nome: "Explorador",  minXP: 200,  color: "#3B82F6", bg: "#eff6ff", border: "#bfdbfe", icon: "🔍" },
  { nome: "Pesquisador", minXP: 500,  color: "#8B5CF6", bg: "#ede9fe", border: "#ddd6fe", icon: "📋" },
  { nome: "Especialista",minXP: 1000, color: "#F59E0B", bg: "#fffbeb", border: "#fde68a", icon: "⭐" },
  { nome: "Mestre",      minXP: 2500, color: "#EF4444", bg: "#fef2f2", border: "#fecaca", icon: "🏆" },
];

function getNivel(xp: number): Nivel {
  let lvl = NIVEIS[0];
  for (const n of NIVEIS) { if (xp >= n.minXP) lvl = n; }
  return lvl;
}
function getNextNivel(xp: number): Nivel | null {
  for (const n of NIVEIS) { if (xp < n.minXP) return n; }
  return null;
}
function xpProgress(xp: number): number {
  const cur = getNivel(xp);
  const nxt = getNextNivel(xp);
  if (!nxt) return 100;
  return Math.round(((xp - cur.minXP) / (nxt.minXP - cur.minXP)) * 100);
}

interface Player {
  id: string;
  nome: string;
  papel: string;
  avatar_url: string;
  fichas: number;
  posts: number;
  msgs: number;
  likes: number;
  xp: number;
}

// ─── GRADIENTS ───────────────────────────────────────────────────────────────
const GRAD_PAIRS: [string,string][] = [
  ["#3B82F6","#6366F1"],["#EC4899","#F43F5E"],["#10B981","#14B8A6"],
  ["#F59E0B","#F97316"],["#8B5CF6","#A855F7"],["#06B6D4","#0EA5E9"],
];
function grad(name: string): [string,string] {
  return GRAD_PAIRS[(name||"?").charCodeAt(0) % GRAD_PAIRS.length];
}
function initials(name: string) {
  return (name||"?").split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase();
}

function PlayerAvatar({ player, size=44 }: { player: Player; size?: number }) {
  const [err, setErr] = useState(false);
  const [g] = useState<[string,string]>(() => grad(player.nome));
  if (player.avatar_url && !err) return (
    <img src={player.avatar_url} alt={player.nome} onError={()=>setErr(true)}
      style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0, display:"block" }} />
  );
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`linear-gradient(135deg,${g[0]},${g[1]})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:900, fontSize:size*0.35, color:"#fff", userSelect:"none",
    }}>
      {initials(player.nome)}
    </div>
  );
}

// ─── PODIUM CARD ─────────────────────────────────────────────────────────────
function PodiumCard({ player, rank }: { player: Player; rank: 1|2|3 }) {
  const nivel = getNivel(player.xp);
  const configs = {
    1: { height:170, crown:"#F59E0B", bg:"linear-gradient(180deg,#FEF3C7,#fff)", border:"#FDE68A",
         label:"🥇 1º Lugar", labelColor:"#92400e", shadow:"0 12px 40px rgba(245,158,11,0.3)" },
    2: { height:130, crown:"#94a3b8", bg:"linear-gradient(180deg,#f1f5f9,#fff)", border:"#e2e8f0",
         label:"🥈 2º Lugar", labelColor:"#475569", shadow:"0 8px 24px rgba(0,0,0,0.08)" },
    3: { height:110, crown:"#cd7c2e", bg:"linear-gradient(180deg,#fef9ec,#fff)", border:"#fde68a",
         label:"🥉 3º Lugar", labelColor:"#92400e", shadow:"0 8px 24px rgba(205,124,46,0.2)" },
  };
  const c = configs[rank];
  const isFirst = rank === 1;

  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"flex-end", flex:1,
    }}>
      {/* Avatar + crown */}
      <div style={{ position:"relative", marginBottom:8 }}>
        {isFirst && (
          <Crown style={{
            position:"absolute", top:-22, left:"50%", transform:"translateX(-50%)",
            width:26, height:26, color:c.crown, filter:`drop-shadow(0 2px 4px ${c.crown}80)`,
          }}/>
        )}
        <div style={{
          padding: isFirst ? 3 : 2,
          borderRadius:"50%",
          background:`linear-gradient(135deg,${c.crown},${c.crown}88)`,
        }}>
          <PlayerAvatar player={player} size={isFirst ? 72 : 56} />
        </div>
        <div style={{
          position:"absolute", bottom:-2, right:-2,
          background:c.crown, color:"#fff", fontSize:10, fontWeight:900,
          width:20, height:20, borderRadius:"50%", display:"flex",
          alignItems:"center", justifyContent:"center",
          border:"2px solid #fff",
        }}>{rank}</div>
      </div>

      {/* Name */}
      <p style={{
        fontWeight:800, fontSize: isFirst ? 14 : 12, color:"#0f172a",
        textAlign:"center", margin:"0 0 3px", maxWidth:100,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
      }}>
        {player.nome.split(" ")[0]}
      </p>

      {/* XP badge */}
      <span style={{
        fontSize:10, fontWeight:800, color:nivel.color,
        background:nivel.bg, border:`1px solid ${nivel.border}`,
        padding:"2px 8px", borderRadius:99, marginBottom:6,
      }}>
        {nivel.icon} {player.xp.toLocaleString()} XP
      </span>

      {/* Podium block */}
      <div style={{
        width:"100%", height:c.height,
        background:c.bg, border:`1.5px solid ${c.border}`,
        borderRadius:"12px 12px 0 0",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:4,
        boxShadow:c.shadow, padding:"12px 8px",
      }}>
        <span style={{ fontSize:11, fontWeight:700, color:c.labelColor }}>{c.label}</span>
        <div style={{ display:"flex", flexDirection:"column", gap:3, width:"100%", padding:"0 8px" }}>
          <StatPill icon="📋" value={player.fichas} label="fichas" color="#7c3aed" />
          <StatPill icon="💬" value={player.msgs} label="msgs" color="#3b82f6" />
          <StatPill icon="📰" value={player.posts} label="posts" color="#10b981" />
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon, value, label, color }: { icon:string; value:number; label:string; color:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:10, color:"#64748b" }}>
      <span>{icon} {label}</span>
      <span style={{ fontWeight:800, color }}>{value}</span>
    </div>
  );
}

// ─── ROW ─────────────────────────────────────────────────────────────────────
function RankRow({ player, rank, isMe }: { player: Player; rank: number; isMe: boolean }) {
  const nivel = getNivel(player.xp);
  const progress = xpProgress(player.xp);
  const nextNivel = getNextNivel(player.xp);

  const rankColors: Record<number,string> = { 1:"#F59E0B", 2:"#94a3b8", 3:"#cd7c2e" };
  const rankColor = rankColors[rank] || "#94a3b8";

  return (
    <div style={{
      background: isMe
        ? "linear-gradient(90deg,rgba(124,58,237,0.06),rgba(67,56,202,0.04))"
        : "#fff",
      border: isMe ? "1.5px solid #ddd6fe" : "1px solid #f1f5f9",
      borderRadius: 20, padding: "14px 18px",
      display: "flex", alignItems: "center", gap: 14,
      transition: "all 0.2s", position: "relative",
      boxShadow: rank <= 3
        ? `0 4px 20px ${rankColor}22`
        : isMe
        ? "0 2px 12px rgba(124,58,237,0.08)"
        : "0 1px 4px rgba(0,0,0,0.03)",
    }}>
      {/* Rank number */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: rank <= 3 ? rankColor : "#f8fafc",
        border: rank <= 3 ? "none" : "1px solid #e2e8f0",
        fontWeight: 900, fontSize: rank <= 3 ? 16 : 14,
        color: rank <= 3 ? "#fff" : "#64748b",
      }}>
        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
      </div>

      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <PlayerAvatar player={player} size={46} />
        {isMe && (
          <div style={{
            position: "absolute", bottom: -2, right: -2,
            background: "#7c3aed", width: 14, height: 14,
            borderRadius: "50%", border: "2px solid #fff",
          }} />
        )}
      </div>

      {/* Name + level + progress */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <p style={{
            fontWeight: 800, fontSize: 14, color: "#0f172a", margin: 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: 180,
          }}>
            {player.nome}
            {isMe && <span style={{ color: "#7c3aed", fontSize: 11, marginLeft: 6 }}>· Você</span>}
          </p>
          <span style={{
            fontSize: 10, fontWeight: 800, color: nivel.color,
            background: nivel.bg, border: `1px solid ${nivel.border}`,
            padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {nivel.icon} {nivel.nome}
          </span>
        </div>
        {/* XP progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: `linear-gradient(90deg,${grad(player.nome)[0]},${grad(player.nome)[1]})`,
              borderRadius: 99, transition: "width 1s ease",
            }} />
          </div>
          <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, flexShrink: 0 }}>
            {player.xp.toLocaleString()} XP
            {nextNivel && ` / ${nextNivel.minXP.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 900, fontSize: 15, color: "#7c3aed", margin: 0 }}>{player.fichas}</p>
          <p style={{ fontSize: 9, color: "#94a3b8", margin: 0, fontWeight: 600 }}>FICHAS</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 900, fontSize: 15, color: "#3b82f6", margin: 0 }}>{player.msgs}</p>
          <p style={{ fontSize: 9, color: "#94a3b8", margin: 0, fontWeight: 600 }}>MSGS</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 900, fontSize: 15, color: "#10b981", margin: 0 }}>{player.posts}</p>
          <p style={{ fontSize: 9, color: "#94a3b8", margin: 0, fontWeight: 600 }}>POSTS</p>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function Ranking() {
  const { profile } = useUserSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [animIn, setAnimIn] = useState(false);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        { data: pessoas },
        { data: fichasRaw },
        { data: msgsRaw },
        { data: postsRaw },
        { data: likesRaw },
      ] = await Promise.all([
        supabase.from("pessoas").select("id, nome_completo, papel, avatar_url"),
        supabase.from("entrevistas").select("user_id"),
        supabase.from("lyka_messages").select("user_id").is("conversation_key", null),
        supabase.from("lyka_posts").select("user_id"),
        supabase.from("pessoa_likes").select("liked_id, liker_id"),
      ]);

      // Count post likes received per user (from lyka_reactions)
      const { data: postsWithAuthor } = await supabase.from("lyka_posts").select("id, user_id");
      const { data: postLikesRaw } = await supabase.from("lyka_reactions").select("post_id, user_id");

      // Count pessoa_likes received per user
      const likesReceivedMap: Record<string, number> = {};
      // 1. Profile likes (pessoa_likes)
      (likesRaw || []).forEach((r: { liked_id: string; liker_id: string }) => {
        likesReceivedMap[r.liked_id] = (likesReceivedMap[r.liked_id] || 0) + 1;
      });
      // 2. Post likes (lyka_reactions)
      if (postsWithAuthor && postLikesRaw) {
        const postAuthorMap: Record<number, string> = {};
        postsWithAuthor.forEach((p: { id: number; user_id: string }) => {
          postAuthorMap[p.id] = p.user_id;
        });
        postLikesRaw.forEach((r: { post_id: number; user_id: string }) => {
          const authorId = postAuthorMap[r.post_id];
          if (authorId) likesReceivedMap[authorId] = (likesReceivedMap[authorId] || 0) + 1;
        });
      }

      // Count fichas per user
      const fichasMap: Record<string, number> = {};
      (fichasRaw || []).forEach((r: { user_id: string }) => {
        fichasMap[r.user_id] = (fichasMap[r.user_id] || 0) + 1;
      });
      const msgsMap: Record<string, number> = {};
      (msgsRaw || []).forEach((r: { user_id: string }) => {
        msgsMap[r.user_id] = (msgsMap[r.user_id] || 0) + 1;
      });
      const postsMap: Record<string, number> = {};
      (postsRaw || []).forEach((r: { user_id: string }) => {
        postsMap[r.user_id] = (postsMap[r.user_id] || 0) + 1;
      });

      const ranked: Player[] = (pessoas || []).map((p: { id: string; nome_completo: string; papel: string; avatar_url: string }) => {
        const fichas = fichasMap[p.id] || 0;
        const msgs = msgsMap[p.id] || 0;
        const posts = postsMap[p.id] || 0;
        const likes = likesReceivedMap[p.id] || 0;
        const xp = fichas * XP_FICHA + posts * XP_POST + msgs * XP_MSG + likes * XP_LIKE;
        return {
          id: p.id, nome: p.nome_completo, papel: p.papel,
          avatar_url: p.avatar_url || "",
          fichas, msgs, posts, likes, xp,
        };
      });

      // Sort: by XP desc, then fichas desc, then alphabetically (so empty ranking is A-Z)
      ranked.sort((a, b) => {
        if (b.xp !== a.xp) return b.xp - a.xp;
        if (b.fichas !== a.fichas) return b.fichas - a.fichas;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
      setPlayers(ranked);
      setLastUpdate(new Date());
      setTimeout(() => setAnimIn(true), 100);
    } catch (err) {
      console.error("Erro ao carregar ranking:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRanking(); }, [fetchRanking]);

  // Realtime updates
  useEffect(() => {
    const ch = supabase.channel("ranking-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "censo_ceep" }, () => void fetchRanking())
      .on("postgres_changes", { event: "*", schema: "public", table: "lyka_messages" }, () => void fetchRanking())
      .on("postgres_changes", { event: "*", schema: "public", table: "lyka_posts" }, () => void fetchRanking())
      .on("postgres_changes", { event: "*", schema: "public", table: "lyka_reactions" }, () => void fetchRanking())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [fetchRanking]);

  const myRank = players.findIndex(p => p.id === profile.id) + 1;
  const myPlayer = players.find(p => p.id === profile.id);
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);
  const totalXP = players.reduce((s, p) => s + p.xp, 0);

  return (
    <div style={{ width: "100%", maxWidth: 820, margin: "0 auto", paddingBottom: 80 }}>
      <style>{`
        @keyframes rankSpin { to { transform: rotate(360deg); } }
        @keyframes rankIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.6;} }
        @keyframes bounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);} }
        @keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#312e81 70%,#4338ca 100%)",
        borderRadius: 28, padding: "28px 28px 24px", marginBottom: 20,
        boxShadow: "0 20px 60px rgba(67,56,202,0.35)", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-50, right:-50, width:220, height:220, borderRadius:"50%", background:"rgba(139,92,246,0.1)" }} />
        <div style={{ position:"absolute", bottom:-70, left:"20%", width:280, height:280, borderRadius:"50%", background:"rgba(99,102,241,0.07)" }} />

        <div style={{ position:"relative", display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{
                width:48, height:48, borderRadius:14,
                background:"linear-gradient(135deg,#F59E0B,#f97316)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 6px 20px rgba(245,158,11,0.4)",
              }}>
                <Trophy style={{ width:24, height:24, color:"#fff" }} />
              </div>
              <div>
                <h1 style={{ color:"#fff", fontWeight:900, fontSize:22, margin:0, letterSpacing:"-0.5px" }}>
                  Ranking do Censo
                </h1>
                <p style={{ color:"rgba(199,210,254,0.7)", fontSize:12, margin:0, fontWeight:500 }}>
                  CEEP Seabra · Projeto Ada Lovelace · Temporada 2026
                </p>
              </div>
            </div>
            {/* XP rules */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[
                { icon:"📋", label:`Ficha = ${XP_FICHA}XP`, color:"#a78bfa" },
                { icon:"📰", label:`Post = ${XP_POST}XP`, color:"#6ee7b7" },
                { icon:"💬", label:`Msg = ${XP_MSG}XP`, color:"#93c5fd" },
                { icon:"❤️", label:`Curtida = ${XP_LIKE}XP`, color:"#fca5a5" },
              ].map(r => (
                <span key={r.label} style={{
                  fontSize:11, fontWeight:700, color:r.color,
                  background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
                  padding:"4px 12px", borderRadius:99,
                }}>
                  {r.icon} {r.label}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
            <button type="button" onClick={() => void fetchRanking()}
              style={{
                display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
                borderRadius:12, background:"rgba(255,255,255,0.1)",
                border:"1px solid rgba(255,255,255,0.2)", color:"#fff",
                fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                transition:"all 0.2s",
              }}
            >
              <RefreshCw style={{ width:13, height:13, animation: loading ? "rankSpin 0.8s linear infinite" : "none" }} />
              Atualizar
            </button>
            <div style={{ textAlign:"right" }}>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:10, margin:"0 0 2px", fontWeight:600 }}>
                {players.length} participantes · {totalXP.toLocaleString()} XP total
              </p>
              <p style={{ color:"rgba(255,255,255,0.25)", fontSize:10, margin:0 }}>
                Atualizado às {lastUpdate.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
              </p>
            </div>
          </div>
        </div>

        {/* My stats banner */}
        {myPlayer && (
          <div style={{
            marginTop:20, padding:"14px 18px",
            background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:16, display:"flex", alignItems:"center", flexWrap:"wrap", gap:16,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
              <div style={{
                width:36, height:36, borderRadius:10, flexShrink:0,
                background:"linear-gradient(135deg,#F59E0B,#f97316)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontWeight:900, color:"#fff", fontSize:16,
              }}>
                {myRank <= 3 ? ["🥇","🥈","🥉"][myRank-1] : `#${myRank}`}
              </div>
              <div>
                <p style={{ color:"#fff", fontWeight:800, fontSize:14, margin:0 }}>
                  Sua posição: <span style={{ color:"#fbbf24" }}>#{myRank}</span> de {players.length}
                </p>
                <p style={{ color:"rgba(199,210,254,0.7)", fontSize:11, margin:0 }}>
                  {getNivel(myPlayer.xp).icon} {getNivel(myPlayer.xp).nome} · {myPlayer.xp.toLocaleString()} XP
                  {getNextNivel(myPlayer.xp) && ` · faltam ${(getNextNivel(myPlayer.xp)!.minXP - myPlayer.xp).toLocaleString()} XP para ${getNextNivel(myPlayer.xp)!.nome}`}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ flex:1, minWidth:140 }}>
              <div style={{ height:8, background:"rgba(255,255,255,0.1)", borderRadius:99, overflow:"hidden" }}>
                <div style={{
                  height:"100%", width:`${xpProgress(myPlayer.xp)}%`,
                  background:"linear-gradient(90deg,#F59E0B,#f97316)",
                  borderRadius:99, transition:"width 1s ease",
                }} />
              </div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:10, margin:"4px 0 0", textAlign:"right" }}>
                {xpProgress(myPlayer.xp)}% para o próximo nível
              </p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 0", gap:16 }}>
          <div style={{ width:48, height:48, border:"3px solid #ede9fe", borderTopColor:"#7c3aed", borderRadius:"50%", animation:"rankSpin 0.8s linear infinite" }} />
          <span style={{ color:"#7c3aed", fontWeight:700, fontSize:14 }}>Calculando pontuações...</span>
        </div>
      ) : players.length === 0 ? (
        <div style={{ background:"#fff", borderRadius:24, padding:"60px 40px", textAlign:"center", border:"1px solid #e2e8f0" }}>
          <Trophy style={{ width:48, height:48, color:"#fbbf24", margin:"0 auto 16px", display:"block" }} />
          <p style={{ fontWeight:800, color:"#1e293b", margin:"0 0 8px" }}>Nenhum dado ainda</p>
          <p style={{ color:"#94a3b8", fontSize:14, margin:0 }}>Comece a coletar fichas para aparecer no ranking!</p>
        </div>
      ) : (
        <>
          {/* ── PÓDIO ──────────────────────────────────────────────────── */}
          {top3.length >= 2 && (
            <div style={{
              background:"#fff", borderRadius:24, padding:"28px 24px 0",
              marginBottom:16, border:"1px solid #f1f5f9",
              boxShadow:"0 4px 24px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
                <Medal style={{ width:18, height:18, color:"#F59E0B" }} />
                <span style={{ fontWeight:800, fontSize:15, color:"#0f172a" }}>Pódio</span>
                <span style={{ fontSize:12, color:"#94a3b8", fontWeight:500 }}>· Top 3 desta temporada</span>
              </div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
                {top3[1] && <PodiumCard player={top3[1]} rank={2} />}
                {top3[0] && <PodiumCard player={top3[0]} rank={1} />}
                {top3[2] && <PodiumCard player={top3[2]} rank={3} />}
              </div>
            </div>
          )}

          {/* ── LISTA COMPLETA ─────────────────────────────────────────── */}
          <div style={{ background:"#fff", borderRadius:24, padding:24, border:"1px solid #f1f5f9", boxShadow:"0 4px 24px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18, paddingBottom:14, borderBottom:"1px solid #f8fafc" }}>
              <TrendingUp style={{ width:16, height:16, color:"#7c3aed" }} />
              <span style={{ fontWeight:800, fontSize:14, color:"#0f172a" }}>Classificação Completa</span>
              <span style={{ marginLeft:"auto", fontSize:11, color:"#94a3b8", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#10b981", display:"inline-block", animation:"pulse 2s infinite" }} />
                Tempo real
              </span>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {/* Top 3 in list too */}
              {top3.map((p, i) => (
                <div key={p.id} style={{ animation: animIn ? `rankIn 0.4s ease ${i*0.05}s both` : "none" }}>
                  <RankRow player={p} rank={i+1} isMe={p.id === profile.id} />
                </div>
              ))}

              {rest.length > 0 && (
                <div style={{ margin:"4px 0", display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ flex:1, height:1, background:"#f1f5f9" }} />
                  <span style={{ fontSize:10, color:"#94a3b8", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                    demais participantes
                  </span>
                  <div style={{ flex:1, height:1, background:"#f1f5f9" }} />
                </div>
              )}

              {rest.map((p, i) => (
                <div key={p.id} style={{ animation: animIn ? `rankIn 0.4s ease ${(i+3)*0.04}s both` : "none" }}>
                  <RankRow player={p} rank={i+4} isMe={p.id === profile.id} />
                </div>
              ))}
            </div>
          </div>

          {/* ── XP LEGEND ──────────────────────────────────────────────── */}
          <div style={{
            marginTop:16, background:"#fff", borderRadius:24, padding:"20px 24px",
            border:"1px solid #f1f5f9", boxShadow:"0 2px 8px rgba(0,0,0,0.03)",
          }}>
            <p style={{ fontWeight:800, fontSize:13, color:"#0f172a", margin:"0 0 14px", display:"flex", alignItems:"center", gap:6 }}>
              <Shield style={{ width:15, height:15, color:"#7c3aed" }} /> Níveis & Conquistas
            </p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {NIVEIS.map(n => (
                <div key={n.nome} style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"8px 14px", borderRadius:14,
                  background:n.bg, border:`1px solid ${n.border}`, flex:1, minWidth:120,
                }}>
                  <span style={{ fontSize:18 }}>{n.icon}</span>
                  <div>
                    <p style={{ fontWeight:800, fontSize:12, color:n.color, margin:0 }}>{n.nome}</p>
                    <p style={{ fontSize:10, color:"#94a3b8", margin:0, fontWeight:600 }}>
                      {n.minXP === 0 ? "0 XP" : `${n.minXP.toLocaleString()}+ XP`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Ranking;
