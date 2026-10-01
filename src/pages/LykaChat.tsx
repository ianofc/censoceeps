import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUserSession } from '../hooks/useUserSession';
import { Radio, Send, MessageSquare } from 'lucide-react';

export function LykaChat() {
  const { profile } = useUserSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from('lyka_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    }

    void loadMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setLoading(true);

    const isTeacher = profile.cargo?.toLowerCase().includes('professor') || profile.cargo?.toLowerCase().includes('admin');

    await supabase.from('lyka_messages').insert([
      {
        user_id: profile.id,
        author_name: profile.name,
        message: newMessage,
        is_teacher_alert: isTeacher
      }
    ]);

    setNewMessage('');
    setLoading(false);

    const { data } = await supabase
      .from('lyka_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    if (data) setMessages(data);
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500 pb-16 px-4">
      <div className="w-full max-w-4xl space-y-6">

        {/* Cabeçalho do Lyka Chat */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-purple-500/20">
          <span className="text-[11px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full border border-cyan-400/30 flex items-center gap-1.5 w-max mb-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-ping" /> Canal de Mensagens • Lyka Chat
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Comunicação Direta da Turma</h1>
          <p className="text-xs sm:text-sm text-purple-200 mt-1">
            Converse em tempo real com os colegas e os professores padrinhos.
          </p>
        </div>

        {/* Caixa de Chat */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[550px]">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-500" /> Chat Geral do Censo
            </h3>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
              Ativo
            </span>
          </div>

          {/* Histórico de Mensagens */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">
                Nenhuma mensagem no Lyka Chat ainda. Mande o primeiro alô!
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`p-4 rounded-2xl border ${
                    msg.is_teacher_alert 
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200' 
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-black">{msg.author_name}</span>
                    <span className="text-[10px] opacity-75">{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm font-medium">{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Input de Envio */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem no Lyka Chat..."
              className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer border-0"
            >
              <Send className="w-4 h-4" /> Enviar
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default LykaChat;