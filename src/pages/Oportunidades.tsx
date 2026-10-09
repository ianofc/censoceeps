import React, { useEffect, useState } from 'react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  opportunity_type: string;
  contact_info: string;
  expires_at: string;
  created_at: string;
}

export function Oportunidades() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      // Mock data to demonstrate UI. In a real app we'd fetch from Supabase:
      // const { data, error } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false });
      
      const mockData: Opportunity[] = [
        {
          id: '1',
          title: 'Estágio em Desenvolvimento Web',
          description: 'Buscamos estagiário para atuar com React e Node.js. Excelente oportunidade para alunos do CEEPS aprenderem na prática.',
          opportunity_type: 'estágio',
          contact_info: 'vagas@tech.com',
          expires_at: new Date(Date.now() + 864000000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Bolsa de Iniciação Científica',
          description: 'Bolsa para projeto de pesquisa em IA aplicada à educação no laboratório de inovação.',
          opportunity_type: 'bolsa',
          contact_info: 'prof.silva@universidade.edu.br',
          expires_at: new Date(Date.now() + 864000000 * 2).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Feira Tecnológica Anual',
          description: 'Inscreva seu projeto na feira tecnológica do estado. Premiações para as melhores inovações.',
          opportunity_type: 'feira',
          contact_info: 'eventos@ceeps.edu.br',
          expires_at: new Date(Date.now() + 864000000 * 5).toISOString(),
          created_at: new Date().toISOString()
        }
      ];
      setOpportunities(mockData);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'estágio': return 'bg-blue-100 text-blue-800';
      case 'bolsa': return 'bg-green-100 text-green-800';
      case 'feira': return 'bg-purple-100 text-purple-800';
      case 'evento': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel da Comunidade</h1>
          <p className="text-gray-500 mt-2">Encontre e divulgue estágios, bolsas, feiras e outros eventos.</p>
        </div>
        <button type="button" className="mt-4 md:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-sm transition-colors flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Nova Publicação
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map((opp) => (
            <div key={opp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${getTypeColor(opp.opportunity_type)}`}>
                    {opp.opportunity_type}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {new Date(opp.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">{opp.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">{opp.description}</p>
              </div>
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 mt-auto">
                <div className="flex flex-col space-y-2.5">
                  <div className="flex items-center text-sm text-gray-700">
                    <svg className="h-4 w-4 text-gray-400 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <span className="truncate">{opp.contact_info}</span>
                  </div>
                  {opp.expires_at && (
                    <div className="flex items-center text-xs text-gray-500 font-medium">
                      <svg className="h-4 w-4 text-gray-400 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Expira em: {new Date(opp.expires_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && opportunities.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma publicação</h3>
          <p className="mt-1 text-sm text-gray-500">Não há oportunidades ativas no momento.</p>
        </div>
      )}
    </div>
  );
}

export default Oportunidades;
