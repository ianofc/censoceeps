import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useUserSession } from '../hooks/useUserSession';
import { Users, Search, MessageCircle, ChevronRight, GraduationCap, Shield, User2 } from 'lucide-react';

interface Membro {
  id: string;
  nome_completo: string;
  turma_ou_cargo: string;
  papel: 'gestor' | 'entrevistador_aluno' | 'entrevistado';
  genero: string;
  avatar_url: string;
}

const GRADIENTS: [string, string][] = [
  ['#3B82F6', '#6366F1'],
  ['#EC4899', '#F43F5E'],
  ['#10B981', '#14B8A6'],
  ['#F59E0B', '#F97316'],
  ['#8B5CF6', '#A855F7'],
  ['#06B6D4', '#0EA5E9'],
  ['#EF4444', '#F97316'],
  ['#22C55E', '#16A34A'],
];

function getGradient(name: string): [string, string] {
  const idx = (name || '?').charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function getInitials(name: string) {
  return (name || '?')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function papelInfo(papel: string) {
  if (papel === 'gestor') return { label: 'Gestor', icon: <Shield style={{ width: 11, height: 11 }} />, color: '#F59E0B' };
  if (papel === 'entrevistador_aluno') return { label: 'Pesquisador', icon: <GraduationCap style={{ width: 11, height: 11 }} />, color: '#3B82F6' };
  return { label: 'Entrevistado', icon: <User2 style={{ width: 11, height: 11 }} />, color: '#10B981' };
}

function MemberAvatar({ member, size = 56 }: { member: Membro; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const [colors] = useState<[string, string]>(() => getGradient(member.nome_completo));

  if (member.avatar_url && !imgError) {
    return (
      <img
        src={member.avatar_url}
        alt={member.nome_completo}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }}
      />
    );
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontWeight: 900,
        fontSize: Math.round(size * 0.35), color: '#fff',
        letterSpacing: '-0.5px', userSelect: 'none',
      }}
    >
      {getInitials(member.nome_completo)}
    </div>
  );
}

interface MemberCardProps {
  membro: Membro;
  isMe: boolean;
  onChat: () => void;
}

function MemberCard({ membro, isMe, onChat }: MemberCardProps) {
  const [hovered, setHovered] = useState(false);
  const papel = papelInfo(membro.papel);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 20,
        border: isMe ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
        padding: '18px 18px 14px',
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'all 0.25s ease',
        boxShadow: hovered
          ? '0 16px 40px rgba(99,102,241,0.18)'
          : isMe
          ? '0 4px 20px rgba(99,102,241,0.1)'
          : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        position: 'relative',
      }}
    >
      {isMe && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px',
          borderRadius: 99, letterSpacing: '0.5px', textTransform: 'uppercase',
        }}>
          Você
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <MemberAvatar member={membro} size={56} />
          <div style={{
            position: 'absolute', bottom: 1, right: 1,
            width: 12, height: 12, borderRadius: '50%',
            background: '#10b981', border: '2px solid #fff',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 800, fontSize: 15, color: '#0f172a', margin: '0 0 3px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            paddingRight: isMe ? 40 : 0,
          }}>
            {membro.nome_completo}
          </p>
          <p style={{
            fontSize: 12, color: '#64748b', margin: '0 0 7px', fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {membro.turma_ou_cargo || 'CEEP Seabra'}
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700, color: papel.color,
            background: `${papel.color}1A`, padding: '3px 10px',
            borderRadius: 99, border: `1px solid ${papel.color}33`,
          }}>
            {papel.icon}
            {papel.label}
          </span>
        </div>
      </div>

      {!isMe ? (
        <button
          type="button"
          onClick={onChat}
          style={{
            width: '100%', padding: '11px 0',
            background: hovered
              ? 'linear-gradient(135deg, #4338ca, #7c3aed)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', border: 'none', borderRadius: 14,
            fontWeight: 800, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', fontFamily: 'inherit',
            boxShadow: hovered ? '0 6px 20px rgba(99,102,241,0.4)' : '0 2px 10px rgba(99,102,241,0.25)',
            transform: hovered ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          <MessageCircle style={{ width: 15, height: 15 }} />
          Abrir Conversa Privada
          <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      ) : (
        <div style={{
          width: '100%', padding: '11px 0', textAlign: 'center',
          background: 'linear-gradient(135deg, #f1f5f9, #e0e7ff)',
          borderRadius: 14, fontSize: 13, fontWeight: 700, color: '#6366f1',
        }}>
          Seu perfil
        </div>
      )}
    </div>
  );
}

