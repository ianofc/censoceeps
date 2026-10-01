import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUserSession } from '../hooks/useUserSession';
import { Sparkles, Send, Award, Heart, MessageSquare } from 'lucide-react';
import { AdinhaMascote } from '../components/AdinhaMascote';

export function Feed() {
  const { profile } = useUserSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { data } = await supabase
      .from('lyka_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setPosts(data);
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    setLoading(true);

    await supabase.from('lyka_posts'].insert([
      {
        user_id: profile.id,
        author_name: profile.name,
        content: newPostContent,
        type: 'user_post'
      }
    ]);

    setNewPostContent('');
    setLoading(false);
    void fetchPosts();
  };

  const handleLike = async (postId: number) => {
    await supabase.from('lyka_reactions').insert([
      {
        post_id: postId,
        user_id: profile.id,
        emoji: '❤️'
      }
    ]);
    void fetchPosts();
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500 pb-16 px-4">
      <div className="w-full max-w-4xl space-y-6">

        {/* Cabeçalho do Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-black uppercase px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Mural de Evidências
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Feed da Pesquisa • CEEP Seabra</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fotos, encontros, bootcamps e relatos de campo dos pesquisadores.</p>
          </div>
        </div>

        {/* Caixa de Criação de Post */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <textarea
              rows={3}
              placeholder="Compartilhe uma conquista, relato de campo ou pensamento com a turma..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer border-0 transition"
              >
                <Send className="w-4 h-4" /> Publicar no Feed
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Postagens */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 font-semibold bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              Nenhuma postagem no feed ainda.
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-inner">
                      {post.author_name ? post.author_name.charAt(0) : 'P'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{post.author_name}</h3>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{new Date(post.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {post.content}
                </p>

                <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer border-0"
                  >
                    <Heart className="h-4 w-4 text-rose-500 fill-current" /> Curtir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default Feed;