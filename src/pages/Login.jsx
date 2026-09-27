import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message || 'Credenciais inválidas. Verifique o seu e-mail e senha.');
            setLoading(false);
        } else if (onLoginSuccess) {
            onLoginSuccess();
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f4f8',
            padding: '1.5rem'
        }}>
            <div style={{
                display: 'flex',
                width: '100%',
                maxWidth: '960px',
                minHeight: '540px',
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.06)'
            }}>
                {/* Lado Esquerdo - Painel Azul Escuro */}
                <div style={{
                    flex: 1,
                    backgroundColor: '#1e2548',
                    color: '#ffffff',
                    padding: '3rem 2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🏛️</span>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Ágora OS</h2>
                        </div>

                        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '1.25rem' }}>
                            A democracia nas suas mãos.
                        </h1>

                        <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            O Simulador Oficial de Cidadania para Colégios Eleitorais e Escolas. Votação criptografada, simples e com apuração em tempo real.
                        </p>
                    </div>

                    {/* Card de Depoimento/Citação */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        marginTop: '2rem'
                    }}>
                        <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: '#cbd5e1', marginBottom: '1rem' }}>
                            "O sistema elevou o nível do debate democrático. A apuração foi instantânea, transparente e 100% à prova de fraudes."
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.85rem'
                            }}>IS</div>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.875rem' }}>Ian Santos</strong>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Criador do Ágora OS</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                            Tecnologia Confiável
                        </span>
                        <div style={{ marginTop: '0.5rem' }}>
                            <span style={{
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '20px',
                                color: '#e2e8f0'
                            }}>
                                🛡️ GovTech / EdTech
                            </span>
                        </div>
                    </div>
                </div>

                {/* Lado Direito - Formulário Clean */}
                <div style={{
                    flex: 1,
                    padding: '3.5rem 3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>
                        Comissão Eleitoral
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>
                        Inicie sessão com as credenciais de gestão para configurar o pleito do seu Colégio Eleitoral.
                    </p>

                    {errorMsg && (
                        <div style={{
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                            padding: '0.875rem',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            marginBottom: '1.5rem'
                        }}>
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: '#475569',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.5rem'
                            }}>
                                E-mail do Gestor / Juiz
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>👤</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ian@escola.com"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 1rem 0.875rem 2.75rem',
                                        backgroundColor: '#f1f5f9',
                                        border: '1px solid transparent',
                                        borderRadius: '10px',
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: '#475569',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '0.5rem'
                            }}>
                                Chave de Segurança
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔒</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                                        backgroundColor: '#f1f5f9',
                                        border: '1px solid transparent',
                                        borderRadius: '10px',
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#94a3b8'
                                    }}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: '#1e2548',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: '800',
                                fontSize: '0.875rem',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'A AUTENTICAR...' : 'DESBLOQUEAR SISTEMA'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}