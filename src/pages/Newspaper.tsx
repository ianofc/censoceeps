import React, { useState, useEffect } from 'react';
import { Newspaper as NewsIcon, Radio, Sparkles, Search, BookOpen } from 'lucide-react';
import { AdinhaMascote } from '../components/AdinhaMascote';

// Estrutura de dados que a IRIS vai coletar e o Mercúrio vai entregar
interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  source: string;
  category: string;
  date: string;
  url: string;
}

export function Newspaper() {
  const [searchTerm, setSearchTerm] = useState('');
  const [liveNews, setLiveNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // TAS Algoritmo de Engajamento (Simulando o "For You" do X/Meta)
  const calculateEngagementScore = (title: string, summary: string) => {
    const buzzwords = ['racismo', 'educação', 'escola', 'ensino', 'stf', 'lei', 'ibge', 'violência', 'mulher', 'direitos', 'censo'];
    const text = (title + ' ' + summary).toLowerCase();
    
    const cryptoRandom1 = window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295;
    let score = Math.floor(cryptoRandom1 * 50); // Base score
    buzzwords.forEach(word => {
      if (text.includes(word)) score += 100; // High impact for our core themes
    });
    
    // Simula engajamento social (likes, retweets, comments)
    const cryptoRandom2 = window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295;
    const likes = Math.floor(score * 1.5) + Math.floor(cryptoRandom2 * 200);
    const shares = Math.floor(likes * 0.3);
    
    return { score, likes, shares };
  };

  useEffect(() => {
    const fetchLiveNews = async () => {
      try {
        setLoading(true);
        // O Olho Analítico (IRIS) fazendo o scraping via APIs públicas de RSS
        const urls = [
          'https://api.rss2json.com/v1/api.json?rss_url=https://g1.globo.com/rss/g1/educacao/',
          'https://api.rss2json.com/v1/api.json?rss_url=https://g1.globo.com/rss/g1/tecnologia/',
          'https://api.rss2json.com/v1/api.json?rss_url=https://g1.globo.com/rss/g1/pop-arte/',
          'https://api.rss2json.com/v1/api.json?rss_url=https://g1.globo.com/rss/g1/trabalho-e-carreira/',
          'https://api.rss2json.com/v1/api.json?rss_url=https://tecnoblog.net/feed/',
          'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/portuguese/rss.xml',
          'https://api.rss2json.com/v1/api.json?rss_url=https://agenciabrasil.ebc.com.br/direitos-humanos/feed',
          'https://api.rss2json.com/v1/api.json?rss_url=https://agenciabrasil.ebc.com.br/educacao/feed',
          'https://api.rss2json.com/v1/api.json?rss_url=https://agenciabrasil.ebc.com.br/cultura/feed'
        ];

        const responses = await Promise.all(urls.map(url => fetch(url).then(res => res.json())));
        
        let allItems: unknown[] = [
          {
            title: 'Quem foi Ada Lovelace? A história da primeira programadora do mundo',
            description: 'Muito antes do primeiro computador moderno ser construído, a matemática Ada Lovelace escreveu o primeiro algoritmo a ser processado por uma máquina. Seu legado revolucionou a programação e hoje inspira mulheres na tecnologia e ciência em todo o mundo.',
            thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Ada_Lovelace',
            categories: ['História da Tecnologia', 'Mulheres na Ciência'],
            pubDate: new Date().toISOString()
          },
          {
            title: 'A Resistência do Quilombo dos Palmares e a Luta Histórica dos Negros no Brasil',
            description: 'Liderado por Zumbi e Dandara, o Quilombo dos Palmares foi o maior símbolo de resistência contra a escravidão no Brasil colonial. Entenda como essa história continua a refletir nas pautas modernas de igualdade racial, combate ao racismo e consciência negra.',
            thumbnail: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Quilombo_dos_Palmares',
            categories: ['História', 'Igualdade Racial'],
            pubDate: new Date().toISOString()
          },
          {
            title: 'Como a Lei Maria da Penha revolucionou o combate à violência contra a mulher',
            description: 'Sancionada em 2006, a lei trouxe mecanismos cruciais para coibir e prevenir a violência doméstica e familiar no Brasil. Especialistas apontam que a educação de jovens nas escolas é o principal motor para a desconstrução do machismo e do feminicídio.',
            thumbnail: 'https://images.unsplash.com/photo-1588075592446-265fd1e6e76f?auto=format&fit=crop&q=80&w=600',
            link: 'https://www.cnj.jus.br/programas-e-acoes/lei-maria-da-penha/',
            categories: ['Direitos Humanos', 'Sociedade'],
            pubDate: new Date().toISOString()
          },
          {
            title: 'Katherine Johnson, Dorothy Vaughan e Mary Jackson: As mulheres negras por trás da NASA',
            description: 'Conhecidas como "Estrelas Além do Tempo", essas cientistas negras quebraram barreiras de racismo e sexismo, realizando cálculos complexos que levaram a humanidade ao espaço. Um marco indispensável na história da tecnologia e do ensino.',
            thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Estrelas_Al%C3%A9m_do_Tempo',
            categories: ['Ciência', 'Feminismo'],
          },
          {
            title: 'A Camélia Branca: O símbolo secreto da abolição e a assinatura da Princesa Isabel',
            description: 'No Brasil Império, usar uma camélia na lapela ou cultivá-la era um ato de rebeldia e apoio ao fim da escravidão, especialmente no Quilombo do Leblon. Até a Princesa Isabel passou a usar a flor como posicionamento antes da Lei Áurea, marcando a história do movimento abolicionista.',
            thumbnail: 'https://images.unsplash.com/photo-1596438459194-f21bb604cb7a?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Cam%C3%A9lia',
            categories: ['História do Brasil', 'Resistência'],
            pubDate: new Date().toISOString()
          },
          {
            title: 'André Rebouças e Enedina Alves: O apagamento e o pioneirismo negro na engenharia brasileira',
            description: 'André Rebouças foi um dos maiores engenheiros do Brasil no século XIX e abolicionista ferrenho. Décadas depois, Enedina Alves Marques superou o racismo estrutural para se tornar a primeira mulher negra a se formar em engenharia no país, cravando seu nome na história da ciência e tecnologia.',
            thumbnail: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Enedina_Alves_Marques',
            categories: ['Tecnologia', 'Vanguardas'],
            pubDate: new Date().toISOString()
          },
          {
            title: 'Machado de Assis e Antonieta de Barros: O poder da escrita e da educação na ascensão negra',
            description: 'Machado, um homem negro e de origem humilde, fundou a Academia Brasileira de Letras tornando-se nosso maior escritor. Já Antonieta de Barros foi a primeira deputada negra do Brasil e criadora do Dia do Professor. Duas trajetórias que provam o poder transformador do ensino e da literatura contra o preconceito.',
            thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Antonieta_de_Barros',
            categories: ['Literatura', 'Educação'],
          },
          {
            title: 'Cochicho, Fuzuê e Caçula: A herança linguística negra que o Brasil fala todos os dias',
            description: 'Muito além da culinária, a contribuição da população negra formou a base do português brasileiro. Palavras do nosso cotidiano, de origem Banto, Quimbundo e Iorubá, carregam séculos de resistência e provam que a nossa comunicação é, em sua essência, afro-brasileira.',
            thumbnail: 'https://images.unsplash.com/photo-1517436073-3b1b110b1062?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Influ%C3%AAncia_africana_no_portugu%C3%AAs_do_Brasil',
            categories: ['Linguística', 'Cultura'],
            pubDate: new Date().toISOString()
          },
          {
            title: 'Carolina Maria de Jesus e o "Quarto de Despejo": A voz negra silenciada que conquistou o mundo',
            description: 'Catadora de papel e moradora de favela, Carolina Maria de Jesus registrou em seus diários a dura realidade da miséria e do racismo no Brasil. Sua obra quebrou as barreiras da literatura de elite e se tornou um dos livros mais traduzidos da história nacional, embora seu nome ainda lute contra o apagamento escolar.',
            thumbnail: 'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Carolina_Maria_de_Jesus',
            categories: ['Literatura', 'Histórias Não Contadas'],
            pubDate: new Date().toISOString()
          },
          {
            title: 'A "Mandinga" e o Batuque: Como a malícia e a oralidade salvaram a história dos escravizados',
            description: 'Proibidos de ler e escrever, os negros escravizados usavam a oralidade cifrada, o batuque e a "mandinga" (esperteza/ginga) para se comunicarem sem que os senhores entendessem. Hoje, essas práticas são reconhecidas como atos intelectuais e de imensa riqueza cultural.',
            thumbnail: 'https://images.unsplash.com/photo-1516027150756-3c0f64c676bb?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Cultura_afro-brasileira',
            categories: ['História', 'Ancestralidade'],
            pubDate: new Date().toISOString()
          },
          {
            title: 'Maria Firmina dos Reis: A primeira romancista negra do Brasil e a literatura antiescravista',
            description: 'Muito antes da abolição, Maria Firmina dos Reis publicou "Úrsula" (1859), o primeiro romance afro-brasileiro da nossa história. Ela usou a literatura para denunciar a brutalidade da escravidão, mas seu nome foi covardemente apagado dos livros escolares por mais de um século.',
            thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Maria_Firmina_dos_Reis',
            categories: ['Literatura', 'Histórias Não Contadas'],
            pubDate: new Date().toISOString()
          },
          {
            title: 'Tia Ciata e o nascimento do Samba: O matriarcado negro por trás da cultura nacional',
            description: 'A casa de Tia Ciata, uma mãe de santo e cozinheira negra no Rio de Janeiro, era o porto seguro onde bambas se reuniam fugindo da repressão policial. Foi na sala dela que nasceu "Pelo Telefone", o primeiro samba gravado no Brasil. Ela é o símbolo vivo da força da mulher negra na música.',
            thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Tia_Ciata',
            categories: ['Música', 'Cultura Afro'],
            pubDate: new Date().toISOString()
          },
          {
            title: 'Chiquinha Gonzaga: A maestrina que desafiou o império e abriu alas para a música popular',
            description: 'Uma mulher à frente do seu tempo que escandalizou a elite ao se divorciar e viver de música no século XIX. Chiquinha Gonzaga misturou o piano clássico com os batuques africanos do maxixe, fundando a música popular brasileira e lutando ativamente pela libertação dos escravizados.',
            thumbnail: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=600',
            link: 'https://pt.wikipedia.org/wiki/Chiquinha_Gonzaga',
            categories: ['Música', 'Feminismo'],
          },
          {
            title: 'A sala de aula como campo de batalha: O alarmante cenário de desrespeito aos professores',
            description: 'Uma crise silenciosa afeta a base da educação brasileira. Pesquisas revelam um aumento assustador nos casos de agressão verbal, física e desrespeito sistemático contra educadores dentro das escolas. Profissionais pedem socorro e alertam: sem a valorização e o respeito à figura do professor, não há futuro possível para o ensino no Brasil.',
            thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=600',
            link: 'https://www.bbc.com/portuguese/brasil-40439403',
            categories: ['Educação', 'Realidade Escolar'],
          }
        ];

        responses.forEach(res => {
          if (res.status === 'ok' && res.items) {
            allItems = [...allItems, ...res.items];
          }
        });

        // TAS converte os dados brutos e aplica o Algoritmo de Trends
        const blockedKeywords = ['lula', 'bolsonaro', 'flávio', 'eleição', 'eleições', 'voto', 'votar', 'candidato', 'prefeito', 'vereador', 'política', 'stf', 'partido', 'governo', 'deputado', 'senador', 'congresso', 'moraes', 'pacheco', 'lira', 'haddad', 'esquerda', 'direita', 'elon musk', 'fofoca', 'celebridade', 'desembargador', 'prisão', 'crime', 'vorcaro', 'fraude', 'propina'];
        
        const requiredKeywords = [
          'educação', 'escola', 'ensino', 'estudo', 'professor', 'professora', 'aluno', 'aluna', 'estudante', 'racismo', 
          'preconceito', 'diversidade', 'inclusão', 'tecnologia', 'ciência', 'pesquisa', 'universidade', 'faculdade', 
          'enem', 'mec', 'ibge', 'censo', 'inteligência artificial', 'software', 'programação', 'aprendizado', 'inovação', 
          'direitos', 'juventude', 'futuro', 'carreira', 'mercado', 'negros', 'negro', 'negra', 'negras', 'história', 
          'mulher', 'mulheres', 'violência', 'feminicídio', 'machismo', 'quilombo', 'quilombola', 'indígena', 'opressão', 
          'igualdade', 'direitos humanos', 'cultura', 'música', 'literatura', 'arte', 'saúde', 'internet', 'digital', 
          'sociedade', 'trabalho', 'emprego', 'economia', 'comunicação', 'identidade', 'resistência'
        ];

        const processedNews: NewsArticle[] = allItems
          .filter(item => {
            const textToInspect = (item.title + ' ' + (item.description || '')).toLowerCase();
            
            // Rejeita sumariamente se tiver palavras bloqueadas usando Regex para pegar palavras inteiras
            const hasBlocked = blockedKeywords.some(keyword => {
              const regex = new RegExp(String.raw`\b${keyword}\b`, 'i');
              return regex.test(textToInspect);
            });
            if (hasBlocked) return false;

            // Filtro Positivo Extremo: A matéria DEVE conter pelo menos um dos temas foco do Censo CEEP
            const hasRequired = requiredKeywords.some(keyword => {
              const regex = new RegExp(String.raw`\b${keyword}\b`, 'i');
              return regex.test(textToInspect);
            });
            return hasRequired;
          })
          .map((item, index) => {
          const { score, likes, shares } = calculateEngagementScore(item.title, item.description || '');
          
          // Tenta extrair a imagem do RSS (enclosure ou da descrição html)
          let imageUrl = 'https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?auto=format&fit=crop&q=80&w=600';
          if (item.enclosure?.link) {
            imageUrl = item.enclosure.link;
          } else if (item.thumbnail) {
            imageUrl = item.thumbnail;
          } else {
             const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
             if (imgMatch) imageUrl = imgMatch[1];
          }

          // Limpa HTML da descrição
          const cleanSummary = item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';

          return {
            id: `news-${index}-${Date.now()}`,
            title: item.title,
            summary: cleanSummary,
            imageUrl,
            source: 'Portal RSS', // RSS de origem
            category: item.categories && item.categories.length > 0 ? item.categories[0] : 'Brasil',
            date: new Date(item.pubDate).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            url: item.link,
            // Meta/X Algorithm metrics
            score,
            likes,
            shares
          } as NewsArticle & { score: number, likes: number, shares: number };
        });

        const trendingNews = [...processedNews].sort((a: unknown, b: unknown) => b.score - a.score).slice(0, 100);
        
        setLiveNews(trendingNews);
      } catch (err) {
        console.error("IRIS Scraping Failed:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchLiveNews();
  }, []);

  const filteredNews = liveNews.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    article.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mainArticle = filteredNews[0];
  const subArticles = filteredNews.slice(1, 4);
  const otherArticles = filteredNews.slice(4);

  return (
    <div className="w-full flex flex-col items-center pb-24 pt-6 bg-slate-50 dark:bg-slate-900 min-h-screen font-sans">
      <style>{`
        @keyframes floatPulse {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .mercurio-badge {
          animation: floatPulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Header Premium (Restored) */}
      <div className="w-full max-w-6xl mb-10 px-4 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/20 dark:bg-blue-600/20 blur-3xl rounded-full"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-400/20 dark:bg-purple-600/20 blur-3xl rounded-full"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 bg-gradient-to-br from-blue-700 to-indigo-800 p-8 rounded-3xl border border-blue-600 shadow-2xl shadow-blue-900/20">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/20 rounded-xl text-white shadow-inner border border-white/20">
                <NewsIcon className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                Censo Tribune
              </h1>
            </div>
            <p className="text-blue-100 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              Curadoria automatizada de notícias, tecnologias e avanços estudantis coletados em tempo real pela IRIS.
            </p>
            
            <div className="flex items-center gap-4 mt-6">
              <span className="mercurio-badge flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-white border border-white/20 shadow-sm backdrop-blur-md">
                <Radio className="w-3.5 h-3.5" />
                Powered by Mercúrio
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 text-white border border-white/20 shadow-sm backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                Scraping via IRIS
              </span>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center">
            <AdinhaMascote pose="lendo" className="w-32 h-32 drop-shadow-xl" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-6xl mb-12 px-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar manchetes recolhidas pela IRIS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
          />
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-400 animate-pulse">
          <AdinhaMascote pose="lendo" className="w-20 h-20 mb-4 opacity-50 grayscale" />
          <p className="font-bold tracking-widest uppercase text-xs">Puxando manchetes da rede...</p>
        </div>
      )}

      {!loading && filteredNews.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
          <BookOpen className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-bold">Nenhuma notícia encontrada para esse termo.</p>
        </div>
      )}

      {!loading && mainArticle && (
        <div className="w-full max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* Manchete Principal (Left Col) */}
          <div className="lg:col-span-8 flex flex-col">
            <a href={mainArticle.url} className="group cursor-pointer flex flex-col">
              <span className="text-[#C4170C] font-black text-sm uppercase tracking-wide mb-2">
                {mainArticle.category}
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-[1.1] mb-4 group-hover:text-[#C4170C] transition-colors tracking-tight">
                {mainArticle.title}
              </h2>
              <p className="text-gray-600 text-lg md:text-xl font-medium leading-snug mb-6 line-clamp-2">
                {mainArticle.summary}
              </p>
              <div className="w-full aspect-[16/9] overflow-hidden rounded-lg bg-gray-100 mb-4">
                <img 
                  src={mainArticle.imageUrl} 
                  alt={mainArticle.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                <span>{mainArticle.date}</span>
                <span className="flex items-center gap-1.5"><span className="text-rose-500">❤️</span> {(mainArticle as any).likes}</span>
                <span className="flex items-center gap-1.5"><span className="text-blue-500">🔁</span> {(mainArticle as any).shares}</span>
              </div>
            </a>
          </div>

          {/* Destaques Secundários (Right Col) */}
          <div className="lg:col-span-4 flex flex-col gap-6 border-l-0 lg:border-l border-gray-200 lg:pl-8">
            {subArticles.map((article) => (
              <a key={article.id} href={article.url} className="group cursor-pointer flex flex-col border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <span className="text-[#C4170C] font-black text-[11px] uppercase tracking-wide mb-1.5">
                  {article.category}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-[#C4170C] transition-colors">
                  {article.title}
                </h3>
                <div className="w-full h-40 overflow-hidden rounded bg-gray-100 mb-3 hidden sm:block lg:hidden">
                  <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 mt-1">
                  <span>{article.date}</span>
                  <span className="flex items-center gap-1"><span className="text-rose-500">❤️</span> {(article as any).likes}</span>
                </div>
              </a>
            ))}
          </div>

        </div>
      )}

      {/* Grade de Outras Notícias */}
      {!loading && otherArticles.length > 0 && (
        <div className="w-full max-w-6xl px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 pt-8 border-t border-gray-200">
          {otherArticles.map((article) => (
            <a key={article.id} href={article.url} className="group cursor-pointer flex flex-col">
              <div className="w-full aspect-[4/3] overflow-hidden rounded bg-gray-100 mb-3">
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <span className="text-[#C4170C] font-black text-[10px] uppercase tracking-wide mb-1">
                {article.category}
              </span>
              <h4 className="text-[15px] font-bold text-gray-900 leading-snug group-hover:text-[#C4170C] transition-colors line-clamp-3">
                {article.title}
              </h4>
            </a>
          ))}
        </div>
      )}

    </div>
  );
}

export default Newspaper;
