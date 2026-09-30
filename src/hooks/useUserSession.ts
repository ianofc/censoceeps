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

        fetchRealUserSession();
    }, []);

    return { profile, loading };
}