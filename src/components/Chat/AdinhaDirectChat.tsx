import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Message {
  id: string;
  sender: 'user' | 'adinha';
  content: string;
  created_at: string;
}

export function AdinhaDirectChat({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const subscription = supabase
      .channel('adinha_chat')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'adinha_chat_messages', filter: `user_id=eq.${userId}` }, 
        payload => {
          setMessages(current => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('adinha_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    const userMsg = newMessage;
    setNewMessage('');

    // Insert user message
    const { error } = await supabase.from('adinha_chat_messages').insert([
      { user_id: userId, sender: 'user', content: userMsg }
    ]);

    if (!error) {
      // Simulate Adinha response
      setTimeout(async () => {
        await supabase.from('adinha_chat_messages').insert([
          { user_id: userId, sender: 'adinha', content: `Olá! Sou a Adinha. Recebi sua mensagem: "${userMsg}". Estou aqui para ajudar com suas dúvidas sobre o Censo CEEPS.` }
        ]);
      }, 1000);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto border rounded-lg shadow-lg bg-white overflow-hidden">
      <div className="bg-blue-600 text-white p-4 font-bold text-lg flex items-center shadow-md">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 mr-3 text-xl">
          🤖
        </div>
        <div>
          Canal Direto - Adinha
          <div className="text-xs font-normal opacity-80">Assistente Virtual Censo CEEPS</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 my-10 flex flex-col items-center">
            <span className="text-4xl mb-3">👋</span>
            <p>Envie uma mensagem para começar a conversar com a Adinha!</p>
            <p className="text-sm mt-2 opacity-70">Tire suas dúvidas sobre o censo ou questões acadêmicas.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl p-3 ${
              msg.sender === 'user' 
                ? 'bg-blue-500 text-white rounded-br-sm' 
                : 'bg-gray-200 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua dúvida sobre o censo..."
          aria-label="Digite sua dúvida sobre o censo"
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !newMessage.trim()}
          className="bg-blue-600 text-white rounded-full py-2 px-6 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
