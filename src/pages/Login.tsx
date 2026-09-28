import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Autenticação direta com a API do Supabase
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message || 'E-mail ou senha inválidos.');
            } else if (data.session) {
                if (onLoginSuccess) onLoginSuccess();
            }
        } catch (err) {
            console.error('Erro ao autenticar:', err);
            setError('Erro ao conectar com o servidor de autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-lg p-8 border border-slate-700">

                <div className="text-center mb-6">
                    <span className="inline-block px-3 py-1 bg-blue-950 text-blue-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2 border border-blue-800">
                        Projeto Ada Lovelace
                    </span>
                    <h1 className="text-2xl font-black text-white">
                        CENSO CEEP
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Pesquisa de Campo sobre Gênero, Raça e Pertencimento
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-950/50 border-l-4 border-red-500 text-red-200 text-sm rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-1">
                            E-mail Institucional ou Cadastrado
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seu.email@escola.ba.gov.br"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-1">
                            Senha
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Autenticando...' : 'Acessar Sistema'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t border-slate-700/50 pt-4">
                    <p className="text-xs text-slate-400">
                        Centro Estadual de Educação Profissional de Seabra — CEEP
                    </p>
                </div>
            </div>
        </div>
    );
};