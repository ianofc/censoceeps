import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
}

interface UserBadge {
  id: string;
  badge: Badge;
  earned_at: string;
}

interface BadgeListProps {
  userId: string;
}

const BadgeList: React.FC<BadgeListProps> = ({ userId }) => {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_badges')
          .select(`
            id,
            earned_at,
            badge:badges (
              id,
              name,
              description,
              icon_url
            )
          `)
          .eq('user_id', userId);

        if (error) throw error;
        // Suppressing TS error if Supabase types are not fully generated for the join yet
        setUserBadges(data as any[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchBadges();
    }
  }, [userId]);

  if (loading) return <div className="text-gray-500 p-4">A carregar insígnias...</div>;
  if (error) return <div className="text-red-500 p-4">Erro ao carregar insígnias: {error}</div>;
  if (!userBadges.length) return <div className="text-gray-500 p-4">Nenhuma insígnia conquistada ainda.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span>🏆</span> As Minhas Insígnias
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {userBadges.map(({ id, badge, earned_at }) => (
          <div key={id} className="flex flex-col items-center p-4 border border-gray-100 rounded-lg hover:shadow-md transition-all bg-gray-50 hover:bg-white">
            {badge.icon_url ? (
              <img src={badge.icon_url} alt={badge.name} className="w-16 h-16 mb-3 object-contain drop-shadow-sm" />
            ) : (
              <div className="w-16 h-16 mb-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center text-2xl shadow-inner border border-yellow-300">
                ⭐
              </div>
            )}
            <h4 className="text-sm font-semibold text-gray-700 text-center">{badge.name}</h4>
            <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2" title={badge.description}>
              {badge.description}
            </p>
            <span className="text-[10px] text-gray-400 mt-3 font-medium bg-gray-100 px-2 py-1 rounded-full">
              {new Date(earned_at).toLocaleDateString('pt-PT')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeList;
