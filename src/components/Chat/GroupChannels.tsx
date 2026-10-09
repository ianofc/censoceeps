import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Group {
  id: string;
  name: string;
  description: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function GroupChannels() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchGroups();
      }
    };
    init();
  }, []);

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('chat_groups')
      .select('*');
    
    if (data) setGroups(data);
  };

  const fetchMessages = async (groupId: string) => {
    const { data, error } = await supabase
      .from('chat_group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  useEffect(() => {
    if (selectedGroupId) {
      fetchMessages(selectedGroupId);
      
      const subscription = supabase
        .channel(`public:chat_group_messages:group_id=eq.${selectedGroupId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_group_messages', filter: `group_id=eq.${selectedGroupId}` }, payload => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedGroupId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroupId || !userId) return;

    const { error } = await supabase
      .from('chat_group_messages')
      .insert([
        { group_id: selectedGroupId, sender_id: userId, content: newMessage }
      ]);

    if (!error) {
      setNewMessage('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with Groups */}
      <div className="w-1/4 bg-white border-r border-gray-200 p-4">
        <h2 className="text-xl font-bold mb-4">Minhas Turmas</h2>
        <ul>
          {groups.map(group => (
            <li key={group.id} className="mb-2">
              <button
                type="button"
                className={`w-full text-left p-3 rounded-lg transition-colors border-0 cursor-pointer ${selectedGroupId === group.id ? 'bg-blue-100' : 'bg-transparent hover:bg-gray-100'}`}
                onClick={() => setSelectedGroupId(group.id)}
              >
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-500 truncate">{group.description}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedGroupId ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className={`mb-4 flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${msg.sender_id === userId ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escreva uma mensagem..."
                aria-label="Escreva uma mensagem"
                className="flex-1 border border-gray-300 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors">
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Selecione uma turma para ver o chat
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupChannels;
