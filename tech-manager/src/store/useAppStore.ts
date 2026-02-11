import { create } from 'zustand';
import type { User, ServiceOrder, ServiceOrderStatus } from '../types';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

interface AppState {
    currentUser: User | null;
    users: User[];
    serviceOrders: ServiceOrder[];
    theme: 'light' | 'dark';
    setUser: (user: User | null) => void;
    fetchData: () => Promise<void>;
    logout: () => Promise<void>;
    toggleTheme: () => void;
    addServiceOrder: (order: Omit<ServiceOrder, 'id' | 'createdAt' | 'status'>) => Promise<void>;
    updateServiceOrderStatus: (id: string, status: ServiceOrder['status']) => Promise<void>;
    assignServiceOrder: (id: string, technicianId: string) => Promise<void>;
    deleteServiceOrder: (id: string) => Promise<void>;
    createTechnician: (name: string, email: string, password: string) => Promise<void>;
    deleteTechnician: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
    currentUser: null,
    users: [],
    serviceOrders: [],
    theme: 'dark',

    setUser: (user) => {
        console.log('🔄 setUser chamado:', user?.name || 'null');
        set({ currentUser: user });
    },

    fetchData: async () => {
        console.log('🔄 fetchData: Carregando dados do Supabase...');
        try {
            // Iniciar o fetch em paralelo
            const [usersResult, ordersResult] = await Promise.allSettled([
                dataService.fetchUsers(),
                dataService.fetchServiceOrders()
            ]);

            const users = usersResult.status === 'fulfilled' ? usersResult.value : [];
            const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];

            if (usersResult.status === 'rejected') console.error('Erro users:', usersResult.reason);
            if (ordersResult.status === 'rejected') console.error('Erro orders:', ordersResult.reason);

            console.log('✅ fetchData: Dados carregados:', { users: users.length, orders: orders.length });

            // Atualizar estado de uma vez só para evitar re-renders múltiplos
            set({ users, serviceOrders: orders });
        } catch (error) {
            console.error('❌ fetchData: Erro fatal:', error);
        }
    },

    logout: async () => {
        console.log('🚪 Logout chamado');
        set({ currentUser: null, users: [], serviceOrders: [] });
        try {
            await authService.signOut();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    },

    toggleTheme: () => {
        set((state) => ({
            theme: state.theme === 'light' ? 'dark' : 'light'
        }));
    },

    addServiceOrder: async (order: Omit<ServiceOrder, 'id' | 'createdAt' | 'status'>) => {
        try {
            const newOrder = await dataService.createServiceOrder(order);
            set((state) => ({ serviceOrders: [newOrder, ...state.serviceOrders] }));
        } catch (error) {
            console.error('Erro ao criar ordem de serviço:', error);
            throw error;
        }
    },

    updateServiceOrderStatus: async (id: string, status: ServiceOrderStatus) => {
        try {
            const updatedOrder = await dataService.updateStatus(id, status);
            set((state) => ({
                serviceOrders: state.serviceOrders.map((o) => (o.id === id ? updatedOrder : o)),
            }));
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            throw error;
        }
    },

    assignServiceOrder: async (id: string, technicianId: string) => {
        try {
            const updatedOrder = await dataService.assignTechnician(id, technicianId);
            set((state) => ({
                serviceOrders: state.serviceOrders.map((o) => (o.id === id ? updatedOrder : o)),
            }));
        } catch (error) {
            console.error('Erro ao atribuir técnico:', error);
            throw error;
        }
    },

    deleteServiceOrder: async (id: string) => {
        try {
            await dataService.deleteServiceOrder(id);
            set((state) => ({
                serviceOrders: state.serviceOrders.filter((o) => o.id !== id),
            }));
        } catch (error) {
            console.error('Erro ao excluir ordem de serviço:', error);
            throw error;
        }
    },

    createTechnician: async (name: string, email: string, password: string) => {
        try {
            // technicianService.createTechnician agora espera 3 argumentos
            // Precisamos importar technicianService
            // Mas espere, technicianService.createTechnician foi definido como:
            // createTechnician(name: string, email: string, password: string)
            // Vamos precisar importar technicianService no topo do arquivo
            const { technicianService } = await import('../services/technicianService');
            await technicianService.createTechnician(name, email, password);
            // Recarregar usuários para pegar o novo técnico
            const users = await dataService.fetchUsers();
            set({ users });
        } catch (error) {
            console.error('Erro ao criar técnico:', error);
            throw error;
        }
    },

    deleteTechnician: async (id: string) => {
        try {
            const { technicianService } = await import('../services/technicianService');
            await technicianService.deleteTechnician(id);
            set((state) => ({
                users: state.users.filter((u) => u.id !== id),
            }));
        } catch (error) {
            console.error('Erro ao excluir técnico:', error);
            throw error;
        }
    }
}));
