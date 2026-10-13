import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebracaoProps {
  isOpen: boolean;
  onClose: () => void;
  nomeAluno: string;
  totalEntrevistas: number;
  onCompartilharFeed?: () => void;
}

export const CelebracaoConquistaModal: React.FC<CelebracaoProps> = ({
  isOpen,
  onClose,
  nomeAluno,
  totalEntrevistas,
  onCompartilharFeed,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Disparo contínuo de confetes e serpentinas
      const duration = 3.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const baixarCertificado = () => {
    import('jspdf').then((module) => {
      const jsPDF = module.default;
      const doc = new jsPDF({ orientation: 'landscape' });
      
      doc.setFillColor(240, 249, 246);
      doc.rect(0, 0, 297, 210, 'F');
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(4);
      doc.rect(10, 10, 277, 190);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(16, 185, 129);
      doc.text('CERTIFICADO DE PESQUISADOR JÚNIOR', 148.5, 50, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.setTextColor(50, 50, 50);
      const texto = `Certificamos que ${nomeAluno} concluiu com excelência a meta de ${totalEntrevistas} entrevistas no Censo Escolar CEEPS Ada Lovelace, demonstrando compromisso e responsabilidade na coleta de dados da comunidade escolar.`;
      doc.text(texto, 148.5, 90, { align: 'center', maxWidth: 220 });
      
      doc.setFontSize(14);
      const dataHoje = new Date().toLocaleDateString('pt-BR');
      doc.text(`Data de Emissão: ${dataHoje}`, 148.5, 150, { align: 'center' });
      
      doc.setFont('helvetica', 'bold');
      doc.text('_________________________________', 148.5, 170, { align: 'center' });
      doc.text('Coordenação do Projeto Censitário', 148.5, 180, { align: 'center' });
      
      doc.save(`Certificado_Censo_${nomeAluno.replace(/\s+/g, '_')}.pdf`);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
        
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        <div className="mx-auto my-4 flex h-32 w-32 items-center justify-center rounded-full bg-emerald-950/60 border-2 border-emerald-400/50 shadow-inner">
          <span className="text-6xl animate-bounce">🏆</span>
        </div>

        <span className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
          Meta Batida • {totalEntrevistas} Entrevistas
        </span>

        <h2 className="mt-3 text-2xl font-bold text-white">
          Parabéns, {nomeAluno}!
        </h2>

        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          Você concluiu com sucesso todas as <span className="font-semibold text-emerald-400">{totalEntrevistas} entrevistas</span> do Censo CEEPS Ada Lovelace! Sua contribuição é fundamental para mapear nossa comunidade escolar.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={baixarCertificado}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.98] flex justify-center items-center gap-2"
          >
            🎓 Baixar Certificado Oficial
          </button>

          {onCompartilharFeed && (
            <button
              onClick={onCompartilharFeed}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.98]"
            >
              🎉 Compartilhar no Mural da Escola
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700/60"
          >
            Continuar Navegando
          </button>
        </div>
      </div>
    </div>
  );
};
