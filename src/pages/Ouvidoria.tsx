import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Ticket {
  id: string;
  assunto: string;
  mensagem: string;
  tipo: string;
  status: string;
  is_anonimo: boolean;
  resposta_admin?: string;
  created_at: string;
}

export function Ouvidoria() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipo, setTipo] = useState('Problema');
  const [isAnonimo, setIsAnonimo] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('ouvidoria_tickets')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('ouvidoria_tickets')
        .insert([
          {
            assunto,
            mensagem,
            tipo,
            is_anonimo: isAnonimo,
            user_id: userData.user?.id
          }
        ]);

      if (error) throw error;
      
      setAssunto('');
      setMensagem('');
      setTipo('Problema');
      setIsAnonimo(false);
      alert('Ticket enviado com sucesso!');
      
      fetchTickets();
    } catch (error) {
      console.error('Erro ao enviar ticket:', error);
      alert('Erro ao enviar ticket. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Ouvidoria e Apoio ao Aluno</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulário de Abertura */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Abrir Novo Ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Solicitação</label>
              <select 
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Problema">Problema / Reclamação</option>
                <option value="Sugestão de Infraestrutura">Sugestão de Infraestrutura</option>
                <option value="Apoio Pedagógico">Apoio Pedagógico</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label htmlFor="assunto" className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
              <input 
                id="assunto"
                type="text"
                required
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Resumo do problema..."
              />
            </div>

            <div>
              <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea 
                id="mensagem"
                required
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 h-32 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descreva em detalhes..."
              />
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox"
                id="anonimo"
                checked={isAnonimo}
                onChange={(e) => setIsAnonimo(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="anonimo" className="ml-2 block text-sm text-gray-700">
                Manter meu anonimato (os gestores não verão seu nome)
              </label>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar Ticket'}
            </button>
          </form>
        </div>

        {/* Lista de Tickets */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Meus Chamados</h2>
          
          {loading ? (
            <p className="text-gray-500 text-center py-4">Carregando...</p>
          ) : tickets.length === 0 ? (
            <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-md">Você ainda não tem nenhum chamado aberto.</p>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {tickets.map(ticket => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-800">{ticket.assunto}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      ticket.status === 'Aberto' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'Em Análise' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'Resolvido' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">{ticket.tipo}</span> • {new Date(ticket.created_at).toLocaleDateString()}
                    {ticket.is_anonimo && <span className="ml-2 text-purple-600 text-xs font-semibold">(Anônimo)</span>}
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap mb-3">{ticket.mensagem}</p>
                  
                  {ticket.resposta_admin && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-2 rounded-r-md">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Resposta da Gestão:</p>
                      <p className="text-sm text-blue-900">{ticket.resposta_admin}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Ouvidoria;
