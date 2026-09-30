import React from 'react';

interface UserAvatarProps {
  readonly genero?: 'masculino' | 'feminino' | 'outro';
  readonly name?: string;
  readonly className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ genero = 'masculino', name = 'Usuário', className = 'w-10 h-10' }) => {
  const inicial = name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className={`${className} rounded-2xl flex items-center justify-center font-black text-white shadow-md relative overflow-hidden ${
      genero === 'feminino' ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
    }`}>
      <div className="flex flex-col items-center justify-center">
        <span className="text-sm font-black">{inicial}</span>
      </div>
    </div>
  );
};