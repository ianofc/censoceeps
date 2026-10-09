import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Save, Edit3, X, ShieldCheck, Mail, Phone, MapPin,
  Briefcase, BookOpen, Star, Award, GraduationCap,
  CheckCircle, UserCircle, Calendar, Hash, Trophy, Target
} from "lucide-react";
import BadgeList from "../components/Gamification/BadgeList";

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
  if (papel === "gestor") return { label: "Gestor", color: "#F59E0B", bg: "#FEF3C7", border: "#FDE68A" };
  if (papel === "entrevistador_aluno") return { label: "Pesquisador", color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" };
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

export const MeuPerfil: React.FC<MeuPerfilProps> = ({ escolaNome }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const [totalFichas, setTotalFichas] = useState(0);
  const [xpStats, setXpStats] = useState({ posts: 0, msgs: 0, likes: 0 });
  const memberSince = new Date().getFullYear();

  const [perfil, setPerfil] = useState({
    id: "", nome: "", email: "", papel: "entrevistador_aluno",
    turma_ou_cargo: "", telefone: "", cep: "", cidade: "Palmeiras",
    estado: "BA", endereco: "", numero: "", bairro: "Mandacaru",
    bio: "", avatar_url: "", genero: "masculino",
  });
  const [editPerfil, setEditPerfil] = useState({ ...perfil });

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const userId = session.user.id;
        const userEmail = session.user.email || "";

        const [{ data: pessoaData }, { count: censoCount }, { count: entrevistasCount }, { count: pC }, { count: mC }, { count: lC }] = await Promise.all([
          supabase.from("pessoas").select("*").eq("id", userId).single(),
          supabase.from("censo_ceep").select("*", { count: "exact", head: true }).eq("pesquisador_id", userId),
          supabase.from("entrevistas").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("lyka_posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
          supabase.from("lyka_messages").select("*", { count: "exact", head: true }).eq("sender_id", userId),
          supabase.from("pessoa_likes").select("*", { count: "exact", head: true }).eq("liked_id", userId),
        ]);

        const totalFichasContadas = Math.max(censoCount || 0, entrevistasCount || 0);
        setTotalFichas(totalFichasContadas);
        setXpStats({ posts: pC || 0, msgs: mC || 0, likes: lC || 0 });

        const nomeCompleto = pessoaData?.nome_completo || session.user.user_metadata?.nome_completo || "Usuário Censo";
        const papelUsuario = pessoaData?.papel || "entrevistador_aluno";
        const turmaCargo = pessoaData?.turma_ou_cargo || "";
        const genero = pessoaData?.genero || "masculino";

        const avatarPadrao = genero === "feminino"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80";

        const p = {
          id: userId, nome: nomeCompleto, email: userEmail, papel: papelUsuario,
          turma_ou_cargo: turmaCargo, telefone: pessoaData?.telefone || "",
          cep: pessoaData?.cep || "", cidade: pessoaData?.cidade || "Palmeiras",
          estado: pessoaData?.estado || "BA", endereco: pessoaData?.endereco || "",
          numero: pessoaData?.numero || "", bairro: pessoaData?.bairro || "Mandacaru",
          bio: pessoaData?.bio || "", avatar_url: pessoaData?.avatar_url || avatarPadrao,
          genero,
        };
        setPerfil(p);
        setEditPerfil(p);
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
      const { error } = await supabase.from("pessoas").update({
        nome_completo: editPerfil.nome,
        turma_ou_cargo: editPerfil.turma_ou_cargo,
        bio: editPerfil.bio,
        avatar_url: editPerfil.avatar_url,
        telefone: editPerfil.telefone,
      }).eq("id", perfil.id);
      if (error) throw error;
      setPerfil({ ...editPerfil });
      setImgErr(false);
      setIsEditing(false);
      setSaved(true);
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
    setIsEditing(false);
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
  const showAvatar = perfil.avatar_url && !imgErr;

  // Cover gradient based on user
  const coverIdx = perfil.nome.charCodeAt(0) % 5;
  const covers = [
    "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #7c3aed 100%)",
    "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #2563eb 100%)",
    "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #10b981 100%)",
    "linear-gradient(135deg, #1a0533 0%, #4c1d95 40%, #8b5cf6 100%)",
    "linear-gradient(135deg, #1e1b4b 0%, #4338ca 40%, #6366f1 100%)",
  ];

  return (
    <div style={{ width: "100%", maxWidth: 680, margin: "0 auto", paddingBottom: 80, fontFamily: "inherit" }}>
      <style>{`
        @keyframes perfilSpin { to { transform: rotate(360deg); } }
        @keyframes perfilPop { from { opacity:0; transform: scale(0.95) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }
        @keyframes savedPulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
      `}</style>

      {/* ── CARD PRINCIPAL ─────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 28, overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
        animation: "perfilPop 0.4s ease",
        border: "1px solid rgba(0,0,0,0.06)",
      }}>

        {/* Cover */}
        <div style={{
          height: 160, background: covers[coverIdx], position: "relative",
          overflow: "hidden",
        }}>
          {/* decorative orbs */}
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
          <div style={{ position:"absolute", bottom:-60, left:"20%", width:240, height:240, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
          <div style={{ position:"absolute", top:16, right:16 }}>
            <button type="button" onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 16px", borderRadius:99,
                background: isEditing ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.15)",
                border: isEditing ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.3)",
                color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                backdropFilter:"blur(8px)", transition:"all 0.2s",
              }}
            >
              {isEditing ? <X style={{width:13,height:13}}/> : <Edit3 style={{width:13,height:13}}/>}
              {isEditing ? "Cancelar" : "Editar perfil"}
            </button>
          </div>
        </div>

        {/* Avatar + top info */}
        <div style={{ padding: "0 28px 24px", position: "relative" }}>
          {/* Avatar */}
          <div style={{ position:"relative", display:"inline-block", marginTop:-56 }}>
            <div style={{
              width:104, height:104, borderRadius:"50%",
              border:"4px solid #fff",
              background:`linear-gradient(135deg,${g1},${g2})`,
              overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {showAvatar ? (
                <img src={perfil.avatar_url} alt={perfil.nome} onError={()=>setImgErr(true)}
                  style={{width:"100%",height:"100%",objectFit:"cover"}} />
              ) : (
                <span style={{fontWeight:900,fontSize:36,color:"#fff",letterSpacing:"-1px"}}>
                  {getInitials(perfil.nome)}
                </span>
              )}
            </div>
            {/* online dot */}
            <div style={{
              position:"absolute", bottom:6, right:6,
              width:18, height:18, borderRadius:"50%",
              background:"#10b981", border:"3px solid #fff",
              boxShadow:"0 2px 6px rgba(16,185,129,0.4)",
            }} />
          </div>

          {/* name + badge */}
          <div style={{ marginTop: 12, marginBottom: 16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <h1 style={{ fontWeight:900, fontSize:22, color:"#0f172a", margin:0, letterSpacing:"-0.5px" }}>
                {perfil.nome}
              </h1>
              <span style={{
                padding:"3px 12px", borderRadius:99, fontSize:11, fontWeight:800,
                color: badge.color, background: badge.bg, border:`1px solid ${badge.border}`,
                letterSpacing:"0.3px",
              }}>
                {badge.label}
              </span>
              {totalFichas >= 20 && (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('abrir-celebracao-meta-20', { detail: { count: totalFichas } }))}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 14px",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#92400e",
                    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                    border: "1.5px solid #f59e0b",
                    boxShadow: "0 2px 8px rgba(245,158,11,0.25)",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}
                  title="Clique para ver o troféu e certificado da Adinha Campeã"
                >
                  🏆 Top Entrevistador • Meta 20 (Adinha Campeã) ✨
                </button>
              )}
              {saved && (
                <span style={{
                  display:"flex", alignItems:"center", gap:4,
                  padding:"3px 12px", borderRadius:99, fontSize:11, fontWeight:700,
                  color:"#10b981", background:"#ecfdf5", border:"1px solid #a7f3d0",
                  animation:"savedPulse 1s ease infinite",
                }}>
                  <CheckCircle style={{width:11,height:11}}/> Salvo!
                </span>
              )}
            </div>
            <p style={{ color:"#64748b", fontSize:14, margin:"4px 0 0", fontWeight:500 }}>
              {perfil.turma_ou_cargo || "CEEP Seabra"} · {escolaNome}
            </p>
            {perfil.bio && (
              <p style={{ color:"#475569", fontSize:14, margin:"10px 0 0", lineHeight:1.6, maxWidth:480 }}>
                {perfil.bio}
              </p>
            )}
          </div>

          {/* Stats bar */}
          <div style={{
            display:"flex", border:"1px solid #f1f5f9",
            borderRadius:18, overflow:"hidden", background:"#fafafa",
          }}>
            <StatCard value={totalFichas} label="Fichas coletadas" icon={<BookOpen style={{width:16,height:16}}/>} />
            <div style={{width:1, background:"#f1f5f9"}}/>
            <StatCard value={memberSince} label="Membro desde" icon={<Calendar style={{width:16,height:16}}/>} />
            <div style={{width:1, background:"#f1f5f9"}}/>
            <StatCard value="CEEP" label="Escola" icon={<GraduationCap style={{width:16,height:16}}/>} />
            <div style={{width:1, background:"#f1f5f9"}}/>
            <StatCard value="BA" label="Estado" icon={<MapPin style={{width:16,height:16}}/>} />
          </div>
        </div>
      </div>

      {/* ── TAS / ACCUMBENS: GAMIFICATION DASHBOARD ──────────────────────── */}
      {(() => {
        const totalXP = (totalFichas * 100) + (xpStats.posts * 20) + (xpStats.msgs * 5) + (xpStats.likes * 10);
        const nivel = getNivel(totalXP);
        const nextNivel = getNextNivel(totalXP);
        const progress = nextNivel ? Math.round(((totalXP - nivel.minXP) / (nextNivel.minXP - nivel.minXP)) * 100) : 100;
        
        return (
          <div style={{
            marginTop: 20, background: "#fff", borderRadius: 28, padding: 24,
            boxShadow: "0 8px 40px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)",
            animation: "perfilPop 0.5s ease"
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
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Fichas (x100 XP)</div>
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

      {/* ── MODO EDIÇÃO ──────────────────────────────────────────────────── */}
      {isEditing && (
        <form onSubmit={handleSave}
          style={{
            background:"#fff", borderRadius:24, padding:28,
            marginTop:16, boxShadow:"0 4px 24px rgba(0,0,0,0.07)",
            border:"1px solid #e2e8f0", animation:"perfilPop 0.3s ease",
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24, paddingBottom:16, borderBottom:"1px solid #f1f5f9" }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#4338ca)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Edit3 style={{width:16,height:16,color:"#fff"}}/>
            </div>
            <div>
              <p style={{fontWeight:800,fontSize:15,color:"#0f172a",margin:0}}>Editar Perfil</p>
              <p style={{fontSize:12,color:"#94a3b8",margin:0}}>Suas informações públicas no Censo</p>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={{gridColumn:"1/-1"}}>
              <Field id="edit-nome" label="Nome Completo" value={editPerfil.nome}
                onChange={v=>setEditPerfil(p=>({...p,nome:v}))} />
            </div>
            <Field id="edit-turma" label="Turma / Cargo" value={editPerfil.turma_ou_cargo}
              onChange={v=>setEditPerfil(p=>({...p,turma_ou_cargo:v}))} />
            <Field id="edit-tel" label="Telefone" value={editPerfil.telefone}
              onChange={v=>setEditPerfil(p=>({...p,telefone:v}))} placeholder="(75) 99999-9999" />
            <div style={{gridColumn:"1/-1"}}>
              <Field id="edit-bio" label="Bio" value={editPerfil.bio}
                onChange={v=>setEditPerfil(p=>({...p,bio:v}))} multiline
                placeholder="Conte um pouco sobre você..." />
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <Field id="edit-avatar" label="URL da foto de perfil" value={editPerfil.avatar_url}
                onChange={v=>setEditPerfil(p=>({...p,avatar_url:v}))}
                placeholder="https://..." />
              {editPerfil.avatar_url && (
                <div style={{marginTop:8,display:"flex",alignItems:"center",gap:10}}>
                  <img src={editPerfil.avatar_url} alt="preview" onError={e=>{(e.target as HTMLImageElement).style.display="none";}}
                    style={{width:48,height:48,borderRadius:12,objectFit:"cover",border:"2px solid #e2e8f0"}} />
                  <span style={{fontSize:12,color:"#94a3b8",fontWeight:500}}>Prévia da foto</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:24, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
            <button type="button" onClick={handleCancel}
              style={{
                padding:"10px 20px", borderRadius:12, border:"1.5px solid #e2e8f0",
                background:"#fff", color:"#64748b", fontWeight:700, fontSize:13,
                cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
              }}
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              style={{
                padding:"10px 24px", borderRadius:12, border:"none",
                background: saving ? "rgba(124,58,237,0.5)" : "linear-gradient(135deg,#7c3aed,#4338ca)",
                color:"#fff", fontWeight:800, fontSize:13,
                cursor: saving ? "not-allowed" : "pointer", fontFamily:"inherit",
                display:"flex", alignItems:"center", gap:8,
                boxShadow:"0 4px 14px rgba(124,58,237,0.35)", transition:"all 0.2s",
              }}
            >
              <Save style={{width:14,height:14}}/>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      )}

      {/* ── INFORMAÇÕES ──────────────────────────────────────────────────── */}
      {!isEditing && (
        <div style={{ marginTop:16, display:"grid", gap:14 }}>

          {/* Credenciais */}
          <div style={{
            background:"#fff", borderRadius:24, padding:24,
            boxShadow:"0 2px 12px rgba(0,0,0,0.05)", border:"1px solid #f1f5f9",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, paddingBottom:12, borderBottom:"1px solid #f8fafc" }}>
              <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#ede9fe,#ddd6fe)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <UserCircle style={{width:15,height:15,color:"#7c3aed"}}/>
              </div>
              <span style={{fontWeight:800,fontSize:13,color:"#0f172a"}}>Informações de Contato</span>
            </div>
            <InfoRow icon={<Mail style={{width:16,height:16}}/>} label="E-mail" value={perfil.email} />
            <InfoRow icon={<Phone style={{width:16,height:16}}/>} label="Telefone" value={perfil.telefone} />
            <InfoRow icon={<Briefcase style={{width:16,height:16}}/>} label="Turma / Cargo" value={perfil.turma_ou_cargo} />
          </div>

          {/* Localização */}
          {(perfil.cidade || perfil.bairro) && (
            <div style={{
              background:"#fff", borderRadius:24, padding:24,
              boxShadow:"0 2px 12px rgba(0,0,0,0.05)", border:"1px solid #f1f5f9",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, paddingBottom:12, borderBottom:"1px solid #f8fafc" }}>
                <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <MapPin style={{width:15,height:15,color:"#059669"}}/>
                </div>
                <span style={{fontWeight:800,fontSize:13,color:"#0f172a"}}>Localização</span>
              </div>
              <InfoRow icon={<MapPin style={{width:16,height:16}}/>} label="Cidade" value={`${perfil.cidade} — ${perfil.estado}`} />
              {perfil.bairro && <InfoRow icon={<Hash style={{width:16,height:16}}/>} label="Bairro" value={perfil.bairro} />}
              {perfil.endereco && <InfoRow icon={<MapPin style={{width:16,height:16}}/>} label="Endereço" value={`${perfil.endereco}${perfil.numero ? ", nº "+perfil.numero : ""}`} />}
            </div>
          )}

          {/* Status */}
          <div style={{
            background:"linear-gradient(135deg,#0f172a,#1e1b4b)",
            borderRadius:24, padding:24,
            boxShadow:"0 8px 32px rgba(15,14,23,0.25)",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{
                  width:52,height:52,borderRadius:16,
                  background:"linear-gradient(135deg,#7c3aed,#4338ca)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  boxShadow:"0 6px 20px rgba(124,58,237,0.4)",
                }}>
                  <Award style={{width:24,height:24,color:"#fff"}}/>
                </div>
                <div>
                  <p style={{color:"#fff",fontWeight:900,fontSize:16,margin:0}}>Membro Ativo</p>
                  <p style={{color:"rgba(199,210,254,0.7)",fontSize:12,margin:"2px 0 0",fontWeight:500}}>
                    Censo CEEP · Projeto Ada Lovelace · {escolaNome}
                  </p>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{
                  display:"flex",alignItems:"center",gap:6,
                  background:"rgba(16,185,129,0.15)",padding:"6px 14px",
                  borderRadius:99,border:"1px solid rgba(16,185,129,0.3)",
                }}>
                  <ShieldCheck style={{width:14,height:14,color:"#34d399"}}/>
                  <span style={{color:"#34d399",fontWeight:700,fontSize:12}}>Verificado</span>
                </div>
                <div style={{
                  display:"flex",alignItems:"center",gap:6,
                  background:"rgba(124,58,237,0.2)",padding:"6px 14px",
                  borderRadius:99,border:"1px solid rgba(124,58,237,0.3)",
                }}>
                  <Star style={{width:14,height:14,color:"#a78bfa"}}/>
                  <span style={{color:"#a78bfa",fontWeight:700,fontSize:12}}>
                    {totalFichas} fichas
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default MeuPerfil;
