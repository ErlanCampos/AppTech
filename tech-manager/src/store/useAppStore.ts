import { create } from 'zustand';
import type { User, ServiceOrder, ServiceOrderStatus } from '../types';
import { authService } from '../services/authService';
import { technicianService } from '../services/technicianService';
import { dataService } from '../services/dataService';

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
            const [users, serviceOrders] = await Promise.all([
                dataService.fetchUsers(),
                dataService.fetchServiceOrders()
            ]);
            set({ users, serviceOrders });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        set({ currentUser: null, users: [], serviceOrders: [] });
        try {
            await authService.signOut();
        } catch {
            // Ignore errors during signout (e.g. invalid session)
        }
    },

    addServiceOrder: async (os) => {
        const { currentUser } = get();
        if (!currentUser) return;

        try {
            await dataService.createServiceOrder(os, currentUser.id);
            await get().fetchData();
        } catch (error) {
            console.error('Error adding order:', error);
            throw error;
        }
    },

    updateServiceOrderStatus: async (id, status) => {
        try {
            await dataService.updateStatus(id, status);

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
            await dataService.assignTechnician(osId, technicianId);

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
            await dataService.deleteServiceOrder(id);

            set(state => ({
                serviceOrders: state.serviceOrders.filter(os => os.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    },

    createTechnician: async (email, password, fullName) => {
        await technicianService.create(email, password, fullName);
        await get().fetchData();
    },

    deleteTechnician: async (userId) => {
        await technicianService.delete(userId);
        set(state => ({
            users: state.users.filter(u => u.id !== userId)
        }));
    },

    theme: 'dark',
    toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
    })),
}));
