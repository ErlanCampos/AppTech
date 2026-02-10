import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export const authService = {
    async getSession(): Promise<Session | null> {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    async signOut(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }
};
