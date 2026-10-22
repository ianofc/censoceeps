import React, { useState } from 'react';
import {
  tasStudentPulseService,
  StudentPoll,
  STUDENT_POLLS_CATALOG
} from '../../services/tasStudentPulseService';
import {
  ChevronLeft, ChevronRight, MessageSquarePlus,
  Sparkles, CheckCircle2, TrendingUp, Send, HeartHandshake
} from 'lucide-react';

interface StudentPulseCardProps {
  userName?: string;
  userRole?: string;
  userTurma?: string;
  onOpinionSubmitted?: () => void;
}

export const StudentPulseCard: React.FC<StudentPulseCardProps> = ({
  userName = "Estudante",
  userRole = "aluno",
  userTurma = "CEEP Seabra",
  onOpinionSubmitted
}) => {
  const polls = STUDENT_POLLS_CATALOG;
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const [showOpinionBox, setShowOpinionBox] = useState(false);
  const [opinionText, setOpinionText] = useState("");
  const [sentiment, setSentiment] = useState<'positivo' | 'critico' | 'propositivo'>('propositivo');
  const [opinionSent, setOpinionSent] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const activePoll: StudentPoll = polls[currentPollIndex] || polls[0];
  const stats = tasStudentPulseService.getPollStats(activePoll.id);
  const userVotes = tasStudentPulseService.getUserVotes();
  const hasVoted = Boolean(userVotes[activePoll.id]);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;
    tasStudentPulseService.registerVote(activePoll.id, optionId);
    setPulseKey(k => k + 1);
    if (onOpinionSubmitted) onOpinionSubmitted();
  };

  const handlePrev = () => {
    setCurrentPollIndex(prev => (prev > 0 ? prev - 1 : polls.length - 1));
    setShowOpinionBox(false);
    setOpinionSent(false);
  };

  const handleNext = () => {
    setCurrentPollIndex(prev => (prev < polls.length - 1 ? prev + 1 : 0));
    setShowOpinionBox(false);
    setOpinionSent(false);
  };

  const handleSubmitOpinion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opinionText.trim()) return;

    tasStudentPulseService.submitOpenOpinion({
      pollId: activePoll.id,
      userName,
      userRole,
      userTurma,
      selectedOptionId: userVotes[activePoll.id] || "livre",
      opinionText: opinionText.trim(),
      sentiment
    });

    setOpinionText("");
    setOpinionSent(true);
    setTimeout(() => {
      setShowOpinionBox(false);
      setOpinionSent(false);
    }, 2200);

    if (onOpinionSubmitted) onOpinionSubmitted();
  };

  const recentOpinions = tasStudentPulseService.getRecentOpinions().slice(0, 2);

  return (
    <div style={{
      background: "linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)",
      borderRadius: 24,
      border: "1.5px solid #e0e7ff",
      padding: "20px 22px",
      boxShadow: "0 8px 28px rgba(99, 102, 241, 0.08)",
      position: "relative",
      overflow: "hidden",
      marginBottom: 18,
    }} key={pulseKey}>
      {/* Decorative gradient top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: "linear-gradient(90deg, #4f46e5, #06b6d4, #ec4899)"
      }} />

      {/* Header with Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)"
          }}>
            <Sparkles style={{ width: 20, height: 20, color: "#fff" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#1e1b4b" }}>
                Radar de Pulso Estudantil
              </h3>
              <span style={{
                fontSize: 10, fontWeight: 800, background: "#ede9fe", color: "#6366f1",
                padding: "2px 8px", borderRadius: 99
              }}>
                TAS Algoritmo Ativo
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
              {activePoll.badge} · Pergunta {currentPollIndex + 1} de {polls.length}
            </span>
          </div>
        </div>

        {/* Carousel arrows */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            onClick={handlePrev}
            title="Enquete anterior"
            style={{
              width: 32, height: 32, borderRadius: 10, border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#64748b"
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            title="Próxima enquete"
            style={{
              width: 32, height: 32, borderRadius: 10, border: "1px solid #e2e8f0",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#64748b"
            }}
          >
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* Question */}
      <h4 style={{
        fontSize: 14, fontWeight: 800, color: "#1e293b", margin: "0 0 4px", lineHeight: 1.5
      }}>
        {activePoll.question}
      </h4>
      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px", lineHeight: 1.4 }}>
        {activePoll.description}
      </p>

      {/* Options List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {stats.options.map((opt) => {
          const isSelected = opt.isUserPick;
          const showBar = hasVoted;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={hasVoted}
              onClick={() => handleVote(opt.id)}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 14,
                border: isSelected ? "2px solid #6366f1" : "1.5px solid #f1f5f9",
                background: isSelected ? "#f5f3ff" : "#f8fafc",
                cursor: hasVoted ? "default" : "pointer",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                fontFamily: "inherit",
              }}
              onMouseEnter={(el) => {
                if (!hasVoted) el.currentTarget.style.borderColor = "#c7d2fe";
              }}
              onMouseLeave={(el) => {
                if (!hasVoted) el.currentTarget.style.borderColor = "#f1f5f9";
              }}
            >
              {showBar && (
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${opt.percentage}%`,
                  background: isSelected ? "rgba(99, 102, 241, 0.18)" : "rgba(226, 232, 240, 0.65)",
                  transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                  zIndex: 0
                }} />
              )}
              <div style={{
                position: "relative", zIndex: 1,
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{opt.icon || "📌"}</span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? "#4338ca" : "#334155"
                  }}>
                    {opt.text}
                  </span>
                </div>
                {showBar && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isSelected && <CheckCircle2 style={{ width: 14, height: 14, color: "#6366f1" }} />}
                    <span style={{
                      fontSize: 12, fontWeight: 900,
                      color: isSelected ? "#4338ca" : "#64748b"
                    }}>
                      {opt.percentage}%
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer & Action Bar */}
      <div style={{
        marginTop: 14, paddingTop: 12, borderTop: "1px solid #f1f5f9",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b", fontWeight: 700 }}>
          <TrendingUp style={{ width: 13, height: 13, color: "#10b981" }} />
          <span>{stats.totalVotes} votos de estudantes computados</span>
        </div>

        <button
          type="button"
          onClick={() => setShowOpinionBox(v => !v)}
          style={{
            background: showOpinionBox ? "#eff6ff" : "transparent",
            border: "1px solid #dbeafe",
            borderRadius: 10,
            padding: "5px 12px",
            fontSize: 11,
            fontWeight: 800,
            color: "#2563eb",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "inherit",
            transition: "all 0.15s ease"
          }}
        >
          <MessageSquarePlus style={{ width: 13, height: 13 }} />
          {showOpinionBox ? "Fechar Opinião" : "Expressar Opinião Rápida"}
        </button>
      </div>

      {/* Opinion Drawer */}
      {showOpinionBox && (
        <form onSubmit={handleSubmitOpinion} style={{
          marginTop: 14, padding: "14px 16px", background: "#f8fafc",
          borderRadius: 16, border: "1.5px solid #e2e8f0"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#1e293b" }}>
              💡 Sua Voz no Censo CEEP
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { id: "propositivo", label: "💡 Ideia" },
                { id: "positivo", label: "👏 Elogio" },
                { id: "critico", label: "⚠️ Melhoria" },
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSentiment(item.id as any)}
                  style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8,
                    border: sentiment === item.id ? "1.5px solid #6366f1" : "1px solid #cbd5e1",
                    background: sentiment === item.id ? "#ede9fe" : "#fff",
                    color: sentiment === item.id ? "#4f46e5" : "#64748b",
                    cursor: "pointer"
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={opinionText}
            onChange={(e) => setOpinionText(e.target.value)}
            placeholder="Escreva sua opinião ou sugestão construtiva para melhorar o colégio..."
            rows={2}
            style={{
              width: "100%", borderRadius: 10, border: "1px solid #cbd5e1",
              padding: "8px 10px", fontSize: 12, fontFamily: "inherit",
              resize: "none", boxSizing: "border-box", outline: "none",
              background: "#fff"
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 10, color: "#94a3b8" }}>
              Sua resposta calibra o feed e recomendações da sua turma.
            </span>
            <button
              type="submit"
              disabled={!opinionText.trim()}
              style={{
                background: opinionText.trim() ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "#cbd5e1",
                color: "#fff", border: "none", borderRadius: 8,
                padding: "6px 14px", fontSize: 11, fontWeight: 800,
                cursor: opinionText.trim() ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", gap: 5,
                fontFamily: "inherit"
              }}
            >
              <Send style={{ width: 11, height: 11 }} />
              Enviar
            </button>
          </div>

          {opinionSent && (
            <div style={{
              marginTop: 8, padding: "6px 10px", borderRadius: 8,
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              color: "#166534", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6
            }}>
              <HeartHandshake style={{ width: 14, height: 14 }} />
              Opinião registrada com sucesso! Seu Algoritmo TAS foi calibrado.
            </div>
          )}
        </form>
      )}

      {/* Recent Voices from CEEP */}
      {recentOpinions.length > 0 && !showOpinionBox && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {recentOpinions.map((op) => (
            <div key={op.id} style={{
              padding: "6px 10px", borderRadius: 10, background: "#f8fafc",
              border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8
            }}>
              <span style={{ fontSize: 12 }}>💬</span>
              <span style={{ fontSize: 11, color: "#475569", fontStyle: "italic", flex: 1 }}>
                "{op.opinionText}"
              </span>
              <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700 }}>
                {op.userTurma || "CEEP"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
