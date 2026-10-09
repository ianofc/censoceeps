import React from 'react';
import { useUserSession } from '../hooks/useUserSession';
import { ShieldAlert, Users, Settings, Database } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const Admin: React.FC = () => {
  const { isAdmin, loading } = useUserSession();

  if (loading) {
    return <div className="p-6 text-center">Carregando permissões...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-3xl shadow-xl border border-slate-100">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <ShieldAlert className="w-8 h-8 text-red-600" />
        <div>
          <h1 className="text-2xl font-black text-slate-900">Painel do Administrador</h1>
          <p className="text-slate-500 font-medium text-sm">Acesso exclusivo e restrito. Configurações gerais do Censo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center hover:shadow-md transition">
          <Users className="w-10 h-10 text-blue-600 mb-3" />
          <h3 className="font-bold text-lg text-slate-800">Gerenciar Usuários</h3>
          <p className="text-xs text-slate-500 mt-2">Alterar papéis, permissões e redefinir acessos de alunos e professores.</p>
          <button type="button" className="mt-4 bg-blue-100 text-blue-700 font-bold py-2 px-4 rounded-xl text-sm w-full hover:bg-blue-200">Acessar Módulo</button>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center hover:shadow-md transition">
          <Database className="w-10 h-10 text-emerald-600 mb-3" />
          <h3 className="font-bold text-lg text-slate-800">Exportação Completa</h3>
          <p className="text-xs text-slate-500 mt-2">Fazer backup e exportar todo o banco de dados bruto do Censo.</p>
          <button type="button" className="mt-4 bg-emerald-100 text-emerald-700 font-bold py-2 px-4 rounded-xl text-sm w-full hover:bg-emerald-200">Gerar Backup</button>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center text-center hover:shadow-md transition">
          <Settings className="w-10 h-10 text-slate-600 mb-3" />
          <h3 className="font-bold text-lg text-slate-800">Configurações de Sistema</h3>
          <p className="text-xs text-slate-500 mt-2">Ajustar os metadados do projeto, prazos de coleta e visibilidade do telão.</p>
          <button type="button" className="mt-4 bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-sm w-full hover:bg-slate-300">Configurar</button>
        </div>
      </div>
    </div>
  );
};
