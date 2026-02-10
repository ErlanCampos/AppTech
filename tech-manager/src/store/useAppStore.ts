import { create } from 'zustand';
import type { User, ServiceOrder, ServiceOrderStatus } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
    currentUser: User | null;
    users: User[];
    serviceOrders: ServiceOrder[];
    isLoading: boolean;

    setUser: (user: User | null) => void;
    fetchData: () => Promise<void>;
    logout: () => Promise<void>;

    addServiceOrder: (os: Omit<ServiceOrder, 'id' | 'createdAt' | 'status'>) => Promise<void>;
    updateServiceOrderStatus: (id: string, status: ServiceOrderStatus) => Promise<void>;
    assignServiceOrder: (osId: string, technicianId: string) => Promise<void>;
    deleteServiceOrder: (id: string) => Promise<void>;

    createTechnician: (email: string, password: string, fullName: string) => Promise<void>;
    deleteTechnician: (userId: string) => Promise<void>;

    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    currentUser: null,
    users: [],
    serviceOrders: [],
    isLoading: false,

    setUser: (user) => set({ currentUser: user }),

    fetchData: async () => {
        set({ isLoading: true });
        try {
            // Fetch Users (Profiles)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*');

            if (profiles) {
                const mappedUsers: User[] = profiles.map((p: Record<string, string>) => ({
                    id: p.id,
                    name: p.full_name || 'Desconhecido',
                    email: p.email || '',
                    role: p.role,
                    avatarUrl: p.avatar_url
                }));
                set({ users: mappedUsers });
            }

            // Fetch Service Orders
            const { data: orders } = await supabase
                .from('service_orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (orders) {
                const mappedOrders: ServiceOrder[] = orders.map((o: Record<string, unknown>) => ({
                    id: o.id,
                    title: o.title,
                    description: o.description,
                    date: o.date,
                    location: o.location, // JSONB matches type
                    status: o.status,
                    assignedTechnicianId: o.assigned_technician_id,
                    createdAt: o.created_at,
                }));
                set({ serviceOrders: mappedOrders });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        // Always clear state first so the UI responds immediately
        set({ currentUser: null, users: [], serviceOrders: [] });
        try {
            await supabase.auth.signOut();
        } catch {
            // signOut may fail with expired tokens — that's OK, state is already cleared
        }
    },

    addServiceOrder: async (os) => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
            const { error } = await supabase
                .from('service_orders')
                .insert({
                    title: os.title,
                    description: os.description,
                    date: os.date,
                    location: os.location,
                    status: 'pending',
                    assigned_technician_id: os.assignedTechnicianId,
                    created_by: currentUser.id
                });

            if (error) throw error;
            await get().fetchData(); // Refresh list
        } catch (error) {
            console.error('Error adding order:', error);
            throw error;
        }
    },

    updateServiceOrderStatus: async (id, status) => {
        try {
            const { error } = await supabase
                .from('service_orders')
                .update({ status })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            set(state => ({
                serviceOrders: state.serviceOrders.map(os =>
                    os.id === id ? { ...os, status } : os
                )
            }));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    },

    assignServiceOrder: async (osId, technicianId) => {
        try {
            const { error } = await supabase
                .from('service_orders')
                .update({ assigned_technician_id: technicianId })
                .eq('id', osId);

            if (error) throw error;

            set(state => ({
                serviceOrders: state.serviceOrders.map(os =>
                    os.id === osId ? { ...os, assignedTechnicianId: technicianId } : os
                )
            }));
        } catch (error) {
            console.error('Error assigning technician:', error);
        }
    },

    deleteServiceOrder: async (id) => {
        try {
            const { error } = await supabase
                .from('service_orders')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set(state => ({
                serviceOrders: state.serviceOrders.filter(os => os.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    },

    createTechnician: async (email, password, fullName) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Não autenticado');

        const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ email, password, full_name: fullName }),
            }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar técnico');

        await get().fetchData();
    },

    deleteTechnician: async (userId) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Não autenticado');

        const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ user_id: userId }),
            }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao excluir técnico');

        set(state => ({
            users: state.users.filter(u => u.id !== userId)
        }));
    },

    theme: 'dark',
    toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
    })),
}));
