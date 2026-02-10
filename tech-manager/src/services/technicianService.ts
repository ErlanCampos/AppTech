import { supabase } from '../lib/supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`;

export const technicianService = {
    async create(email: string, password: string, fullName: string): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Não autenticado');

        const res = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ email, password, full_name: fullName }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Erro ao criar técnico');
        }
    },

    async delete(userId: string): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Não autenticado');

        const res = await fetch(EDGE_FUNCTION_URL, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ user_id: userId }),
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Erro ao excluir técnico');
        }
    }
};
