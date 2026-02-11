import { supabase } from '../lib/supabase';


export const technicianService = {
    async createTechnician(name: string, email: string, password: string): Promise<void> {
        const cleanEmail = email.trim();
        const cleanName = name.trim();
        const cleanPassword = password.trim();

        if (!cleanEmail || !cleanEmail.includes('@')) {
            throw new Error('Email inválido');
        }

        if (cleanPassword.length < 6) {
            throw new Error('A senha deve ter pelo menos 6 caracteres');
        }

        // Criar usuário no Auth do Supabase
        const { data, error: signUpError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: {
                data: {
                    full_name: cleanName,
                    role: 'technician'
                }
            }
        });

        if (signUpError) {
            console.error('Error creating technician:', signUpError);
            throw signUpError;
        }

        // O trigger handle_new_user criará automaticamente o registro em public.users
        console.log('Technician created:', data.user?.id);
    },

    async deleteTechnician(id: string): Promise<void> {
        // Deletar usuário da tabela users (cascade deletará de auth.users via ON DELETE CASCADE)
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting technician:', error);
            throw error;
        }
    }
};
