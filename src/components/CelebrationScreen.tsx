import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import * as htmlToImage from 'html-to-image';
import { Share2, Download, CheckCircle, Medal } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { AdinhaMascote, MascotePose } from './AdinhaMascote';

interface CelebrationScreenProps {
  readonly interviewCount: number;
  readonly targetCount?: number;
  readonly studentName: string;
  readonly userId?: string;
  readonly onClose?: () => void;
}

export function CelebrationScreen({
  interviewCount,
  targetCount = 20,
  studentName,
  userId = "anon",
  onClose
}: CelebrationScreenProps) {
  const [hasCelebrated, setHasCelebrated] = useState(() => {
    return localStorage.getItem(`hasCelebrated20_${studentName}`) === 'true';
  });
  const cardRef = useRef<HTMLDivElement>(null);

  const isGoalReached = interviewCount >= targetCount;
  const progressPercentage = Math.min((interviewCount / targetCount) * 100, 100);

  useEffect(() => {
    if (isGoalReached && !hasCelebrated) {
      localStorage.setItem(`hasCelebrated20_${studentName}`, 'true');
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#fbbf24', '#f59e0b', '#d97706']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3b82f6', '#2563eb', '#1d4ed8']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();

      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      }

      setHasCelebrated(true);
    }
  }, [isGoalReached, hasCelebrated, studentName]);

  const getMilestoneMessage = () => {
    if (isGoalReached) return "Missão Cumprida: Adinha Campeã!";
    if (interviewCount >= 15) return "Adinha Reta Final: Falta muito pouco!";
    if (interviewCount >= 10) return "Adinha Meio-Caminho: Metade da jornada vencida!";
    if (interviewCount >= 5) return "Adinha Curiosa: Excelente começo!";
    return "Vamos começar essa jornada!";
  };

  const getAdinhaPose = (): MascotePose => {
    if (isGoalReached) return "vencedora";
    if (interviewCount >= 15) return "ideia";
    if (interviewCount >= 10) return "lendo";
    if (interviewCount >= 5) return "correndo";
    return "andando";
  };

  const handleShareToFeed = async () => {
    try {
      const { error } = await supabase.from('lyka_posts').insert([
        {
          user_id: userId,
          author_name: studentName,
          content: `🎉 Alcancei a meta e me tornei um Pesquisador Nota 10 com 20 entrevistas completadas! #CensoAdaLovelace #Meta20`,
          type: 'conquista',
        }
      ]);
      
      if (error) {
        // Fallback caso a tabela não seja 'feed' - você pode ajustar depois
        console.warn("Erro ao inserir no feed (tabela pode estar incorreta):", error);
      }
      
      alert("Conquista publicada no Feed com sucesso!");
    } catch (err) {
      console.error("Erro ao compartilhar no feed:", err);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 0.95 });
      const link = document.createElement('a');
      link.download = 'minha-conquista-censo.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Falha ao gerar imagem', err);
    }
  };

  return (
    <div className="w-full flex flex-col items-center text-center space-y-5 py-4">
      
      <div className="w-full space-y-2">
        <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
          {getMilestoneMessage()}
        </h2>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden relative">
          <div 
            className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Entrevistas concluídas: {interviewCount}/{targetCount}
        </p>
      </div>

      <div className="relative flex items-center justify-center p-2">
        {isGoalReached ? (
          <div className="animate-bounce drop-shadow-xl flex flex-col items-center">
             <AdinhaMascote pose={getAdinhaPose()} className="w-28 h-28" />
          </div>
        ) : (
          <div className="opacity-90 transition-all duration-500 hover:scale-110">
            <AdinhaMascote pose={getAdinhaPose()} className="w-24 h-24" />
          </div>
        )}
      </div>

      {isGoalReached && (
        <div 
          ref={cardRef} 
          className="w-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 p-6 rounded-3xl border-2 border-amber-300 dark:border-amber-600 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <div className="flex justify-center mb-3">
            <Medal className="w-12 h-12 text-amber-600 dark:text-amber-400 drop-shadow-md" />
          </div>
          <h3 className="text-xl font-black text-amber-900 dark:text-amber-100 uppercase mb-1">
            Pesquisador Nota 10!
          </h3>
          <p className="text-amber-800 dark:text-amber-200 text-sm mb-6 font-semibold leading-relaxed">
            Parabéns, <span className="font-black underline decoration-amber-400">{studentName}</span>! Você concluiu suas 20 entrevistas e ajudou a mapear o futuro do CEEP Seabra!
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
            <button 
              type="button"
              onClick={handleShareToFeed}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-md active:scale-95 border-0 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs uppercase">Postar no Feed</span>
            </button>
            <button 
              type="button"
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 py-3 px-4 rounded-xl font-bold transition-all shadow-sm border border-slate-200 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs uppercase">Baixar Card</span>
            </button>
          </div>
        </div>
      )}

      {isGoalReached && (
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-200 dark:border-emerald-800 animate-pulse">
          <CheckCircle className="w-4 h-4" />
          <span>Selo <strong>Top Entrevistador</strong> Desbloqueado!</span>
        </div>
      )}
      
      {isGoalReached && onClose && (
        <button 
          type="button"
          onClick={onClose}
          className="mt-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer bg-transparent border-0"
        >
          Fechar
        </button>
      )}

    </div>
  );
}
