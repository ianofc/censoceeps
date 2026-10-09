import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUserSession } from './useUserSession';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

export interface UseCelebracaoMeta20Return {
  isOpen: boolean;
  totalEntrevistas: number;
  hasReachedMeta: boolean;
  isSharing: boolean;
  sharedSuccess: boolean;
  openCelebration: () => void;
  closeCelebration: () => void;
  dispararConfetes: () => void;
  compartilharNoFeed: () => Promise<boolean>;
  baixarCertificadoPdf: () => void;
  copiarTextoCompartilhamento: () => Promise<boolean>;
  checkAndTrigger: (explicitCount?: number) => Promise<boolean>;
}

// Síntese Web Audio Fanfarra de Vitória (suave, sem áudios externos quebrados)
export function playVictorySound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    // Melodia de celebração: C5, E5, G5, C6 arpejo majestoso
    const notes = [
      { f: 523.25, time: 0.0, dur: 0.16 }, // C5
      { f: 659.25, time: 0.15, dur: 0.16 }, // E5
      { f: 783.99, time: 0.30, dur: 0.22 }, // G5
      { f: 1046.50, time: 0.52, dur: 0.70 }, // C6
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, ctx.currentTime + note.time);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + note.time);
      gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + note.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + note.time);
      osc.stop(ctx.currentTime + note.time + note.dur + 0.08);
    });
  } catch (err) {
    console.debug('[Audio] WebAudio indisponível ou bloqueado por política de autoplay:', err);
  }
}

// Disparo dinâmico de confetes e serpentinas estilo estádio
export function dispararEfeitoConfetes() {
  try {
    // 1. Explosão central imediata
    confetti({
      particleCount: 110,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#FBBF24']
    });

    // 2. Canhões laterais esquerdo e direito cruzados
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: ['#F59E0B', '#3B82F6', '#EC4899']
    });

    confetti({
      particleCount: 60,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: ['#10B981', '#8B5CF6', '#FBBF24']
    });

    // 3. Chuva contínua de estrelas e serpentinas por 3 segundos
    const duration = 2800;
    const end = Date.now() + duration;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        startVelocity: 26,
        spread: 360,
        ticks: 50,
        origin: {
          x: Math.random() * 0.8 + 0.1,
          y: Math.random() * 0.4
        },
        colors: ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F43F5E']
      });
    }, 320);
  } catch (err) {
    console.warn('[Confetti] Falha ao disparar confetes:', err);
  }
}

