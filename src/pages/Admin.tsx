import { useState, useEffect, useMemo } from "react";
import { Turma } from "@/data/turmas";
import { supabase } from "@/lib/supabase";
import { 
  ShieldCheck, FileText, Filter, Search, Calendar, Eye, EyeOff, 
  Lock, Trash2, Printer, BarChart3, CheckCircle2, User, 
  Maximize, ActivitySquare, ChevronLeft, ChevronRight, 
  Download, Trophy, Flame, Users, Landmark, 
  Image as ImageIcon, Contact, Database, UserCheck, LogOut, Menu, X
} from "lucide-react";

import ManageTurmas from "./ManageTurmas";
import ManageAdmins from "./ManageAdmins";
import MeuPerfil from "./MeuPerfil";
import ManageEleicoes from "./ManageEleicoes"; 
import ManageCandidatos from "./ManageCandidatos"; 
import { toast } from "@/hooks/use-toast";
import { downloadCampaignPDF } from "@/lib/pdf-generator";

interface ExtendedVoteRecord { id?: string; turma_id?: string; eleicao_id?: string; voter_name: string; voter_document?: string; candidate_role: string; candidate_number: number | null; vote_type: "candidate" | "branco" | "nulo"; created_at?: string; }
interface AdminLog { id: string; admin_email: string; acao: string; detalhes: string; created_at: string; }
type Tab = "apuracao" | "reports" | "midias" | "eleicoes" | "turmas" | "candidatos" | "admins" | "perfil" | "logs";
interface AdminPanelProps { turma: Turma | null; onBack: () => void; onTurmasChanged: () => void; }

