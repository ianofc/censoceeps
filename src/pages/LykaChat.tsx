import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useUserSession } from "../hooks/useUserSession";
import {
  Send, Wifi, WifiOff, ChevronDown, ArrowLeft, Search,
  Radio, CornerUpLeft, Trash2, X, Heart, ExternalLink
} from "lucide-react";

// ─── Icons ───────────────────────────────────────────────────────────────────
function LaikaIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8 C4 4 2 3 3 7" /><path d="M19 8 C20 4 22 3 21 7" />
      <ellipse cx="12" cy="10" rx="7" ry="6" /><ellipse cx="12" cy="13" rx="3" ry="2" />
      <ellipse cx="12" cy="12" rx="1.2" ry="0.8" fill={color} stroke="none" />
      <circle cx="9" cy="9" r="0.9" fill={color} stroke="none" />
      <circle cx="15" cy="9" r="0.9" fill={color} stroke="none" />
      <path d="M7 15.5 C6 18 6 21 8 21 L16 21 C18 21 18 18 17 15.5" />
      <path d="M17 16 C21 14 22 10 20 9" />
    </svg>
  );
}
function PawIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <ellipse cx="6" cy="7" rx="2" ry="2.5" /><ellipse cx="12" cy="5" rx="2" ry="2.5" />
      <ellipse cx="18" cy="7" rx="2" ry="2.5" /><ellipse cx="3.5" cy="12" rx="1.5" ry="2" />
      <path d="M12 22 C7 22 5 18 6 14.5 C7 11 17 11 18 14.5 C19 18 17 22 12 22Z" />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GRADS: [string, string][] = [
  ["#3B82F6", "#6366F1"], ["#EC4899", "#F43F5E"], ["#10B981", "#14B8A6"],
  ["#F59E0B", "#F97316"], ["#8B5CF6", "#A855F7"], ["#06B6D4", "#0EA5E9"],
];
function grad(n: string): [string, string] { return GRADS[(n || "?").charCodeAt(0) % GRADS.length]; }
function ini(n: string) { return (n || "?").split(" ").slice(0, 2).map(x => x[0]).join("").toUpperCase(); }
function fmtTime(s: string) { return new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(s: string) {
  const d = new Date(s), t = new Date();
  if (d.toDateString() === t.toDateString()) return "Hoje";
  const y = new Date(t); y.setDate(t.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function timeAgo(s: string) {
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
  if (diff < 60) return "agora"; if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`; return `${Math.floor(diff / 86400)}d`;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  id: number; user_id: string; author_name: string; message: string;
  is_teacher_alert: boolean; created_at: string;
  conversation_key?: string | null;
  reply_to_id?: number | null; reply_to_text?: string | null; reply_to_author?: string | null;
  media_url?: string | null; media_type?: string | null;
}
interface Pessoa { id: string; nome_completo: string; turma_ou_cargo: string; papel: string; avatar_url: string; }
interface Conversation {
  id: string; name: string; isGroup: boolean; convKey: string | null;
  unread: number;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40, url = "" }: { name: string; size?: number; url?: string }) {
  const [err, setErr] = useState(false);
  const [g] = useState<[string, string]>(() => grad(name));
  if (url && !err) return (
    <img src={url} alt={name} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, display: "block" }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg,${g[0]},${g[1]})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: size * 0.35, color: "#fff", userSelect: "none",
    }}>{ini(name)}</div>
  );
}
function GroupAvatar({ size = 40 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#7c3aed,#4338ca)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <PawIcon size={size * 0.5} color="#fff" />
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MsgBubble({ msg, isMe, showAvatar, showName, onReply, onDelete }: {
  msg: Message; isMe: boolean; showAvatar: boolean; showName: boolean;
  onReply: (m: Message) => void; onDelete: (id: number) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", gap: 8, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", position: "relative" }}>
      {!isMe && (
        <div style={{ width: 30, flexShrink: 0, display: "flex", alignItems: "flex-end" }}>
          {showAvatar && <Avatar name={msg.author_name} size={28} />}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", maxWidth: "70%", alignItems: isMe ? "flex-end" : "flex-start" }}>
        {showName && !isMe && (
          <span style={{ fontSize: 10, fontWeight: 800, color: "#64748b", marginBottom: 2, marginLeft: 2 }}>{msg.author_name}</span>
        )}
        {msg.reply_to_id && (
          <div style={{
            background: isMe ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)",
            borderLeft: "2px solid", borderLeftColor: isMe ? "rgba(255,255,255,0.5)" : "#7c3aed",
            borderRadius: "8px 8px 0 0", padding: "5px 10px", marginBottom: -4,
            fontSize: 11, color: isMe ? "rgba(255,255,255,0.8)" : "#64748b",
            maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            <span style={{ fontWeight: 700 }}>{msg.reply_to_author}: </span>{msg.reply_to_text}
          </div>
        )}
        <div style={{
          padding: "9px 13px", borderRadius: 18, fontSize: 13, fontWeight: 500, lineHeight: 1.55,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)", wordBreak: "break-word",
          ...(isMe
            ? { background: "linear-gradient(135deg,#6d28d9,#4338ca)", color: "#fff", borderBottomRightRadius: 4 }
            : msg.is_teacher_alert
            ? { background: "#fffbeb", border: "1px solid #fde68a", color: "#78350f", borderBottomLeftRadius: 4 }
            : { background: "#fff", color: "#1e293b", borderBottomLeftRadius: 4, border: "1px solid #f1f5f9" }),
        }}>
          {msg.is_teacher_alert && !isMe && (
            <span style={{ display: "block", fontSize: 9, fontWeight: 900, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>
              📢 Professor(a)
            </span>
          )}
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.message}</p>
          {msg.media_url && msg.media_type === "image" && (
            <img src={msg.media_url} alt="Mídia" style={{ width: "100%", borderRadius: 12, marginTop: 6, marginBottom: 4 }} />
          )}
          {msg.media_url && msg.media_type === "video" && (
            <video src={msg.media_url} controls style={{ width: "100%", borderRadius: 12, marginTop: 6, marginBottom: 4 }} />
          )}
          {msg.media_url && msg.media_type === "audio" && (
            <audio src={msg.media_url} controls style={{ width: "100%", marginTop: 6, marginBottom: 4, height: 36 }} />
          )}
          <span style={{ display: "block", fontSize: 9, marginTop: 3, textAlign: "right", color: isMe ? "rgba(255,255,255,0.55)" : "#94a3b8" }}>
            {fmtTime(msg.created_at)}{isMe && " ✓"}
          </span>
        </div>
      </div>
      {hover && (
        <div style={{
          display: "flex", alignItems: "center", gap: 3,
          flexDirection: isMe ? "row" : "row-reverse",
          position: "absolute", bottom: 0, ...(isMe ? { right: "100%", marginRight: 6 } : { left: "100%", marginLeft: 6 }),
        }}>
          <button type="button" onClick={() => onReply(msg)} title="Responder"
            style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <CornerUpLeft style={{ width: 13, height: 13 }} />
          </button>
          {isMe && (
            <button type="button" onClick={() => onDelete(msg.id)} title="Excluir"
              style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #fee2e2", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <Trash2 style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Person Profile Modal ─────────────────────────────────────────────────────
function PersonProfileModal({ pessoa, myId, onClose }: { pessoa: Pessoa; myId: string; onClose: () => void }) {
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [myFichas, setMyFichas] = useState(0);
  const [myPosts, setMyPosts] = useState(0);
  const [myMsgs, setMyMsgs] = useState(0);

  useEffect(() => {
    void (async () => {
      const [{ count: lk }, { data: myLike }, { count: fichas }, { count: posts }, { count: msgs }] = await Promise.all([
        supabase.from("pessoa_likes").select("*", { count: "exact", head: true }).eq("liked_id", pessoa.id),
        supabase.from("pessoa_likes").select("id").eq("liked_id", pessoa.id).eq("liker_id", myId).maybeSingle(),
        supabase.from("entrevistas").select("*", { count: "exact", head: true }).eq("user_id", pessoa.id),
        supabase.from("lyka_posts").select("*", { count: "exact", head: true }).eq("user_id", pessoa.id),
        supabase.from("lyka_messages").select("*", { count: "exact", head: true }).eq("user_id", pessoa.id).is("conversation_key", null),
      ]);
      setLikeCount(lk || 0);
      setHasLiked(!!myLike);
      setMyFichas(fichas || 0);
      setMyPosts(posts || 0);
      setMyMsgs(msgs || 0);
    })();
  }, [pessoa.id, myId]);

  const handleLike = async () => {
    if (likeLoading || myId === pessoa.id) return;
    setLikeLoading(true);
    if (hasLiked) {
      await supabase.from("pessoa_likes").delete().eq("liker_id", myId).eq("liked_id", pessoa.id);
      setLikeCount(c => c - 1); setHasLiked(false);
    } else {
      await supabase.from("pessoa_likes").insert([{ liker_id: myId, liked_id: pessoa.id }]);
      setLikeCount(c => c + 1); setHasLiked(true);
    }
    setLikeLoading(false);
  };

  const [g] = React.useState(() => grad(pessoa.nome_completo));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 360, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
        {/* Cover */}
        <div style={{ height: 80, background: `linear-gradient(135deg,${g[0]},${g[1]})`, position: "relative", flexShrink: 0 }}>
          <button type="button" onClick={onClose}
            style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(0,0,0,0.2)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {/* Avatar */}
        <div style={{ padding: "0 20px 20px", marginTop: -32 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
            <Avatar name={pessoa.nome_completo} size={64} url={pessoa.avatar_url} />
            {myId !== pessoa.id && (
              <button type="button" onClick={() => void handleLike()} disabled={likeLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 14, border: "none",
                  background: hasLiked ? "linear-gradient(135deg,#f43f5e,#e11d48)" : "#f1f5f9",
                  color: hasLiked ? "#fff" : "#64748b", fontWeight: 800, fontSize: 13, cursor: likeLoading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", transition: "all 0.2s", boxShadow: hasLiked ? "0 4px 12px rgba(244,63,94,0.35)" : "none",
                }}>
                <Heart style={{ width: 15, height: 15, fill: hasLiked ? "#fff" : "none" }} />
                {hasLiked ? "Curtido" : "Curtir"}
              </button>
            )}
          </div>
          <p style={{ fontWeight: 900, fontSize: 17, color: "#0f172a", margin: "0 0 2px" }}>{pessoa.nome_completo}</p>
          <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 4px" }}>{pessoa.turma_ou_cargo || "CEEP Seabra"}</p>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "2px 10px", borderRadius: 99, border: "1px solid #ddd6fe" }}>
            {pessoa.papel === "gestor" ? "Professor(a)" : "Pesquisador(a)"}
          </span>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 16 }}>
            {[
              { label: "❤️ Curtidas", value: likeCount, color: "#f43f5e" },
              { label: "📋 Fichas", value: myFichas, color: "#7c3aed" },
              { label: "📰 Posts", value: myPosts, color: "#3b82f6" },
              { label: "💬 Msgs", value: myMsgs, color: "#10b981" },
            ].map(s => (
              <div key={s.label} style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 6px", textAlign: "center", border: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 9, color: "#94a3b8", margin: "0 0 4px", fontWeight: 700 }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function LykaChat() {
  const { profile } = useUserSession();
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [fetchingMsgs, setFetchingMsgs] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [scrollUnread, setScrollUnread] = useState(0);
  const [search, setSearch] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [profileModal, setProfileModal] = useState<Pessoa | null>(null);
  const [lastMsgs, setLastMsgs] = useState<Record<string, { text: string; time: string; unread: number }>>({});
  const [pinned, setPinned] = useState<string[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingChanRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReadRef = useRef<Record<string, string>>({});

  // Load people & build conversations
  useEffect(() => {
    if (!profile.id) return;
    supabase.from("pessoas").select("id,nome_completo,turma_ou_cargo,papel,avatar_url")
      .order("nome_completo", { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        const ps = data as Pessoa[];
        setPessoas(ps);
        const convs: Conversation[] = [
          { id: "group", name: "Layka Chat · Geral", isGroup: true, convKey: null, unread: 0 },
        ];
        ps.filter(p => p.id !== profile.id).forEach(p => {
          const key = [profile.id, p.id].sort().join("_");
          convs.push({ id: p.id, name: p.nome_completo, isGroup: false, convKey: key, unread: 0 });
        });
        setConversations(convs);
      });
      
    // Load pinned
    try {
      setPinned(JSON.parse(localStorage.getItem(`lyka_pinned_${profile.id}`) || '[]'));
    } catch {}
  }, [profile.id]);

  // Load last messages for sidebar preview + unread counts
  const loadLastMsgs = useCallback(async () => {
    if (!profile.id) return;
    const { data } = await supabase.from("lyka_messages")
      .select("conversation_key,message,author_name,user_id,created_at")
      .order("created_at", { ascending: false }).limit(300);
    if (!data) return;
    const map: Record<string, { text: string; time: string; unread: number }> = {};
    for (const m of data as Message[]) {
      const key = m.conversation_key ?? "group";
      const lastRead = lastReadRef.current[key] || new Date(0).toISOString();
      const isUnread = m.user_id !== profile.id && m.created_at > lastRead;
      if (!map[key]) {
        map[key] = {
          text: (m.user_id === profile.id ? "Você: " : "") + m.message.slice(0, 45) + (m.message.length > 45 ? "…" : ""),
          time: m.created_at, unread: isUnread ? 1 : 0,
        };
      } else if (isUnread) {
        map[key].unread++;
      }
    }
    setLastMsgs(map);
  }, [profile.id]);

  useEffect(() => { void loadLastMsgs(); }, [loadLastMsgs]);

  // Global realtime for sidebar updates
  useEffect(() => {
    if (!profile.id) return;
    const ch = supabase.channel("sidebar-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "lyka_messages" }, () => void loadLastMsgs())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [profile.id, loadLastMsgs]);

  const scrollToBottom = (beh: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior: beh });
  };
  const handleScroll = () => {
    const el = scrollRef.current; if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);
    if (atBottom) setScrollUnread(0);
  };

  const loadMessages = useCallback(async (conv: Conversation) => {
    setFetchingMsgs(true); setMessages([]);
    let q = supabase.from("lyka_messages").select("*").order("created_at", { ascending: true }).limit(200);
    q = conv.convKey ? q.eq("conversation_key", conv.convKey) : q.is("conversation_key", null);
    const { data } = await q;
    if (data) setMessages(data as Message[]);
    setFetchingMsgs(false);
  }, []);

  // Per-conversation realtime
  useEffect(() => {
    if (!activeConv) return;
    if (channelRef.current) void supabase.removeChannel(channelRef.current);
    const ch = supabase.channel(`msgs-${activeConv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lyka_messages" }, (p) => {
        const msg = p.new as Message;
        if ((msg.conversation_key ?? null) !== (activeConv.convKey ?? null)) return;
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        if (isAtBottomRef.current) setTimeout(() => scrollToBottom(), 50);
        else setScrollUnread(c => c + 1);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "lyka_messages" }, (p) => {
        const old = p.old as Message;
        setMessages(prev => prev.filter(m => m.id !== old.id));
      })
      .subscribe(s => setIsConnected(s === "SUBSCRIBED"));
    channelRef.current = ch;
    return () => { void supabase.removeChannel(ch); };
  }, [activeConv]);

  // Typing indicator channel
  useEffect(() => {
    if (!activeConv || !profile.id) return;
    if (typingChanRef.current) void supabase.removeChannel(typingChanRef.current);
    const ch = supabase.channel(`typing-${activeConv.id}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId, name, typing } = payload.payload as { userId: string; name: string; typing: boolean };
        if (userId === profile.id) return;
        setTypingUsers(prev => {
          if (typing && !prev.includes(name)) return [...prev, name];
          if (!typing) return prev.filter(n => n !== name);
          return prev;
        });
        setTimeout(() => setTypingUsers(prev => prev.filter(n => n !== name)), 4000);
      })
      .subscribe();
    typingChanRef.current = ch;
    return () => { void supabase.removeChannel(ch); };
  }, [activeConv, profile.id]);

  useEffect(() => {
    if (!fetchingMsgs) setTimeout(() => scrollToBottom("instant" as ScrollBehavior), 50);
  }, [fetchingMsgs]);

  const openConv = (conv: Conversation) => {
    setActiveConv(conv);
    setScrollUnread(0); setTypingUsers([]); setReplyTo(null);
    setMobileView("chat");
    const key = conv.convKey ?? "group";
    lastReadRef.current[key] = new Date().toISOString();
    setLastMsgs(prev => ({ ...prev, [key]: { ...prev[key], unread: 0, text: prev[key]?.text || "" } }));
    void loadMessages(conv);
  };

  const broadcastTyping = (typing: boolean) => {
    if (!typingChanRef.current || !profile.nomeCompleto) return;
    void typingChanRef.current.send({ type: "broadcast", event: "typing", payload: { userId: profile.id, name: profile.nomeCompleto.split(" ")[0], typing } });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => broadcastTyping(false), 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || sending || !activeConv) return;
    broadcastTyping(false);
    setSending(true); setNewMessage("");
    const isTeacher = profile.papel === "gestor" || (profile.turmaOuCargo || "").toLowerCase().includes("professor");
    const ins: Record<string, unknown> = {
      user_id: profile.id || "anon", author_name: profile.nomeCompleto || "Pesquisador(a)",
      message: text, is_teacher_alert: isTeacher,
      media_url: mediaPreview || null,
      media_type: mediaFile ? (mediaFile.type.startsWith("image/") ? "image" : mediaFile.type.startsWith("video/") ? "video" : "audio") : null,
    };
    if (activeConv.convKey) ins.conversation_key = activeConv.convKey;
    if (replyTo) {
      ins.reply_to_id = replyTo.id;
      ins.reply_to_text = replyTo.message.slice(0, 80);
      ins.reply_to_author = replyTo.author_name.split(" ")[0];
    }
    const opt: Message = {
      id: Date.now(), user_id: profile.id, author_name: profile.nomeCompleto || "Eu",
      message: text, is_teacher_alert: isTeacher, created_at: new Date().toISOString(),
      conversation_key: activeConv.convKey,
      reply_to_id: replyTo?.id, reply_to_text: replyTo?.message.slice(0, 80),
      reply_to_author: replyTo?.author_name.split(" ")[0],
      media_url: mediaPreview || null,
      media_type: mediaFile ? (mediaFile.type.startsWith("image/") ? "image" : mediaFile.type.startsWith("video/") ? "video" : "audio") : null,
    };
    setMessages(prev => [...prev, opt]);
    setReplyTo(null);
    setMediaFile(null);
    setMediaPreview("");
    setTimeout(() => scrollToBottom(), 50);
    const { error } = await supabase.from("lyka_messages").insert([ins]);
    if (error) { setMessages(prev => prev.filter(m => m.id !== opt.id)); setNewMessage(text); }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleDeleteMsg = async (id: number) => {
    await supabase.from("lyka_messages").delete().eq("id", id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const lbl = fmtDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === lbl) last.msgs.push(msg);
    else grouped.push({ date: lbl, msgs: [msg] });
  });

  const togglePin = (e: React.MouseEvent, cid: string) => {
    e.stopPropagation();
    setPinned(prev => {
      let next = [...prev];
      if (next.includes(cid)) next = next.filter(x => x !== cid);
      else {
        if (next.length >= 3) { alert("Você pode fixar no máximo 3 conversas."); return next; }
        next.push(cid);
      }
      localStorage.setItem(`lyka_pinned_${profile.id}`, JSON.stringify(next));
      return next;
    });
  };

  const sortedConvs = [...conversations].sort((a, b) => {
    const pA = pinned.includes(a.id);
    const pB = pinned.includes(b.id);
    if (pA && !pB) return -1;
    if (!pA && pB) return 1;

    const tA = lastMsgs[a.convKey ?? "group"]?.time || "1970-01-01T00:00:00Z";
    const tB = lastMsgs[b.convKey ?? "group"]?.time || "1970-01-01T00:00:00Z";
    if (tA !== tB) return tB.localeCompare(tA);
    return a.name.localeCompare(b.name);
  });

  const filteredConvs = sortedConvs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const totalUnread = Object.values(lastMsgs).reduce((s, v) => s + (v.unread || 0), 0);
  const p = profile;

  // ── SIDEBAR ───────────────────────────────────────────────────────────────
  const SidebarEl = (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0f0e17", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ padding: "18px 12px 12px", background: "linear-gradient(180deg,#1a1830,#0f0e17)", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#4338ca)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <LaikaIcon size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontWeight: 900, fontSize: 15, margin: 0 }}>Layka Chat</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0 }}>🐾 Em memória de Laika</p>
          </div>
          {totalUnread > 0 && (
            <span style={{ background: "#ef4444", color: "#fff", fontWeight: 900, fontSize: 10, padding: "2px 7px", borderRadius: 99 }}>
              {totalUnread}
            </span>
          )}
        </div>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversa..."
            style={{ width: "100%", boxSizing: "border-box", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 500, outline: "none", fontFamily: "inherit" }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {filteredConvs.map(conv => {
          const isActive = activeConv?.id === conv.id;
          const pessoa = pessoas.find(px => px.id === conv.id);
          const convKey = conv.convKey ?? "group";
          const last = lastMsgs[convKey];
          const unread = last?.unread || 0;
          return (
            <button key={conv.id} type="button" onClick={() => openConv(conv)}
              style={{
                width: "100%", padding: "10px 12px", border: "none", cursor: "pointer", textAlign: "left",
                background: isActive ? "rgba(124,58,237,0.2)" : "transparent",
                borderLeft: `3px solid ${isActive ? "#7c3aed" : "transparent"}`,
                display: "flex", alignItems: "center", gap: 10, transition: "background 0.15s", fontFamily: "inherit",
              }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                {conv.isGroup ? <GroupAvatar size={42} /> : <Avatar name={conv.name} size={42} url={pessoa?.avatar_url || ""} />}
                {isConnected && isActive && (
                  <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: "#10b981", border: "2px solid #0f0e17" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                    <p style={{ color: unread > 0 ? "#fff" : "rgba(255,255,255,0.75)", fontWeight: unread > 0 ? 800 : 600, fontSize: 13, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {conv.name}
                    </p>
                    {pinned.includes(conv.id) && <span style={{ fontSize: 10 }}>📌</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <button type="button" onClick={(e) => togglePin(e, conv.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, opacity: 0.5, padding: 0 }} title="Fixar">
                      {pinned.includes(conv.id) ? "📍" : "📌"}
                    </button>
                    {last?.time && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{timeAgo(last.time)}</span>}
                    {unread > 0 && (
                      <span style={{ background: "#7c3aed", color: "#fff", fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 99 }}>{unread}</span>
                    )}
                  </div>
                </div>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: unread > 0 ? 600 : 400 }}>
                  {last?.text || (conv.isGroup ? "Chat de todos · CEEP Seabra" : (pessoa?.turma_ou_cargo || "CEEP Seabra"))}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {p.nomeCompleto && (
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: "rgba(0,0,0,0.2)" }}>
          <Avatar name={p.nomeCompleto} size={32} url={p.avatarUrl || ""} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 12, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nomeCompleto}</p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0 }}>{p.turmaOuCargo || "CEEP Seabra"}</p>
          </div>
          {isConnected ? <Wifi style={{ width: 12, height: 12, color: "#10b981", flexShrink: 0 }} /> : <WifiOff style={{ width: 12, height: 12, color: "#64748b", flexShrink: 0 }} />}
        </div>
      )}
    </div>
  );

  // ── CHAT PANEL ────────────────────────────────────────────────────────────
  const ChatEl = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
      {!activeConv ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40, background: "linear-gradient(135deg,#f8fafc,#e0e7ff)" }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg,#7c3aed,#4338ca)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(124,58,237,0.3)" }}>
            <LaikaIcon size={44} color="#fff" />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 900, fontSize: 20, color: "#1e1b4b", margin: "0 0 8px" }}>Layka Chat</p>
            <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 4px" }}>Selecione uma conversa para começar</p>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>🐾 Em memória de Laika (1957)</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ padding: "10px 14px", background: "linear-gradient(90deg,#1e1b4b,#312e81)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
            <button type="button" id="layka-back-btn" onClick={() => { setMobileView("list"); setActiveConv(null); }}
              style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer", alignItems: "center", justifyContent: "center", flexShrink: 0, display: "none" }}>
              <ArrowLeft style={{ width: 15, height: 15 }} />
            </button>
            {activeConv.isGroup
              ? <GroupAvatar size={36} />
              : (
                <button type="button" onClick={() => { const p = pessoas.find(px => px.id === activeConv.id); if(p) setProfileModal(p); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                  <Avatar name={activeConv.name} size={36} url={pessoas.find(px => px.id === activeConv.id)?.avatar_url || ""} />
                </button>
              )
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              {!activeConv.isGroup ? (
                <button type="button"
                  onClick={() => { const p = pessoas.find(px => px.id === activeConv.id); if(p) setProfileModal(p); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: 14, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeConv.name}</p>
                  <ExternalLink style={{ width: 11, height: 11, color: "rgba(199,210,254,0.6)", flexShrink: 0 }} />
                </button>
              ) : (
                <p style={{ color: "#fff", fontWeight: 800, fontSize: 14, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeConv.name}</p>
              )}
              <p style={{ color: "rgba(199,210,254,0.7)", fontSize: 11, margin: 0, fontWeight: 500 }}>
                {typingUsers.length > 0 ? `${typingUsers.slice(0, 2).join(", ")} ${typingUsers.length === 1 ? "está" : "estão"} digitando...` : activeConv.isGroup ? `${pessoas.length} membros · Chat geral` : "🔒 Conversa privada"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {isConnected ? (
                <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.15)", fontSize: 11, fontWeight: 700, color: "#6ee7b7" }}>
                  <Wifi style={{ width: 11, height: 11 }} /> Online
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(255,255,255,0.1)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
                  <WifiOff style={{ width: 11, height: 11 }} /> Conectando
                </span>
              )}
              {activeConv.isGroup && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(245,158,11,0.15)", padding: "4px 10px", borderRadius: 99, border: "1px solid rgba(245,158,11,0.25)", fontSize: 11, fontWeight: 700, color: "#fcd34d" }}>
                  <Radio style={{ width: 11, height: 11 }} /> Ao vivo
                </span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <div ref={scrollRef} onScroll={handleScroll}
              style={{ height: "100%", overflowY: "auto", padding: "16px 14px 8px", background: "linear-gradient(180deg,#f1f5f9,#f8fafc)", scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
              {fetchingMsgs ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <div style={{ width: 32, height: 32, border: "3px solid #e0e7ff", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "lykaSpin 0.8s linear infinite" }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#ede9fe,#ddd6fe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LaikaIcon size={28} color="#7c3aed" />
                  </div>
                  <p style={{ fontWeight: 800, color: "#1e293b", margin: 0 }}>{activeConv.isGroup ? "Seja o primeiro a falar!" : "Nenhuma mensagem ainda"}</p>
                  <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                    {activeConv.isGroup ? "Mande um alô para a turma 🐾" : `Inicie uma conversa com ${activeConv.name} 💬`}
                  </p>
                </div>
              ) : (
                grouped.map(group => (
                  <div key={group.date}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 10px" }}>
                      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", background: "#fff", padding: "3px 10px", borderRadius: 99, border: "1px solid #e2e8f0" }}>
                        {group.date}
                      </span>
                      <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.07)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {group.msgs.map((msg, idx) => {
                        const mine = msg.user_id === profile.id;
                        const prev = group.msgs[idx - 1];
                        const showAv = !mine && (!prev || prev.user_id !== msg.user_id);
                        return (
                          <MsgBubble key={msg.id} msg={msg} isMe={mine} showAvatar={showAv} showName={showAv}
                            onReply={setReplyTo} onDelete={handleDeleteMsg} />
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {/* Typing dots */}
              {typingUsers.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", marginLeft: 38 }}>
                  <div style={{ background: "#fff", borderRadius: 16, padding: "8px 14px", display: "flex", gap: 4, alignItems: "center", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#94a3b8", display: "inline-block", animation: `lykaBounce 1s ease ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{typingUsers[0]} está digitando...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showScrollBtn && (
              <button type="button" onClick={() => { scrollToBottom(); setScrollUnread(0); }}
                style={{ position: "absolute", bottom: 14, right: 14, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 10 }}>
                <ChevronDown style={{ width: 14, height: 14 }} />
                {scrollUnread > 0 && <span style={{ background: "#7c3aed", color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: 99, padding: "1px 6px" }}>{scrollUnread}</span>}
              </button>
            )}
          </div>

          {/* Reply and Media banner */}
          {(replyTo || mediaPreview) && (
            <div style={{ padding: "8px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {replyTo && (
                <div style={{ flex: 1, borderLeft: "3px solid #7c3aed", paddingLeft: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", display: "block" }}>{replyTo.author_name.split(" ")[0]}</span>
                  <span style={{ fontSize: 12, color: "#64748b", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{replyTo.message.slice(0, 80)}</span>
                </div>
              )}
              {mediaPreview && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {mediaFile?.type.startsWith("image/") ? (
                    <img src={mediaPreview} alt="preview" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#3b82f6" }}>Arquivo Anexado</span>
                  )}
                </div>
              )}
              <button type="button" onClick={() => { setReplyTo(null); setMediaFile(null); setMediaPreview(""); }}
                style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "#e2e8f0", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 12, height: 12 }} />
              </button>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #e2e8f0", flexShrink: 0, background: "#fff" }}>
            <form onSubmit={e => void handleSend(e)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "#f1f5f9", color: "#64748b", flexShrink: 0, transition: "background 0.2s" }}>
                📎
                <input type="file" style={{ display: "none" }} accept="image/*,video/*,audio/*"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setMediaFile(f);
                      const url = URL.createObjectURL(f);
                      setMediaPreview(url);
                    }
                  }}
                />
              </label>
              <input ref={inputRef} type="text" value={newMessage} onChange={handleInputChange}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) void handleSend(e as unknown as React.FormEvent); }}
                placeholder={replyTo ? "Responder..." : activeConv.isGroup ? "Mensagem para a turma..." : "Mensagem privada..."}
                autoComplete="off"
                style={{ flex: 1, padding: "10px 14px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 14, fontSize: 13, fontWeight: 500, outline: "none", fontFamily: "inherit", color: "#0f172a", transition: "border-color 0.2s" }}
                onFocus={e => (e.target.style.borderColor = "#7c3aed")}
                onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
              />
              <button type="submit" disabled={sending || !newMessage.trim()}
                style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: sending || !newMessage.trim() ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#4338ca)", color: "#fff", cursor: sending || !newMessage.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: newMessage.trim() ? "0 4px 12px rgba(124,58,237,0.4)" : "none", transition: "all 0.2s" }}>
                <Send style={{ width: 16, height: 16 }} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes lykaSpin { to { transform: rotate(360deg); } }
        @keyframes lykaBounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
        @media(max-width:640px){
          .layka-sidebar{ display: ${mobileView === "list" ? "flex" : "none"} !important; width: 100% !important; }
          .layka-chat{ display: ${mobileView === "chat" ? "flex" : "none"} !important; }
          #layka-back-btn{ display: flex !important; }
        }
      `}</style>
      <div style={{ width: "100%", maxWidth: 940, height: "calc(100vh - 120px)", minHeight: 500, display: "flex", borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.08)" }}>
        <div className="layka-sidebar" style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column" }}>
          {SidebarEl}
        </div>
        <div className="layka-chat" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {ChatEl}
        </div>
      </div>
      {profileModal && (
        <PersonProfileModal
          pessoa={profileModal}
          myId={profile.id}
          onClose={() => setProfileModal(null)}
        />
      )}
    </>
  );

}

export default LykaChat;
