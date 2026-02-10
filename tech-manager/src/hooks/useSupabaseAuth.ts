import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import type { User } from '../types';

export function useSupabaseAuth() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const setUser = useAppStore.getState().setUser;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    // Set user IMMEDIATELY from auth metadata (no network call)
                    const authUser = session.user;
                    const quickUser: User = {
                        id: authUser.id,
                        email: authUser.email || '',
                        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                        role: authUser.user_metadata?.role || 'technician',
                    };
                    setUser(quickUser);
                    setIsLoading(false);

                    // Then fetch profile in background to get latest role/name
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', authUser.id)
                            .single();

                        if (profile) {
                            setUser({
                                id: authUser.id,
                                email: authUser.email || '',
                                name: profile.full_name || quickUser.name,
                                role: profile.role || quickUser.role,
                                avatarUrl: profile.avatar_url,
                            });
                        }
                    } catch {
                        // Profile fetch failed, quickUser already set — no problem
                    }

                    // Fetch app data (orders, users list)
                    useAppStore.getState().fetchData();
                } else {
                    setUser(null);
                    setIsLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return { isLoading };
}
