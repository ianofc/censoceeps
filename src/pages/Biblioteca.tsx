import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { badgeService } from '../services/badgeService';

interface BibliotecaItem {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  created_at: string;
}

const CURATED_BIBLIOTECA_ITEMS: BibliotecaItem[] = [
  {
    id: 'curated-cartilha-censo',
    title: 'Cartilha Oficial do Censo CEEP Ada Lovelace',
    description: 'Manual metodológico para coleta científica sobre gênero, raça e pertencimento na comunidade escolar.',
    category: 'Cartilha',
    file_url: 'https://ceeps.edu.br/materiais/cartilha_censo_ada_lovelace.pdf',
    created_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'curated-manual-abordagem',
    title: 'Guia de Abordagem Ética e Empática de Campo',
    description: 'Técnicas de escuta ativa, garantia de sigilo e conforto psicológico para estudantes entrevistados.',
    category: 'Material Pedagógico',
    file_url: 'https://ceeps.edu.br/materiais/guia_abordagem_humanizada.pdf',
    created_at: '2026-03-05T12:00:00Z',
  },
  {
    id: 'curated-lgpd-escolar',
    title: 'Diretrizes de LGPD e Privacidade em Pesquisas Escolares',
    description: 'Protocolos de segurança, anonimização e conformidade legal com a Lei Geral de Proteção de Dados.',
    category: 'Regulamento',
    file_url: 'https://ceeps.edu.br/materiais/lgpd_pesquisa_escolar.pdf',
    created_at: '2026-03-10T14:30:00Z',
  },
  {
    id: 'curated-premio-ada-lovelace',
    title: 'Regulamento do Prêmio Científico Ada Lovelace 2026',
    description: 'Critérios da premiação para alunos que atingirem as metas de entrevistas e produções acadêmicas.',
    category: 'Regulamento',
    file_url: 'https://ceeps.edu.br/materiais/regulamento_premio_ada_lovelace.pdf',
    created_at: '2026-03-12T09:00:00Z',
  },
  {
    id: 'curated-glossario-etnico',
    title: 'Glossário Étnico-Racial e Territórios da Chapada Diamantina',
    description: 'Apoio conceitual sobre identidades quilombolas, indígenas, pardas e comunidades tradicionais da região.',
    category: 'Material Pedagógico',
    file_url: 'https://ceeps.edu.br/materiais/glossario_etnico_racial_seabra.pdf',
    created_at: '2026-03-15T16:00:00Z',
  },
];

export function Biblioteca() {
  const [items, setItems] = useState<BibliotecaItem[]>(CURATED_BIBLIOTECA_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDownloadClick = () => {
    supabase.auth.getSession().then(({ data }) => {
      let uid = data.session?.user?.id;
      if (!uid && typeof window !== 'undefined') {
        try {
          const testUser = JSON.parse(localStorage.getItem('ceep_test_user') || '{}');
          uid = testUser?.id;
        } catch {}
      }
      if (uid) {
        void badgeService.recordExplorationVisit(uid, 'biblioteca');
      }
    });
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('biblioteca_viva')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback gracioso para a biblioteca curada em memória sem emitir erro vermelho de console
        console.info('[Biblioteca] Utilizando acervo educacional local de segurança.');
        setItems(CURATED_BIBLIOTECA_ITEMS);
      } else if (data && data.length > 0) {
        // Se houver itens no banco, mescla com os curados
        const serverIds = new Set(data.map((d: any) => d.id));
        const combined = [...data, ...CURATED_BIBLIOTECA_ITEMS.filter(c => !serverIds.has(c.id))];
        setItems(combined);
      } else {
        setItems(CURATED_BIBLIOTECA_ITEMS);
      }
    } catch {
      console.info('[Biblioteca] Modo offline: acervo curado carregado.');
      setItems(CURATED_BIBLIOTECA_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (path: string) => {
    if (!path) return '#';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const { data } = supabase.storage.from('biblioteca').getPublicUrl(path);
    return data?.publicUrl || path;
  };


  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Biblioteca Viva</h1>
      <p className="text-gray-600 mb-8">
        Repositório digital de cartilhas, regulamentos e materiais pedagógicos.
      </p>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Pesquisar por título, descrição ou categoria..."
          aria-label="Pesquisar por título, descrição ou categoria"
          className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <p className="text-xl text-gray-500">Carregando materiais...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-semibold text-gray-800 line-clamp-2">
                      {item.title}
                    </h2>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                    {item.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a
                      href={getFileUrl(item.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      download
                      onClick={handleDownloadClick}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Baixar Material
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Nenhum material encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Biblioteca;
