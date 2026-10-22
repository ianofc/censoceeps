import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useUserSession, isStaffPapel } from "../hooks/useUserSession";
import { badgeService, BadgeDefinition } from "../services/badgeService";
import {
  Heart, X, MessageCircle, Rss, Award, Sparkles,
  Shield, CheckCircle, ExternalLink, Flame, Trophy,
  ChevronRight, Calendar, UserCheck
} from "lucide-react";

// ─── Níveis & Cores ──────────────────────────────────────────────────────────
interface Nivel {
  nome: string;
  minXP: number;
  color: string;
  bg: string;
  border: string;
  icon: string;
}

const NIVEIS: Nivel[] = [
  { nome: "Novato",       minXP: 0,    color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", icon: "🌱" },
  { nome: "Explorador",   minXP: 200,  color: "#3B82F6", bg: "#eff6ff", border: "#bfdbfe", icon: "🔍" },
  { nome: "Pesquisador",  minXP: 500,  color: "#8B5CF6", bg: "#ede9fe", border: "#ddd6fe", icon: "📋" },
  { nome: "Especialista", minXP: 1000, color: "#F59E0B", bg: "#fffbeb", border: "#fde68a", icon: "⭐" },
  { nome: "Mestre",       minXP: 2500, color: "#EF4444", bg: "#fef2f2", border: "#fecaca", icon: "🏆" },
];

function getNivel(xp: number): Nivel {
  let lvl = NIVEIS[0];
  for (const n of NIVEIS) {
    if (xp >= n.minXP) lvl = n;
  }
  return lvl;
}

function getNextNivel(xp: number): Nivel | null {
  for (const n of NIVEIS) {
    if (xp < n.minXP) return n;
  }
  return null;
}

function xpProgress(xp: number): number {
  const cur = getNivel(xp);
  const nxt = getNextNivel(xp);
  if (!nxt) return 100;
  return Math.min(100, Math.max(0, Math.round(((xp - cur.minXP) / (nxt.minXP - cur.minXP)) * 100)));
}

const GRAD_PAIRS: [string, string][] = [
  ["#3B82F6", "#6366F1"],
  ["#EC4899", "#F43F5E"],
  ["#10B981", "#14B8A6"],
  ["#F59E0B", "#F97316"],
  ["#8B5CF6", "#A855F7"],
  ["#06B6D4", "#0EA5E9"],
];

function getGrad(name: string): [string, string] {
  return GRAD_PAIRS[(name || "?").charCodeAt(0) % GRAD_PAIRS.length];
}

function getInitials(name: string): string {
  return (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export interface ColegaProfileData {
  id: string;
  nome_completo: string;
  avatar_url?: string;
  turma_ou_cargo?: string;
  papel?: string;
  bio?: string;
  fichas?: number;
  posts?: number;
  msgs?: number;
  likes?: number;
  xp?: number;
}

interface ColegaProfileModalProps {
  colega: ColegaProfileData | null;
  onClose: () => void;
  onLikeChanged?: (colegaId: string, liked: boolean, newCount: number) => void;
}

export function ColegaProfileModal({ colega, onClose, onLikeChanged }: ColegaProfileModalProps) {
  const { profile } = useUserSession();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(colega?.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [fichas, setFichas] = useState(colega?.fichas || 0);
  const [posts, setPosts] = useState(colega?.posts || 0);
  const [msgs, setMsgs] = useState(colega?.msgs || 0);
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number }[]>([]);

  const isMe = Boolean(profile?.id && colega?.id && profile.id === colega.id);

  // Carrega dados completos e status de curtida
  useEffect(() => {
    if (!colega?.id) return;
    let isMounted = true;
    setLoading(true);

    const loadStats = async () => {
      try {
        const myId = profile?.id;
        const [
          { count: lkCount },
          { data: myLikeRow },
          { count: fCount },
          { count: pCount },
          { count: mCount },
          userBadges
        ] = await Promise.all([
          supabase.from("pessoa_likes").select("*", { count: "exact", head: true }).eq("liked_id", colega.id),
          myId
            ? supabase.from("pessoa_likes").select("id").eq("liked_id", colega.id).eq("liker_id", myId).maybeSingle()
            : Promise.resolve({ data: null }),
          typeof colega.fichas === "number"
            ? Promise.resolve({ count: colega.fichas })
            : supabase.from("entrevistas").select("*", { count: "exact", head: true }).eq("entrevistador_id", colega.id),
          typeof colega.posts === "number"
            ? Promise.resolve({ count: colega.posts })
            : supabase.from("lyka_posts").select("*", { count: "exact", head: true }).eq("user_id", colega.id),
          typeof colega.msgs === "number"
            ? Promise.resolve({ count: colega.msgs })
            : supabase.from("lyka_messages").select("*", { count: "exact", head: true }).eq("user_id", colega.id).is("conversation_key", null),
          badgeService.getUserBadges(colega.id).catch(() => [])
        ]);

        if (!isMounted) return;

        setLikeCount(lkCount ?? colega.likes ?? 0);
        setHasLiked(Boolean(myLikeRow));
        setFichas(fCount ?? colega.fichas ?? 0);
        setPosts(pCount ?? colega.posts ?? 0);
        const catalog = badgeService.getAllBadges();
        const earned = catalog.filter((c) => (userBadges || []).some((u) => u.badgeId === c.id));
        setBadges(earned);
      } catch (err) {
        console.warn("Erro ao carregar dados do colega:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadStats();
    return () => {
      isMounted = false;
    };
  }, [colega?.id, colega?.fichas, colega?.posts, colega?.msgs, colega?.likes, profile?.id]);

  if (!colega) return null;

  // Cálculo de XP do colega (+100 ficha, +20 post, +5 msg, +10 like recebido)
  const calculatedXP = fichas * 100 + posts * 20 + msgs * 5 + likeCount * 10;
  const xp = colega.xp && colega.xp > calculatedXP ? colega.xp : calculatedXP;
  const nivel = getNivel(xp);
  const nextNivel = getNextNivel(xp);
  const progress = xpProgress(xp);
  const colors = getGrad(colega.nome_completo);

  const handleToggleLike = async () => {
    if (!profile?.id || isMe || likeLoading) return;
    setLikeLoading(true);

    const prevLiked = hasLiked;
    const prevCount = likeCount;
    const nextCount = prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1;

    // Atualização otimista
    setHasLiked(!prevLiked);
    setLikeCount(nextCount);

    // Efeito visual de corações flutuantes ao curtir
    if (!prevLiked) {
      const newHearts = Array.from({ length: 5 }, (_, i) => ({
        id: Date.now() + i,
        left: 30 + Math.random() * 40,
      }));
      setFloatingHearts((prev) => [...prev, ...newHearts]);
      setTimeout(() => {
        setFloatingHearts([]);
      }, 1200);
    }

    try {
      if (prevLiked) {
        await supabase
          .from("pessoa_likes")
          .delete()
          .eq("liker_id", profile.id)
          .eq("liked_id", colega.id);
      } else {
        await supabase
          .from("pessoa_likes")
          .insert([{ liker_id: profile.id, liked_id: colega.id }]);
      }
      onLikeChanged?.(colega.id, !prevLiked, nextCount);
    } catch (err) {
      console.error("Erro ao curtir colega:", err);
      // Reverte em caso de falha
      setHasLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleStartChat = () => {
    onClose();
    navigate(`/lyka-chat?dm=${colega.id}&dmName=${encodeURIComponent(colega.nome_completo)}`);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "colegaFadeIn 0.25s ease-out",
      }}
    >
      <style>{`
        @keyframes colegaFadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes floatHeart {
          0% { transform: translateY(0) scale(0.8); opacity: 1; }
          100% { transform: translateY(-70px) scale(1.3); opacity: 0; }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          borderRadius: 28,
          width: "100%",
          maxWidth: 420,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(255,255,255,0.8)",
        }}
      >
        {/* Capa com Gradiente Telegram / Lyka */}
        <div
          style={{
            height: 110,
            background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
            position: "relative",
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(6px)",
              padding: "4px 12px",
              borderRadius: 99,
              color: "#fff",
              fontSize: 11,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Sparkles style={{ width: 13, height: 13 }} />
            <span>Pesquisador Censo CEEP</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar perfil"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: "rgba(0,0,0,0.25)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Informações Principais & Avatar */}
        <div style={{ padding: "0 22px 24px", marginTop: -46, position: "relative" }}>
          {/* Top row: Avatar + Botão Curtir */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
            {/* Avatar com Anel de Nível */}
            <div
              style={{
                padding: 4,
                borderRadius: "50%",
                background: "#ffffff",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                position: "relative",
              }}
            >
              {colega.avatar_url ? (
                <img
                  src={colega.avatar_url}
                  alt={colega.nome_completo}
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: "50%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 26,
                  }}
                >
                  {getInitials(colega.nome_completo)}
                </div>
              )}

              {/* Selo de Nível */}
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  background: nivel.bg,
                  border: `2px solid ${nivel.border}`,
                  color: nivel.color,
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
                title={`Nível ${nivel.nome}`}
              >
                {nivel.icon}
              </div>
            </div>

            {/* Ações Rápidas: Botão Curtir Colega */}
            <div style={{ position: "relative" }}>
              {floatingHearts.map((h) => (
                <div
                  key={h.id}
                  style={{
                    position: "absolute",
                    bottom: 40,
                    left: `${h.left}%`,
                    animation: "floatHeart 1s ease-out forwards",
                    fontSize: 22,
                    pointerEvents: "none",
                    zIndex: 20,
                  }}
                >
                  ❤️
                </div>
              ))}

              {!isMe ? (
                <button
                  type="button"
                  onClick={() => void handleToggleLike()}
                  disabled={likeLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 18px",
                    borderRadius: 99,
                    border: hasLiked ? "none" : "1.5px solid #fecdd3",
                    background: hasLiked
                      ? "linear-gradient(135deg, #f43f5e, #e11d48)"
                      : "#fff1f2",
                    color: hasLiked ? "#ffffff" : "#e11d48",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: likeLoading ? "wait" : "pointer",
                    boxShadow: hasLiked
                      ? "0 6px 18px rgba(244,63,94,0.35)"
                      : "0 2px 6px rgba(244,63,94,0.08)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <Heart
                    style={{
                      width: 17,
                      height: 17,
                      fill: hasLiked ? "#fff" : "none",
                      stroke: hasLiked ? "#fff" : "#e11d48",
                      strokeWidth: 2.2,
                    }}
                  />
                  <span>{hasLiked ? "Curtido" : "Curtir"}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      background: hasLiked ? "rgba(255,255,255,0.25)" : "rgba(225,29,72,0.12)",
                      padding: "2px 7px",
                      borderRadius: 99,
                    }}
                  >
                    {likeCount}
                  </span>
                </button>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 99,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <Heart style={{ width: 14, height: 14, color: "#f43f5e", fill: "#f43f5e" }} />
                  <span>{likeCount} curtidas recebidas</span>
                </div>
              )}
            </div>
          </div>

          {/* Nome & Turma */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
              <h2
                style={{
                  fontWeight: 900,
                  fontSize: 19,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.3px",
                }}
              >
                {colega.nome_completo}
              </h2>
              {isMe && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#7c3aed",
                    background: "#ede9fe",
                    padding: "2px 8px",
                    borderRadius: 99,
                  }}
                >
                  Você
                </span>
              )}
            </div>

            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 6px", fontWeight: 500 }}>
              {colega.turma_ou_cargo || "Estudante Pesquisador(a) · CEEP Seabra"}
            </p>

            {/* Rótulo de Papel */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isStaffPapel(colega.papel) ? "#d97706" : "#2563eb",
                  background: isStaffPapel(colega.papel) ? "#fffbeb" : "#eff6ff",
                  border: `1px solid ${isStaffPapel(colega.papel) ? "#fde68a" : "#bfdbfe"}`,
                  padding: "3px 10px",
                  borderRadius: 99,
                }}
              >
                {isStaffPapel(colega.papel) ? "🎓 Orientador / Docente" : "🔬 Pesquisador de Campo"}
              </span>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: nivel.color,
                  background: nivel.bg,
                  border: `1px solid ${nivel.border}`,
                  padding: "3px 10px",
                  borderRadius: 99,
                }}
              >
                {nivel.icon} Nível {nivel.nome}
              </span>
            </div>

            {colega.bio && (
              <p
                style={{
                  fontSize: 13,
                  color: "#334155",
                  lineHeight: 1.55,
                  background: "#f8fafc",
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid #f1f5f9",
                  margin: "0 0 16px",
                  fontStyle: "italic",
                }}
              >
                "{colega.bio}"
              </p>
            )}
          </div>

          {/* Barra de Progresso de XP */}
          <div
            style={{
              background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
              borderRadius: 18,
              padding: "12px 14px",
              border: "1px solid #e2e8f0",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, color: "#475569" }}>
                XP Acumulado na Temporada
              </span>
              <span style={{ fontSize: 13, fontWeight: 900, color: nivel.color }}>
                {xp.toLocaleString()} XP
              </span>
            </div>
            <div
              style={{
                height: 7,
                background: "#e2e8f0",
                borderRadius: 99,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`,
                  borderRadius: 99,
                  transition: "width 0.8s ease",
                }}
              />
            </div>
            {nextNivel && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "#94a3b8",
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                <span>{nivel.nome}</span>
                <span>Faltam {(nextNivel.minXP - xp).toLocaleString()} XP para {nextNivel.nome}</span>
              </div>
            )}
          </div>

          {/* 4 Cards de Estatísticas Oficiais */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {[
              { label: "Fichas", value: fichas, icon: "📋", color: "#7c3aed", xpLabel: "+100 XP cada" },
              { label: "Posts", value: posts, icon: "📰", color: "#10b981", xpLabel: "+20 XP cada" },
              { label: "Msgs", value: msgs, icon: "💬", color: "#3b82f6", xpLabel: "+5 XP cada" },
              { label: "Likes", value: likeCount, icon: "❤️", color: "#f43f5e", xpLabel: "+10 XP cada" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "#f8fafc",
                  borderRadius: 14,
                  padding: "10px 4px",
                  textAlign: "center",
                  border: "1px solid #f1f5f9",
                  transition: "transform 0.15s",
                }}
              >
                <div style={{ fontSize: 15, marginBottom: 2 }}>{stat.icon}</div>
                <div style={{ fontWeight: 900, fontSize: 17, color: stat.color, lineHeight: 1.1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginTop: 3 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Insígnias & Conquistas */}
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#334155",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <Trophy style={{ width: 14, height: 14, color: "#f59e0b" }} />
                Insígnias Conquistadas ({badges.length})
              </h3>
            </div>

            {badges.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 4,
                  scrollbarWidth: "none",
                }}
              >
                {badges.map((b) => (
                  <div
                    key={b.id}
                    title={`${b.name}: ${b.description}`}
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 12,
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{b.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#92400e" }}>
                      {b.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px dashed #e2e8f0",
                  fontSize: 11,
                  color: "#94a3b8",
                  textAlign: "center",
                }}
              >
                Colega trilhando suas primeiras conquistas científicas!
              </div>
            )}
          </div>

          {/* Botão de Ação: Conversar no Lyka */}
          {!isMe && (
            <button
              type="button"
              onClick={handleStartChat}
              style={{
                width: "100%",
                padding: "12px 18px",
                borderRadius: 16,
                border: "none",
                background: "linear-gradient(135deg, #0284c7, #2563eb)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 6px 20px rgba(37,99,235,0.25)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.25)";
              }}
            >
              <MessageCircle style={{ width: 17, height: 17 }} />
              <span>Conversar no Lyka Chat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
