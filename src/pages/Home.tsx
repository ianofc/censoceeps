import React from 'react';
import { InterviewForm } from '../components/InterviewForm';

interface Props {
  userId?: string;
}

export const Home: React.FC<Props> = ({ userId = '00000000-0000-0000-0000-000000000000' }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">Coleta de Dados de Campo</h1>
        <p className="text-gray-600 mt-1">
          Iniciação Científica — Projeto Ada Lovelace (Gênero, Raça e Pertencimento)
        </p>
      </div>
      <InterviewForm userId={userId} />
    </div>
  );
};