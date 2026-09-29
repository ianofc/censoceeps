import React from 'react';

// Importação segura dos assets da Adinha
const adinhaCorrendo = new URL('../assets/imgs/adinhascorrendo.png', import.meta.url).href;
const adinhaAndando = new URL('../assets/imgs/adinhasandando.png', import.meta.url).href;
const adinhaVencedora = new URL('../assets/imgs/adinhavencedora.png', import.meta.url).href;
const adinhaPerfil = new URL('../assets/imgs/adinhapefil.png', import.meta.url).href;
const adinhaIdeia = new URL('../assets/imgs/adinhaideia.png', import.meta.url).href;
const adinhaLendo = new URL('../assets/imgs/adinhalendo.png', import.meta.url).href;
const adinhaCafe = new URL('../assets/imgs/adinhatomandocafe.png', import.meta.url).href;

export type MascotePose = 'correndo' | 'andando' | 'vencedora' | 'perfil' | 'ideia' | 'lendo' | 'cafe';

interface AdinhaMascoteProps {
  readonly pose: MascotePose;
  readonly className?: string;
  readonly animatePulse?: boolean;
}

export const AdinhaMascote: React.FC<AdinhaMascoteProps> = ({ pose, className = "w-24 h-24", animatePulse = true }) => {
  const getPoseSrc = () => {
    switch (pose) {
      case 'correndo': return adinhaCorrendo;
      case 'andando': return adinhaAndando;
      case 'vencedora': return adinhaVencedora;
      case 'perfil': return adinhaPerfil;
      case 'ideia': return adinhaIdeia;
      case 'lendo': return adinhaLendo;
      case 'cafe': return adinhaCafe;
      default: return adinhaAndando;
    }
  };

  return (
    <div className={`relative flex items-center justify-center ${animatePulse ? 'animate-bounce' : ''}`}>
      <img 
        src={getPoseSrc()} 
        alt={`Adinha ${pose}`} 
        className={`${className} object-contain drop-shadow-xl`}
      />
    </div>
  );
};