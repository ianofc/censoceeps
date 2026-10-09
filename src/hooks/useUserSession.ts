import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
    id: string;
    nomeCompleto: string;
    email: string;
    papel: 'gestor' | 'entrevistador_aluno' | 'entrevistado';
    turmaOuCargo: string;
    genero: 'masculino' | 'feminino' | 'outro';
    avatarUrl: string;
}

export function useUserSession() {
    const [profile, setProfile] = useState<UserProfile>({
        id: '',
        nomeCompleto: '',
        email: '',
        papel: 'entrevistador_aluno',
        turmaOuCargo: '',
        genero: 'masculino',
        avatarUrl: '',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRealUserSession() {
            try {
                // VERIFICAÇÃO DE USUÁRIO DE TESTE (MOCK)
                const testUserStr = localStorage.getItem('ceep_test_user');
                if (testUserStr) {
                    const testUser = JSON.parse(testUserStr);
                    setProfile(testUser);
                    setLoading(false);
                    return; // Sai cedo, não bate no Supabase
                }

                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    const authUser = session.user;

                    // JOIN / SELECT na tabela pai de pessoas usando o ID do Auth
                    const { data: pessoaData, error } = await supabase
                        .from('pessoas')
                        .select('nome_completo, email, papel, turma_ou_cargo, genero, avatar_url')
                        .eq('id', authUser.id)
                        .single();

                    if (!error && pessoaData) {
                        setProfile({
                            id: authUser.id,
                            nomeCompleto: pessoaData.nome_completo,
                            email: pessoaData.email,
                            papel: pessoaData.papel,
                            turmaOuCargo: pessoaData.turma_ou_cargo || '',
                            genero: pessoaData.genero || 'masculino',
                            avatarUrl: pessoaData.avatar_url || '',
                        });
                    }
                }
            } catch (err) {
                console.error('Erro crítico ao buscar dados reais da pessoa:', err);
            } finally {
                setLoading(false);
            }
        }

        // Adicionado 'void' para sinalizar explicitamente a intenção da promise flutuante
        void fetchRealUserSession();
    }, []);

    const isAdmin = profile.nomeCompleto.toLowerCase().includes('ian') || profile.email.toLowerCase().includes('ian');
    const isJuliana = profile.nomeCompleto.toLowerCase().includes('juliana') || profile.email.toLowerCase().includes('juliana');
    const isTeacher = isAdmin || isJuliana || profile.papel === 'gestor' || profile.turmaOuCargo.toLowerCase().includes('professor');
    const isStudent = !isTeacher;

    return { profile, loading, isAdmin, isTeacher, isStudent };
}