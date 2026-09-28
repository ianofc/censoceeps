import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

import adinhaFrenteImg from '../assets/imgs/adinhafrente.png';

export function NotFound() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlaying = () => {
      setVideoLoaded(true);
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('loadeddata', handlePlaying);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setVideoLoaded(true);
        })
        .catch((error) => {
          console.warn('Autoplay aguardando interação do usuário:', error);
        });
    }

    return () => {
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('loadeddata', handlePlaying);
    };
  }, []);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      
      {/* Bloco Central com os Números 404 e a Adinha no Meio */}
      <div className="relative flex items-center justify-center select-none my-4">
        <span className="text-[9rem] sm:text-[14rem] font-black text-slate-200 tracking-tighter leading-none">
          4
        </span>

        {/* Container da Personagem */}
        <div className="relative w-48 h-72 sm:w-64 sm:h-96 -mx-6 sm:-mx-10 z-10 flex items-center justify-center">
          
          {/* Imagem Estática (Exibida enquanto o vídeo não inicia) */}
          {!videoLoaded && (
            <img
              src={adinhaFrenteImg}
              alt="Ada Lovelace (Adinha) de Frente"
              className="absolute inset-0 w-full h-full object-contain drop-shadow-xl z-10"
            />
          )}

          {/* Vídeo Animado (Carregado via pasta public/imgs/adinha-animada.mp4) */}
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-contain drop-shadow-xl z-20 transition-opacity duration-300 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <source src="/imgs/adinha-animada.mp4" type="video/mp4" />
            Seu navegador não suporta tags de vídeo.
          </video>
        </div>

        <span className="text-[9rem] sm:text-[14rem] font-black text-slate-200 tracking-tighter leading-none">
          4
        </span>
      </div>

      {/* Mensagem e Ações */}
      <div className="max-w-md space-y-3 z-20">
        <span className="bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-blue-200">
          Ops! Caminho Perdido
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
          Página não encontrada
        </h1>

        <p className="text-sm font-medium text-slate-500 leading-relaxed">
          A Adinha procurou por todos os lados no banco do Censo CEEP, mas o endereço que você tentou acessar não existe.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition duration-200 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Início do Censo
          </button>
        </div>
      </div>
    </div>
  );
}