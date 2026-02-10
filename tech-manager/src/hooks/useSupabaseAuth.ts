import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import type { User } from '../types';

function buildUserFromSession(session: { user: { id: string; email?: string; user_metadata?: Record<string, string> } }): User {
    const authUser = session.user;
    return {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        role: (authUser.user_metadata?.role as 'admin' | 'technician') || 'technician',
    };
}

async function hydrateUser(userId: string, fallback: User): Promise<void> {
    const setUser = useAppStore.getState().setUser;
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profile) {
            setUser({
                id: userId,
                email: fallback.email,
                name: profile.full_name || fallback.name,
                role: profile.role || fallback.role,
                avatarUrl: profile.avatar_url,
            });
        }
    } catch {
        // Profile fetch failed, fallback user already set
    }
}

export function useSupabaseAuth() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const setUser = useAppStore.getState().setUser;
        let isMounted = true;

        // 1. Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                if (session?.user) {
                    const quickUser = buildUserFromSession(session);
                    setUser(quickUser);
                    setIsLoading(false);

                    // Only do full hydration on sign-in events, not token refreshes
                    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                        await hydrateUser(session.user.id, quickUser);
                        await useAppStore.getState().fetchData();
                    }
                } else {
                    setUser(null);
                    setIsLoading(false);
                }
            }
        );

        // 2. SAFETY NET: If onAuthStateChange doesn't fire within 1s,
        //    manually check for existing session (fixes F5 refresh bug)
        const fallbackTimer = setTimeout(async () => {
            if (!isMounted) return;
            const currentUser = useAppStore.getState().currentUser;
            if (currentUser) return; // Already hydrated by onAuthStateChange

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (session?.user) {
                    const quickUser = buildUserFromSession(session);
                    setUser(quickUser);
                    setIsLoading(false);
                    await hydrateUser(session.user.id, quickUser);
                    await useAppStore.getState().fetchData();
                } else {
                    setIsLoading(false);
                }
            } catch {
                if (isMounted) setIsLoading(false);
            }
        }, 1000);

        return () => {
            isMounted = false;
            clearTimeout(fallbackTimer);
            subscription.unsubscribe();
        };
    }, []);

    return { isLoading };
}
