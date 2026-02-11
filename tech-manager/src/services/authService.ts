import { supabase } from '../lib/supabase';
import type { User } from '../types';

export const authService = {
    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error getting session:', error);
            return { data: { session: null } };
        }
        return { data };
    },

    async getCurrentUser(): Promise<User | null> {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        // Buscar dados extras da tabela users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            console.error('Error fetching user data:', userError);
            return null;
        }

        return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role as 'admin' | 'technician'
        };
    },

    async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return { user: null, error: error.message };
        }

        if (!data.user) {
            return { user: null, error: 'Falha ao obter usuário' };
        }

        // Buscar dados completos do usuário
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (userError || !userData) {
            return { user: null, error: 'Usuário não encontrado no banco de dados' };
        }

        return {
            user: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role as 'admin' | 'technician'
            },
            error: null
        };
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
        }
    }
};
