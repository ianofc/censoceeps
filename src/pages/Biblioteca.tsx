import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface BibliotecaItem {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  created_at: string;
}

export function Biblioteca() {
  const [items, setItems] = useState<BibliotecaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('biblioteca_viva')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching biblioteca items:', error);
      } else {
        setItems(data || []);
      }
    } catch (error) {
      console.error('Error in fetchItems:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from('biblioteca').getPublicUrl(path);
    return data.publicUrl;
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