export function Membros() {
  const navigate = useNavigate();
  const { profile } = useUserSession();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'gestor' | 'entrevistador_aluno' | 'entrevistado'>('todos');

  useEffect(() => {
    async function fetchMembros() {
      const { data } = await supabase
        .from('pessoas')
        .select('id, nome_completo, turma_ou_cargo, papel, genero, avatar_url')
        .order('nome_completo', { ascending: true });
      if (data) setMembros(data as Membro[]);
      setLoading(false);
    }
    void fetchMembros();
  }, []);

  const handleOpenDM = (membro: Membro) => {
    navigate(`/chat?dm=${membro.id}&dmName=${encodeURIComponent(membro.nome_completo)}`);
  };

  const filtered = membros.filter((m) => {
    const matchSearch =
      m.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      (m.turma_ou_cargo || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'todos' || m.papel === filter;
    return matchSearch && matchFilter;
  });

  const eu = filtered.find((m) => m.id === profile.id);
  const outros = filtered.filter((m) => m.id !== profile.id);
  const ordenados = eu ? [eu, ...outros] : outros;

  const filterBtns: { key: typeof filter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'gestor', label: 'Gestores' },
    { key: 'entrevistador_aluno', label: 'Pesquisadores' },
    { key: 'entrevistado', label: 'Entrevistados' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: '0 0 80px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::placeholder { color: rgba(255,255,255,0.5) !important; }
        .members-search:focus { outline: none; border-color: rgba(255,255,255,0.5) !important; }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderRadius: 28, padding: '28px 28px 22px', marginBottom: 24,
        boxShadow: '0 20px 60px rgba(67,56,202,0.3)', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(139,92,246,0.12)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: '25%', width: 250, height: 250,
          borderRadius: '50%', background: 'rgba(99,102,241,0.08)', pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, position: 'relative' }}>
          <div style={{
            width: 52, height: 52, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid rgba(255,255,255,0.25)', flexShrink: 0,
          }}>
            <Users style={{ width: 24, height: 24, color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: 0, letterSpacing: '-0.5px' }}>
              Membros
            </h1>
            <p style={{ color: '#c7d2fe', fontSize: 13, margin: 0, fontWeight: 500 }}>
              {loading ? 'Carregando...' : `${membros.length} pessoa${membros.length !== 1 ? 's' : ''} · CEEP Seabra`}
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Search style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            width: 16, height: 16, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            className="members-search"
            placeholder="Buscar por nome ou turma..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: 42, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 16,
              color: '#fff', fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {filterBtns.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setFilter(btn.key)}
              style={{
                padding: '6px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                border: filter === btn.key ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                background: filter === btn.key ? '#fff' : 'rgba(255,255,255,0.1)',
                color: filter === btn.key ? '#312e81' : 'rgba(255,255,255,0.8)',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
          <div style={{
            width: 44, height: 44, border: '3px solid #e0e7ff',
            borderTopColor: '#4338ca', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 14 }}>Carregando membros...</span>
        </div>
      ) : ordenados.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 24, padding: '60px 40px', textAlign: 'center',
          border: '1px solid #e2e8f0',
        }}>
          <Users style={{ width: 48, height: 48, color: '#c7d2fe', margin: '0 auto 16px', display: 'block' }} />
          <p style={{ fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>Nenhum membro encontrado</p>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Tente outro termo de busca</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
        }}>
          {ordenados.map((m) => (
            <MemberCard
              key={m.id}
              membro={m}
              isMe={m.id === profile.id}
              onChat={() => handleOpenDM(m)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Membros;
