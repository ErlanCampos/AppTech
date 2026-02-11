import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import type { User } from '../types';

export function useSupabaseAuth() {
    const [user, setLocalUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { setUser } = useAppStore();
    const fetchData = useAppStore(state => state.fetchData);

    useEffect(() => {
        console.log('🔐 useAuth: Iniciando verificação de autenticação...');

        // Timeout de segurança: forçar fim do loading após 10s
        const safetyTimeout = setTimeout(() => {
            console.warn('⚠️ useAuth: Timeout de segurança atingido, forçando isLoading = false');
            setIsLoading(false);
        }, 10000);

        // Verificar sessão atual
        const checkSession = async () => {
            try {
                console.log('🔐 useAuth: Buscando sessão...');
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('❌ useAuth: Erro ao buscar sessão:', sessionError);
                    setIsLoading(false);
                    clearTimeout(safetyTimeout);
                    return;
                }

                if (!session?.user) {
                    console.log('🔐 useAuth: Sem sessão ativa');
                    setLocalUser(null);
                    setUser(null);
                    setIsLoading(false);
                    clearTimeout(safetyTimeout);
                    return;
                }

                console.log('🔐 useAuth: Sessão encontrada, buscando dados do usuário...', session.user.id);

                // Buscar dados completos do usuário com timeout de 5s
                try {
                    console.log('🔐 useAuth: Iniciando query na tabela users...');

                    const queryPromise = supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Query timeout após 5s')), 5000)
                    );

                    const { data: userData, error: userError } = await Promise.race([
                        queryPromise,
                        timeoutPromise
                    ]) as any;

                    console.log('🔐 useAuth: Query retornou!', { userData, userError });

                    if (userError) {
                        console.error('❌ useAuth: Erro ao buscar dados do usuário:', userError);
                        // Tentar continuar com dados mínimos do auth, INCLUINDO role dos metadados
                        const userMetadata = session.user.user_metadata || {};
                        const fallbackUser: User = {
                            id: session.user.id,
                            email: session.user.email || '',
                            name: userMetadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
                            role: (userMetadata.role as 'admin' | 'technician') || 'technician'
                        };
                        console.log('⚠️ useAuth: Usando dados fallback:', fallbackUser);
                        setLocalUser(fallbackUser);
                        setUser(fallbackUser);
                        setIsLoading(false);
                        clearTimeout(safetyTimeout);
                        return;
                    }

                    if (userData) {
                        console.log('✅ useAuth: Usuário autenticado:', userData.name);
                        const appUser: User = {
                            id: userData.id,
                            email: userData.email,
                            name: userData.name,
                            role: userData.role as 'admin' | 'technician'
                        };
                        setLocalUser(appUser);
                        setUser(appUser);
                        fetchData();
                    } else {
                        console.log('⚠️ useAuth: Usuário não encontrado na tabela users');
                        setLocalUser(null);
                        setUser(null);
                    }
                } catch (queryError) {
                    console.error('❌ useAuth: Timeout ou erro na query:', queryError);
                    // Continuar com dados mínimos, PRESERVANDO role dos metadados
                    const userMetadata = session.user.user_metadata || {};
                    const fallbackUser: User = {
                        id: session.user.id,
                        email: session.user.email || '',
                        name: userMetadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
                        role: (userMetadata.role as 'admin' | 'technician') || 'technician'
                    };
                    console.log('⚠️ useAuth: Usando dados fallback após erro:', fallbackUser);
                    setLocalUser(fallbackUser);
                    setUser(fallbackUser);
                }

                setIsLoading(false);
                clearTimeout(safetyTimeout);
            } catch (error) {
                console.error('❌ useAuth: Erro inesperado:', error);
                setLocalUser(null);
                setUser(null);
                setIsLoading(false);
                clearTimeout(safetyTimeout);
            }
        };

        checkSession();

        // Escutar mudanças no estado de autenticação
        console.log('🔐 useAuth: Registrando listener onAuthStateChange');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 useAuth: Auth event:', event);

            // Não fazer nada para SIGNED_IN se já temos usuário (evita queries repetidas)
            if (event === 'SIGNED_IN' && session?.user) {
                console.log('🔐 useAuth: SIGNED_IN ignorado, usuário já carregado');
                return;
            }

            // Só processar SIGNED_OUT e INITIAL_SESSION
            if (event === 'SIGNED_OUT') {
                console.log('🔐 useAuth: Usuário deslogado via evento');
                setLocalUser(null);
                setUser(null);
            } else if (event === 'INITIAL_SESSION' && session?.user) {
                console.log('🔐 useAuth: INITIAL_SESSION - pulando, checkSession já tratou');
                // checkSession já tratou isso, não fazer nada
            }
        });

        return () => {
            console.log('🔐 useAuth: Limpando subscription');
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, [setUser, fetchData]);

    return { user, isLoading };
}
