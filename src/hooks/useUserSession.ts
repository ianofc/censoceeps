import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
    id: string;
    nomeCompleto: string;
    email: string;
    papel: 'gestor' | 'entrevistador_aluno' | 'entrevistador' | 'entrevistado' | 'admin' | 'professor';
    turmaOuCargo: string;
    genero: 'masculino' | 'feminino' | 'outro';
    avatarUrl: string;
}

const CACHED_PROFILE_KEY = 'ceep_cached_profile';

function getInitialCachedProfile(): UserProfile {
    try {
        const testUserStr = localStorage.getItem('ceep_test_user');
        if (testUserStr) {
            return JSON.parse(testUserStr);
        }
        const cachedStr = localStorage.getItem(CACHED_PROFILE_KEY);
        if (cachedStr) {
            return JSON.parse(cachedStr);
        }
        const offlineSessionStr = localStorage.getItem('ceep_offline_session');
        if (offlineSessionStr) {
            const offlineSession = JSON.parse(offlineSessionStr);
            if (offlineSession?.user?.id) {
                return {
                    id: offlineSession.user.id,
                    nomeCompleto: offlineSession.user.user_metadata?.nome_completo || offlineSession.user.email || 'Pesquisador(a)',
                    email: offlineSession.user.email || '',
                    // user_metadata é editável pelo próprio usuário: nunca usar para papel
                    papel: 'entrevistador',
                    turmaOuCargo: offlineSession.user.user_metadata?.turma_ou_cargo || '',
                    genero: 'masculino',
                    avatarUrl: offlineSession.user.user_metadata?.avatar_url || '',
                };
            }
        }
    } catch {
        // Ignora erro de parse no localStorage
    }
    return {
        id: '',
        nomeCompleto: '',
        email: '',
        papel: 'entrevistador_aluno',
        turmaOuCargo: '',
        genero: 'masculino',
        avatarUrl: '',
    };
}

/**
 * Permissões baseadas EXCLUSIVAMENTE no campo `papel` da tabela `pessoas`.
 * - 'entrevistador' / 'entrevistador_aluno' / 'entrevistado': aluno, apenas coleta.
 * - 'professor' / 'gestor': acesso docente (auditoria, todas as coletas).
 * - 'admin': somente o Prof. Ian Santos (papel + e-mail institucional).
 * Nunca usar nome ou trechos de e-mail para conceder permissões.
 */
export const ADMIN_EMAIL = 'iansantos@ceeps.com';
const STAFF_PAPEIS = ['admin', 'professor', 'gestor'];

export function isStaffPapel(papel?: string | null): boolean {
    return STAFF_PAPEIS.includes((papel || '').trim().toLowerCase());
}

export function isAdminPapel(papel?: string | null, email?: string | null): boolean {
    return (papel || '').trim().toLowerCase() === 'admin' && (email || '').trim().toLowerCase() === ADMIN_EMAIL;
}

export function useUserSession() {
    const [profile, setProfile] = useState<UserProfile>(getInitialCachedProfile);
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
                let authUser = session?.user;

                // Fallback para sessão salva em modo offline
                if (!authUser) {
                    try {
                        const offlineSessionStr = localStorage.getItem('ceep_offline_session');
                        if (offlineSessionStr) {
                            const offlineSession = JSON.parse(offlineSessionStr);
                            authUser = offlineSession?.user || (offlineSession?.id ? offlineSession : undefined);
                        }
                    } catch {
                        // ignora
                    }
                }

                if (authUser) {
                    // Garante que o ID e dados básicos do Auth já fiquem disponíveis imediatamente
                    // mesmo se a consulta na tabela 'pessoas' falhar por queda de internet
                    const cached = getInitialCachedProfile();
                    const fallbackProfile: UserProfile = {
                        id: authUser.id,
                        nomeCompleto:
                            (cached.id === authUser.id && cached.nomeCompleto) ||
                            authUser.user_metadata?.nome_completo ||
                            authUser.email?.split('@')[0] ||
                            'Pesquisador(a)',
                        email: authUser.email || cached.email || '',
                        // Papel vem apenas do banco (ou cache do banco); user_metadata é editável pelo usuário
                        papel:
                            (cached.id === authUser.id && cached.papel) ||
                            'entrevistador',
                        turmaOuCargo:
                            (cached.id === authUser.id && cached.turmaOuCargo) ||
                            authUser.user_metadata?.turma_ou_cargo ||
                            '',
                        genero: (cached.id === authUser.id && cached.genero) || 'masculino',
                        avatarUrl:
                            (cached.id === authUser.id && cached.avatarUrl) ||
                            authUser.user_metadata?.avatar_url ||
                            '',
                    };

                    setProfile(fallbackProfile);

                    // JOIN / SELECT na tabela pai de pessoas usando o ID do Auth
                    const { data: pessoaData, error } = await supabase
                        .from('pessoas')
                        .select('nome_completo, email, papel, turma_ou_cargo, genero, avatar_url')
                        .eq('id', authUser.id)
                        .maybeSingle();

                    if (!error && pessoaData) {
                        const resolvedProfile: UserProfile = {
                            id: authUser.id,
                            nomeCompleto: pessoaData.nome_completo || fallbackProfile.nomeCompleto,
                            email: pessoaData.email || fallbackProfile.email,
                            papel: pessoaData.papel || fallbackProfile.papel,
                            turmaOuCargo: pessoaData.turma_ou_cargo || '',
                            genero: pessoaData.genero || 'masculino',
                            avatarUrl: pessoaData.avatar_url || '',
                        };
                        setProfile(resolvedProfile);
                        try {
                            localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(resolvedProfile));
                        } catch {
                            // ignora
                        }
                    }
                }
            } catch (err) {
                console.error('Erro ao buscar dados da pessoa (mantendo perfil em cache):', err);
            } finally {
                setLoading(false);
            }
        }

        void fetchRealUserSession();
    }, []);

    const isAdmin = isAdminPapel(profile.papel, profile.email);
    const isTeacher = isAdmin || (isStaffPapel(profile.papel) && profile.papel !== 'admin');
    const isStudent = !isTeacher;

    return { profile, loading, isAdmin, isTeacher, isStudent };
}