export function useCelebracaoMeta20(): UseCelebracaoMeta20Return {
  const { profile } = useUserSession();
  const [isOpen, setIsOpen] = useState(false);
  const [totalEntrevistas, setTotalEntrevistas] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);

  const getStorageKey = useCallback((userId: string) => {
    return `censo_meta20_celebrated_${userId}`;
  }, []);

  // Conta total real de entrevistas (online em 'entrevistas' + fila offline)
  const fetchInterviewsCount = useCallback(async (userId: string): Promise<number> => {
    try {
      const { count } = await supabase
        .from('entrevistas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const pendingQueue = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
      const pendingUserCount = pendingQueue.filter((item: any) => 
        item.user_id === userId || !item.user_id
      ).length;

      return (count || 0) + pendingUserCount;
    } catch (err) {
      console.warn('Erro ao verificar contagem de entrevistas para meta 20:', err);
      const pendingQueue = JSON.parse(localStorage.getItem('censo_pending_queue') || '[]');
      return pendingQueue.length;
    }
  }, []);

  const openCelebration = useCallback(() => {
    setIsOpen(true);
    playVictorySound();
    dispararEfeitoConfetes();
  }, []);

  const closeCelebration = useCallback(() => {
    setIsOpen(false);
  }, []);

  const dispararConfetes = useCallback(() => {
    dispararEfeitoConfetes();
  }, []);

  // Verifica contagem e dispara celebração automaticamente ao atingir 20
  const checkAndTrigger = useCallback(async (explicitCount?: number): Promise<boolean> => {
    if (!profile?.id) return false;

    const currentCount = typeof explicitCount === 'number' 
      ? explicitCount 
      : await fetchInterviewsCount(profile.id);

    setTotalEntrevistas(currentCount);

    if (currentCount >= 20) {
      const storageKey = getStorageKey(profile.id);
      const hasSeen = localStorage.getItem(storageKey);

      // Se ainda não viu a celebração, dispara automaticamente
      if (!hasSeen) {
        localStorage.setItem(storageKey, new Date().toISOString());
        openCelebration();
        return true;
      }
    }
    return false;
  }, [profile?.id, fetchInterviewsCount, getStorageKey, openCelebration]);

  // Listener para evento customizado global 'abrir-celebracao-meta-20'
  useEffect(() => {
    const handleCustomTrigger = (event: any) => {
      const count = event.detail?.count;
      if (typeof count === 'number') {
        setTotalEntrevistas(count);
      }
      openCelebration();
    };

    window.addEventListener('abrir-celebracao-meta-20', handleCustomTrigger);
    return () => {
      window.removeEventListener('abrir-celebracao-meta-20', handleCustomTrigger);
    };
  }, [openCelebration]);

  // Checagem inicial quando o perfil do usuário carregar
  useEffect(() => {
    if (profile?.id) {
      void checkAndTrigger();
    }
  }, [profile?.id, checkAndTrigger]);

  // Compartilhar conquista automaticamente no Feed do Censo (lyka_posts)
  const compartilharNoFeed = async (): Promise<boolean> => {
    if (!profile?.id || isSharing) return false;
    setIsSharing(true);

    try {
      const nomeAutor = profile.nomeCompleto || 'Pesquisador(a) CEEP';
      const turma = profile.turmaOuCargo ? ` (${profile.turmaOuCargo})` : '';

      const content = `🎉🏆 MISSÃO CUMPRIDA: META 20 CONCLUÍDA! 🏆🎉\n\n` +
        `Eu, ${nomeAutor}${turma}, acabo de concluir todas as 20 entrevistas de campo do Censo Escolar Ada Lovelace no CEEP Seabra!\n\n` +
        `Muito obrigado a todos os colegas e participantes que colaboraram com essa jornada científica e comunitária. A Adinha Campeã está em festa! 🤖✨\n\n` +
        `#AdinhaCampeã #CensoCEEP #Meta20Batida #PesquisaEscolar #AdaLovelace`;

      const { error } = await supabase.from('lyka_posts').insert([{
        user_id: profile.id,
        author_name: nomeAutor,
        content,
        image_url: null,
        type: 'conquista_censo',
      }]);

      if (error) throw error;

      setSharedSuccess(true);
      dispararEfeitoConfetes();
      return true;
    } catch (err) {
      console.error('Erro ao compartilhar conquista no feed:', err);
      alert('Não foi possível publicar no feed. Verifique sua conexão e tente novamente.');
      return false;
    } finally {
      setIsSharing(false);
    }
  };

  // Copiar texto para stories/WhatsApp
  const copiarTextoCompartilhamento = async (): Promise<boolean> => {
    try {
      const nomeAutor = profile.nomeCompleto || 'Pesquisador(a)';
      const texto = `🎉🏆 Concluí a meta das 20 entrevistas do Censo Escolar Ada Lovelace no CEEP Seabra com a Adinha Campeã! 🤖✨ #CensoCEEP #AdinhaCampeã`;
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (err) {
      console.warn('Erro ao copiar para clipboard:', err);
      return false;
    }
  };

  // Baixar Certificado Oficial em PDF com jsPDF
  const baixarCertificadoPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const nomeAluno = profile.nomeCompleto || 'Pesquisador(a) do Censo';
      const turmaAluno = profile.turmaOuCargo || 'Comunidade Escolar CEEP';
      const dataHoje = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      // Moldura e Fundo
      doc.setFillColor(250, 250, 252);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Bordas Douradas e Roxas
      doc.setDrawColor(217, 119, 6); // Amber
      doc.setLineWidth(3);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

      doc.setDrawColor(99, 102, 241); // Indigo
      doc.setLineWidth(1);
      doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

      // Faixa Superior
      doc.setFillColor(30, 27, 75); // Slate 900
      doc.rect(13, 13, pageWidth - 26, 26, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('CEEP SEABRA — CENTRO ESTADUAL DE EDUCAÇÃO PROFISSIONAL', pageWidth / 2, 24, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(216, 180, 254);
      doc.text('PROJETO CIENTÍFICO E COMUNITÁRIO • CENSO ESCOLAR ADA LOVELACE', pageWidth / 2, 32, { align: 'center' });

      // Título do Certificado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(180, 83, 9); // Dourado escuro
      doc.text('CERTIFICADO DE MÉRITO CIENTÍFICO', pageWidth / 2, 60, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text('★ MISSÃO CUMPRIDA: ADINHA CAMPEÃ (META DAS 20 ENTREVISTAS) ★', pageWidth / 2, 70, { align: 'center' });

      // Texto de Reconhecimento
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(51, 65, 85);
      doc.text('Certificamos com distinção e honra que:', pageWidth / 2, 86, { align: 'center' });

      // Nome do Aluno Destacado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text(nomeAluno.toUpperCase(), pageWidth / 2, 100, { align: 'center' });

      // Linha sob o nome
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.8);
      doc.line(pageWidth / 2 - 60, 104, pageWidth / 2 + 60, 104);

      // Descrição
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      const textoDescritivo = 
        `Estudante/Pesquisador(a) da turma/cargo "${turmaAluno}", concluiu com êxito a meta de 20 entrevistas de campo ` +
        `no Censo Escolar Ada Lovelace, demonstrando rigor metodológico, cidadania participativa e contribuição ativa ` +
        `para o mapeamento sociodemográfico e educacional do CEEP Seabra na Chapada Diamantina.`;

      const splitText = doc.splitTextToSize(textoDescritivo, pageWidth - 60);
      doc.text(splitText, pageWidth / 2, 116, { align: 'center', lineHeightFactor: 1.4 });

      // Rodapé: Data e Assinaturas
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(`Seabra — BA, ${dataHoje}`, pageWidth / 2, 150, { align: 'center' });

      // Linhas de Assinatura
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);

      // Assinatura 1: Coordenação
      doc.line(pageWidth / 4 - 35, 172, pageWidth / 4 + 35, 172);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text('Coordenação Pedagógica CEEP', pageWidth / 4, 177, { align: 'center' });

      // Assinatura 2: Adinha Mascote & Comitê Científico
      doc.line((pageWidth * 3) / 4 - 35, 172, (pageWidth * 3) / 4 + 35, 172);
      doc.text('Comitê do Censo Ada Lovelace', (pageWidth * 3) / 4, 177, { align: 'center' });

      // Selo de Registro no Rodapé
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const hashVerificacao = `ID: CEEP-META20-${profile.id?.slice(0, 8).toUpperCase() || 'OFFLINE'}-${Date.now().toString().slice(-6)}`;
      doc.text(`Autenticação Digital: ${hashVerificacao} • Plataforma Censo CEEP`, pageWidth / 2, 194, { align: 'center' });

      doc.save(`Certificado_Adinha_Campea_${nomeAluno.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar certificado em PDF:', err);
      alert('Erro ao gerar o certificado em PDF. Tente novamente.');
    }
  };

  return {
    isOpen,
    totalEntrevistas,
    hasReachedMeta: totalEntrevistas >= 20,
    isSharing,
    sharedSuccess,
    openCelebration,
    closeCelebration,
    dispararConfetes,
    compartilharNoFeed,
    baixarCertificadoPdf,
    copiarTextoCompartilhamento,
    checkAndTrigger,
  };
}