// DOCK ITEM NO TEMA LIGHT CLEAN
const DockItem = ({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) => (
  <div className="relative group flex items-center justify-center">
    <button
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${
        isActive 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105" 
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
    <div className="absolute left-16 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 hidden md:block">
      {label}
      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900" />
    </div>
  </div>
);

const menuItems: { id: Tab, label: string, icon: React.ElementType, group: string }[] = [
  { id: "apuracao", label: "Dashboard ao Vivo", icon: BarChart3, group: "Resultados" },
  { id: "reports", label: "Auditoria Oficial", icon: FileText, group: "Resultados" },
  { id: "midias", label: "Estúdio de Mídias", icon: ImageIcon, group: "Campanha" },
  { id: "eleicoes", label: "Gestão de Pleitos", icon: ShieldCheck, group: "Gestão Base" },
  { id: "turmas", label: "Zonas & Eleitores", icon: Users, group: "Gestão Base" },
  { id: "candidatos", label: "Base de Candidatos", icon: UserCheck, group: "Gestão Base" },
  { id: "admins", label: "Juízes Eleitorais", icon: ShieldCheck, group: "Sistema" },
  { id: "logs", label: "Logs de Sistema", icon: ActivitySquare, group: "Sistema" },
  { id: "perfil", label: "Meu Perfil", icon: User, group: "Conta" },
];

const AdminPanel = ({ turma, onBack, onTurmasChanged }: AdminPanelProps) => {
  const [escolaNome, setEscolaNome] = useState("Carregando Sistema...");
  const [escolaLogo, setEscolaLogo] = useState<string | null>(null); 
  const [activeTab, setActiveTab] = useState<Tab>("apuracao");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [showVotes, setShowVotes] = useState(false);
  
  const [allVotes, setAllVotes] = useState<ExtendedVoteRecord[]>([]);
  const [allTurmas, setAllTurmas] = useState<{id: string, name: string}[]>([]);
  const [allCandidates, setAllCandidates] = useState<any[]>([]); 
  const [allEleicoes, setAllEleicoes] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]); 
  const [systemLogs, setSystemLogs] = useState<AdminLog[]>([]); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [filters, setFilters] = useState({ search: "", turmaId: turma ? turma.id : "", eleicaoId: "", voteType: "", date: "" });
  const [apuracaoEleicaoId, setApuracaoEleicaoId] = useState("");
  const [apuracaoTurmaId, setApuracaoTurmaId] = useState("");
  const [midiaSearch, setMidiaSearch] = useState("");

  const fetchAllData = async () => {
    setReportLoading(true);
    const fetchEverything = async (tableName: string) => {
      let allData: any[] = []; let from = 0; const step = 1000; let fetchMore = true;
      while (fetchMore) {
        const { data, error } = await supabase.from(tableName).select('*').order('id', { ascending: true }).range(from, from + step - 1);
        if (error) break;
        if (data && data.length > 0) { allData = [...allData, ...data]; if (data.length < step) fetchMore = false; else from += step; } else { fetchMore = false; }
      }
      return allData;
    };

    try {
      const [votesData, turmasData, candidatesRes, logsData, eleicoesData, studentsData] = await Promise.all([
        fetchEverything('votes'), fetchEverything('turmas'), supabase.from("students").select("*").eq("is_candidate", true).limit(5000),
        supabase.from("admin_logs").select("*").order('created_at', { ascending: false }).limit(200), fetchEverything('eleicoes'), fetchEverything('students')
      ]);

      setAllVotes((votesData as ExtendedVoteRecord[]).sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
      if (studentsData) setAllStudents(studentsData);
      if (turmasData) setAllTurmas(turmasData.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || "")));
      if (candidatesRes.data) setAllCandidates(candidatesRes.data);
      if (logsData.data) setSystemLogs(logsData.data);
      if (eleicoesData) setAllEleicoes(eleicoesData);
    } catch (err) { console.error(err); } finally { setReportLoading(false); }
  };

  useEffect(() => { if (["reports", "apuracao", "logs", "midias"].includes(activeTab)) fetchAllData(); }, [activeTab]);

  const getTurmaName = (id?: string) => allTurmas.find(t => t.id === id)?.name || "Desconhecida";
  const getEleicaoNome = (id?: string) => allEleicoes.find(e => e.id === id)?.nome || "Eleição Geral";

  const renderContent = () => {
    switch (activeTab) {
      case "apuracao":
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Banner de Status Light Clean */}
            <div className="agora-card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg border border-orange-200"><Flame className="w-4 h-4" /></span>
                  <h2 className="text-xs font-bold text-orange-600 uppercase tracking-wider">Acompanhamento ao Vivo</h2>
                </div>
                <h3 className="text-2xl font-black text-slate-800">Termômetro da Coleta</h3>
              </div>
              <div className="flex gap-6 text-center">
                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Base de Alunos</span><p className="text-2xl font-black text-slate-800">{allStudents.length}</p></div>
                <div><span className="text-[10px] font-bold text-slate-400 uppercase">Registros</span><p className="text-2xl font-black text-blue-600">{allVotes.length}</p></div>
              </div>
            </div>

            {/* Painel de Resultados */}
            <div className="agora-card space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold text-slate-600 uppercase mb-2 block">Selecione o Pleito/Censo</label>
                  <select className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-800 bg-slate-50 focus:bg-white" value={apuracaoEleicaoId} onChange={e => setApuracaoEleicaoId(e.target.value)}>
                    <option value="">-- Todos os Registros --</option>
                    {allEleicoes.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
                <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Imprimir Relatório
                </button>
              </div>
            </div>
          </div>
        );

      case "reports":
        return (
          <div className="agora-card space-y-4 animate-in fade-in duration-300">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><Filter className="w-5 h-5 text-blue-600" /> Auditoria Geral de Coletas</h2>
            <p className="text-xs text-slate-500 font-medium">Consulte e filtre todos os dados registrados em campo.</p>
          </div>
        );

      case "candidatos": return <ManageCandidatos />;
      case "eleicoes": return <ManageEleicoes />;
      case "turmas": return <div className="agora-card"><ManageTurmas onTurmasChanged={onTurmasChanged} /></div>;
      case "admins": return <ManageAdmins />;
      case "perfil": return <MeuPerfil escolaNome={escolaNome} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* HEADER MOBILE */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold"><Landmark className="w-4 h-4"/></div>
          <h1 className="font-black text-sm uppercase">{escolaNome}</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 bg-slate-100 rounded-md">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* DOCK FLUTUANTE LIGHT — DESKTOP */}
      <div className="hidden md:flex flex-col h-screen py-6 pl-6 z-50">
        <nav className="bg-white border border-slate-200 shadow-xl rounded-[30px] flex flex-col items-center gap-3 w-[76px] h-full relative py-6">
          <div className="mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-[20px] flex items-center justify-center shadow-md shadow-blue-500/20">
              <Landmark className="w-6 h-6 text-white"/>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full px-3 flex-1 overflow-y-auto scrollbar-hide">
            {menuItems.map(item => (
              <DockItem key={item.id} icon={item.icon} label={item.label} isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)} />
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-3 items-center pt-4 border-t border-slate-100 w-full">
            <button onClick={onBack} title="Sair do Painel" className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 h-screen overflow-y-auto px-4 py-6 md:p-8">
        <div className="max-w-6xl mx-auto pb-20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>
          {renderContent()}
        </div>
      </main>

    </div>
  );
};

export default AdminPanel;